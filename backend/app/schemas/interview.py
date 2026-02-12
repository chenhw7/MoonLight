"""面试相关 Schema 模块。

定义面试相关的 Pydantic 模型，包括请求和响应格式。
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ============================================================================
# 面试会话 Schema
# ============================================================================


class InterviewSessionBase(BaseModel):
    """面试会话基础模型。"""

    company_name: str = Field(..., max_length=100, description="目标企业名称")
    position_name: str = Field(..., max_length=100, description="目标岗位名称")
    job_description: str = Field(..., description="岗位描述（JD）")
    recruitment_type: str = Field(
        ..., pattern=r"^(campus|social)$", description="招聘类型"
    )
    interview_mode: str = Field(..., max_length=50, description="面试模式")
    interviewer_style: str = Field(
        ..., pattern=r"^(strict|gentle|pressure)$", description="面试官风格"
    )

    model_config = ConfigDict(from_attributes=True)


class InterviewSessionCreate(InterviewSessionBase):
    """创建面试会话请求模型。"""

    resume_id: int = Field(..., description="关联简历 ID")
    ai_model_config: Optional[dict] = Field(
        default=None, description="AI 模型配置（可选，默认使用用户配置）"
    )


class InterviewSessionUpdate(BaseModel):
    """更新面试会话请求模型。"""

    status: Optional[str] = Field(
        None, pattern=r"^(ongoing|completed|aborted)$"
    )
    current_round: Optional[str] = Field(
        None, pattern=r"^(opening|self_intro|qa|reverse_qa|closing)$"
    )
    end_time: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InterviewSessionResponse(InterviewSessionBase):
    """面试会话响应模型。"""

    id: int
    user_id: int
    resume_id: int
    status: str
    current_round: str
    model_config: dict
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewSessionListResponse(BaseModel):
    """面试会话列表响应模型。"""

    id: int
    company_name: str
    position_name: str
    recruitment_type: str
    interview_mode: str
    interviewer_style: str
    status: str
    current_round: str
    start_time: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewSessionDetailResponse(InterviewSessionResponse):
    """面试会话详情响应模型（包含消息列表）。"""

    messages: list["InterviewMessageResponse"] = []

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 面试消息 Schema
# ============================================================================


class InterviewMessageBase(BaseModel):
    """面试消息基础模型。"""

    role: str = Field(..., pattern=r"^(ai|user)$", description="消息角色")
    content: str = Field(..., description="消息内容")
    round: str = Field(
        ...,
        pattern=r"^(opening|self_intro|qa|reverse_qa|closing)$",
        description="所属轮次",
    )

    model_config = ConfigDict(from_attributes=True)


class InterviewMessageCreate(InterviewMessageBase):
    """创建面试消息请求模型。"""

    pass


class InterviewMessageResponse(InterviewMessageBase):
    """面试消息响应模型。"""

    id: int
    session_id: int
    meta_info: Optional[dict] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 面试评价 Schema
# ============================================================================


class DimensionScores(BaseModel):
    """各维度评分模型。"""

    communication: int = Field(..., ge=0, le=100, description="沟通能力")
    technical_depth: int = Field(..., ge=0, le=100, description="技术深度")
    project_experience: int = Field(..., ge=0, le=100, description="项目经验")
    adaptability: int = Field(..., ge=0, le=100, description="应变能力")
    job_match: int = Field(..., ge=0, le=100, description="岗位匹配度")


class InterviewEvaluationResponse(BaseModel):
    """面试评价响应模型。"""

    id: int
    session_id: int
    overall_score: int = Field(..., ge=0, le=100, description="综合评分")
    dimension_scores: DimensionScores
    summary: str = Field(..., description="总体评价")
    dimension_details: dict = Field(..., description="各维度详细评价")
    suggestions: list[str] = Field(..., description="改进建议列表")
    recommended_questions: list[str] = Field(..., description="推荐练习题")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 面试配置常量
# ============================================================================


class InterviewConfig:
    """面试配置常量。"""

    # 招聘类型
    RECRUITMENT_TYPES = {
        "campus": "校招",
        "social": "社招",
    }

    # 面试模式
    INTERVIEW_MODES = {
        "campus": {
            "basic_knowledge": "基础知识问答",
            "project_deep_dive": "项目/实习深挖",
            "coding": "编程题",
        },
        "social": {
            "technical_deep_dive": "技术深挖",
            "technical_qa": "技术问答",
            "scenario_design": "场景设计",
        },
    }

    # 面试官风格
    INTERVIEWER_STYLES = {
        "strict": "严格专业型",
        "gentle": "温和引导型",
        "pressure": "压力测试型",
    }

    # 面试轮次
    INTERVIEW_ROUNDS = [
        "opening",
        "self_intro",
        "qa",
        "reverse_qa",
        "closing",
    ]

    # 轮次显示名称
    ROUND_DISPLAY_NAMES = {
        "opening": "开场白",
        "self_intro": "自我介绍",
        "qa": "核心问答",
        "reverse_qa": "反问环节",
        "closing": "结束",
    }
