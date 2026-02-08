"""简历相关Schema模块。

定义简历相关的Pydantic模型，包括请求和响应格式。
"""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ==================== 基础Schema ====================

class ResumeBase(BaseModel):
    """简历基础模型。"""

    model_config = ConfigDict(from_attributes=True)


# ==================== 教育经历Schema ====================

class EducationBase(BaseModel):
    """教育经历基础模型。"""

    school_name: str = Field(..., min_length=1, max_length=100)
    degree: str = Field(..., pattern=r"^(博士|硕士|本科|大专|高中)$")
    major: str = Field(..., min_length=1, max_length=100)
    start_date: date
    end_date: Optional[date] = None
    gpa: Optional[str] = Field(None, max_length=20)
    courses: Optional[str] = None
    honors: Optional[str] = None
    sort_order: int = 0


class EducationCreate(EducationBase):
    """创建教育经历请求模型。"""

    pass


class EducationUpdate(EducationBase):
    """更新教育经历请求模型。"""

    school_name: Optional[str] = Field(None, min_length=1, max_length=100)
    degree: Optional[str] = Field(None, pattern=r"^(博士|硕士|本科|大专|高中)$")
    major: Optional[str] = Field(None, min_length=1, max_length=100)
    start_date: Optional[date] = None


class EducationResponse(EducationBase):
    """教育经历响应模型。"""

    id: int


# ==================== 工作/实习经历Schema ====================

class WorkExperienceBase(BaseModel):
    """工作/实习经历基础模型。"""

    exp_type: str = Field(..., pattern=r"^(work|internship)$")
    company_name: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    start_date: date
    end_date: Optional[date] = None
    description: str = Field(..., min_length=1)
    sort_order: int = 0


class WorkExperienceCreate(WorkExperienceBase):
    """创建工作/实习经历请求模型。"""

    pass


class WorkExperienceUpdate(WorkExperienceBase):
    """更新工作/实习经历请求模型。"""

    exp_type: Optional[str] = Field(None, pattern=r"^(work|internship)$")
    company_name: Optional[str] = Field(None, min_length=1, max_length=100)
    position: Optional[str] = Field(None, min_length=1, max_length=100)
    start_date: Optional[date] = None
    description: Optional[str] = Field(None, min_length=1)


class WorkExperienceResponse(WorkExperienceBase):
    """工作/实习经历响应模型。"""

    id: int


# ==================== 项目经历Schema ====================

class ProjectBase(BaseModel):
    """项目经历基础模型。"""

    project_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)
    start_date: date
    end_date: Optional[date] = None
    project_link: Optional[str] = Field(None, max_length=500)
    description: str = Field(..., min_length=1)
    sort_order: int = 0


class ProjectCreate(ProjectBase):
    """创建项目经历请求模型。"""

    pass


class ProjectUpdate(ProjectBase):
    """更新项目经历请求模型。"""

    project_name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[str] = Field(None, min_length=1, max_length=100)
    start_date: Optional[date] = None
    description: Optional[str] = Field(None, min_length=1)


class ProjectResponse(ProjectBase):
    """项目经历响应模型。"""

    id: int


# ==================== 技能特长Schema ====================

class SkillBase(BaseModel):
    """技能特长基础模型。"""

    skill_name: str = Field(..., min_length=1, max_length=50)
    proficiency: str = Field(..., pattern=r"^(精通|熟练|掌握|了解)$")
    sort_order: int = 0


class SkillCreate(SkillBase):
    """创建技能请求模型。"""

    pass


class SkillUpdate(SkillBase):
    """更新技能请求模型。"""

    skill_name: Optional[str] = Field(None, min_length=1, max_length=50)
    proficiency: Optional[str] = Field(None, pattern=r"^(精通|熟练|掌握|了解)$")


class SkillResponse(SkillBase):
    """技能响应模型。"""

    id: int


# ==================== 语言能力Schema ====================

class LanguageBase(BaseModel):
    """语言能力基础模型。"""

    language: str = Field(..., min_length=1, max_length=20)
    proficiency: str = Field(..., min_length=1, max_length=50)


class LanguageCreate(LanguageBase):
    """创建语言能力请求模型。"""

    pass


class LanguageUpdate(LanguageBase):
    """更新语言能力请求模型。"""

    language: Optional[str] = Field(None, min_length=1, max_length=20)
    proficiency: Optional[str] = Field(None, min_length=1, max_length=50)


class LanguageResponse(LanguageBase):
    """语言能力响应模型。"""

    id: int


# ==================== 获奖经历Schema ====================

class AwardBase(BaseModel):
    """获奖经历基础模型。"""

    award_name: str = Field(..., min_length=1, max_length=200)
    award_date: Optional[date] = None
    description: Optional[str] = None
    sort_order: int = 0


class AwardCreate(AwardBase):
    """创建获奖经历请求模型。"""

    pass


class AwardUpdate(AwardBase):
    """更新获奖经历请求模型。"""

    award_name: Optional[str] = Field(None, min_length=1, max_length=200)


class AwardResponse(AwardBase):
    """获奖经历响应模型。"""

    id: int


# ==================== 作品展示Schema ====================

class PortfolioBase(BaseModel):
    """作品展示基础模型。"""

    work_name: str = Field(..., min_length=1, max_length=100)
    work_link: Optional[str] = Field(None, max_length=500)
    attachment_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    sort_order: int = 0


class PortfolioCreate(PortfolioBase):
    """创建作品请求模型。"""

    pass


class PortfolioUpdate(PortfolioBase):
    """更新作品请求模型。"""

    work_name: Optional[str] = Field(None, min_length=1, max_length=100)


class PortfolioResponse(PortfolioBase):
    """作品响应模型。"""

    id: int


# ==================== 社交账号Schema ====================

class SocialLinkBase(BaseModel):
    """社交账号基础模型。"""

    platform: str = Field(..., min_length=1, max_length=50)
    url: str = Field(..., min_length=1, max_length=500)


class SocialLinkCreate(SocialLinkBase):
    """创建社交账号请求模型。"""

    pass


class SocialLinkUpdate(SocialLinkBase):
    """更新社交账号请求模型。"""

    platform: Optional[str] = Field(None, min_length=1, max_length=50)
    url: Optional[str] = Field(None, min_length=1, max_length=500)


class SocialLinkResponse(SocialLinkBase):
    """社交账号响应模型。"""

    id: int


# ==================== 简历主Schema ====================

class ResumeBase(BaseModel):
    """简历基础模型。"""

    model_config = ConfigDict(from_attributes=True)

    resume_type: str = Field(..., pattern=r"^(campus|social)$")
    title: Optional[str] = Field(None, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., min_length=1, max_length=20)
    email: str = Field(..., min_length=1, max_length=100)
    avatar: Optional[str] = None  # Base64 编码的头像
    avatar_ratio: Optional[str] = Field(default="1.4", pattern=r"^(1\.4|1)$")  # 头像比例: '1.4' 或 '1'
    current_city: Optional[str] = Field(None, max_length=50)
    self_evaluation: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """验证手机号格式。"""
        import re
        if not re.match(r"^1[3-9]\d{9}$", v):
            raise ValueError("Invalid phone number format")
        return v


class ResumeCreate(ResumeBase):
    """创建简历请求模型。"""

    pass


class ResumeUpdate(BaseModel):
    """更新简历请求模型。"""

    model_config = ConfigDict(from_attributes=True)

    resume_type: Optional[str] = Field(None, pattern=r"^(campus|social)$")
    title: Optional[str] = Field(None, max_length=100)
    full_name: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = Field(None, min_length=1, max_length=20)
    email: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar: Optional[str] = None
    avatar_ratio: Optional[str] = Field(None, pattern=r"^(1\.4|1)$")
    current_city: Optional[str] = Field(None, max_length=50)
    target_cities: Optional[str] = Field(None, max_length=200)
    job_status: Optional[str] = Field(None, pattern=r"^(employed|unemployed|student)$")
    target_positions: Optional[str] = Field(None, max_length=200)
    work_years: Optional[int] = Field(None, ge=0, le=50)
    current_company: Optional[str] = Field(None, max_length=100)
    current_position: Optional[str] = Field(None, max_length=100)
    expected_salary: Optional[str] = Field(None, max_length=50)
    self_evaluation: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(draft|completed)$")


class ResumeListResponse(ResumeBase):
    """简历列表响应模型。"""

    id: int
    status: str
    updated_at: datetime


class ResumeDetailResponse(ResumeBase):
    """简历详情响应模型。"""

    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    educations: List[EducationResponse] = []
    work_experiences: List[WorkExperienceResponse] = []
    projects: List[ProjectResponse] = []
    skills: List[SkillResponse] = []
    languages: List[LanguageResponse] = []
    awards: List[AwardResponse] = []
    portfolios: List[PortfolioResponse] = []
    social_links: List[SocialLinkResponse] = []


class ResumeList(BaseModel):
    """简历列表响应包装模型。"""

    items: List[ResumeListResponse]
    total: int
    page: int
    page_size: int
