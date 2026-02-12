"""AI 配置路由模块。

提供 AI 配置的 CRUD 接口和连接测试功能。
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import get_logger
from app.core.security import get_current_user
from app.models.interview import AIConfig
from app.models.user import User
from app.schemas.ai_config import (
    AIConfigCreate,
    AIConfigResponse,
    AIConfigTestRequest,
    AIConfigTestResponse,
    AIConfigUpdate,
    ModelListResponse,
)
from app.services.ai_config_service import AIConfigService, AIConfigTestService

logger = get_logger(__name__)

router = APIRouter(prefix="/ai-config", tags=["AI 配置"])


@router.get(
    "",
    response_model=AIConfigResponse,
    summary="获取 AI 配置",
    description="获取当前用户的 AI 配置信息。",
)
async def get_ai_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIConfig:
    """获取 AI 配置。"""
    config = await AIConfigService.get_by_user_id(db, current_user.id)

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI 配置不存在",
        )

    # 添加脱敏的 api_key
    config.api_key_masked = AIConfigService.mask_api_key(config.api_key)

    return config


@router.put(
    "",
    response_model=AIConfigResponse,
    summary="更新 AI 配置",
    description="创建或更新当前用户的 AI 配置。",
)
async def update_ai_config(
    config_data: AIConfigCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIConfig:
    """更新 AI 配置。"""
    config = await AIConfigService.create_or_update(
        db, current_user.id, config_data
    )

    # 添加脱敏的 api_key
    config.api_key_masked = AIConfigService.mask_api_key(config.api_key)

    return config


@router.patch(
    "",
    response_model=AIConfigResponse,
    summary="部分更新 AI 配置",
    description="部分更新当前用户的 AI 配置。",
)
async def patch_ai_config(
    config_update: AIConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIConfig:
    """部分更新 AI 配置。"""
    config = await AIConfigService.update(
        db, current_user.id, config_update
    )

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI 配置不存在",
        )

    # 添加脱敏的 api_key
    config.api_key_masked = AIConfigService.mask_api_key(config.api_key)

    return config


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除 AI 配置",
    description="删除当前用户的 AI 配置。",
)
async def delete_ai_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """删除 AI 配置。"""
    deleted = await AIConfigService.delete(db, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI 配置不存在",
        )


@router.post(
    "/test",
    response_model=AIConfigTestResponse,
    summary="测试 AI 连接",
    description="测试 AI 配置是否可用，返回可用模型列表。",
)
async def test_ai_connection(
    test_data: AIConfigTestRequest,
) -> AIConfigTestResponse:
    """测试 AI 连接。"""
    success, message, models = await AIConfigTestService.test_connection(
        base_url=test_data.base_url,
        api_key=test_data.api_key,
    )

    return AIConfigTestResponse(
        success=success,
        message=message,
        models=models,
    )


@router.get(
    "/models",
    response_model=ModelListResponse,
    summary="获取模型列表",
    description="获取当前用户配置的可用模型列表。",
)
async def get_models(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ModelListResponse:
    """获取模型列表。"""
    config = await AIConfigService.get_by_user_id(db, current_user.id)

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI 配置不存在，请先配置",
        )

    models = await AIConfigTestService.fetch_models(
        base_url=config.base_url,
        api_key=config.api_key,
    )

    return ModelListResponse(models=models)
