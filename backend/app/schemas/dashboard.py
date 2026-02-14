"""仪表盘数据模型模块。

定义仪表盘相关的 Pydantic 模型，包括统计数据和面试分析数据。
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# 核心统计数据
# ============================================================================


class DashboardStats(BaseModel):
    """仪表盘核心统计数据。"""

    resume_count: int = Field(..., description="简历数量")
    interview_count: int = Field(..., description="面试次数")
    average_score: Optional[int] = Field(None, description="平均分数（0-100）")
    streak_days: int = Field(..., description="连续练习天数")

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 简历相关
# ============================================================================


class RecentResumeItem(BaseModel):
    """最近编辑的简历项。"""

    id: int
    resume_name: str = Field(..., description="简历名称")
    location: Optional[str] = Field(None, description="期望地点")
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 面试统计相关
# ============================================================================


class DimensionScores(BaseModel):
    """能力维度评分。"""

    communication: int = Field(..., description="沟通能力")
    technical_depth: int = Field(..., description="技术深度")
    project_experience: int = Field(..., description="项目经验")
    adaptability: int = Field(..., description="应变能力")
    job_match: int = Field(..., description="岗位匹配度")

    model_config = ConfigDict(from_attributes=True)


class RecentInterviewItem(BaseModel):
    """最近面试项。"""

    id: int
    company_name: str = Field(..., description="企业名称")
    position_name: str = Field(..., description="岗位名称")
    overall_score: int = Field(..., description="综合分数")
    start_time: datetime

    model_config = ConfigDict(from_attributes=True)


class ScoreTrendItem(BaseModel):
    """分数趋势项。"""

    session_id: int
    company_name: str = Field(..., description="企业名称")
    overall_score: int = Field(..., description="综合分数")
    start_time: datetime

    model_config = ConfigDict(from_attributes=True)


class DimensionChangeItem(BaseModel):
    """维度变化项。"""

    key: str = Field(..., description="维度标识")
    name: str = Field(..., description="维度名称")
    current: int = Field(..., description="当前值")
    previous: int = Field(..., description="前值")
    change: int = Field(..., description="变化值")

    model_config = ConfigDict(from_attributes=True)


class InterviewStats(BaseModel):
    """面试统计数据。"""

    dimension_scores: Optional[DimensionScores] = Field(
        None, description="维度评分（近3场平均）"
    )
    recent_interviews: list[RecentInterviewItem] = Field(
        default_factory=list, description="最近面试列表"
    )
    score_trend: list[ScoreTrendItem] = Field(
        default_factory=list, description="分数趋势（近10场）"
    )
    dimension_changes: list[DimensionChangeItem] = Field(
        default_factory=list, description="维度变化"
    )
    insight: Optional[str] = Field(None, description="洞察文字")

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 仪表盘完整数据
# ============================================================================


class DashboardData(BaseModel):
    """仪表盘完整数据。"""

    stats: DashboardStats = Field(..., description="核心统计数据")
    recent_resumes: list[RecentResumeItem] = Field(
        default_factory=list, description="最近编辑的简历"
    )
    interview_stats: InterviewStats = Field(
        default_factory=InterviewStats, description="面试统计数据"
    )

    model_config = ConfigDict(from_attributes=True)
