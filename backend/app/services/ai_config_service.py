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
    async def get_by_id(
        db: AsyncSession, config_id: int, user_id: int
    ) -> Optional[AIConfig]:
        """根据 ID 获取配置。

        Args:
            db: 数据库会话
            config_id: 配置 ID
            user_id: 用户 ID

        Returns:
            AI 配置，如果不存在返回 None
        """
        result = await db.execute(
            select(AIConfig).where(
                AIConfig.id == config_id,
                AIConfig.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_user_id(
        db: AsyncSession, user_id: int
    ) -> Optional[AIConfig]:
        """获取用户的当前激活 AI 配置。

        Args:
            db: 数据库会话
            user_id: 用户 ID

        Returns:
            AI 配置，如果不存在返回 None
        """
        result = await db.execute(
            select(AIConfig).where(
                AIConfig.user_id == user_id,
                AIConfig.is_active == True
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_by_user_id(
        db: AsyncSession, user_id: int
    ) -> list[AIConfig]:
        """获取用户的所有 AI 配置。

        Args:
            db: 数据库会话
            user_id: 用户 ID

        Returns:
            AI 配置列表
        """
        result = await db.execute(
            select(AIConfig).where(AIConfig.user_id == user_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create(
        db: AsyncSession, user_id: int, config_data: AIConfigCreate
    ) -> AIConfig:
        """创建新的 AI 配置。

        Args:
            db: 数据库会话
            user_id: 用户 ID
            config_data: 配置数据

        Returns:
            创建后的 AI 配置
        """
        # 检查是否已有配置，如果没有，设为激活
        existing = await AIConfigService.get_all_by_user_id(db, user_id)
        is_first = len(existing) == 0

        new_config = AIConfig(
            user_id=user_id,
            name=config_data.name,
            provider=config_data.provider,
            base_url=config_data.base_url,
            api_key=config_data.api_key,
            chat_model=config_data.chat_model,
            temperature=config_data.temperature,
            max_tokens=config_data.max_tokens,
            is_active=is_first,  # 第一个配置自动设为激活
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
        config_id: int,
        user_id: int,
        config_update: AIConfigUpdate,
    ) -> Optional[AIConfig]:
        """更新 AI 配置。

        Args:
            db: 数据库会话
            config_id: 配置 ID
            user_id: 用户 ID
            config_update: 更新的配置数据

        Returns:
            更新后的 AI 配置，如果不存在返回 None
        """
        config = await AIConfigService.get_by_id(db, config_id, user_id)
        if not config:
            return None

        # 特殊标记：使用已保存的 Key
        USE_SAVED_KEY = "__USE_SAVED_KEY__"

        update_data = config_update.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if field == "api_key" and value == USE_SAVED_KEY:
                # 跳过，保留原 Key
                continue
            if hasattr(config, field):
                setattr(config, field, value)

        await db.commit()
        await db.refresh(config)

        logger.info(
            "AI config updated",
            extra={"user_id": user_id, "config_id": config.id},
        )
        return config

    @staticmethod
    async def delete(db: AsyncSession, config_id: int, user_id: int) -> bool:
        """删除 AI 配置。

        Args:
            db: 数据库会话
            config_id: 配置 ID
            user_id: 用户 ID

        Returns:
            是否成功删除
        """
        config = await AIConfigService.get_by_id(db, config_id, user_id)
        if not config:
            return False

        was_active = config.is_active
        await db.delete(config)
        await db.commit()

        # 如果删除的是激活配置，尝试将第一个剩余配置设为激活
        if was_active:
            remaining = await AIConfigService.get_all_by_user_id(db, user_id)
            if remaining:
                remaining[0].is_active = True
                await db.commit()

        logger.info(
            "AI config deleted",
            extra={"user_id": user_id, "config_id": config_id},
        )
        return True

    @staticmethod
    async def set_active(
        db: AsyncSession, config_id: int, user_id: int
    ) -> Optional[AIConfig]:
        """设置当前激活配置。

        Args:
            db: 数据库会话
            config_id: 配置 ID
            user_id: 用户 ID

        Returns:
            激活的配置，如果不存在返回 None
        """
        # 先取消所有激活状态
        result = await db.execute(
            select(AIConfig).where(
                AIConfig.user_id == user_id,
                AIConfig.is_active == True
            )
        )
        for config in result.scalars().all():
            config.is_active = False

        # 设置指定配置为激活
        target = await AIConfigService.get_by_id(db, config_id, user_id)
        if not target:
            await db.commit()
            return None

        target.is_active = True
        await db.commit()
        await db.refresh(target)

        logger.info(
            "AI config set active",
            extra={"user_id": user_id, "config_id": config_id},
        )
        return target

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
            models = await client.list_models()
            return True, f"连接成功，发现 {len(models)} 个可用模型", models
        except AIClientError as e:
            logger.warning(
                "AI connection test failed",
                extra={"base_url": base_url, "error": str(e)},
            )
            return False, f"连接失败: {str(e)}", []
        except Exception as e:
            logger.error(
                "AI connection test error",
                extra={"base_url": base_url, "error": str(e)},
            )
            return False, f"测试出错: {str(e)}", []

    @staticmethod
    async def fetch_models(base_url: str, api_key: str) -> list[str]:
        """获取可用模型列表。

        Args:
            base_url: API 基础 URL
            api_key: API 密钥

        Returns:
            可用模型列表
        """
        try:
            client = AIClient(base_url=base_url, api_key=api_key)
            return await client.list_models()
        except Exception as e:
            logger.error(
                "Failed to fetch models",
                extra={"base_url": base_url, "error": str(e)},
            )
            return []
