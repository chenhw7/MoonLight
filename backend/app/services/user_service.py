"""用户服务模块。

提供用户资料管理相关的业务逻辑，包括更新用户名、获取用户信息等。
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.auth import UserResponse

logger = get_logger(__name__)


class UserService:
    """用户服务类。

    处理所有与用户资料管理相关的业务逻辑。

    Attributes:
        db: 异步数据库会话

    Example:
        >>> user_service = UserService(db)
        >>> user = await user_service.update_username(user_id, "new_username")
    """

    def __init__(self, db: AsyncSession):
        """初始化用户服务。

        Args:
            db: 异步数据库会话
        """
        self.db = db

    async def get_user_by_id(self, user_id: int) -> User | None:
        """根据 ID 获取用户。

        Args:
            user_id: 用户 ID

        Returns:
            User 对象或 None
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> User | None:
        """根据用户名获取用户。

        Args:
            username: 用户名

        Returns:
            User 对象或 None
        """
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def update_username(self, user_id: int, new_username: str) -> UserResponse:
        """更新用户名。

        Args:
            user_id: 用户 ID
            new_username: 新用户名

        Returns:
            UserResponse: 更新后的用户信息

        Raises:
            NotFoundError: 用户不存在
            ValidationError: 用户名格式无效
            ConflictError: 用户名已被占用

        Example:
            >>> user = await user_service.update_username(1, "new_name")
        """
        logger.info("Updating username", user_id=user_id, new_username=new_username)

        # 验证用户名格式
        self._validate_username(new_username)

        # 查找用户
        user = await self.get_user_by_id(user_id)
        if not user:
            logger.warning("User not found", user_id=user_id)
            raise NotFoundError("User not found")

        # 如果用户名没变，直接返回
        if user.username == new_username:
            logger.debug("Username unchanged", user_id=user_id)
            return UserResponse.model_validate(user)

        # 检查用户名是否已被占用
        existing_user = await self.get_user_by_username(new_username)
        if existing_user and existing_user.id != user_id:
            logger.warning("Username already taken", username=new_username)
            raise ConflictError("Username already taken")

        # 更新用户名
        old_username = user.username
        user.username = new_username
        await self.db.flush()

        logger.info(
            "Username updated successfully",
            user_id=user_id,
            old_username=old_username,
            new_username=new_username,
        )

        return UserResponse.model_validate(user)

    async def update_avatar(self, user_id: int, avatar_url: str) -> UserResponse:
        """更新用户头像。

        Args:
            user_id: 用户 ID
            avatar_url: 头像 URL

        Returns:
            UserResponse: 更新后的用户信息

        Raises:
            NotFoundError: 用户不存在

        Example:
            >>> user = await user_service.update_avatar(1, "https://example.com/avatar.jpg")
        """
        logger.info("Updating avatar", user_id=user_id)

        # 查找用户
        user = await self.get_user_by_id(user_id)
        if not user:
            logger.warning("User not found", user_id=user_id)
            raise NotFoundError("User not found")

        # 更新头像
        user.avatar = avatar_url
        await self.db.flush()

        logger.info("Avatar updated successfully", user_id=user_id)

        return UserResponse.model_validate(user)

    def _validate_username(self, username: str) -> None:
        """验证用户名格式。

        Args:
            username: 用户名

        Raises:
            ValidationError: 用户名格式无效
        """
        if not username:
            raise ValidationError("Username is required")

        if len(username) < 3:
            raise ValidationError("Username must be at least 3 characters")

        if len(username) > 20:
            raise ValidationError("Username must be at most 20 characters")

        # 允许字母、数字、下划线、中文字符
        import re

        if not re.match(r"^[\w\u4e00-\u9fa5]+$", username):
            raise ValidationError(
                "Username can only contain letters, numbers, underscores, and Chinese characters"
            )
