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
    avatar: Mapped[Optional[str]] = mapped_column(Text)  # Base64 编码的头像图片
    avatar_ratio: Mapped[Optional[str]] = mapped_column(String(10), default="1.4")  # 头像比例: '1.4' 或 '1'
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
