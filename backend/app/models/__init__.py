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
]
