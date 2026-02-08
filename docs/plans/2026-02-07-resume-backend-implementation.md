# 简历功能后端开发实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现简历生成功能的完整后端API，包括数据库模型、Schema定义、Service层和API路由

**Architecture:** 采用分层架构，遵循项目现有模式：Models(数据层) → Schemas(验证层) → Services(业务层) → API Routes(接口层)

**Tech Stack:** FastAPI + SQLAlchemy + Pydantic + Alembic + SQLite/PostgreSQL

---

## Task 1: 创建数据库模型文件

**Files:**
- Create: `backend/app/models/resume.py`

**Step 1: 创建简历主表模型**

```python
"""简历数据模型模块。

定义简历相关的数据库模型，包括简历主表和各个子模块。
"""

from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String, Text, Integer, Date, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Resume(Base):
    """简历主表模型。

    Attributes:
        id: 主键ID
        user_id: 关联用户ID
        resume_type: 简历类型(campus/social)
        title: 简历标题
        status: 简历状态(draft/completed)
        full_name: 姓名
        phone: 手机号
        email: 邮箱
        current_city: 当前城市
        target_cities: 期望城市
        job_status: 求职状态
        target_positions: 期望岗位
        work_years: 工作年限
        current_company: 当前公司
        current_position: 当前职位
        expected_salary: 期望薪资
        self_evaluation: 自我评价
    """

    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    resume_type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default="draft")

    # 基本信息
    full_name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False)
    current_city: Mapped[Optional[str]] = mapped_column(String(50))
    target_cities: Mapped[Optional[str]] = mapped_column(String(200))
    job_status: Mapped[Optional[str]] = mapped_column(String(20))
    target_positions: Mapped[Optional[str]] = mapped_column(String(200))

    # 社招特有字段
    work_years: Mapped[Optional[int]] = mapped_column(Integer)
    current_company: Mapped[Optional[str]] = mapped_column(String(100))
    current_position: Mapped[Optional[str]] = mapped_column(String(100))
    expected_salary: Mapped[Optional[str]] = mapped_column(String(50))

    # 自我评价
    self_evaluation: Mapped[Optional[str]] = mapped_column(Text)

    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # 关系
    user: Mapped["User"] = relationship("User", back_populates="resumes")
    educations: Mapped[List["Education"]] = relationship(
        "Education", back_populates="resume", cascade="all, delete-orphan"
    )
    work_experiences: Mapped[List["WorkExperience"]] = relationship(
        "WorkExperience", back_populates="resume", cascade="all, delete-orphan"
    )
    projects: Mapped[List["Project"]] = relationship(
        "Project", back_populates="resume", cascade="all, delete-orphan"
    )
    skills: Mapped[List["Skill"]] = relationship(
        "Skill", back_populates="resume", cascade="all, delete-orphan"
    )
    languages: Mapped[List["Language"]] = relationship(
        "Language", back_populates="resume", cascade="all, delete-orphan"
    )
    awards: Mapped[List["Award"]] = relationship(
        "Award", back_populates="resume", cascade="all, delete-orphan"
    )
    portfolios: Mapped[List["Portfolio"]] = relationship(
        "Portfolio", back_populates="resume", cascade="all, delete-orphan"
    )
    social_links: Mapped[List["SocialLink"]] = relationship(
        "SocialLink", back_populates="resume", cascade="all, delete-orphan"
    )


class Education(Base):
    """教育经历模型。"""

    __tablename__ = "educations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    school_name: Mapped[str] = mapped_column(String(100), nullable=False)
    degree: Mapped[str] = mapped_column(String(20), nullable=False)
    major: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    gpa: Mapped[Optional[str]] = mapped_column(String(20))
    courses: Mapped[Optional[str]] = mapped_column(Text)
    honors: Mapped[Optional[str]] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    resume: Mapped["Resume"] = relationship("Resume", back_populates="educations")


class WorkExperience(Base):
    """工作/实习经历模型。"""

    __tablename__ = "work_experiences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    exp_type: Mapped[str] = mapped_column(String(20), nullable=False)
    company_name: Mapped[str] = mapped_column(String(100), nullable=False)
    position: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    resume: Mapped["Resume"] = relationship("Resume", back_populates="work_experiences")


class Project(Base):
    """项目经历模型。"""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    project_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    project_link: Mapped[Optional[str]] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    resume: Mapped["Resume"] = relationship("Resume", back_populates="projects")


class Skill(Base):
    """技能特长模型。"""

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    skill_name: Mapped[str] = mapped_column(String(50), nullable=False)
    proficiency: Mapped[str] = mapped_column(String(20), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    resume: Mapped["Resume"] = relationship("Resume", back_populates="skills")


class Language(Base):
    """语言能力模型。"""

    __tablename__ = "languages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    language: Mapped[str] = mapped_column(String(20), nullable=False)
    proficiency: Mapped[str] = mapped_column(String(50), nullable=False)

    resume: Mapped["Resume"] = relationship("Resume", back_populates="languages")


class Award(Base):
    """获奖经历模型。"""

    __tablename__ = "awards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    award_name: Mapped[str] = mapped_column(String(200), nullable=False)
    award_date: Mapped[Optional[date]] = mapped_column(Date)
    description: Mapped[Optional[str]] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    resume: Mapped["Resume"] = relationship("Resume", back_populates="awards")


class Portfolio(Base):
    """作品展示模型。"""

    __tablename__ = "portfolios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    work_name: Mapped[str] = mapped_column(String(100), nullable=False)
    work_link: Mapped[Optional[str]] = mapped_column(String(500))
    attachment_url: Mapped[Optional[str]] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    resume: Mapped["Resume"] = relationship("Resume", back_populates="portfolios")


class SocialLink(Base):
    """社交账号模型。"""

    __tablename__ = "social_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)

    resume: Mapped["Resume"] = relationship("Resume", back_populates="social_links")
```

**Step 2: 更新用户模型添加关系**

Modify: `backend/app/models/user.py`

在User模型中添加resumes关系：

```python
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from app.models.resume import Resume

# 在User类中添加
resumes: Mapped[List["Resume"]] = relationship("Resume", back_populates="user")
```

**Step 3: 更新模型初始化文件**

Modify: `backend/app/models/__init__.py`

添加导出：

```python
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
    # ... 原有导出
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
```

**Step 4: Commit**

```bash
git add backend/app/models/
git commit -m "feat: add resume database models"
```

---

## Task 2: 创建Schema定义文件

**Files:**
- Create: `backend/app/schemas/resume.py`

**Step 1: 创建完整Schema定义**

```python
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
    current_city: Optional[str] = Field(None, max_length=50)
    target_cities: Optional[str] = Field(None, max_length=200)
    job_status: Optional[str] = Field(None, pattern=r"^(employed|unemployed|student)$")
    target_positions: Optional[str] = Field(None, max_length=200)
    work_years: Optional[int] = Field(None, ge=0, le=50)
    current_company: Optional[str] = Field(None, max_length=100)
    current_position: Optional[str] = Field(None, max_length=100)
    expected_salary: Optional[str] = Field(None, max_length=50)
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
```

**Step 2: 更新Schema初始化文件**

Modify: `backend/app/schemas/__init__.py`

添加导出：

```python
from app.schemas.resume import (
    ResumeCreate,
    ResumeUpdate,
    ResumeListResponse,
    ResumeDetailResponse,
    ResumeList,
    EducationCreate,
    EducationUpdate,
    EducationResponse,
    WorkExperienceCreate,
    WorkExperienceUpdate,
    WorkExperienceResponse,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    SkillCreate,
    SkillUpdate,
    SkillResponse,
    LanguageCreate,
    LanguageUpdate,
    LanguageResponse,
    AwardCreate,
    AwardUpdate,
    AwardResponse,
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioResponse,
    SocialLinkCreate,
    SocialLinkUpdate,
    SocialLinkResponse,
)

__all__ = [
    # ... 原有导出
    "ResumeCreate",
    "ResumeUpdate",
    "ResumeListResponse",
    "ResumeDetailResponse",
    "ResumeList",
    "EducationCreate",
    "EducationUpdate",
    "EducationResponse",
    "WorkExperienceCreate",
    "WorkExperienceUpdate",
    "WorkExperienceResponse",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "SkillCreate",
    "SkillUpdate",
    "SkillResponse",
    "LanguageCreate",
    "LanguageUpdate",
    "LanguageResponse",
    "AwardCreate",
    "AwardUpdate",
    "AwardResponse",
    "PortfolioCreate",
    "PortfolioUpdate",
    "PortfolioResponse",
    "SocialLinkCreate",
    "SocialLinkUpdate",
    "SocialLinkResponse",
]
```

**Step 3: Commit**

```bash
git add backend/app/schemas/
git commit -m "feat: add resume schemas"
```

---

## Task 3: 创建Service服务层

**Files:**
- Create: `backend/app/services/resume_service.py`

**Step 1: 创建Service类**

```python
"""简历服务模块。

提供简历相关的业务逻辑处理。
"""

from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError, ValidationError, ForbiddenError
from app.core.logging import get_logger
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
from app.schemas.resume import (
    ResumeCreate,
    ResumeUpdate,
    EducationCreate,
    EducationUpdate,
    WorkExperienceCreate,
    WorkExperienceUpdate,
    ProjectCreate,
    ProjectUpdate,
    SkillCreate,
    SkillUpdate,
    LanguageCreate,
    LanguageUpdate,
    AwardCreate,
    AwardUpdate,
    PortfolioCreate,
    PortfolioUpdate,
    SocialLinkCreate,
    SocialLinkUpdate,
)

logger = get_logger(__name__)


class ResumeService:
    """简历服务类。"""

    def __init__(self, db: AsyncSession):
        """初始化服务。

        Args:
            db: 数据库会话
        """
        self.db = db

    async def get_resume_list(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 10,
        resume_type: Optional[str] = None,
    ) -> tuple[List[Resume], int]:
        """获取简历列表。

        Args:
            user_id: 用户ID
            page: 页码
            page_size: 每页数量
            resume_type: 简历类型筛选

        Returns:
            tuple: (简历列表, 总数)
        """
        query = select(Resume).where(Resume.user_id == user_id)

        if resume_type:
            query = query.where(Resume.resume_type == resume_type)

        # 获取总数
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query)

        # 分页查询
        query = query.order_by(Resume.updated_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        resumes = result.scalars().all()

        return list(resumes), total

    async def get_resume_detail(self, resume_id: int, user_id: int) -> Resume:
        """获取简历详情。

        Args:
            resume_id: 简历ID
            user_id: 用户ID

        Returns:
            Resume: 简历对象

        Raises:
            NotFoundError: 简历不存在
            ForbiddenError: 无权访问
        """
        query = (
            select(Resume)
            .where(Resume.id == resume_id)
            .options(
                selectinload(Resume.educations),
                selectinload(Resume.work_experiences),
                selectinload(Resume.projects),
                selectinload(Resume.skills),
                selectinload(Resume.languages),
                selectinload(Resume.awards),
                selectinload(Resume.portfolios),
                selectinload(Resume.social_links),
            )
        )
        result = await self.db.execute(query)
        resume = result.scalar_one_or_none()

        if not resume:
            raise NotFoundError("Resume not found")

        if resume.user_id != user_id:
            raise ForbiddenError("Access denied")

        return resume

    async def create_resume(self, user_id: int, data: ResumeCreate) -> Resume:
        """创建简历。

        Args:
            user_id: 用户ID
            data: 简历数据

        Returns:
            Resume: 创建的简历
        """
        resume = Resume(
            user_id=user_id,
            resume_type=data.resume_type,
            title=data.title,
            full_name=data.full_name,
            phone=data.phone,
            email=data.email,
            current_city=data.current_city,
            target_cities=data.target_cities,
            job_status=data.job_status,
            target_positions=data.target_positions,
            work_years=data.work_years,
            current_company=data.current_company,
            current_position=data.current_position,
            expected_salary=data.expected_salary,
            self_evaluation=data.self_evaluation,
        )

        self.db.add(resume)
        await self.db.commit()
        await self.db.refresh(resume)

        logger.info("Resume created", resume_id=resume.id, user_id=user_id)
        return resume

    async def update_resume(
        self, resume_id: int, user_id: int, data: ResumeUpdate
    ) -> Resume:
        """更新简历。

        Args:
            resume_id: 简历ID
            user_id: 用户ID
            data: 更新数据

        Returns:
            Resume: 更新后的简历
        """
        resume = await self.get_resume_detail(resume_id, user_id)

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(resume, field, value)

        await self.db.commit()
        await self.db.refresh(resume)

        logger.info("Resume updated", resume_id=resume_id)
        return resume

    async def delete_resume(self, resume_id: int, user_id: int) -> None:
        """删除简历。

        Args:
            resume_id: 简历ID
            user_id: 用户ID
        """
        resume = await self.get_resume_detail(resume_id, user_id)
        await self.db.delete(resume)
        await self.db.commit()

        logger.info("Resume deleted", resume_id=resume_id)

    async def clone_resume(self, resume_id: int, user_id: int) -> Resume:
        """复制简历。

        Args:
            resume_id: 简历ID
            user_id: 用户ID

        Returns:
            Resume: 新创建的简历
        """
        original = await self.get_resume_detail(resume_id, user_id)

        # 创建新简历
        new_resume = Resume(
            user_id=user_id,
            resume_type=original.resume_type,
            title=f"{original.title or '未命名简历'}_副本",
            full_name=original.full_name,
            phone=original.phone,
            email=original.email,
            current_city=original.current_city,
            target_cities=original.target_cities,
            job_status=original.job_status,
            target_positions=original.target_positions,
            work_years=original.work_years,
            current_company=original.current_company,
            current_position=original.current_position,
            expected_salary=original.expected_salary,
            self_evaluation=original.self_evaluation,
        )
        self.db.add(new_resume)
        await self.db.flush()

        # 复制教育经历
        for edu in original.educations:
            new_edu = Education(
                resume_id=new_resume.id,
                school_name=edu.school_name,
                degree=edu.degree,
                major=edu.major,
                start_date=edu.start_date,
                end_date=edu.end_date,
                gpa=edu.gpa,
                courses=edu.courses,
                honors=edu.honors,
                sort_order=edu.sort_order,
            )
            self.db.add(new_edu)

        # 复制工作/实习经历
        for exp in original.work_experiences:
            new_exp = WorkExperience(
                resume_id=new_resume.id,
                exp_type=exp.exp_type,
                company_name=exp.company_name,
                position=exp.position,
                start_date=exp.start_date,
                end_date=exp.end_date,
                description=exp.description,
                sort_order=exp.sort_order,
            )
            self.db.add(new_exp)

        # 复制项目经历
        for proj in original.projects:
            new_proj = Project(
                resume_id=new_resume.id,
                project_name=proj.project_name,
                role=proj.role,
                start_date=proj.start_date,
                end_date=proj.end_date,
                project_link=proj.project_link,
                description=proj.description,
                sort_order=proj.sort_order,
            )
            self.db.add(new_proj)

        # 复制技能
        for skill in original.skills:
            new_skill = Skill(
                resume_id=new_resume.id,
                skill_name=skill.skill_name,
                proficiency=skill.proficiency,
                sort_order=skill.sort_order,
            )
            self.db.add(new_skill)

        # 复制语言能力
        for lang in original.languages:
            new_lang = Language(
                resume_id=new_resume.id,
                language=lang.language,
                proficiency=lang.proficiency,
            )
            self.db.add(new_lang)

        # 复制获奖经历
        for award in original.awards:
            new_award = Award(
                resume_id=new_resume.id,
                award_name=award.award_name,
                award_date=award.award_date,
                description=award.description,
                sort_order=award.sort_order,
            )
            self.db.add(new_award)

        # 复制作品
        for portfolio in original.portfolios:
            new_portfolio = Portfolio(
                resume_id=new_resume.id,
                work_name=portfolio.work_name,
                work_link=portfolio.work_link,
                attachment_url=portfolio.attachment_url,
                description=portfolio.description,
                sort_order=portfolio.sort_order,
            )
            self.db.add(new_portfolio)

        # 复制社交账号
        for link in original.social_links:
            new_link = SocialLink(
                resume_id=new_resume.id,
                platform=link.platform,
                url=link.url,
            )
            self.db.add(new_link)

        await self.db.commit()
        await self.db.refresh(new_resume)

        logger.info("Resume cloned", new_resume_id=new_resume.id, original_id=resume_id)
        return new_resume

    # ==================== 教育经历管理 ====================

    async def add_education(
        self, resume_id: int, user_id: int, data: EducationCreate
    ) -> Education:
        """添加教育经历。"""
        await self.get_resume_detail(resume_id, user_id)

        education = Education(resume_id=resume_id, **data.model_dump())
        self.db.add(education)
        await self.db.commit()
        await self.db.refresh(education)
        return education

    async def update_education(
        self, resume_id: int, edu_id: int, user_id: int, data: EducationUpdate
    ) -> Education:
        """更新教育经历。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Education).where(
            Education.id == edu_id, Education.resume_id == resume_id
        )
        result = await self.db.execute(query)
        education = result.scalar_one_or_none()

        if not education:
            raise NotFoundError("Education not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(education, field, value)

        await self.db.commit()
        await self.db.refresh(education)
        return education

    async def delete_education(self, resume_id: int, edu_id: int, user_id: int) -> None:
        """删除教育经历。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Education).where(
            Education.id == edu_id, Education.resume_id == resume_id
        )
        result = await self.db.execute(query)
        education = result.scalar_one_or_none()

        if not education:
            raise NotFoundError("Education not found")

        await self.db.delete(education)
        await self.db.commit()

    # ==================== 工作/实习经历管理 ====================

    async def add_work_experience(
        self, resume_id: int, user_id: int, data: WorkExperienceCreate
    ) -> WorkExperience:
        """添加工作/实习经历。"""
        await self.get_resume_detail(resume_id, user_id)

        exp = WorkExperience(resume_id=resume_id, **data.model_dump())
        self.db.add(exp)
        await self.db.commit()
        await self.db.refresh(exp)
        return exp

    async def update_work_experience(
        self, resume_id: int, exp_id: int, user_id: int, data: WorkExperienceUpdate
    ) -> WorkExperience:
        """更新工作/实习经历。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(WorkExperience).where(
            WorkExperience.id == exp_id, WorkExperience.resume_id == resume_id
        )
        result = await self.db.execute(query)
        exp = result.scalar_one_or_none()

        if not exp:
            raise NotFoundError("Work experience not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(exp, field, value)

        await self.db.commit()
        await self.db.refresh(exp)
        return exp

    async def delete_work_experience(
        self, resume_id: int, exp_id: int, user_id: int
    ) -> None:
        """删除工作/实习经历。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(WorkExperience).where(
            WorkExperience.id == exp_id, WorkExperience.resume_id == resume_id
        )
        result = await self.db.execute(query)
        exp = result.scalar_one_or_none()

        if not exp:
            raise NotFoundError("Work experience not found")

        await self.db.delete(exp)
        await self.db.commit()

    # ==================== 项目经历管理 ====================

    async def add_project(
        self, resume_id: int, user_id: int, data: ProjectCreate
    ) -> Project:
        """添加项目经历。"""
        await self.get_resume_detail(resume_id, user_id)

        project = Project(resume_id=resume_id, **data.model_dump())
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def update_project(
        self, resume_id: int, proj_id: int, user_id: int, data: ProjectUpdate
    ) -> Project:
        """更新项目经历。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Project).where(
            Project.id == proj_id, Project.resume_id == resume_id
        )
        result = await self.db.execute(query)
        project = result.scalar_one_or_none()

        if not project:
            raise NotFoundError("Project not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete_project(self, resume_id: int, proj_id: int, user_id: int) -> None:
        """删除项目经历。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Project).where(
            Project.id == proj_id, Project.resume_id == resume_id
        )
        result = await self.db.execute(query)
        project = result.scalar_one_or_none()

        if not project:
            raise NotFoundError("Project not found")

        await self.db.delete(project)
        await self.db.commit()

    # ==================== 技能管理 ====================

    async def add_skill(self, resume_id: int, user_id: int, data: SkillCreate) -> Skill:
        """添加技能。"""
        await self.get_resume_detail(resume_id, user_id)

        skill = Skill(resume_id=resume_id, **data.model_dump())
        self.db.add(skill)
        await self.db.commit()
        await self.db.refresh(skill)
        return skill

    async def update_skill(
        self, resume_id: int, skill_id: int, user_id: int, data: SkillUpdate
    ) -> Skill:
        """更新技能。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Skill).where(Skill.id == skill_id, Skill.resume_id == resume_id)
        result = await self.db.execute(query)
        skill = result.scalar_one_or_none()

        if not skill:
            raise NotFoundError("Skill not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(skill, field, value)

        await self.db.commit()
        await self.db.refresh(skill)
        return skill

    async def delete_skill(self, resume_id: int, skill_id: int, user_id: int) -> None:
        """删除技能。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Skill).where(Skill.id == skill_id, Skill.resume_id == resume_id)
        result = await self.db.execute(query)
        skill = result.scalar_one_or_none()

        if not skill:
            raise NotFoundError("Skill not found")

        await self.db.delete(skill)
        await self.db.commit()

    # ==================== 语言能力管理 ====================

    async def add_language(
        self, resume_id: int, user_id: int, data: LanguageCreate
    ) -> Language:
        """添加语言能力。"""
        await self.get_resume_detail(resume_id, user_id)

        language = Language(resume_id=resume_id, **data.model_dump())
        self.db.add(language)
        await self.db.commit()
        await self.db.refresh(language)
        return language

    async def update_language(
        self, resume_id: int, lang_id: int, user_id: int, data: LanguageUpdate
    ) -> Language:
        """更新语言能力。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Language).where(
            Language.id == lang_id, Language.resume_id == resume_id
        )
        result = await self.db.execute(query)
        language = result.scalar_one_or_none()

        if not language:
            raise NotFoundError("Language not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(language, field, value)

        await self.db.commit()
        await self.db.refresh(language)
        return language

    async def delete_language(
        self, resume_id: int, lang_id: int, user_id: int
    ) -> None:
        """删除语言能力。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Language).where(
            Language.id == lang_id, Language.resume_id == resume_id
        )
        result = await self.db.execute(query)
        language = result.scalar_one_or_none()

        if not language:
            raise NotFoundError("Language not found")

        await self.db.delete(language)
        await self.db.commit()

    # ==================== 获奖经历管理 ====================

    async def add_award(
        self, resume_id: int, user_id: int, data: AwardCreate
    ) -> Award:
        """添加获奖经历。"""
        await self.get_resume_detail(resume_id, user_id)

        award = Award(resume_id=resume_id, **data.model_dump())
        self.db.add(award)
        await self.db.commit()
        await self.db.refresh(award)
        return award

    async def update_award(
        self, resume_id: int, award_id: int, user_id: int, data: AwardUpdate
    ) -> Award:
        """更新获奖经历。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Award).where(Award.id == award_id, Award.resume_id == resume_id)
        result = await self.db.execute(query)
        award = result.scalar_one_or_none()

        if not award:
            raise NotFoundError("Award not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(award, field, value)

        await self.db.commit()
        await self.db.refresh(award)
        return award

    async def delete_award(self, resume_id: int, award_id: int, user_id: int) -> None:
        """删除获奖经历。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Award).where(Award.id == award_id, Award.resume_id == resume_id)
        result = await self.db.execute(query)
        award = result.scalar_one_or_none()

        if not award:
            raise NotFoundError("Award not found")

        await self.db.delete(award)
        await self.db.commit()

    # ==================== 作品管理 ====================

    async def add_portfolio(
        self, resume_id: int, user_id: int, data: PortfolioCreate
    ) -> Portfolio:
        """添加作品。"""
        await self.get_resume_detail(resume_id, user_id)

        portfolio = Portfolio(resume_id=resume_id, **data.model_dump())
        self.db.add(portfolio)
        await self.db.commit()
        await self.db.refresh(portfolio)
        return portfolio

    async def update_portfolio(
        self, resume_id: int, portfolio_id: int, user_id: int, data: PortfolioUpdate
    ) -> Portfolio:
        """更新作品。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Portfolio).where(
            Portfolio.id == portfolio_id, Portfolio.resume_id == resume_id
        )
        result = await self.db.execute(query)
        portfolio = result.scalar_one_or_none()

        if not portfolio:
            raise NotFoundError("Portfolio not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(portfolio, field, value)

        await self.db.commit()
        await self.db.refresh(portfolio)
        return portfolio

    async def delete_portfolio(
        self, resume_id: int, portfolio_id: int, user_id: int
    ) -> None:
        """删除作品。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(Portfolio).where(
            Portfolio.id == portfolio_id, Portfolio.resume_id == resume_id
        )
        result = await self.db.execute(query)
        portfolio = result.scalar_one_or_none()

        if not portfolio:
            raise NotFoundError("Portfolio not found")

        await self.db.delete(portfolio)
        await self.db.commit()

    # ==================== 社交账号管理 ====================

    async def add_social_link(
        self, resume_id: int, user_id: int, data: SocialLinkCreate
    ) -> SocialLink:
        """添加社交账号。"""
        await self.get_resume_detail(resume_id, user_id)

        link = SocialLink(resume_id=resume_id, **data.model_dump())
        self.db.add(link)
        await self.db.commit()
        await self.db.refresh(link)
        return link

    async def update_social_link(
        self, resume_id: int, link_id: int, user_id: int, data: SocialLinkUpdate
    ) -> SocialLink:
        """更新社交账号。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(SocialLink).where(
            SocialLink.id == link_id, SocialLink.resume_id == resume_id
        )
        result = await self.db.execute(query)
        link = result.scalar_one_or_none()

        if not link:
            raise NotFoundError("Social link not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(link, field, value)

        await self.db.commit()
        await self.db.refresh(link)
        return link

    async def delete_social_link(
        self, resume_id: int, link_id: int, user_id: int
    ) -> None:
        """删除社交账号。"""
        await self.get_resume_detail(resume_id, user_id)

        query = select(SocialLink).where(
            SocialLink.id == link_id, SocialLink.resume_id == resume_id
        )
        result = await self.db.execute(query)
        link = result.scalar_one_or_none()

        if not link:
            raise NotFoundError("Social link not found")

        await self.db.delete(link)
        await self.db.commit()
```

**Step 2: 更新Service初始化文件**

Modify: `backend/app/services/__init__.py`

添加导出：

```python
from app.services.resume_service import ResumeService

__all__ = [
    # ... 原有导出
    "ResumeService",
]
```

**Step 3: Commit**

```bash
git add backend/app/services/
git commit -m "feat: add resume service layer"
```

---

## Task 4: 创建API路由层

**Files:**
- Create: `backend/app/api/v1/resume.py`

**Step 1: 创建路由文件**

```python
"""简历路由模块。

提供简历相关的 API 端点。
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError, ForbiddenError, ValidationError
from app.core.logging import get_logger
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.common import ResponseModel
from app.schemas.resume import (
    ResumeCreate,
    ResumeUpdate,
    ResumeListResponse,
    ResumeDetailResponse,
    ResumeList,
    EducationCreate,
    EducationUpdate,
    EducationResponse,
    WorkExperienceCreate,
    WorkExperienceUpdate,
    WorkExperienceResponse,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    SkillCreate,
    SkillUpdate,
    SkillResponse,
    LanguageCreate,
    LanguageUpdate,
    LanguageResponse,
    AwardCreate,
    AwardUpdate,
    AwardResponse,
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioResponse,
    SocialLinkCreate,
    SocialLinkUpdate,
    SocialLinkResponse,
)
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resumes", tags=["简历"])
logger = get_logger(__name__)


def get_resume_service(db: AsyncSession = Depends(get_db)) -> ResumeService:
    """获取简历服务实例。"""
    return ResumeService(db)


# ==================== 简历管理接口 ====================

@router.get(
    "",
    response_model=ResponseModel[ResumeList],
    summary="获取简历列表",
    description="获取当前用户的简历列表，支持分页和类型筛选",
)
async def get_resume_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    resume_type: Optional[str] = Query(None, pattern=r"^(campus|social)$", description="简历类型"),
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[ResumeList]:
    """获取简历列表。"""
    logger.info("API: get_resume_list", user_id=current_user.id, page=page)

    resumes, total = await resume_service.get_resume_list(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        resume_type=resume_type,
    )

    return ResponseModel(
        data=ResumeList(
            items=[ResumeListResponse.model_validate(r) for r in resumes],
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.post(
    "",
    response_model=ResponseModel[ResumeDetailResponse],
    status_code=status.HTTP_201_CREATED,
    summary="创建简历",
    description="创建新的简历",
)
async def create_resume(
    data: ResumeCreate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[ResumeDetailResponse]:
    """创建简历。"""
    logger.info("API: create_resume", user_id=current_user.id, resume_type=data.resume_type)

    try:
        resume = await resume_service.create_resume(current_user.id, data)
        # 重新获取完整详情
        resume = await resume_service.get_resume_detail(resume.id, current_user.id)
        return ResponseModel(data=ResumeDetailResponse.model_validate(resume))
    except ValidationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/{resume_id}",
    response_model=ResponseModel[ResumeDetailResponse],
    summary="获取简历详情",
    description="获取指定简历的完整信息",
)
async def get_resume_detail(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[ResumeDetailResponse]:
    """获取简历详情。"""
    logger.info("API: get_resume_detail", resume_id=resume_id, user_id=current_user.id)

    try:
        resume = await resume_service.get_resume_detail(resume_id, current_user.id)
        return ResponseModel(data=ResumeDetailResponse.model_validate(resume))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.put(
    "/{resume_id}",
    response_model=ResponseModel[ResumeDetailResponse],
    summary="更新简历",
    description="更新简历基础信息",
)
async def update_resume(
    resume_id: int,
    data: ResumeUpdate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[ResumeDetailResponse]:
    """更新简历。"""
    logger.info("API: update_resume", resume_id=resume_id)

    try:
        resume = await resume_service.update_resume(resume_id, current_user.id, data)
        resume = await resume_service.get_resume_detail(resume_id, current_user.id)
        return ResponseModel(data=ResumeDetailResponse.model_validate(resume))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{resume_id}",
    response_model=ResponseModel,
    summary="删除简历",
    description="删除指定简历",
)
async def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel:
    """删除简历。"""
    logger.info("API: delete_resume", resume_id=resume_id)

    try:
        await resume_service.delete_resume(resume_id, current_user.id)
        return ResponseModel()
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.post(
    "/{resume_id}/clone",
    response_model=ResponseModel[ResumeDetailResponse],
    status_code=status.HTTP_201_CREATED,
    summary="复制简历",
    description="复制指定简历创建新简历",
)
async def clone_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[ResumeDetailResponse]:
    """复制简历。"""
    logger.info("API: clone_resume", resume_id=resume_id)

    try:
        new_resume = await resume_service.clone_resume(resume_id, current_user.id)
        new_resume = await resume_service.get_resume_detail(new_resume.id, current_user.id)
        return ResponseModel(data=ResumeDetailResponse.model_validate(new_resume))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


# ==================== 教育经历接口 ====================

@router.post(
    "/{resume_id}/educations",
    response_model=ResponseModel[EducationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="添加教育经历",
)
async def add_education(
    resume_id: int,
    data: EducationCreate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[EducationResponse]:
    """添加教育经历。"""
    logger.info("API: add_education", resume_id=resume_id)

    try:
        education = await resume_service.add_education(resume_id, current_user.id, data)
        return ResponseModel(data=EducationResponse.model_validate(education))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.put(
    "/{resume_id}/educations/{edu_id}",
    response_model=ResponseModel[EducationResponse],
    summary="更新教育经历",
)
async def update_education(
    resume_id: int,
    edu_id: int,
    data: EducationUpdate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[EducationResponse]:
    """更新教育经历。"""
    logger.info("API: update_education", resume_id=resume_id, edu_id=edu_id)

    try:
        education = await resume_service.update_education(
            resume_id, edu_id, current_user.id, data
        )
        return ResponseModel(data=EducationResponse.model_validate(education))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{resume_id}/educations/{edu_id}",
    response_model=ResponseModel,
    summary="删除教育经历",
)
async def delete_education(
    resume_id: int,
    edu_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel:
    """删除教育经历。"""
    logger.info("API: delete_education", resume_id=resume_id, edu_id=edu_id)

    try:
        await resume_service.delete_education(resume_id, edu_id, current_user.id)
        return ResponseModel()
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


# ==================== 工作/实习经历接口 ====================

@router.post(
    "/{resume_id}/work-experiences",
    response_model=ResponseModel[WorkExperienceResponse],
    status_code=status.HTTP_201_CREATED,
    summary="添加工作/实习经历",
)
async def add_work_experience(
    resume_id: int,
    data: WorkExperienceCreate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[WorkExperienceResponse]:
    """添加工作/实习经历。"""
    logger.info("API: add_work_experience", resume_id=resume_id)

    try:
        exp = await resume_service.add_work_experience(resume_id, current_user.id, data)
        return ResponseModel(data=WorkExperienceResponse.model_validate(exp))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.put(
    "/{resume_id}/work-experiences/{exp_id}",
    response_model=ResponseModel[WorkExperienceResponse],
    summary="更新工作/实习经历",
)
async def update_work_experience(
    resume_id: int,
    exp_id: int,
    data: WorkExperienceUpdate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[WorkExperienceResponse]:
    """更新工作/实习经历。"""
    logger.info("API: update_work_experience", resume_id=resume_id, exp_id=exp_id)

    try:
        exp = await resume_service.update_work_experience(
            resume_id, exp_id, current_user.id, data
        )
        return ResponseModel(data=WorkExperienceResponse.model_validate(exp))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{resume_id}/work-experiences/{exp_id}",
    response_model=ResponseModel,
    summary="删除工作/实习经历",
)
async def delete_work_experience(
    resume_id: int,
    exp_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel:
    """删除工作/实习经历。"""
    logger.info("API: delete_work_experience", resume_id=resume_id, exp_id=exp_id)

    try:
        await resume_service.delete_work_experience(resume_id, exp_id, current_user.id)
        return ResponseModel()
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


# ==================== 项目经历接口 ====================

@router.post(
    "/{resume_id}/projects",
    response_model=ResponseModel[ProjectResponse],
    status_code=status.HTTP_201_CREATED,
    summary="添加项目经历",
)
async def add_project(
    resume_id: int,
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[ProjectResponse]:
    """添加项目经历。"""
    logger.info("API: add_project", resume_id=resume_id)

    try:
        project = await resume_service.add_project(resume_id, current_user.id, data)
        return ResponseModel(data=ProjectResponse.model_validate(project))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except ForbiddenError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.put(
    "/{resume_id}/projects/{proj_id}",
    response_model=ResponseModel[ProjectResponse],
    summary="更新项目经历",
)
async def update_project(
    resume_id: int,
    proj_id: int,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[ProjectResponse]:
    """更新项目经历。"""
    logger.info("API: update_project", resume_id=resume_id, proj_id