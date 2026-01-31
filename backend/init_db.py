"""数据库初始化脚本。

用于创建数据库表结构。
"""

import asyncio

from app.core.database import init_db, close_db
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)


async def main() -> None:
    """初始化数据库。"""
    logger.info("Initializing database...")
    await init_db()
    await close_db()
    logger.info("Database initialized successfully!")


if __name__ == "__main__":
    asyncio.run(main())
