"""AI 配置服务模块。

提供 AI 配置的 CRUD 操作和连接测试功能。
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_client import AIClient, AIClientError
from app.core.logging import get_logger
from app.models.interview import AIConfig
from app.schemas.ai_config import AIConfigCreate, AIConfigUpdate

logger = get_logger(__name__)


class AIConfigService:
    """AI 配置服务。"""

    @staticmethod
    async def get_by_user_id(
        db: AsyncSession, user_id: int
    ) -> Optional[AIConfig]:
        """获取用户的 AI 配置。

        Args:
            db: 数据库会话
            user_id: 用户 ID

        Returns:
            AI 配置，如果不存在返回 None
        """
        result = await db.execute(
            select(AIConfig).where(AIConfig.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_or_update(
        db: AsyncSession, user_id: int, config_data: AIConfigCreate
    ) -> AIConfig:
        """创建或更新 AI 配置。

        Args:
            db: 数据库会话
            user_id: 用户 ID
            config_data: 配置数据

        Returns:
            创建或更新后的 AI 配置
        """
        # 查询现有配置
        existing = await AIConfigService.get_by_user_id(db, user_id)

        if existing:
            # 更新现有配置
            existing.provider = config_data.provider
            existing.base_url = config_data.base_url
            existing.api_key = config_data.api_key
            existing.chat_model = config_data.chat_model
            existing.reasoning_model = config_data.reasoning_model
            existing.vision_model = config_data.vision_model
            existing.voice_model = config_data.voice_model
            existing.temperature = config_data.temperature
            existing.max_tokens = config_data.max_tokens

            await db.commit()
            await db.refresh(existing)

            logger.info(
                "AI config updated",
                extra={"user_id": user_id, "config_id": existing.id},
            )
            return existing
        else:
            # 创建新配置
            new_config = AIConfig(
                user_id=user_id,
                provider=config_data.provider,
                base_url=config_data.base_url,
                api_key=config_data.api_key,
                chat_model=config_data.chat_model,
                reasoning_model=config_data.reasoning_model,
                vision_model=config_data.vision_model,
                voice_model=config_data.voice_model,
                temperature=config_data.temperature,
                max_tokens=config_data.max_tokens,
            )

            db.add(new_config)
            await db.commit()
            await db.refresh(new_config)

            logger.info(
                "AI config created",
                extra={"user_id": user_id, "config_id": new_config.id},
            )
            return new_config

    @staticmethod
    async def update(
        db: AsyncSession,
        user_id: int,
        config_update: AIConfigUpdate,
    ) -> Optional[AIConfig]:
        """部分更新 AI 配置。

        Args:
            db: 数据库会话
            user_id: 用户 ID
            config_update: 更新的配置数据

        Returns:
            更新后的 AI 配置，如果不存在返回 None
        """
        config = await AIConfigService.get_by_user_id(db, user_id)
        if not config:
            return None

        update_data = config_update.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(config, field):
                setattr(config, field, value)

        await db.commit()
        await db.refresh(config)

        logger.info(
            "AI config partially updated",
            extra={"user_id": user_id, "config_id": config.id},
        )
        return config

    @staticmethod
    async def delete(db: AsyncSession, user_id: int) -> bool:
        """删除 AI 配置。

        Args:
            db: 数据库会话
            user_id: 用户 ID

        Returns:
            是否成功删除
        """
        config = await AIConfigService.get_by_user_id(db, user_id)
        if not config:
            return False

        await db.delete(config)
        await db.commit()

        logger.info(
            "AI config deleted",
            extra={"user_id": user_id, "config_id": config.id},
        )
        return True

    @staticmethod
    def mask_api_key(api_key: str) -> str:
        """脱敏 API Key。

        Args:
            api_key: 原始 API Key

        Returns:
            脱敏后的 API Key
        """
        if not api_key:
            return ""
        if len(api_key) <= 8:
            return "****"
        return f"{api_key[:4]}****{api_key[-4:]}"


class AIConfigTestService:
    """AI 配置测试服务。"""

    @staticmethod
    async def test_connection(
        base_url: str, api_key: str
    ) -> tuple[bool, str, list[str]]:
        """测试 AI 配置连接。

        Args:
            base_url: API 基础 URL
            api_key: API 密钥

        Returns:
            (是否成功, 消息, 可用模型列表)
        """
        try:
            client = AIClient(base_url=base_url, api_key=api_key)

            # 测试连接
            models = await client.list_models()

            logger.info(
                "AI connection test successful",
                extra={
                    "base_url": base_url,
                    "models_count": len(models),
                },
            )

            return (
                True,
                f"连接成功！发现 {len(models)} 个可用模型",
                models,
            )

        except AIClientError as e:
            logger.error(
                "AI connection test failed",
                extra={
                    "base_url": base_url,
                    "error": str(e),
                },
            )
            return (
                False,
                f"连接失败：{e.message}",
                [],
            )
        except Exception as e:
            logger.error(
                "AI connection test unexpected error",
                extra={
                    "base_url": base_url,
                    "error": str(e),
                },
            )
            return (
                False,
                f"连接失败：{str(e)}",
                [],
            )

    @staticmethod
    async def fetch_models(base_url: str, api_key: str) -> list[str]:
        """获取可用模型列表。

        Args:
            base_url: API 基础 URL
            api_key: API 密钥

        Returns:
            模型 ID 列表
        """
        try:
            client = AIClient(base_url=base_url, api_key=api_key)
            return await client.list_models()
        except Exception:
            return []
