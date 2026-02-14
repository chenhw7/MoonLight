"""模型模块。

导出所有数据库模型。
"""

from app.models.user import User, VerificationCode
from app.models.resume import (
    Resume,
    Education,
    WorkExperience,
    Project,
    Skill,
    Language,
    Award,
    Portfolio,
    SocialLink,
)
from app.models.interview import (
    InterviewSession,
    InterviewMessage,
    InterviewEvaluation,
    AIConfig,
)

__all__ = [
    "User",
    "VerificationCode",
    "Resume",
    "Education",
    "WorkExperience",
    "Project",
    "Skill",
    "Language",
    "Award",
    "Portfolio",
    "SocialLink",
    "InterviewSession",
    "InterviewMessage",
    "InterviewEvaluation",
    "AIConfig",
]
