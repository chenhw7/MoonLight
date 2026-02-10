"""简历相关Schema模块。

定义简历相关的Pydantic模型，包括请求和响应格式。
支持前端发送的数据格式（英文枚举、YYYY-MM 日期等）。
"""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ============================================================================
# 工具函数
# ============================================================================

def parse_date_string(v):
    """将 YYYY-MM 或 YYYY-MM-DD 格式字符串转为 date 对象。
    
    前端 <input type="month"> 返回 "YYYY-MM" 格式，需要转成 Python date。
    """
    if v is None or v == "":
        return None
    if isinstance(v, date):
        return v
    v = str(v).strip()
    if not v:
        return None
    # 已经是 YYYY-MM-DD 格式
    if len(v) == 10:
        return date.fromisoformat(v)
    # YYYY-MM 格式，补充为月初
    if len(v) == 7:
        return date.fromisoformat(f"{v}-01")
    raise ValueError(f"Invalid date format: {v}, expected YYYY-MM or YYYY-MM-DD")


def format_date_to_month(v):
    """将 date 对象转为 YYYY-MM 格式字符串（用于响应）。"""
    if v is None:
        return None
    if isinstance(v, date):
        return v.strftime("%Y-%m")
    return v


# ============================================================================
# 基础Schema
# ============================================================================

class ResumeBase(BaseModel):
    """简历基础模型。"""
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 教育经历Schema
# ============================================================================

class EducationBase(BaseModel):
    """教育经历基础模型。支持草稿保存（空值）。"""

    school_name: str = Field(default="", max_length=100)
    degree: str = Field(default="bachelor", pattern=r"^(doctor|master|bachelor|associate|other)$")
    major: str = Field(default="", max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    gpa: Optional[str] = Field(None, max_length=20)
    courses: Optional[str] = None
    honors: Optional[str] = None
    sort_order: int = 0

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def parse_dates(cls, v):
        return parse_date_string(v)


class EducationCreate(EducationBase):
    """创建教育经历请求模型。"""
    pass


class EducationUpdate(BaseModel):
    """更新教育经历请求模型。"""

    school_name: Optional[str] = Field(None, min_length=1, max_length=100)
    degree: Optional[str] = Field(None, pattern=r"^(doctor|master|bachelor|associate|other)$")
    major: Optional[str] = Field(None, min_length=1, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    gpa: Optional[str] = Field(None, max_length=20)
    courses: Optional[str] = None
    honors: Optional[str] = None
    sort_order: Optional[int] = None

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def parse_dates(cls, v):
        return parse_date_string(v)


class EducationResponse(BaseModel):
    """教育经历响应模型。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    school_name: str
    degree: str
    major: str
    start_date: str
    end_date: Optional[str] = None
    gpa: Optional[str] = None
    courses: Optional[str] = None
    honors: Optional[str] = None
    sort_order: int = 0

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def format_dates(cls, v):
        return format_date_to_month(v)


# ============================================================================
# 工作/实习经历Schema
# ============================================================================

class WorkExperienceBase(BaseModel):
    """工作/实习经历基础模型。
    
    前端发送 is_internship (boolean)，后端数据库存储 exp_type (string)。
    Schema 接受前端格式，Service 层负责转换。
    """

    company_name: str = Field(default="", max_length=100)
    position: str = Field(default="", max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: str = Field(default="")
    is_internship: Optional[bool] = False
    sort_order: int = 0

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def parse_dates(cls, v):
        return parse_date_string(v)


class WorkExperienceCreate(WorkExperienceBase):
    """创建工作/实习经历请求模型。"""
    pass


class WorkExperienceUpdate(BaseModel):
    """更新工作/实习经历请求模型。"""

    company_name: Optional[str] = Field(None, min_length=1, max_length=100)
    position: Optional[str] = Field(None, min_length=1, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = Field(None, min_length=1)
    is_internship: Optional[bool] = None
    sort_order: Optional[int] = None

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def parse_dates(cls, v):
        return parse_date_string(v)


class WorkExperienceResponse(BaseModel):
    """工作/实习经历响应模型。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    position: str
    start_date: str
    end_date: Optional[str] = None
    description: str
    is_internship: bool = False
    sort_order: int = 0

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def format_dates(cls, v):
        return format_date_to_month(v)

    @model_validator(mode="before")
    @classmethod
    def convert_exp_type(cls, data):
        """从数据库的 exp_type 字段转换为前端的 is_internship。"""
        if hasattr(data, "__dict__"):
            # SQLAlchemy model
            obj = data
            return {
                "id": obj.id,
                "company_name": obj.company_name,
                "position": obj.position,
                "start_date": obj.start_date,
                "end_date": obj.end_date,
                "description": obj.description,
                "is_internship": getattr(obj, "exp_type", "work") == "internship",
                "sort_order": getattr(obj, "sort_order", 0),
            }
        if isinstance(data, dict) and "exp_type" in data:
            data["is_internship"] = data.get("exp_type") == "internship"
        return data


# ============================================================================
# 项目经历Schema
# ============================================================================

class ProjectBase(BaseModel):
    """项目经历基础模型。"""

    project_name: str = Field(default="", max_length=100)
    role: str = Field(default="", max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project_link: Optional[str] = Field(None, max_length=500)
    description: str = Field(default="")
    sort_order: int = 0

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def parse_dates(cls, v):
        return parse_date_string(v)


class ProjectCreate(ProjectBase):
    """创建项目经历请求模型。"""
    pass


class ProjectUpdate(BaseModel):
    """更新项目经历请求模型。"""

    project_name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[str] = Field(None, min_length=1, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project_link: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, min_length=1)
    sort_order: Optional[int] = None

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def parse_dates(cls, v):
        return parse_date_string(v)


class ProjectResponse(BaseModel):
    """项目经历响应模型。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    project_name: str
    role: str
    start_date: str
    end_date: Optional[str] = None
    project_link: Optional[str] = None
    description: str
    sort_order: int = 0

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def format_dates(cls, v):
        return format_date_to_month(v)


# ============================================================================
# 技能特长Schema
# ============================================================================

class SkillBase(BaseModel):
    """技能特长基础模型。"""

    skill_name: str = Field(default="", max_length=100)
    proficiency: str = Field(default="competent", pattern=r"^(expert|proficient|competent|beginner)$")
    sort_order: int = 0


class SkillCreate(SkillBase):
    """创建技能请求模型。"""
    pass


class SkillUpdate(BaseModel):
    """更新技能请求模型。"""

    skill_name: Optional[str] = Field(None, min_length=1, max_length=50)
    proficiency: Optional[str] = Field(None, pattern=r"^(expert|proficient|competent|beginner)$")
    sort_order: Optional[int] = None


class SkillResponse(SkillBase):
    """技能响应模型。"""

    model_config = ConfigDict(from_attributes=True)

    id: int


# ============================================================================
# 语言能力Schema
# ============================================================================

class LanguageBase(BaseModel):
    """语言能力基础模型。"""

    language: str = Field(default="", max_length=20)
    proficiency: str = Field(default="", max_length=50)


class LanguageCreate(LanguageBase):
    """创建语言能力请求模型。"""
    pass


class LanguageUpdate(BaseModel):
    """更新语言能力请求模型。"""

    language: Optional[str] = Field(None, min_length=1, max_length=20)
    proficiency: Optional[str] = Field(None, min_length=1, max_length=50)


class LanguageResponse(LanguageBase):
    """语言能力响应模型。"""

    model_config = ConfigDict(from_attributes=True)

    id: int


# ============================================================================
# 获奖经历Schema
# ============================================================================

class AwardBase(BaseModel):
    """获奖经历基础模型。"""

    award_name: str = Field(default="", max_length=200)
    award_date: Optional[date] = None
    description: Optional[str] = None
    sort_order: int = 0

    @field_validator("award_date", mode="before")
    @classmethod
    def parse_dates(cls, v):
        return parse_date_string(v)


class AwardCreate(AwardBase):
    """创建获奖经历请求模型。"""
    pass


class AwardUpdate(BaseModel):
    """更新获奖经历请求模型。"""

    award_name: Optional[str] = Field(None, min_length=1, max_length=200)
    award_date: Optional[date] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None

    @field_validator("award_date", mode="before")
    @classmethod
    def parse_dates(cls, v):
        return parse_date_string(v)


class AwardResponse(BaseModel):
    """获奖经历响应模型。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    award_name: str
    award_date: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0

    @field_validator("award_date", mode="before")
    @classmethod
    def format_dates(cls, v):
        return format_date_to_month(v)


# ============================================================================
# 作品展示Schema
# ============================================================================

class PortfolioBase(BaseModel):
    """作品展示基础模型。"""

    work_name: str = Field(default="", max_length=200)
    work_link: Optional[str] = Field(None, max_length=500)
    attachment_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    sort_order: int = 0


class PortfolioCreate(PortfolioBase):
    """创建作品请求模型。"""
    pass


class PortfolioUpdate(BaseModel):
    """更新作品请求模型。"""

    work_name: Optional[str] = Field(None, min_length=1, max_length=100)
    work_link: Optional[str] = Field(None, max_length=500)
    attachment_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    sort_order: Optional[int] = None


class PortfolioResponse(PortfolioBase):
    """作品响应模型。"""

    model_config = ConfigDict(from_attributes=True)

    id: int


# ============================================================================
# 社交账号Schema
# ============================================================================

class SocialLinkBase(BaseModel):
    """社交账号基础模型。"""

    platform: str = Field(default="", max_length=50)
    url: str = Field(default="", max_length=500)


class SocialLinkCreate(SocialLinkBase):
    """创建社交账号请求模型。"""
    pass


class SocialLinkUpdate(BaseModel):
    """更新社交账号请求模型。"""

    platform: Optional[str] = Field(None, min_length=1, max_length=50)
    url: Optional[str] = Field(None, min_length=1, max_length=500)


class SocialLinkResponse(SocialLinkBase):
    """社交账号响应模型。"""

    model_config = ConfigDict(from_attributes=True)

    id: int


# ============================================================================
# 完整简历保存Schema（前端一次性提交所有数据）
# ============================================================================

class ResumeFullSave(BaseModel):
    """完整简历保存请求模型。
    
    前端一次性提交简历基础信息 + 所有子项数据。
    支持草稿保存：基础字段允许为空字符串。
    所有子项列表都是可选的，默认为空列表。
    """

    model_config = ConfigDict(from_attributes=True)

    # 基础信息 — 允许空字符串以支持草稿保存
    resume_type: str = Field(default="campus", pattern=r"^(campus|social)$")
    title: Optional[str] = Field(None, max_length=100)
    full_name: str = Field(default="", max_length=50)
    phone: str = Field(default="", max_length=20)
    email: str = Field(default="", max_length=100)
    avatar: Optional[str] = None
    avatar_ratio: Optional[str] = Field(default="1.4", pattern=r"^(1\.4|1)$")
    current_city: Optional[str] = Field(None, max_length=50)
    self_evaluation: Optional[str] = None

    # 子项数据（所有可选，默认空列表）
    educations: List[EducationCreate] = []
    work_experiences: List[WorkExperienceCreate] = []
    projects: List[ProjectCreate] = []
    skills: List[SkillCreate] = []
    languages: List[LanguageCreate] = []
    awards: List[AwardCreate] = []
    portfolios: List[PortfolioCreate] = []
    social_links: List[SocialLinkCreate] = []

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """验证手机号格式（允许空字符串以支持草稿保存）。"""
        if not v:
            return v
        import re
        if not re.match(r"^1[3-9]\d{9}$", v):
            raise ValueError("Invalid phone number format")
        return v


class ResumeFullUpdate(BaseModel):
    """完整简历更新请求模型。
    
    基础字段全部可选（只更新传入的字段），子项列表如果传入则整体替换。
    """

    model_config = ConfigDict(from_attributes=True)

    # 基础信息（全部可选）
    resume_type: Optional[str] = Field(None, pattern=r"^(campus|social)$")
    title: Optional[str] = Field(None, max_length=100)
    full_name: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = Field(None, min_length=1, max_length=20)
    email: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar: Optional[str] = None
    avatar_ratio: Optional[str] = Field(None, pattern=r"^(1\.4|1)$")
    current_city: Optional[str] = Field(None, max_length=50)
    self_evaluation: Optional[str] = None

    # 子项数据（如果传入则整体替换）
    educations: Optional[List[EducationCreate]] = None
    work_experiences: Optional[List[WorkExperienceCreate]] = None
    projects: Optional[List[ProjectCreate]] = None
    skills: Optional[List[SkillCreate]] = None
    languages: Optional[List[LanguageCreate]] = None
    awards: Optional[List[AwardCreate]] = None
    portfolios: Optional[List[PortfolioCreate]] = None
    social_links: Optional[List[SocialLinkCreate]] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        """验证手机号格式。"""
        if v is None:
            return v
        import re
        if not re.match(r"^1[3-9]\d{9}$", v):
            raise ValueError("Invalid phone number format")
        return v


# 向后兼容别名
ResumeCreate = ResumeFullSave
ResumeUpdate = ResumeFullUpdate


# ============================================================================
# 响应Schema
# ============================================================================

class ResumeListResponse(BaseModel):
    """简历列表响应模型。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_type: str
    title: Optional[str] = None
    full_name: str
    phone: str
    email: str
    avatar: Optional[str] = None
    avatar_ratio: Optional[str] = None
    current_city: Optional[str] = None
    self_evaluation: Optional[str] = None
    status: str
    updated_at: datetime


class ResumeDetailResponse(BaseModel):
    """简历详情响应模型。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_type: str
    title: Optional[str] = None
    full_name: str
    phone: str
    email: str
    avatar: Optional[str] = None
    avatar_ratio: Optional[str] = None
    current_city: Optional[str] = None
    self_evaluation: Optional[str] = None
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
