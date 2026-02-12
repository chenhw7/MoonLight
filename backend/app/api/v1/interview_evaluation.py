"""面试评价路由模块。

提供面试评价生成和查看接口。
"""

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_client import AIClientFactory
from app.core.database import get_db
from app.core.logging import get_logger
from app.core.security import get_current_user
from app.models.interview import InterviewSession
from app.models.user import User
from app.schemas.interview import (
    InterviewEvaluationResponse,
    InterviewSessionResponse,
)
from app.services.interview_service import (
    InterviewEvaluationService,
    InterviewMessageService,
    InterviewSessionService,
    PromptService,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/interviews/{session_id}/evaluation", tags=["面试评价"])


@router.post(
    "",
    response_model=InterviewEvaluationResponse,
    summary="生成面试评价",
    description="根据面试对话生成评价报告。",
)
async def generate_evaluation(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewEvaluationResponse:
    """生成面试评价。"""
    # 获取会话
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

    # 检查是否已存在评价
    existing = await InterviewEvaluationService.get_by_session_id(db, session_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="评价报告已存在",
        )

    # 获取所有消息
    messages = await InterviewMessageService.list_by_session(db, session_id)

    if len(messages) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="对话内容不足，无法生成评价",
        )

    # 构建评价 Prompt
    prompt = PromptService.build_evaluation_prompt(session, messages)

    # 调用 AI 生成评价
    try:
        client = AIClientFactory.get_client(
            base_url=session.model_config["base_url"],
            api_key=session.model_config.get("api_key", ""),
        )

        ai_response = await client.chat_complete(
            messages=[{"role": "user", "content": prompt}],
            model=session.model_config.get("chat_model", "gpt-4"),
            temperature=0.3,  # 评价需要更稳定的输出
            max_tokens=session.model_config.get("max_tokens", 4096),
        )

        # 解析 AI 返回的 JSON
        try:
            # 尝试直接解析
            evaluation_data = json.loads(ai_response)
        except json.JSONDecodeError:
            # 如果直接解析失败，尝试提取 JSON 部分
            import re

            json_match = re.search(r"\{[\s\S]*\}", ai_response)
            if json_match:
                evaluation_data = json.loads(json_match.group())
            else:
                raise ValueError("无法解析 AI 返回的评价数据")

        # 验证必要字段
        required_fields = [
            "overall_score",
            "dimension_scores",
            "summary",
            "dimension_details",
            "suggestions",
            "recommended_questions",
        ]
        for field in required_fields:
            if field not in evaluation_data:
                raise ValueError(f"评价数据缺少字段: {field}")

        # 创建评价记录
        evaluation = await InterviewEvaluationService.create(
            db, session_id, evaluation_data
        )

        # 自动完成面试
        if session.status == "ongoing":
            from datetime import datetime

            session.status = "completed"
            session.end_time = datetime.utcnow()
            await db.commit()
            await db.refresh(session)

        logger.info(
            "Interview evaluation generated",
            extra={
                "session_id": session_id,
                "score": evaluation.overall_score,
            },
        )

        return evaluation

    except Exception as e:
        logger.error(
            f"Evaluation generation failed: {e}",
            extra={"session_id": session_id},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"评价生成失败: {str(e)}",
        )


@router.get(
    "",
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
    # 获取会话
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

    # 获取评价
    evaluation = await InterviewEvaluationService.get_by_session_id(db, session_id)

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="评价报告不存在",
        )

    return evaluation


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除面试评价",
    description="删除面试评价报告。",
)
async def delete_evaluation(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """删除面试评价。"""
    # 获取会话
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

    # 获取评价
    evaluation = await InterviewEvaluationService.get_by_session_id(db, session_id)

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="评价报告不存在",
        )

    # 删除评价
    await db.delete(evaluation)
    await db.commit()

    logger.info(
        "Interview evaluation deleted",
        extra={"session_id": session_id},
    )
