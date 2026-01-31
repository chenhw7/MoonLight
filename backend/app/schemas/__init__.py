"""Schema 模块。

导出所有 Pydantic 模型。
"""

from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    PasswordResetRequest,
    PasswordResetResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserCreate,
    UserResponse,
    VerificationCodeRequest,
    VerificationCodeResponse,
)
from app.schemas.common import (
    ErrorResponse,
    PaginatedResponse,
    PaginationParams,
    ResponseModel,
)

__all__ = [
    # Common
    "ResponseModel",
    "ErrorResponse",
    "PaginationParams",
    "PaginatedResponse",
    # Auth
    "UserCreate",
    "UserResponse",
    "LoginRequest",
    "LoginResponse",
    "RefreshTokenRequest",
    "RefreshTokenResponse",
    "VerificationCodeRequest",
    "VerificationCodeResponse",
    "PasswordResetRequest",
    "PasswordResetResponse",
]
