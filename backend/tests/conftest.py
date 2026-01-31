"""pytest 配置和 fixtures。

提供测试所需的共享 fixtures 和配置。
"""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.core.database import Base, get_db
from app.main import app

# 测试数据库 URL（使用文件 SQLite 进行测试）
import tempfile
import os

# 创建临时数据库文件
temp_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{temp_db_file.name}"

# 创建测试引擎
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    future=True,
)

# 创建测试会话工厂
TestingSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """创建事件循环 fixture。

    Yields:
        asyncio.AbstractEventLoop: 事件循环实例
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """创建数据库会话 fixture。

    每个测试函数开始前创建新的数据库表，
    测试结束后清理数据。

    Yields:
        AsyncSession: 数据库会话
    """
    # 创建所有表
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 创建会话
    async with TestingSessionLocal() as session:
        yield session
        # 回滚事务
        await session.rollback()

    # 清理表
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """创建 HTTP 客户端 fixture。

    提供配置了测试数据库的 AsyncClient。

    Args:
        db_session: 数据库会话 fixture

    Yields:
        AsyncClient: HTTP 客户端
    """
    # 覆盖依赖
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    # 清理依赖覆盖
    app.dependency_overrides.clear()
