"""认证路由模块。

提供用户认证相关的 API 端点，包括注册、登录、验证码等。
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import (
    AppException,
    AuthenticationError,
    ConflictError,
    NotFoundError,
    RateLimitError,
    ValidationError,
)
from app.core.logging import get_logger
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    PasswordResetRequest,
    PasswordResetResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserCreate,
    VerificationCodeRequest,
    VerificationCodeResponse,
)
from app.schemas.common import ErrorResponse, ResponseModel
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["认证"])
logger = get_logger(__name__)


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """获取认证服务实例。

    Args:
        db: 数据库会话

    Returns:
        AuthService: 认证服务实例
    """
    return AuthService(db)


@router.post(
    "/register",
    response_model=ResponseModel[LoginResponse],
    status_code=status.HTTP_201_CREATED,
    summary="用户注册",
    description="使用邮箱、用户名、密码和验证码注册新用户",
)
async def register(
    request: Request,
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
) -> ResponseModel[LoginResponse]:
    """用户注册接口。

    创建新用户账号，需要验证邮箱验证码。

    Args:
        request: FastAPI 请求对象
        user_data: 用户注册数据
        auth_service: 认证服务实例

    Returns:
        ResponseModel[LoginResponse]: 包含访问令牌和用户信息

    Raises:
        HTTPException: 注册失败时返回相应错误码
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        "API: register called",
        email=user_data.email,
        username=user_data.username,
        client_ip=client_ip,
    )

    try:
        result = await auth_service.register(user_data)
        logger.info(
            "API: register success",
            email=user_data.email,
            user_id=result.user.id,
        )
        return ResponseModel(data=result)
    except ConflictError as e:
        logger.warning("API: register conflict", email=user_data.email, reason=e.message)
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ValidationError as e:
        logger.warning("API: register validation failed", email=user_data.email, reason=e.message)
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AppException as e:
        logger.error("API: register failed", email=user_data.email, error=e.message)
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.post(
    "/login",
    response_model=ResponseModel[LoginResponse],
    summary="用户登录",
    description="使用邮箱和密码登录",
)
async def login(
    request: Request,
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ResponseModel[LoginResponse]:
    """用户登录接口。

    验证邮箱和密码，返回访问令牌。

    Args:
        request: FastAPI 请求对象
        login_data: 登录请求数据
        auth_service: 认证服务实例

    Returns:
        ResponseModel[LoginResponse]: 包含访问令牌和用户信息

    Raises:
        HTTPException: 登录失败时返回 401
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info("API: login called", email=login_data.email, client_ip=client_ip)

    try:
        result = await auth_service.login(login_data)
        logger.info(
            "API: login success",
            email=login_data.email,
            user_id=result.user.id,
        )
        return ResponseModel(data=result)
    except AuthenticationError as e:
        logger.warning("API: login failed", email=login_data.email, reason=e.message)
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AppException as e:
        logger.error("API: login error", email=login_data.email, error=e.message)
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.post(
    "/refresh",
    response_model=ResponseModel[RefreshTokenResponse],
    summary="刷新令牌",
    description="使用刷新令牌获取新的访问令牌",
)
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ResponseModel[RefreshTokenResponse]:
    """刷新令牌接口。

    使用有效的刷新令牌生成新的访问令牌。

    Args:
        request: FastAPI 请求对象
        refresh_data: 刷新令牌请求数据
        auth_service: 认证服务实例

    Returns:
        ResponseModel[RefreshTokenResponse]: 包含新的访问令牌

    Raises:
        HTTPException: 刷新失败时返回 401
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info("API: refresh token called", client_ip=client_ip)

    try:
        result = await auth_service.refresh_token(refresh_data.refresh_token)
        logger.info("API: token refreshed")
        return ResponseModel(data=result)
    except AuthenticationError as e:
        logger.warning("API: refresh token failed", reason=e.message)
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AppException as e:
        logger.error("API: refresh token error", error=e.message)
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.post(
    "/verification-code",
    response_model=ResponseModel[VerificationCodeResponse],
    summary="发送验证码",
    description="发送邮箱验证码，用于注册或密码重置",
)
async def send_verification_code(
    request: Request,
    code_request: VerificationCodeRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ResponseModel[VerificationCodeResponse]:
    """发送验证码接口。

    向指定邮箱发送验证码，用于注册或密码重置验证。

    Args:
        request: FastAPI 请求对象
        code_request: 验证码请求数据
        auth_service: 认证服务实例

    Returns:
        ResponseModel[VerificationCodeResponse]: 包含发送结果和冷却时间

    Raises:
        HTTPException: 发送失败时返回相应错误码
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        "API: send verification code called",
        email=code_request.email,
        code_type=code_request.code_type,
        client_ip=client_ip,
    )

    try:
        result = await auth_service.send_verification_code(
            code_request.email, code_request.code_type
        )
        logger.info(
            "API: verification code sent",
            email=code_request.email,
            code_type=code_request.code_type,
        )
        return ResponseModel(data=result)
    except RateLimitError as e:
        logger.warning(
            "API: rate limit exceeded",
            email=code_request.email,
            reason=e.message,
        )
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AppException as e:
        logger.error(
            "API: send verification code failed",
            email=code_request.email,
            error=e.message,
        )
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.post(
    "/reset-password",
    response_model=ResponseModel[PasswordResetResponse],
    summary="重置密码",
    description="使用验证码重置密码",
)
async def reset_password(
    request: Request,
    reset_data: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ResponseModel[PasswordResetResponse]:
    """重置密码接口。

    验证验证码后重置用户密码。

    Args:
        request: FastAPI 请求对象
        reset_data: 密码重置请求数据
        auth_service: 认证服务实例

    Returns:
        ResponseModel[PasswordResetResponse]: 包含重置结果

    Raises:
        HTTPException: 重置失败时返回相应错误码
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        "API: reset password called",
        email=reset_data.email,
        client_ip=client_ip,
    )

    try:
        await auth_service.reset_password(reset_data)
        logger.info("API: password reset success", email=reset_data.email)
        return ResponseModel(
            data=PasswordResetResponse(message="Password reset successfully")
        )
    except NotFoundError as e:
        logger.warning("API: user not found", email=reset_data.email)
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ValidationError as e:
        logger.warning(
            "API: reset password validation failed",
            email=reset_data.email,
            reason=e.message,
        )
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AppException as e:
        logger.error(
            "API: reset password failed",
            email=reset_data.email,
            error=e.message,
        )
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
