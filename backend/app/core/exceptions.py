"""应用异常模块。

定义统一的异常体系，便于错误处理和响应。
"""

from typing import Any, Dict, Optional


class AppException(Exception):
    """应用基础异常。

    所有自定义异常的基类，提供统一的错误码和消息格式。

    Attributes:
        message: 错误消息
        code: 错误码
        status_code: HTTP 状态码
        details: 额外的错误详情

    Example:
        >>> raise AppException("User not found", code="USER_NOT_FOUND", status_code=404)
    """

    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.code = code or "INTERNAL_ERROR"
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式。

        Returns:
            Dict[str, Any]: 包含错误信息的字典
        """
        return {
            "code": self.status_code,
            "message": self.message,
            "error": self.code,
            "details": self.details,
        }


class AuthenticationError(AppException):
    """认证异常。

    用户认证失败时抛出，如密码错误、令牌无效等。

    Example:
        >>> raise AuthenticationError("Invalid password")
    """

    def __init__(self, message: str = "Authentication failed", **kwargs):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            status_code=401,
            **kwargs,
        )


class AuthorizationError(AppException):
    """授权异常。

    用户权限不足时抛出。

    Example:
        >>> raise AuthorizationError("Insufficient permissions")
    """

    def __init__(self, message: str = "Access denied", **kwargs):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            status_code=403,
            **kwargs,
        )


class ValidationError(AppException):
    """数据验证异常。

    请求数据验证失败时抛出。

    Example:
        >>> raise ValidationError("Invalid email format")
    """

    def __init__(self, message: str = "Validation failed", **kwargs):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            **kwargs,
        )


class NotFoundError(AppException):
    """资源不存在异常。

    请求的资源不存在时抛出。

    Example:
        >>> raise NotFoundError("User not found")
    """

    def __init__(self, message: str = "Resource not found", **kwargs):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=404,
            **kwargs,
        )


class ConflictError(AppException):
    """资源冲突异常。

    资源已存在或发生冲突时抛出。

    Example:
        >>> raise ConflictError("Email already registered")
    """

    def __init__(self, message: str = "Resource conflict", **kwargs):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=409,
            **kwargs,
        )


class RateLimitError(AppException):
    """频率限制异常。

    请求频率超过限制时抛出。

    Example:
        >>> raise RateLimitError("Too many requests")
    """

    def __init__(self, message: str = "Rate limit exceeded", **kwargs):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            **kwargs,
        )


class ServiceUnavailableError(AppException):
    """服务不可用异常。

    依赖服务不可用时抛出。

    Example:
        >>> raise ServiceUnavailableError("Database connection failed")
    """

    def __init__(self, message: str = "Service unavailable", **kwargs):
        super().__init__(
            message=message,
            code="SERVICE_UNAVAILABLE",
            status_code=503,
            **kwargs,
        )
