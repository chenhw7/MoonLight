"""简历路由模块。

提供简历相关的 API 端点。
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError, AuthorizationError, ValidationError
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
    except AuthorizationError as e:
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
    except AuthorizationError as e:
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
    except AuthorizationError as e:
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
    except AuthorizationError as e:
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
    except AuthorizationError as e:
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
    except AuthorizationError as e:
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
    except AuthorizationError as e:
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
    except AuthorizationError as e:
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
    except AuthorizationError as e:
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
    except AuthorizationError as e:
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
    except AuthorizationError as e:
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
    logger.info("API: update_project", resume_id=resume_id, proj_id=proj_id)

    try:
        project = await resume_service.update_project(
            resume_id, proj_id, current_user.id, data
        )
        return ResponseModel(data=ProjectResponse.model_validate(project))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{resume_id}/projects/{proj_id}",
    response_model=ResponseModel,
    summary="删除项目经历",
)
async def delete_project(
    resume_id: int,
    proj_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel:
    """删除项目经历。"""
    logger.info("API: delete_project", resume_id=resume_id, proj_id=proj_id)

    try:
        await resume_service.delete_project(resume_id, proj_id, current_user.id)
        return ResponseModel()
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


# ==================== 技能接口 ====================

@router.post(
    "/{resume_id}/skills",
    response_model=ResponseModel[SkillResponse],
    status_code=status.HTTP_201_CREATED,
    summary="添加技能",
)
async def add_skill(
    resume_id: int,
    data: SkillCreate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[SkillResponse]:
    """添加技能。"""
    logger.info("API: add_skill", resume_id=resume_id)

    try:
        skill = await resume_service.add_skill(resume_id, current_user.id, data)
        return ResponseModel(data=SkillResponse.model_validate(skill))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.put(
    "/{resume_id}/skills/{skill_id}",
    response_model=ResponseModel[SkillResponse],
    summary="更新技能",
)
async def update_skill(
    resume_id: int,
    skill_id: int,
    data: SkillUpdate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[SkillResponse]:
    """更新技能。"""
    logger.info("API: update_skill", resume_id=resume_id, skill_id=skill_id)

    try:
        skill = await resume_service.update_skill(
            resume_id, skill_id, current_user.id, data
        )
        return ResponseModel(data=SkillResponse.model_validate(skill))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{resume_id}/skills/{skill_id}",
    response_model=ResponseModel,
    summary="删除技能",
)
async def delete_skill(
    resume_id: int,
    skill_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel:
    """删除技能。"""
    logger.info("API: delete_skill", resume_id=resume_id, skill_id=skill_id)

    try:
        await resume_service.delete_skill(resume_id, skill_id, current_user.id)
        return ResponseModel()
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


# ==================== 语言能力接口 ====================

@router.post(
    "/{resume_id}/languages",
    response_model=ResponseModel[LanguageResponse],
    status_code=status.HTTP_201_CREATED,
    summary="添加语言能力",
)
async def add_language(
    resume_id: int,
    data: LanguageCreate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[LanguageResponse]:
    """添加语言能力。"""
    logger.info("API: add_language", resume_id=resume_id)

    try:
        language = await resume_service.add_language(resume_id, current_user.id, data)
        return ResponseModel(data=LanguageResponse.model_validate(language))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.put(
    "/{resume_id}/languages/{lang_id}",
    response_model=ResponseModel[LanguageResponse],
    summary="更新语言能力",
)
async def update_language(
    resume_id: int,
    lang_id: int,
    data: LanguageUpdate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[LanguageResponse]:
    """更新语言能力。"""
    logger.info("API: update_language", resume_id=resume_id, lang_id=lang_id)

    try:
        language = await resume_service.update_language(
            resume_id, lang_id, current_user.id, data
        )
        return ResponseModel(data=LanguageResponse.model_validate(language))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{resume_id}/languages/{lang_id}",
    response_model=ResponseModel,
    summary="删除语言能力",
)
async def delete_language(
    resume_id: int,
    lang_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel:
    """删除语言能力。"""
    logger.info("API: delete_language", resume_id=resume_id, lang_id=lang_id)

    try:
        await resume_service.delete_language(resume_id, lang_id, current_user.id)
        return ResponseModel()
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


# ==================== 获奖经历接口 ====================

@router.post(
    "/{resume_id}/awards",
    response_model=ResponseModel[AwardResponse],
    status_code=status.HTTP_201_CREATED,
    summary="添加获奖经历",
)
async def add_award(
    resume_id: int,
    data: AwardCreate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[AwardResponse]:
    """添加获奖经历。"""
    logger.info("API: add_award", resume_id=resume_id)

    try:
        award = await resume_service.add_award(resume_id, current_user.id, data)
        return ResponseModel(data=AwardResponse.model_validate(award))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.put(
    "/{resume_id}/awards/{award_id}",
    response_model=ResponseModel[AwardResponse],
    summary="更新获奖经历",
)
async def update_award(
    resume_id: int,
    award_id: int,
    data: AwardUpdate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[AwardResponse]:
    """更新获奖经历。"""
    logger.info("API: update_award", resume_id=resume_id, award_id=award_id)

    try:
        award = await resume_service.update_award(
            resume_id, award_id, current_user.id, data
        )
        return ResponseModel(data=AwardResponse.model_validate(award))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{resume_id}/awards/{award_id}",
    response_model=ResponseModel,
    summary="删除获奖经历",
)
async def delete_award(
    resume_id: int,
    award_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel:
    """删除获奖经历。"""
    logger.info("API: delete_award", resume_id=resume_id, award_id=award_id)

    try:
        await resume_service.delete_award(resume_id, award_id, current_user.id)
        return ResponseModel()
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


# ==================== 作品接口 ====================

@router.post(
    "/{resume_id}/portfolios",
    response_model=ResponseModel[PortfolioResponse],
    status_code=status.HTTP_201_CREATED,
    summary="添加作品",
)
async def add_portfolio(
    resume_id: int,
    data: PortfolioCreate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[PortfolioResponse]:
    """添加作品。"""
    logger.info("API: add_portfolio", resume_id=resume_id)

    try:
        portfolio = await resume_service.add_portfolio(resume_id, current_user.id, data)
        return ResponseModel(data=PortfolioResponse.model_validate(portfolio))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.put(
    "/{resume_id}/portfolios/{portfolio_id}",
    response_model=ResponseModel[PortfolioResponse],
    summary="更新作品",
)
async def update_portfolio(
    resume_id: int,
    portfolio_id: int,
    data: PortfolioUpdate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[PortfolioResponse]:
    """更新作品。"""
    logger.info("API: update_portfolio", resume_id=resume_id, portfolio_id=portfolio_id)

    try:
        portfolio = await resume_service.update_portfolio(
            resume_id, portfolio_id, current_user.id, data
        )
        return ResponseModel(data=PortfolioResponse.model_validate(portfolio))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{resume_id}/portfolios/{portfolio_id}",
    response_model=ResponseModel,
    summary="删除作品",
)
async def delete_portfolio(
    resume_id: int,
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel:
    """删除作品。"""
    logger.info("API: delete_portfolio", resume_id=resume_id, portfolio_id=portfolio_id)

    try:
        await resume_service.delete_portfolio(resume_id, portfolio_id, current_user.id)
        return ResponseModel()
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


# ==================== 社交账号接口 ====================

@router.post(
    "/{resume_id}/social-links",
    response_model=ResponseModel[SocialLinkResponse],
    status_code=status.HTTP_201_CREATED,
    summary="添加社交账号",
)
async def add_social_link(
    resume_id: int,
    data: SocialLinkCreate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[SocialLinkResponse]:
    """添加社交账号。"""
    logger.info("API: add_social_link", resume_id=resume_id)

    try:
        link = await resume_service.add_social_link(resume_id, current_user.id, data)
        return ResponseModel(data=SocialLinkResponse.model_validate(link))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.put(
    "/{resume_id}/social-links/{link_id}",
    response_model=ResponseModel[SocialLinkResponse],
    summary="更新社交账号",
)
async def update_social_link(
    resume_id: int,
    link_id: int,
    data: SocialLinkUpdate,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel[SocialLinkResponse]:
    """更新社交账号。"""
    logger.info("API: update_social_link", resume_id=resume_id, link_id=link_id)

    try:
        link = await resume_service.update_social_link(
            resume_id, link_id, current_user.id, data
        )
        return ResponseModel(data=SocialLinkResponse.model_validate(link))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{resume_id}/social-links/{link_id}",
    response_model=ResponseModel,
    summary="删除社交账号",
)
async def delete_social_link(
    resume_id: int,
    link_id: int,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResponseModel:
    """删除社交账号。"""
    logger.info("API: delete_social_link", resume_id=resume_id, link_id=link_id)

    try:
        await resume_service.delete_social_link(resume_id, link_id, current_user.id)
        return ResponseModel()
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
    except AuthorizationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
