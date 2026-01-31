"""日志配置模块。

提供结构化日志记录功能，支持 JSON 格式输出和上下文追踪。
"""

import logging
import sys
from typing import Any, Dict

import structlog
from structlog.processors import JSONRenderer
from structlog.stdlib import LoggerFactory, add_log_level, add_logger_name

from app.core.config import get_settings


def configure_logging() -> None:
    """配置结构化日志系统。

    根据环境配置日志级别和格式：
    - 开发环境：控制台输出，人类可读格式
    - 生产环境：JSON 格式，便于日志收集系统处理

    Example:
        >>> configure_logging()
        >>> logger = get_logger(__name__)
        >>> logger.info("Application started")
    """
    settings = get_settings()

    # 配置标准库 logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.debug else logging.INFO,
    )

    # 配置 structlog
    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        add_log_level,
        add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.ExtraAdder(),
    ]

    if settings.is_production:
        # 生产环境：JSON 格式
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            JSONRenderer(),
        ]
    else:
        # 开发环境：控制台格式
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
        >>> logger = get_request_logger("req-123", "192.168.1.1", "POST", "/api/login")
        >>> logger.info("Request started")
    """
    return structlog.get_logger().bind(
        request_id=request_id,
        client_ip=client_ip,
        method=method,
        path=path,
    )
