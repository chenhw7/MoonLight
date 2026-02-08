"""简历服务模块。

提供简历相关的业务逻辑处理。
"""

from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError, ValidationError, AuthorizationError
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
            AuthorizationError: 无权访问
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
            raise AuthorizationError("Access denied")

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
