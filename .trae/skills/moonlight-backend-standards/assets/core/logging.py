"""
日志配置模块

配置 structlog 和 Python 标准日志
"""

import logging
import sys
from pathlib import Path

import structlog

# 日志目录
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# 日志格式
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def configure_logging(log_level: str = "INFO") -> None:
    """配置日志系统。
    
    Args:
        log_level: 日志级别 (DEBUG, INFO, WARNING, ERROR)
    """
    # 配置标准库日志
    logging.basicConfig(
        format=LOG_FORMAT,
        datefmt=DATE_FORMAT,
        level=getattr(logging, log_level.upper()),
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(LOG_DIR / "app.log", encoding="utf-8"),
        ],
    )
    
    # 配置 structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if log_level == "INFO" else structlog.dev.ConsoleRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str):
    """获取日志记录器。
    
    Args:
        name: 日志记录器名称，通常使用 __name__
        
    Returns:
        structlog.stdlib.BoundLogger: 配置好的日志记录器
        
    Example:
        >>> from app.core.logging import get_logger
        >>> logger = get_logger(__name__)
        >>> logger.info("User logged in", user_id=123)
    """
    return structlog.get_logger(name)
