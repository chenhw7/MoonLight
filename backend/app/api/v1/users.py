"""用户路由模块。

提供用户资料管理相关的 API 端点。
"""

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AppException
from app.core.logging import get_logger
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.common import ErrorResponse, ResponseModel
from app.services.user_service import UserService

logger = get_logger(__name__)

router = APIRouter(prefix="/users", tags=["用户"])


class UpdateProfileRequest(BaseModel):
    """更新用户资料请求。"""

    username: str = Field(
        ...,
        min_length=3,
        max_length=20,
        description="新用户名，3-20字符，支持字母、数字、下划线和中文",
    )


class UpdateAvatarRequest(BaseModel):
    """更新头像请求。"""

    avatar: str = Field(
        ...,
        description="头像URL或Base64编码的图片数据",
    )


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """获取用户服务实例。

    Args:
        db: 数据库会话

    Returns:
        UserService: 用户服务实例
    """
    return UserService(db)


@router.put(
    "/profile",
    response_model=ResponseModel[UserResponse],
    responses={
        400: {"model": ErrorResponse, "description": "请求参数错误"},
        401: {"model": ErrorResponse, "description": "未授权"},
        409: {"model": ErrorResponse, "description": "用户名已存在"},
    },
    summary="更新用户资料",
    description="更新当前用户的资料信息，目前支持修改用户名。",
)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> ResponseModel[UserResponse]:
    """更新用户资料。

    Args:
        request: 更新请求数据
        current_user: 当前用户
        user_service: 用户服务实例

    Returns:
        ResponseModel[UserResponse]: 更新后的用户信息

    Raises:
        HTTPException: 更新失败时返回相应错误码
    """
    logger.info(
        "API: update_profile called",
        user_id=current_user.id,
        new_username=request.username,
    )

    try:
        updated_user = await user_service.update_username(
            current_user.id, request.username
        )

        logger.info(
            "API: profile updated successfully",
            user_id=current_user.id,
            username=updated_user.username,
        )

        return ResponseModel(
            code=status.HTTP_200_OK,
            message="Profile updated successfully",
            data=updated_user,
        )
    except AppException as e:
        logger.warning(
            "API: update_profile failed",
            user_id=current_user.id,
            reason=e.message,
        )
        raise


@router.put(
    "/avatar",
    response_model=ResponseModel[UserResponse],
    responses={
        400: {"model": ErrorResponse, "description": "请求参数错误"},
        401: {"model": ErrorResponse, "description": "未授权"},
    },
    summary="更新用户头像",
    description="更新当前用户的头像。",
)
async def update_avatar(
    request: UpdateAvatarRequest,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> ResponseModel[UserResponse]:
    """更新用户头像。

    Args:
        request: 更新请求数据
        current_user: 当前用户
        user_service: 用户服务实例

    Returns:
        ResponseModel[UserResponse]: 更新后的用户信息

    Raises:
        HTTPException: 更新失败时返回相应错误码
    """
    logger.info("API: update_avatar called", user_id=current_user.id)

    try:
        updated_user = await user_service.update_avatar(
            current_user.id, request.avatar
        )

        logger.info(
            "API: avatar updated successfully",
            user_id=current_user.id,
        )

        return ResponseModel(
            code=status.HTTP_200_OK,
            message="Avatar updated successfully",
            data=updated_user,
        )
    except AppException as e:
        logger.warning(
            "API: update_avatar failed",
            user_id=current_user.id,
            reason=e.message,
        )
        raise


@router.get(
    "/profile",
    response_model=ResponseModel[UserResponse],
    responses={
        401: {"model": ErrorResponse, "description": "未授权"},
    },
    summary="获取用户资料",
    description="获取当前用户的完整资料信息。",
)
async def get_profile(
    current_user: User = Depends(get_current_user),
) -> ResponseModel[UserResponse]:
    """获取用户资料。

    Args:
        current_user: 当前用户

    Returns:
        ResponseModel[UserResponse]: 用户信息
    """
    logger.info("API: get_profile called", user_id=current_user.id)

    return ResponseModel(
        code=status.HTTP_200_OK,
        message="success",
        data=UserResponse.model_validate(current_user),
    )
