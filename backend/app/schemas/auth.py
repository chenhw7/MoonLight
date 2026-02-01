"""认证相关 Schema 模块。

定义认证相关的 Pydantic 模型，包括请求和响应格式。
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """用户基础模型。

    Attributes:
        email: 邮箱地址
        username: 用户名
    """

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=20)

    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    """用户创建模型。

    用于注册请求。

    Attributes:
        email: 邮箱地址
        username: 用户名
        password: 密码
        verification_code: 验证码
    """

    password: str = Field(..., min_length=8, max_length=128)
    verification_code: str = Field(..., min_length=6, max_length=6)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """验证用户名格式。

        用户名只能包含英文字母、数字和下划线。

        Args:
            v: 用户名

        Returns:
            str: 验证通过的用户名

        Raises:
            ValueError: 用户名格式无效时抛出
        """
        if not v.replace("_", "").isalnum():
            raise ValueError("Username can only contain letters, numbers, and underscores")
        if not v[0].isalpha():
            raise ValueError("Username must start with a letter")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """验证密码强度。

        密码必须包含至少一个大写字母、一个小写字母和一个数字。

        Args:
            v: 密码

        Returns:
            str: 验证通过的密码

        Raises:
            ValueError: 密码强度不足时抛出
        """
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(UserBase):
    """用户响应模型。

    返回给客户端的用户信息（不包含敏感数据）。

    Attributes:
        id: 用户 ID
        email: 邮箱地址
        username: 用户名
        is_active: 是否激活
        created_at: 创建时间
    """

    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "email": "user@example.com",
                "username": "john_doe",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z",
            }
        },
    )


class LoginRequest(BaseModel):
    """登录请求模型。

    Attributes:
        email: 邮箱地址
        password: 密码
    """

    email: EmailStr
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "Password123",
            }
        },
    )


class LoginResponse(BaseModel):
    """登录响应模型。

    Attributes:
        access_token: 访问令牌
        refresh_token: 刷新令牌
        token_type: 令牌类型
        user: 用户信息
    """

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIs...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "email": "user@example.com",
                    "username": "john_doe",
                    "is_active": True,
                    "created_at": "2024-01-01T00:00:00Z",
                },
            }
        },
    )


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求模型。

    Attributes:
        refresh_token: 刷新令牌
    """

    refresh_token: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
            }
        },
    )


class RefreshTokenResponse(BaseModel):
    """刷新令牌响应模型。

    Attributes:
        access_token: 新的访问令牌
        token_type: 令牌类型
    """

    access_token: str
    token_type: str = "bearer"

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIs...",
                "token_type": "bearer",
            }
        },
    )


class VerificationCodeRequest(BaseModel):
    """验证码请求模型。

    Attributes:
        email: 邮箱地址
        code_type: 验证码类型（register/reset_password）
    """

    email: EmailStr
    code_type: str = Field(..., pattern="^(register|reset_password)$")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "code_type": "register",
            }
        },
    )


class VerificationCodeResponse(BaseModel):
    """验证码响应模型。

    Attributes:
        message: 响应消息
        cooldown_seconds: 冷却时间（秒）
    """

    message: str
    cooldown_seconds: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Verification code sent successfully",
                "cooldown_seconds": 60,
            }
        },
    )


class PasswordResetRequest(BaseModel):
    """密码重置请求模型。

    Attributes:
        email: 邮箱地址
        verification_code: 验证码
        new_password: 新密码
    """

    email: EmailStr
    verification_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """验证新密码强度。

        密码必须包含至少一个大写字母、一个小写字母和一个数字。

        Args:
            v: 新密码

        Returns:
            str: 验证通过的密码

        Raises:
            ValueError: 密码强度不足时抛出
        """
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "verification_code": "123456",
                "new_password": "NewPassword123",
            }
        },
    )


class PasswordResetResponse(BaseModel):
    """密码重置响应模型。

    Attributes:
        message: 响应消息
    """

    message: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Password reset successfully",
            }
        },
    )


class CheckEmailRequest(BaseModel):
    """检查邮箱请求模型。

    Attributes:
        email: 邮箱地址
    """

    email: EmailStr

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
            }
        },
    )


class CheckEmailResponse(BaseModel):
    """检查邮箱响应模型。

    Attributes:
        exists: 邮箱是否已存在
    """

    exists: bool

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "exists": True,
            }
        },
    )


class VerifyCodeRequest(BaseModel):
    """验证验证码请求模型。

    Attributes:
        email: 邮箱地址
        code: 验证码
        code_type: 验证码类型（register/reset_password）
    """

    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    code_type: str = Field(..., pattern="^(register|reset_password)$")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "code": "123456",
                "code_type": "register",
            }
        },
    )


class VerifyCodeResponse(BaseModel):
    """验证验证码响应模型。

    Attributes:
        valid: 验证码是否有效
    """

    valid: bool

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "valid": True,
            }
        },
    )
