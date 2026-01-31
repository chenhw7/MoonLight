"""通用 Schema 模块。

定义通用的 Pydantic 模型，如统一响应格式。
"""

from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    """统一响应模型。

    所有 API 响应都使用此格式包装。

    Attributes:
        code: 业务状态码
        message: 响应消息
        data: 响应数据

    Example:
        >>> response = ResponseModel(data={"user": "john"})
        >>> print(response.model_dump())
        {'code': 200, 'message': 'success', 'data': {'user': 'john'}}
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": 200,
                "message": "success",
                "data": None,
            }
        }
    )

    code: int = 200
    message: str = "success"
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    """错误响应模型。

    错误响应使用的格式。

    Attributes:
        code: HTTP 状态码
        message: 错误消息
        error: 错误代码
        details: 错误详情

    Example:
        >>> error = ErrorResponse(
        ...     code=401,
        ...     message="Authentication failed",
        ...     error="AUTHENTICATION_ERROR"
        ... )
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": 401,
                "message": "Authentication failed",
                "error": "AUTHENTICATION_ERROR",
                "details": {},
            }
        }
    )

    code: int
    message: str
    error: str
    details: Optional[dict] = None


class PaginationParams(BaseModel):
    """分页参数模型。

    用于分页查询的请求参数。

    Attributes:
        page: 页码（从 1 开始）
        page_size: 每页数量

    Example:
        >>> params = PaginationParams(page=1, page_size=20)
        >>> print(params.page)
        1
    """

    page: int = 1
    page_size: int = 20

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "page": 1,
                "page_size": 20,
            }
        }
    )


class PaginatedResponse(BaseModel, Generic[T]):
    """分页响应模型。

    分页查询的响应格式。

    Attributes:
        items: 数据列表
        total: 总数量
        page: 当前页码
        page_size: 每页数量
        total_pages: 总页数

    Example:
        >>> response = PaginatedResponse(
        ...     items=[{"id": 1}, {"id": 2}],
        ...     total=100,
        ...     page=1,
        ...     page_size=20
        ... )
    """

    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [],
                "total": 0,
                "page": 1,
                "page_size": 20,
                "total_pages": 0,
            }
        }
    )
