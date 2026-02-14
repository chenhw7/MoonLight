"""面试相关数据模型模块。

定义 AI 面试官功能相关的数据库模型，包括面试会话、消息和评价。
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Float,
    JSON,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.resume import Resume


class InterviewSession(Base):
    """面试会话模型。

    存储一次模拟面试的完整信息，包括配置、状态和关联数据。

    Attributes:
        id: 主键 ID
        user_id: 关联用户 ID
        resume_id: 关联简历 ID
        company_name: 目标企业名称
        position_name: 目标岗位名称
        job_description: 岗位描述（JD）
        recruitment_type: 招聘类型（campus/social）
        interview_mode: 面试模式
        interviewer_style: 面试官风格
        model_config: AI 模型配置快照
        status: 会话状态
        current_round: 当前面试轮次
        start_time: 开始时间
        end_time: 结束时间
        created_at: 创建时间
        updated_at: 更新时间
    """

    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    resume_id: Mapped[int] = mapped_column(
        ForeignKey("resumes.id"), nullable=False
    )

    # 企业信息
    company_name: Mapped[str] = mapped_column(String(100), nullable=False)
    position_name: Mapped[str] = mapped_column(String(100), nullable=False)
    job_description: Mapped[str] = mapped_column(Text, nullable=False)

    # 面试配置
    recruitment_type: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="campus/social"
    )
    interview_mode: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="面试模式"
    )
    interviewer_style: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="strict/gentle/pressure"
    )

    # AI 模型配置快照（JSON 格式）
    model_config: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict
    )

    # 状态管理
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ongoing",
        comment="ongoing/completed/aborted",
    )
    current_round: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="opening",
        comment="opening/self_intro/qa/reverse_qa/closing",
    )

    # 时间戳
    start_time: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    end_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # 关联关系
    user: Mapped["User"] = relationship(
        "User", back_populates="interview_sessions"
    )
    resume: Mapped["Resume"] = relationship("Resume")
    messages: Mapped[list["InterviewMessage"]] = relationship(
        "InterviewMessage",
        back_populates="session",
        order_by="InterviewMessage.id",
        cascade="all, delete-orphan",
    )
    evaluation: Mapped[Optional["InterviewEvaluation"]] = relationship(
        "InterviewEvaluation",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<InterviewSession(id={self.id}, "
            f"company={self.company_name}, "
            f"position={self.position_name}, "
            f"status={self.status})>"
        )


class InterviewMessage(Base):
    """面试消息模型。

    存储面试过程中的对话消息。

    Attributes:
        id: 主键 ID
        session_id: 关联会话 ID
        role: 消息角色（ai/user）
        content: 消息内容
        round: 所属面试轮次
        metadata: 额外元数据（JSON）
        created_at: 创建时间
    """

    __tablename__ = "interview_messages"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    session_id: Mapped[int] = mapped_column(
        ForeignKey("interview_sessions.id"), nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="ai/user"
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    round: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        comment="opening/self_intro/qa/reverse_qa/closing",
    )

    # 元数据（如 AI 思考过程、token 用量等）
    meta_info: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, comment="元数据")

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    # 关联关系
    session: Mapped["InterviewSession"] = relationship(
        "InterviewSession", back_populates="messages"
    )

    def __repr__(self) -> str:
        content_preview = (
            self.content[:50] + "..."
            if len(self.content) > 50
            else self.content
        )
        return (
            f"<InterviewMessage(id={self.id}, "
            f"role={self.role}, "
            f"content={content_preview!r})>"
        )


class InterviewEvaluation(Base):
    """面试评价模型。

    存储面试结束后的评价报告。

    Attributes:
        id: 主键 ID
        session_id: 关联会话 ID
        overall_score: 综合评分（0-100）
        dimension_scores: 各维度评分（JSON）
        summary: 总体评价
        dimension_details: 各维度详细评价（JSON）
        suggestions: 改进建议列表（JSON）
        recommended_questions: 推荐练习题（JSON）
        created_at: 创建时间
    """

    __tablename__ = "interview_evaluations"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    session_id: Mapped[int] = mapped_column(
        ForeignKey("interview_sessions.id"),
        nullable=False,
        unique=True,
    )

    # 评分
    overall_score: Mapped[int] = mapped_column(
        Integer, nullable=False, comment="0-100"
    )
    dimension_scores: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
        comment="各维度评分",
    )

    # 评价内容
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    dimension_details: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
        comment="各维度详细评价",
    )

    # 建议
    suggestions: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="改进建议列表",
    )
    recommended_questions: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="推荐练习题",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    # 关联关系
    session: Mapped["InterviewSession"] = relationship(
        "InterviewSession", back_populates="evaluation"
    )

    def __repr__(self) -> str:
        return (
            f"<InterviewEvaluation(id={self.id}, "
            f"session_id={self.session_id}, "
            f"score={self.overall_score})>"
        )


class AIConfig(Base):
    """AI 配置模型。

    存储用户的 AI 模型配置信息。支持多配置，通过 is_active 标记当前使用的配置。

    Attributes:
        id: 主键 ID
        user_id: 关联用户 ID
        name: 配置名称
        provider: 提供商类型
        base_url: API 基础 URL
        api_key: API 密钥（加密存储）
        chat_model: 对话模型名称
        reasoning_model: 思考模型名称
        vision_model: 视觉模型名称
        voice_model: 语音模型名称
        temperature: 温度参数
        max_tokens: 最大 token 数
        is_active: 是否为当前使用的配置
        created_at: 创建时间
        updated_at: 更新时间
    """

    __tablename__ = "ai_configs"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    # 配置名称（用户自定义）
    name: Mapped[str] = mapped_column(
        String(100), nullable=False, default="未命名配置"
    )

    # 是否为当前使用的配置
    is_active: Mapped[bool] = mapped_column(
        default=False, nullable=False
    )

    # 提供商配置
    provider: Mapped[str] = mapped_column(
        String(50), nullable=False, default="openai-compatible"
    )
    base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    api_key: Mapped[str] = mapped_column(
        String(500), nullable=False, comment="加密存储"
    )

    # 模型配置
    chat_model: Mapped[str] = mapped_column(
        String(100), nullable=False, default="gpt-4"
    )
    reasoning_model: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    vision_model: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    voice_model: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )

    # 参数配置
    temperature: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.7
    )
    max_tokens: Mapped[int] = mapped_column(
        Integer, nullable=False, default=4096
    )

    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # 关联关系
    user: Mapped["User"] = relationship("User")

    # 唯一约束：每个用户只有一个激活的配置
    __table_args__ = (
        # 移除 user_id 的 unique 约束，改为联合约束
        # 确保每个用户的配置名称唯一
        # 数据库级别的约束由迁移文件处理
    )

    def __repr__(self) -> str:
        return (
            f"<AIConfig(id={self.id}, "
            f"user_id={self.user_id}, "
            f"provider={self.provider}, "
            f"chat_model={self.chat_model})>"
        )
