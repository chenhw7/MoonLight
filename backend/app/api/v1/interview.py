"""面试路由模块。

提供面试会话、消息和评价的接口。
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import get_logger
from app.core.security import get_current_user
from app.models.interview import InterviewSession
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.interview import (
    InterviewConfig,
    InterviewEvaluationResponse,
    InterviewSessionCreate,
    InterviewSessionDetailResponse,
    InterviewSessionListResponse,
    InterviewSessionResponse,
    InterviewSessionUpdate,
)
from app.services.ai_config_service import AIConfigService
from app.services.interview_service import InterviewSessionService

logger = get_logger(__name__)

router = APIRouter(prefix="/interviews", tags=["面试"])


@router.get(
    "/config",
    response_model=dict,
    summary="获取面试配置选项",
    description="获取面试模式、风格等配置选项。",
)
async def get_interview_config() -> dict:
    """获取面试配置选项。"""
    return {
        "recruitment_types": InterviewConfig.RECRUITMENT_TYPES,
        "interview_modes": InterviewConfig.INTERVIEW_MODES,
        "interviewer_styles": InterviewConfig.INTERVIEWER_STYLES,
        "rounds": InterviewConfig.INTERVIEW_ROUNDS,
        "round_display_names": InterviewConfig.ROUND_DISPLAY_NAMES,
    }


@router.post(
    "",
    response_model=InterviewSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建面试会话",
    description="创建新的面试会话。",
)
async def create_interview(
    session_data: InterviewSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSession:
    """创建面试会话。"""
    # 获取用户的 AI 配置
    ai_config = await AIConfigService.get_by_user_id(db, current_user.id)
    if not ai_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先配置 AI 模型",
        )

    # 创建会话
    session = await InterviewSessionService.create(
        db, current_user.id, session_data, ai_config
    )

    return session


@router.get(
    "",
    response_model=PaginatedResponse[InterviewSessionListResponse],
    summary="获取面试会话列表",
    description="获取当前用户的面试会话列表。",
)
async def list_interviews(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[InterviewSessionListResponse]:
    """获取面试会话列表。"""
    sessions, total = await InterviewSessionService.list_by_user(
        db, current_user.id, skip, limit
    )

    return PaginatedResponse(
        items=sessions,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{session_id}",
    response_model=InterviewSessionDetailResponse,
    summary="获取面试会话详情",
    description="获取面试会话详情，包含消息列表。",
)
async def get_interview(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSession:
    """获取面试会话详情。"""
    session = await InterviewSessionService.get_by_id(db, session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="面试会话不存在",
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此面试会话",
        )

    return session


@router.patch(
    "/{session_id}",
    response_model=InterviewSessionResponse,
    summary="更新面试会话",
    description="更新面试会话信息。",
)
async def update_interview(
    session_id: int,
    update_data: InterviewSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSession:
    """更新面试会话。"""
    session = await InterviewSessionService.get_by_id(db, session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="面试会话不存在",
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此面试会话",
        )

    session = await InterviewSessionService.update(db, session, update_data)
    return session


@router.post(
    "/{session_id}/complete",
    response_model=InterviewSessionResponse,
    summary="完成面试",
    description="标记面试会话为已完成。",
)
async def complete_interview(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSession:
    """完成面试。"""
    session = await InterviewSessionService.get_by_id(db, session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="面试会话不存在",
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此面试会话",
        )

    if session.status != "ongoing":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="面试已结束",
        )

    session = await InterviewSessionService.complete(db, session)
    return session


@router.post(
    "/{session_id}/abort",
    response_model=InterviewSessionResponse,
    summary="放弃面试",
    description="标记面试会话为已放弃。",
)
async def abort_interview(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSession:
    """放弃面试。"""
    session = await InterviewSessionService.get_by_id(db, session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="面试会话不存在",
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此面试会话",
        )

    if session.status != "ongoing":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="面试已结束",
        )

    session = await InterviewSessionService.abort(db, session)
    return session


@router.get(
    "/{session_id}/evaluation",
    response_model=InterviewEvaluationResponse,
    summary="获取面试评价",
    description="获取面试评价报告。",
)
async def get_evaluation(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewEvaluationResponse:
    """获取面试评价。"""
    from app.services.interview_service import InterviewEvaluationService

    session = await InterviewSessionService.get_by_id(db, session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="面试会话不存在",
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此面试会话",
        )

    evaluation = await InterviewEvaluationService.get_by_session_id(
        db, session_id
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="评价报告不存在",
        )

    return evaluation
