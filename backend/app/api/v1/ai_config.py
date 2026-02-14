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
    AIConfigListResponse,
    SetActiveConfigRequest,
    ModelListResponse,
)
from app.services.ai_config_service import AIConfigService, AIConfigTestService

logger = get_logger(__name__)

router = APIRouter(prefix="/ai-config", tags=["AI 配置"])


def _format_config_response(config: AIConfig) -> dict:
    """格式化配置响应。"""
    return {
        "id": config.id,
        "user_id": config.user_id,
        "name": config.name,
        "provider": config.provider,
        "base_url": config.base_url,
        "chat_model": config.chat_model,
        "temperature": config.temperature,
        "max_tokens": config.max_tokens,
        "is_active": config.is_active,
        "api_key_masked": AIConfigService.mask_api_key(config.api_key),
        "created_at": config.created_at.isoformat() if config.created_at else "",
        "updated_at": config.updated_at.isoformat() if config.updated_at else "",
    }


@router.get(
    "",
    response_model=AIConfigListResponse,
    summary="获取所有 AI 配置",
    description="获取当前用户的所有 AI 配置列表。",
)
async def get_ai_configs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIConfigListResponse:
    """获取所有 AI 配置。"""
    configs = await AIConfigService.get_all_by_user_id(db, current_user.id)
    active_config_id = None
    
    formatted_configs = []
    for config in configs:
        if config.is_active:
            active_config_id = config.id
        formatted_configs.append(_format_config_response(config))

    return AIConfigListResponse(
        configs=formatted_configs,
        active_config_id=active_config_id,
    )


@router.get(
    "/active",
    response_model=AIConfigResponse,
    summary="获取当前激活的 AI 配置",
    description="获取当前用户正在使用的 AI 配置。",
)
async def get_active_ai_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIConfigResponse:
    """获取当前激活的 AI 配置。"""
    config = await AIConfigService.get_by_user_id(db, current_user.id)

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI 配置不存在",
        )

    return _format_config_response(config)


@router.post(
    "",
    response_model=AIConfigResponse,
    summary="创建 AI 配置",
    description="创建新的 AI 配置。",
)
async def create_ai_config(
    config_data: AIConfigCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIConfigResponse:
    """创建 AI 配置。"""
    config = await AIConfigService.create(db, current_user.id, config_data)
    return _format_config_response(config)


@router.put(
    "/{config_id}",
    response_model=AIConfigResponse,
    summary="更新 AI 配置",
    description="更新指定的 AI 配置。",
)
async def update_ai_config(
    config_id: int,
    config_data: AIConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIConfigResponse:
    """更新 AI 配置。"""
    config = await AIConfigService.update(
        db, config_id, current_user.id, config_data
    )

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI 配置不存在",
        )

    return _format_config_response(config)


@router.delete(
    "/{config_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除 AI 配置",
    description="删除指定的 AI 配置。",
)
async def delete_ai_config(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """删除 AI 配置。"""
    deleted = await AIConfigService.delete(db, config_id, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI 配置不存在",
        )


@router.post(
    "/{config_id}/activate",
    response_model=AIConfigResponse,
    summary="激活 AI 配置",
    description="将指定的配置设为当前使用的配置。",
)
async def activate_ai_config(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIConfigResponse:
    """激活 AI 配置。"""
    config = await AIConfigService.set_active(db, config_id, current_user.id)

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI 配置不存在",
        )

    return _format_config_response(config)


@router.post(
    "/test",
    response_model=AIConfigTestResponse,
    summary="测试 AI 连接",
    description="测试 AI 配置是否可用，返回可用模型列表。",
)
async def test_ai_connection(
    test_data: AIConfigTestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIConfigTestResponse:
    """测试 AI 连接。"""
    api_key = test_data.api_key
    
    # 特殊标记：使用已保存的 Key
    USE_SAVED_KEY = "__USE_SAVED_KEY__"
    if api_key == USE_SAVED_KEY:
        # 从数据库获取已保存的 Key（从激活的配置）
        config = await AIConfigService.get_by_user_id(db, current_user.id)
        if config:
            api_key = config.api_key
        else:
            return AIConfigTestResponse(
                success=False,
                message="未找到已保存的 API Key，请先配置",
                models=[],
            )
    
    success, message, models = await AIConfigTestService.test_connection(
        base_url=test_data.base_url,
        api_key=api_key,
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
