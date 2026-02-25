"""日志配置模块。

提供结构化日志记录功能，支持控制台人类可读格式和文件JSON格式输出。
支持请求上下文追踪和动态日志级别调整。
"""

import logging
import logging.handlers
import os
import sys
from typing import Any, Dict, Optional

import structlog
from structlog.processors import JSONRenderer
from structlog.stdlib import LoggerFactory, add_log_level, add_logger_name

from app.core.config import get_settings


# 全局日志级别映射，支持动态调整
_LOG_LEVEL_OVERRIDES: Dict[str, int] = {}


def get_log_level_from_env() -> int:
    """从环境变量获取日志级别。

    Returns:
        int: logging 模块的日志级别常量
    """
    settings = get_settings()
    level_map = {
        "debug": logging.DEBUG,
        "info": logging.INFO,
        "warning": logging.WARNING,
        "error": logging.ERROR,
        "critical": logging.CRITICAL,
    }
    # 优先使用配置中的 log_level
    env_level = os.getenv("LOG_LEVEL", settings.log_level).lower()
    return level_map.get(env_level, logging.INFO)


def set_log_level(logger_name: str, level: str) -> None:
    """动态设置日志级别。

    可以在运行时调整特定 logger 的日志级别，无需重启服务。

    Args:
        logger_name: Logger 名称，如 "app.services.user" 或 "sqlalchemy.engine"
        level: 日志级别字符串 (debug/info/warning/error/critical)

    Example:
        >>> set_log_level("app.services.user", "debug")
        >>> set_log_level("sqlalchemy.engine", "warning")
    """
    level_map = {
        "debug": logging.DEBUG,
        "info": logging.INFO,
        "warning": logging.WARNING,
        "error": logging.ERROR,
        "critical": logging.CRITICAL,
    }
    numeric_level = level_map.get(level.lower(), logging.INFO)
    _LOG_LEVEL_OVERRIDES[logger_name] = numeric_level
    logging.getLogger(logger_name).setLevel(numeric_level)


def reset_log_level(logger_name: str) -> None:
    """重置日志级别到默认状态。

    Args:
        logger_name: Logger 名称
    """
    if logger_name in _LOG_LEVEL_OVERRIDES:
        del _LOG_LEVEL_OVERRIDES[logger_name]
    # 重新应用默认配置
    settings = get_settings()
    default_level = logging.DEBUG if settings.debug else logging.INFO
    logging.getLogger(logger_name).setLevel(default_level)


class RequestIDFormatter:
    """请求ID格式化器。

    将 request_id 格式化为 [request_id] 前缀形式，便于识别和过滤。
    """

    def __call__(self, logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        request_id = event_dict.pop("request_id", None)
        if request_id:
            event_dict["request_id"] = f"[{request_id}]"
        return event_dict


class SQLAlchemyFilter(logging.Filter):
    """SQLAlchemy 日志过滤器。

    过滤掉 pg_catalog 等内部系统查询，减少日志噪音。
    """

    def __init__(self, suppress_internal: bool = True):
        super().__init__()
        self.suppress_internal = suppress_internal
        # 需要过滤的内部查询模式
        self._internal_patterns = [
            "pg_catalog",
            "pg_namespace",
            "pg_class",
            "information_schema",
            "SHOW",
            "SET",
        ]

    def filter(self, record: logging.LogRecord) -> bool:
        if not self.suppress_internal:
            return True

        message = record.getMessage()
        return not any(pattern in message for pattern in self._internal_patterns)


class SQLAlchemyHandler(logging.Handler):
    """自定义 SQLAlchemy 日志处理器。

    增强 SQL 日志，添加执行时间和请求上下文。
    """

    def __init__(self, level: int = logging.NOTSET):
        super().__init__(level)
        self._sql_start_time: Optional[float] = None

    def emit(self, record: logging.LogRecord) -> None:
        # 这里可以添加 SQL 执行时间计算逻辑
        # 由于 SQLAlchemy 的日志是分开的，我们需要在应用层配合实现
        pass


def configure_logging() -> None:
    """配置结构化日志系统。

    根据环境配置日志级别和格式：
    - 开发环境：控制台输出，人类可读格式，带颜色
    - 生产环境：文件输出，JSON 格式，便于日志收集系统处理

    特性：
    - ISO 时间戳格式 (2026-02-25T10:30:45.123Z)
    - request_id 前缀形式 [a3f7b2c1]
    - 动态日志级别调整
    - SQLAlchemy 内部查询过滤

    Example:
        >>> configure_logging()
        >>> logger = get_logger(__name__)
        >>> logger.info("Application started")
    """
    settings = get_settings()

    # 从环境变量获取日志级别，默认根据 debug 设置
    env_level = get_log_level_from_env()
    log_level = env_level if env_level != logging.INFO else (
        logging.DEBUG if settings.debug else logging.INFO
    )

    # 清除所有现有的 handlers
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # 设置根日志级别
    root_logger.setLevel(log_level)

    # 配置标准库 logging
    _configure_stdlib_logging(log_level, settings)

    # 配置 structlog
    _configure_structlog(settings)

    # 应用动态日志级别覆盖
    for logger_name, level in _LOG_LEVEL_OVERRIDES.items():
        logging.getLogger(logger_name).setLevel(level)


def _configure_stdlib_logging(log_level: int, settings: Any) -> None:
    """配置标准库 logging。

    Args:
        log_level: 日志级别
        settings: 应用配置
    """
    # 控制台处理器 - 人类可读格式
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    # 文件处理器 - JSON 格式（生产环境）或纯文本（开发环境）
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "backend.log")

    # 使用 RotatingFileHandler 防止日志文件过大
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=settings.log_max_bytes,
        backupCount=settings.log_backup_count,
        encoding="utf-8",
    )
    file_handler.setLevel(log_level)

    # 配置 SQLAlchemy 日志
    sqlalchemy_logger = logging.getLogger("sqlalchemy.engine")
    sqlalchemy_logger.setLevel(logging.DEBUG if settings.debug else logging.WARNING)

    # 添加 SQLAlchemy 过滤器
    sqlalchemy_filter = SQLAlchemyFilter(suppress_internal=not settings.log_sqlalchemy_internal)
    for handler in [console_handler, file_handler]:
        handler.addFilter(sqlalchemy_filter)

    # 设置关键 logger 的级别
    loggers_config = {
        "app": log_level,
        "uvicorn": log_level,
        "uvicorn.access": log_level,
        "uvicorn.error": log_level,
        "sqlalchemy.engine": logging.DEBUG if settings.debug else logging.WARNING,
    }

    for logger_name, level in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(level)
        # 清除现有 handlers 避免重复
        logger.handlers = []
        logger.propagate = False

    # 为 uvicorn 添加处理器
    for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
        logger = logging.getLogger(logger_name)
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)


def _configure_structlog(settings: Any) -> None:
    """配置 structlog。

    Args:
        settings: 应用配置
    """
    # 共享处理器
    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        add_log_level,
        add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),  # ISO 格式时间戳
        RequestIDFormatter(),  # request_id 格式化为前缀形式
        structlog.stdlib.ExtraAdder(),
    ]

    if settings.is_production:
        # 生产环境：JSON 格式，无颜色
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            JSONRenderer(),
        ]
    else:
        # 开发环境：控制台格式，带颜色
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """获取结构化日志记录器。

    Args:
        name: 日志记录器名称，通常使用 __name__

    Returns:
        structlog.stdlib.BoundLogger: 绑定了上下文的日志记录器

    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("User logged in", user_id=123, email="user@example.com")
    """
    return structlog.get_logger(name)


def get_request_logger(
    request_id: str, client_ip: str, method: str, path: str
) -> structlog.stdlib.BoundLogger:
    """获取带有请求上下文的日志记录器。

    Args:
        request_id: 请求唯一标识
        client_ip: 客户端 IP 地址
        method: HTTP 方法
        path: 请求路径

    Returns:
        structlog.stdlib.BoundLogger: 绑定了请求上下文的日志记录器

    Example:
        >>> logger = get_request_logger("a3f7b2c1", "192.168.1.1", "POST", "/api/login")
        >>> logger.info("Request started")
        # 输出: 2026-02-25T10:30:45.123Z INFO [a3f7b2c1] app.api - Request started
    """
    return structlog.get_logger().bind(
        request_id=request_id,
        client_ip=client_ip,
        method=method,
        path=path,
    )


def bind_request_context(request_id: str, **kwargs: Any) -> None:
    """绑定请求上下文到当前线程。

    使用 contextvars 确保在异步环境中上下文正确传递。

    Args:
        request_id: 请求唯一标识
        **kwargs: 其他上下文数据

    Example:
        >>> bind_request_context("a3f7b2c1", user_id=123, client_ip="192.168.1.1")
        >>> logger.info("Processing request")  # 自动包含 request_id
    """
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id, **kwargs)


def clear_request_context() -> None:
    """清除当前请求的上下文。"""
    structlog.contextvars.clear_contextvars()
