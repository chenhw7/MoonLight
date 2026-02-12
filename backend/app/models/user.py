"""用户模型模块。

定义用户和验证码相关的数据库模型。
"""

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.resume import Resume
    from app.models.interview import InterviewSession


class User(Base):
    """用户模型。

    存储用户的基本信息，包括邮箱、用户名、密码哈希等。

    Attributes:
        id: 主键 ID
        email: 邮箱地址（唯一）
        username: 用户名（唯一）
        password_hash: 密码哈希
        is_active: 是否激活
        created_at: 创建时间
        updated_at: 更新时间

    Example:
        >>> user = User(email="user@example.com", username="john", password_hash="...")
        >>> print(user.email)
        'user@example.com'
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    username: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # 关系
    resumes: Mapped[List["Resume"]] = relationship("Resume", back_populates="user")
    interview_sessions: Mapped[List["InterviewSession"]] = relationship(
        "InterviewSession", back_populates="user"
    )

    def __repr__(self) -> str:
        """返回用户对象的字符串表示。"""
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"


class VerificationCode(Base):
    """验证码模型。

    存储邮箱验证码，用于注册和密码重置验证。

    Attributes:
        id: 主键 ID
        email: 邮箱地址
        code: 验证码
        code_type: 验证码类型（register/reset_password）
        is_used: 是否已使用
        created_at: 创建时间
        expires_at: 过期时间

    Example:
        >>> code = VerificationCode(
        ...     email="user@example.com",
        ...     code="123456",
        ...     code_type="register",
        ...     expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        ... )
    """

    __tablename__ = "verification_codes"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True
    )
    email: Mapped[str] = mapped_column(
        String(255), index=True, nullable=False
    )
    code: Mapped[str] = mapped_column(
        String(6), nullable=False
    )
    code_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    is_used: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    def __repr__(self) -> str:
        """返回验证码对象的字符串表示。"""
        return (
            f"<VerificationCode(id={self.id}, email={self.email}, "
            f"type={self.code_type}, is_used={self.is_used})>"
        )

    def is_expired(self) -> bool:
        """检查验证码是否已过期。

        Returns:
            bool: 已过期返回 True，否则返回 False
        """
        return datetime.now(timezone.utc) > self.expires_at

    def is_valid(self) -> bool:
        """检查验证码是否有效（未使用且未过期）。

        Returns:
            bool: 有效返回 True，否则返回 False
        """
        return not self.is_used and not self.is_expired()
