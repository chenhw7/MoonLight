"""
pytest 全局 fixtures

提供测试所需的共享资源
"""

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient

from app.core.database import Base, get_db
from app.main import app

# 测试数据库配置
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test_db"


@pytest_asyncio.fixture(scope="session")
async def engine():
    """
    创建测试数据库引擎
    
    Yields:
        AsyncEngine: 异步数据库引擎
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    # 创建所有表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # 清理
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    """
    创建数据库会话
    
    Args:
        engine: 数据库引擎 fixture
        
    Yields:
        AsyncSession: 异步数据库会话
    """
    async_session = sessionmaker(
        engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
def override_get_db(db_session):
    """
    覆盖 FastAPI 的数据库依赖
    
    Args:
        db_session: 数据库会话 fixture
    """
    async def _get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = _get_db
    yield
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(override_get_db):
    """
    创建 HTTP 测试客户端
    
    Args:
        override_get_db: 数据库依赖覆盖 fixture
        
    Yields:
        AsyncClient: 异步 HTTP 客户端
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_redis():
    """
    Mock Redis 客户端
    
    Returns:
        MockRedis: 内存中的 Redis 模拟实现
    """
    class MockRedis:
        def __init__(self):
            self._data = {}
        
        async def get(self, key: str):
            return self._data.get(key)
        
        async def setex(self, key: str, seconds: int, value: str):
            self._data[key] = value
        
        async def delete(self, key: str):
            self._data.pop(key, None)
        
        async def exists(self, key: str) -> int:
            return 1 if key in self._data else 0
        
        async def ttl(self, key: str) -> int:
            return -1  # 永不过期
    
    return MockRedis()


@pytest.fixture
def sample_user_data():
    """
    示例用户数据
    
    Returns:
        dict: 用户数据字典
    """
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "TestPassword123",
    }


@pytest.fixture
def sample_login_data():
    """
    示例登录数据
    
    Returns:
        dict: 登录数据字典
    """
    return {
        "email": "test@example.com",
        "password": "TestPassword123",
    }


@pytest.fixture(autouse=True)
def setup_test_env(monkeypatch):
    """
    设置测试环境变量
    
    自动在每个测试前执行
    """
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    monkeypatch.setenv("DATABASE_URL", TEST_DATABASE_URL)
    yield
