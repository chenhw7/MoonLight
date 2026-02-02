"""认证服务模块。

提供用户认证相关的业务逻辑，包括注册、登录、验证码管理等。
"""

import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
    RateLimitError,
    ValidationError,
)
from app.core.logging import get_logger
from app.core.security import (
    create_token_pair,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User, VerificationCode
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    PasswordResetRequest,
    RefreshTokenResponse,
    UserCreate,
    UserResponse,
    VerificationCodeResponse,
)

logger = get_logger(__name__)
settings = get_settings()


class AuthService:
    """认证服务类。

    处理所有与用户认证相关的业务逻辑。

    Attributes:
        db: 异步数据库会话

    Example:
        >>> auth_service = AuthService(db)
        >>> user = await auth_service.register(user_data)
    """

    def __init__(self, db: AsyncSession):
        """初始化认证服务。

        Args:
            db: 异步数据库会话
        """
        self.db = db

    async def register(self, user_data: UserCreate) -> LoginResponse:
        """用户注册。

        验证验证码后创建新用户，并返回登录令牌。

        Args:
            user_data: 用户注册数据

        Returns:
            LoginResponse: 包含访问令牌和用户信息

        Raises:
            ConflictError: 邮箱或用户名已存在
            ValidationError: 验证码无效或过期

        Example:
            >>> user_data = UserCreate(
            ...     email="user@example.com",
            ...     username="john",
            ...     password="Password123",
            ...     verification_code="123456"
            ... )
            >>> result = await auth_service.register(user_data)
        """
        logger.info("Registration attempt", email=user_data.email, username=user_data.username)

        # 检查邮箱是否已注册
        existing_user = await self._get_user_by_email(user_data.email)
        if existing_user:
            logger.warning("Email already registered", email=user_data.email)
            raise ConflictError("Email already registered")

        # 检查用户名是否已存在
        existing_username = await self._get_user_by_username(user_data.username)
        if existing_username:
            logger.warning("Username already taken", username=user_data.username)
            raise ConflictError("Username already taken")

        # 验证验证码
        is_valid = await self._verify_code(
            user_data.email, user_data.verification_code, "register"
        )
        if not is_valid:
            logger.warning("Invalid verification code", email=user_data.email)
            raise ValidationError("Invalid or expired verification code")

        # 创建用户
        user = User(
            email=user_data.email,
            username=user_data.username,
            password_hash=hash_password(user_data.password),
            is_active=True,
        )
        self.db.add(user)
        await self.db.flush()

        logger.info("User registered successfully", user_id=user.id, email=user.email)

        # 生成令牌
        access_token, refresh_token = create_token_pair(
            str(user.id), user.email
        )

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )

    async def login(self, login_data: LoginRequest) -> LoginResponse:
        """用户登录。

        验证邮箱和密码，返回访问令牌。

        Args:
            login_data: 登录请求数据

        Returns:
            LoginResponse: 包含访问令牌和用户信息

        Raises:
            AuthenticationError: 邮箱或密码错误

        Example:
            >>> login_data = LoginRequest(
            ...     email="user@example.com",
            ...     password="Password123"
            ... )
            >>> result = await auth_service.login(login_data)
        """
        logger.info("Login attempt", email=login_data.email)

        # 查找用户
        user = await self._get_user_by_email(login_data.email)
        if not user:
            logger.warning("User not found", email=login_data.email)
            raise AuthenticationError("Account does not exist")

        # 验证密码
        if not verify_password(login_data.password, user.password_hash):
            logger.warning("Invalid password", email=login_data.email)
            raise AuthenticationError("Password is incorrect")

        # 检查用户状态
        if not user.is_active:
            logger.warning("User account is inactive", email=login_data.email)
            raise AuthenticationError("Account is inactive")

        logger.info("Login successful", user_id=user.id, email=user.email)

        # 生成令牌
        access_token, refresh_token = create_token_pair(
            str(user.id), user.email
        )

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )

    async def refresh_token(self, refresh_token: str) -> RefreshTokenResponse:
        """刷新访问令牌。

        使用刷新令牌生成新的访问令牌。

        Args:
            refresh_token: 刷新令牌

        Returns:
            RefreshTokenResponse: 包含新的访问令牌

        Raises:
            AuthenticationError: 刷新令牌无效或过期

        Example:
            >>> result = await auth_service.refresh_token("eyJhbGciOiJIUzI1NiIs...")
        """
        logger.debug("Token refresh attempt")

        # 解码刷新令牌
        payload = decode_token(refresh_token)
        if not payload:
            logger.warning("Invalid refresh token")
            raise AuthenticationError("Invalid refresh token")

        # 检查令牌类型
        if payload.get("type") != "refresh":
            logger.warning("Invalid token type")
            raise AuthenticationError("Invalid token type")

        # 获取用户
        user_id = payload.get("sub")
        user = await self._get_user_by_id(int(user_id))
        if not user or not user.is_active:
            logger.warning("User not found or inactive", user_id=user_id)
            raise AuthenticationError("User not found or inactive")

        logger.info("Token refreshed", user_id=user.id)

        # 生成新的访问令牌
        from app.core.security import create_access_token

        access_token = create_access_token({"sub": str(user.id), "email": user.email})

        return RefreshTokenResponse(access_token=access_token)

    async def send_verification_code(
        self, email: str, code_type: str
    ) -> VerificationCodeResponse:
        """发送验证码。

        生成验证码并发送到用户邮箱，用于注册或密码重置。

        Args:
            email: 用户邮箱地址
            code_type: 验证码类型（register/reset_password）

        Returns:
            VerificationCodeResponse: 包含发送结果和冷却时间

        Raises:
            RateLimitError: 触发频率限制

        Example:
            >>> result = await auth_service.send_verification_code(
            ...     "user@example.com", "register"
            ... )
        """
        logger.info("Sending verification code", email=email, code_type=code_type)

        # 检查频率限制
        can_send = await self._check_rate_limit(email, code_type)
        if not can_send:
            logger.warning("Rate limit exceeded", email=email)
            raise RateLimitError(
                f"Please wait {settings.verification_code_cooldown_seconds} seconds before requesting another code"
            )

        # 生成验证码
        code = self._generate_verification_code()

        # 保存验证码
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.verification_code_expire_minutes
        )
        verification = VerificationCode(
            email=email,
            code=code,
            code_type=code_type,
            expires_at=expires_at,
        )
        self.db.add(verification)
        await self.db.flush()

        # 发送验证码邮件
        from app.utils.email import send_verification_email

        email_sent = await send_verification_email(email, code, code_type)
        if not email_sent:
            logger.error("Failed to send verification email", email=email)
            raise RuntimeError("Failed to send verification email")

        logger.info(
            "Verification code sent",
            email=email,
            code_type=code_type,
        )

        return VerificationCodeResponse(
            message="Verification code sent successfully",
            cooldown_seconds=settings.verification_code_cooldown_seconds,
        )

    async def reset_password(self, reset_data: PasswordResetRequest) -> None:
        """重置密码。

        验证验证码后重置用户密码。

        Args:
            reset_data: 密码重置请求数据

        Raises:
            NotFoundError: 用户不存在
            ValidationError: 验证码无效或过期

        Example:
            >>> reset_data = PasswordResetRequest(
            ...     email="user@example.com",
            ...     verification_code="123456",
            ...     new_password="NewPassword123"
            ... )
            >>> await auth_service.reset_password(reset_data)
        """
        logger.info("Password reset attempt", email=reset_data.email)

        # 查找用户
        user = await self._get_user_by_email(reset_data.email)
        if not user:
            logger.warning("User not found", email=reset_data.email)
            raise NotFoundError("User not found")

        # 验证验证码
        is_valid = await self._verify_code(
            reset_data.email, reset_data.verification_code, "reset_password"
        )
        if not is_valid:
            logger.warning("Invalid verification code", email=reset_data.email)
            raise ValidationError("Invalid or expired verification code")

        # 更新密码
        user.password_hash = hash_password(reset_data.new_password)
        await self.db.flush()

        logger.info("Password reset successful", user_id=user.id)

    async def check_email_exists(self, email: str) -> bool:
        """检查邮箱是否已存在。

        Args:
            email: 邮箱地址

        Returns:
            bool: 邮箱已存在返回 True，否则返回 False
        """
        user = await self._get_user_by_email(email)
        return user is not None

    async def _get_user_by_email(self, email: str) -> Optional[User]:
        """通过邮箱获取用户。

        Args:
            email: 用户邮箱

        Returns:
            Optional[User]: 用户对象或 None
        """
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def _get_user_by_username(self, username: str) -> Optional[User]:
        """通过用户名获取用户。

        Args:
            username: 用户名

        Returns:
            Optional[User]: 用户对象或 None
        """
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def _get_user_by_id(self, user_id: int) -> Optional[User]:
        """通过 ID 获取用户。

        Args:
            user_id: 用户 ID

        Returns:
            Optional[User]: 用户对象或 None
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def verify_code(
        self, email: str, code: str, code_type: str
    ) -> bool:
        """验证验证码（公共方法，不标记为已使用）。

        Args:
            email: 邮箱地址
            code: 验证码
            code_type: 验证码类型

        Returns:
            bool: 验证成功返回 True
        """
        result = await self.db.execute(
            select(VerificationCode)
            .where(VerificationCode.email == email)
            .where(VerificationCode.code == code)
            .where(VerificationCode.code_type == code_type)
            .where(VerificationCode.is_used == False)
            .order_by(VerificationCode.created_at.desc())
        )
        verification = result.scalar_one_or_none()

        if not verification or not verification.is_valid():
            return False

        return True

    async def _verify_code(
        self, email: str, code: str, code_type: str
    ) -> bool:
        """验证验证码并标记为已使用（内部方法）。

        Args:
            email: 邮箱地址
            code: 验证码
            code_type: 验证码类型

        Returns:
            bool: 验证成功返回 True
        """
        result = await self.db.execute(
            select(VerificationCode)
            .where(VerificationCode.email == email)
            .where(VerificationCode.code == code)
            .where(VerificationCode.code_type == code_type)
            .where(VerificationCode.is_used == False)
            .order_by(VerificationCode.created_at.desc())
        )
        verification = result.scalar_one_or_none()

        if not verification or not verification.is_valid():
            return False

        # 标记为已使用
        verification.is_used = True
        await self.db.flush()

        return True

    async def _check_rate_limit(self, email: str, code_type: str) -> bool:
        """检查发送频率限制。

        Args:
            email: 邮箱地址
            code_type: 验证码类型

        Returns:
            bool: 可以发送返回 True
        """
        cooldown = timedelta(seconds=settings.verification_code_cooldown_seconds)
        since = datetime.now(timezone.utc) - cooldown

        result = await self.db.execute(
            select(VerificationCode)
            .where(VerificationCode.email == email)
            .where(VerificationCode.code_type == code_type)
            .where(VerificationCode.created_at > since)
        )
        recent = result.scalars().all()

        return len(recent) == 0

    def _generate_verification_code(self) -> str:
        """生成6位数字验证码。

        Returns:
            str: 6位数字验证码
        """
        return "".join(random.choices(string.digits, k=6))
