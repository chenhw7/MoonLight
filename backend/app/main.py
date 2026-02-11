"""FastAPI 应用入口模块。

创建和配置 FastAPI 应用实例，包括中间件、异常处理和路由注册。
"""

import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1 import router as api_v1_router
from app.core.config import get_settings
from app.core.database import close_db, init_db
from app.core.exceptions import AppException
from app.core.logging import configure_logging, get_logger, get_request_logger
from app.schemas.common import ErrorResponse

# 配置日志
configure_logging()
logger = get_logger(__name__)

# 获取配置
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理。

    处理应用启动和关闭时的初始化和清理工作。

    Args:
        app: FastAPI 应用实例

    Yields:
        None

    Example:
        在应用启动时自动调用，无需手动触发。
    """
    # 启动
    logger.info(
        "Application starting",
        app_name=settings.app_name,
        version=settings.app_version,
        env=settings.app_env,
    )

    # 初始化数据库
    await init_db()

    yield

    # 关闭
    logger.info("Application shutting down")
    await close_db()


# 创建 FastAPI 应用
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="MoonLight Backend API - 用户认证服务",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    openapi_url="/openapi.json" if settings.is_development else None,
    lifespan=lifespan,
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.is_development else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """请求日志中间件。

    记录每个请求的详细信息，包括请求 ID、处理时间、请求体和响应体等。

    Args:
        request: FastAPI 请求对象
        call_next: 下一个处理函数

    Returns:
        Response: HTTP 响应对象
    """
    # 生成请求 ID
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id

    # 获取客户端信息
    client_ip = request.client.host if request.client else "unknown"
    method = request.method
    path = request.url.path

    # 创建请求日志记录器
    request_logger = get_request_logger(request_id, client_ip, method, path)

    # 读取请求体
    request_body = None
    body_size = 0
    if method in ["POST", "PUT", "PATCH"]:
        try:
            body = await request.body()
            body_size = len(body) if body else 0
            if body:
                try:
                    request_body = body.decode("utf-8")
                    # 限制日志长度，避免过大（base64 头像数据可能很大）
                    if len(request_body) > 500:
                        request_body = request_body[:500] + f"... [truncated, total {body_size} bytes]"
                except UnicodeDecodeError:
                    request_body = f"[binary data, {body_size} bytes]"
            # 重新设置请求体，以便后续处理
            async def receive():
                return {"type": "http.request", "body": body}
            request._receive = receive
        except Exception as e:
            request_logger.debug("Failed to read request body", error=str(e))

    # 记录请求开始
    start_time = time.time()
    log_data = {
        "query": str(request.query_params),
        "body_size": body_size,
    }
    if request_body:
        log_data["body"] = request_body
    request_logger.info("Request started", **log_data)

    # 处理请求
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000

        # 读取响应体（仅开发环境，且跳过大响应避免性能问题）
        response_body = None
        if settings.is_development and response.status_code != 204:
            try:
                from starlette.responses import StreamingResponse
                if not isinstance(response, StreamingResponse):
                    response_body_chunks = []
                    async for chunk in response.body_iterator:
                        response_body_chunks.append(chunk)
                    raw_body = b"".join(response_body_chunks)
                    # 只对小响应记录内容（跳过包含 base64 图片的大响应）
                    if len(raw_body) <= 5000:
                        response_body = raw_body.decode("utf-8")
                        if len(response_body) > 1000:
                            response_body = response_body[:1000] + "... [truncated]"
                    else:
                        response_body = f"[large response, {len(raw_body)} bytes]"
                    # 重建响应
                    from starlette.responses import Response
                    response = Response(
                        content=raw_body,
                        status_code=response.status_code,
                        headers=dict(response.headers),
                        media_type=response.media_type,
                    )
            except Exception as e:
                request_logger.debug("Failed to read response body", error=str(e))

        # 记录请求完成
        log_data = {
            "status_code": response.status_code,
            "latency_ms": round(process_time, 2),
        }
        if response_body:
            log_data["response_body"] = response_body
        request_logger.info("Request completed", **log_data)

        # 添加请求 ID 到响应头
        response.headers["X-Request-ID"] = request_id
        return response

    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        request_logger.error(
            "Request failed",
            error=str(e),
            latency_ms=round(process_time, 2),
        )
        raise


# 注册 API 路由
app.include_router(api_v1_router, prefix="/api")


# 请求体验证异常处理（Pydantic 验证失败时触发）
@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    """处理请求体验证错误。

    当前端发送的数据不符合 Pydantic Schema 时触发。
    在日志中记录详细错误以便调试。
    """
    # 打印每个验证错误的详情
    error_details = []
    for error in exc.errors():
        error_details.append({
            "field": " -> ".join(str(loc) for loc in error.get("loc", [])),
            "message": error.get("msg", ""),
            "type": error.get("type", ""),
        })

    logger.warning(
        "Request validation failed",
        path=request.url.path,
        method=request.method,
        error_count=len(error_details),
        errors=str(error_details),
    )

    return JSONResponse(
        status_code=422,
        content={
            "code": 422,
            "message": "请求数据验证失败",
            "error": "VALIDATION_ERROR",
            "details": error_details,
        },
    )


# 数据库异常处理
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """处理数据库异常。"""
    logger.error(
        "Database exception",
        path=request.url.path,
        error=str(exc),
        exc_info=True,
    )

    return JSONResponse(
        status_code=500,
        content={
            "code": 500,
            "message": f"数据库错误: {str(exc)}",
            "error": "DATABASE_ERROR",
        },
    )


# 全局异常处理
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """处理应用自定义异常。

    将 AppException 转换为统一的 JSON 响应格式。

    Args:
        request: FastAPI 请求对象
        exc: 应用异常实例

    Returns:
        JSONResponse: 格式化的错误响应
    """
    logger.warning(
        "Application exception",
        path=request.url.path,
        error=exc.message,
        code=exc.code,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """处理所有未捕获的异常。

    将未知异常转换为统一的错误响应格式，避免暴露内部信息。

    Args:
        request: FastAPI 请求对象
        exc: 异常实例

    Returns:
        JSONResponse: 格式化的错误响应
    """
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        error=str(exc),
        exc_info=True,
    )

    error_response = ErrorResponse(
        code=500,
        message="Internal server error",
        error="INTERNAL_ERROR",
    )

    return JSONResponse(
        status_code=500,
        content=error_response.model_dump(),
    )


# 健康检查端点
@app.get("/health", tags=["健康检查"])
async def health_check() -> dict:
    """健康检查接口。

    用于监控和负载均衡检查。

    Returns:
        dict: 健康状态信息

    Example:
        >>> GET /health
        {"status": "healthy", "version": "1.0.0"}
    """
    return {
        "status": "healthy",
        "version": settings.app_version,
        "environment": settings.app_env,
    }


# 根路径
@app.get("/", tags=["根路径"])
async def root() -> dict:
    """根路径接口。

    返回应用基本信息。

    Returns:
        dict: 应用信息

    Example:
        >>> GET /
        {"message": "Welcome to MoonLight API", "version": "1.0.0"}
    """
    return {
        "message": "Welcome to MoonLight API",
        "version": settings.app_version,
        "docs": "/docs" if settings.is_development else None,
    }
