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

# 延迟创建 engine 和 session factory，避免模块导入时立即加载 SQLAlchemy 全套组件（约 2 秒）
# 它们在 init_db() 首次调用时才初始化，此时应用已进入 lifespan 阶段
engine = None
AsyncSessionLocal = None


def _ensure_engine():
    """确保 engine 已创建（首次调用时初始化）。"""
    global engine, AsyncSessionLocal
    if engine is None:
        settings = get_settings()
        engine = create_async_engine(
            settings.database_url,
            echo=False,
            future=True,
        )
        AsyncSessionLocal = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
        logger.info("Database engine created")

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
    _ensure_engine()
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
    _ensure_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")


async def close_db() -> None:
    """关闭数据库连接。

    在应用关闭时调用，释放数据库连接池。

    Example:
        >>> await close_db()
    """
    _ensure_engine()
    await engine.dispose()
    logger.info("Database connection closed")
