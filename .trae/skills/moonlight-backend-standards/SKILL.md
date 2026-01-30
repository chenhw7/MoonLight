---
name: moonlight-backend-standards
description: MoonLight 项目后端开发规范。使用 FastAPI + Python + PostgreSQL 技术栈。包含代码风格、项目结构、API 规范、日志规范、数据库规范。在编写后端代码、创建 API、操作数据库时触发。
---

# MoonLight 后端开发规范

## 技术栈

- Python 3.11+
- FastAPI 0.104+
- SQLAlchemy 2.0 (ORM)
- Pydantic v2 (数据验证)
- PostgreSQL 16
- Redis 7
- Alembic (数据库迁移)
- structlog (日志)
- pytest (测试)

## 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── core/                # 核心配置
│   │   ├── config.py        # 配置管理
│   │   ├── logging.py       # 日志配置
│   │   └── security.py      # 安全工具 (JWT, 密码哈希)
│   ├── api/                 # API 路由
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py      # 认证相关接口
│   │       └── users.py     # 用户相关接口
│   ├── models/              # 数据库模型 (SQLAlchemy)
│   │   ├── __init__.py
│   │   └── user.py
│   ├── schemas/             # Pydantic 模型
│   │   ├── __init__.py
│   │   └── auth.py
│   ├── services/            # 业务逻辑层
│   │   ├── __init__.py
│   │   └── auth_service.py
│   ├── utils/               # 工具函数
│   │   ├── __init__.py
│   │   └── email.py
│   └── dependencies.py      # FastAPI 依赖
├── tests/                   # 测试
│   ├── __init__.py
│   ├── conftest.py          # pytest fixtures
│   └── test_auth.py
├── alembic/                 # 数据库迁移
├── logs/                    # 日志文件
├── .env                     # 环境变量 (不提交)
├── .env.example             # 环境变量示例
├── pyproject.toml           # 项目配置
├── requirements.txt         # 依赖
└── Dockerfile
```

## 代码规范

### 代码风格

- 遵循 PEP 8
- 使用 Black 格式化（行宽 88 字符）
- 使用 isort 排序导入
- 类型注解必须完整

### 函数/方法注释规范

使用 Google Style 文档字符串：

```python
async def send_verification_code(email: str, code_type: str) -> bool:
    """发送邮箱验证码。

    根据指定的类型发送验证码到用户邮箱，用于注册或密码重置。
    验证码有效期为10分钟，同一邮箱60秒内只能发送一次。

    Args:
        email: 用户邮箱地址
        code_type: 验证码类型 ('register' 或 'reset_password')

    Returns:
        bool: 发送成功返回 True，否则返回 False

    Raises:
        EmailSendError: 邮件服务异常时抛出
        RateLimitError: 触发频率限制时抛出

    Example:
        >>> success = await send_verification_code("user@example.com", "register")
        >>> print(success)
        True
    """
```

### 日志规范

每个函数入口必须记录日志：

```python
from app.core.logging import get_logger

logger = get_logger(__name__)

async def login(email: str, password: str) -> User:
    """用户登录。"""
    logger.info("Login attempt", email=email)
    
    start_time = time.time()
    
    try:
        user = await authenticate_user(email, password)
        latency = (time.time() - start_time) * 1000
        
        logger.info(
            "Login successful",
            email=email,
            user_id=user.id,
            latency_ms=round(latency, 2)
        )
        return user
    except AuthenticationError as e:
        logger.warning("Login failed", email=email, reason=str(e))
        raise
    except Exception as e:
        logger.error("Login error", email=email, error=str(e), exc_info=True)
        raise
```

### API 路由规范

```python
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.auth_service import AuthService
from app.core.logging import get_logger

router = APIRouter(prefix="/auth", tags=["认证"])
logger = get_logger(__name__)

@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends()
) -> LoginResponse:
    """用户登录接口。
    
    Args:
        request: 登录请求数据
        
    Returns:
        LoginResponse: 登录成功返回用户信息
        
    Raises:
        HTTPException: 认证失败时返回 401
    """
    logger.info("API: login called", email=request.email)
    
    try:
        result = await auth_service.login(request.email, request.password)
        logger.info("API: login success", email=request.email)
        return result
    except AuthenticationError as e:
        logger.warning("API: login failed", email=request.email, reason=str(e))
        raise HTTPException(status_code=401, detail=str(e))
```

### 数据库模型规范

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    """用户模型。
    
    Attributes:
        id: 主键
        email: 邮箱地址 (唯一)
        username: 用户名 (唯一)
        password_hash: 密码哈希
        is_active: 是否激活
        created_at: 创建时间
        updated_at: 更新时间
    """
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(20), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### 异常处理规范

```python
# app/core/exceptions.py

class AppException(Exception):
    """应用基础异常。"""
    
    def __init__(self, message: str, code: str = None):
        self.message = message
        self.code = code
        super().__init__(self.message)

class AuthenticationError(AppException):
    """认证异常。"""
    pass

class ValidationError(AppException):
    """数据验证异常。"""
    pass

class RateLimitError(AppException):
    """频率限制异常。"""
    pass
```

### 统一响应格式

```python
# app/schemas/common.py

from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")

class ResponseModel(BaseModel, Generic[T]):
    """统一响应模型。"""
    
    code: int = 200
    message: str = "success"
    data: Optional[T] = None

class ErrorResponse(BaseModel):
    """错误响应模型。"""
    
    code: int
    message: str
    error: Optional[str] = None
```

## Assets 使用

使用 `assets/` 目录下的配置文件：

- `pyproject.toml` - 项目配置 (Black, isort, pytest)
- `.flake8` - Flake8 配置
- `templates/router.py` - 路由模板
- `templates/service.py` - 服务层模板
- `templates/model.py` - 模型模板
- `core/logging.py` - 日志配置
- `core/config.py` - 应用配置模板

## Git 提交规范

遵循 Conventional Commits：

```
feat(api): 添加用户登录接口
fix(auth): 修复验证码过期判断逻辑
docs(api): 更新认证接口文档
test(auth): 添加登录接口单元测试
```
