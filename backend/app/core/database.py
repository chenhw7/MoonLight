"""数据库配置模块。

提供 SQLAlchemy 异步数据库连接和会话管理。
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# 创建异步引擎
settings = get_settings()
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
)

# 创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# 声明基类
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话。

    用于 FastAPI 依赖注入，提供异步数据库会话。
    会话会在请求结束后自动关闭。

    Yields:
        AsyncSession: 异步数据库会话

    Example:
        >>> @router.get("/users")
        ... async def get_users(db: AsyncSession = Depends(get_db)):
        ...     result = await db.execute(select(User))
        ...     return result.scalars().all()
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error("Database transaction failed", error=str(e))
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """初始化数据库。

    创建所有定义的表结构。
    注意：生产环境建议使用 Alembic 进行迁移。

    Example:
        >>> await init_db()
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")


async def close_db() -> None:
    """关闭数据库连接。

    在应用关闭时调用，释放数据库连接池。

    Example:
        >>> await close_db()
    """
    await engine.dispose()
    logger.info("Database connection closed")
