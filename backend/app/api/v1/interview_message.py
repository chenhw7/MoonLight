"""面试消息路由模块。

提供面试消息处理和流式对话接口。
"""

import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_client import AIClient, AIClientFactory
from app.core.database import get_db
from app.core.logging import get_logger
from app.core.security import get_current_user
from app.models.interview import InterviewSession
from app.models.resume import Resume
from app.models.user import User
from app.schemas.interview import (
    InterviewConfig,
    InterviewMessageCreate,
    InterviewMessageResponse,
)
from app.services.interview_flow_service import InterviewFlowService
from app.services.interview_service import (
    InterviewMessageService,
    InterviewSessionService,
    PromptService,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/interviews/{session_id}/messages", tags=["面试消息"])


@router.get(
    "",
    response_model=list[InterviewMessageResponse],
    summary="获取消息列表",
    description="获取面试会话的消息列表。",
)
async def get_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[InterviewMessageResponse]:
    """获取消息列表。"""
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

    messages = await InterviewMessageService.list_by_session(db, session_id)
    return messages


@router.post(
    "",
    response_model=InterviewMessageResponse,
    summary="发送消息",
    description="发送消息给 AI 面试官（非流式）。",
)
async def send_message(
    session_id: int,
    message_data: InterviewMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewMessageResponse:
    """发送消息。"""
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

    # 保存用户消息
    user_message = await InterviewMessageService.create(
        db,
        session_id=session_id,
        role="user",
        content=message_data.content,
        round=session.current_round,
    )

    # 获取历史消息
    messages = await InterviewMessageService.list_by_session(db, session_id)

    # 获取简历
    from sqlalchemy import select

    result = await db.execute(
        select(Resume).where(Resume.id == session.resume_id)
    )
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="关联简历不存在",
        )

    # 构建 Prompt
    system_prompt = PromptService.build_system_prompt(session, resume)
    prompt_messages = InterviewFlowService.build_full_prompt(
        session, system_prompt, messages
    )

    # 调用 AI
    try:
        client = AIClientFactory.get_client(
            base_url=session.model_config["base_url"],
            api_key=session.model_config.get("api_key", ""),
        )

        ai_response = await client.chat_complete(
            messages=prompt_messages,
            model=session.model_config.get("chat_model", "gpt-4"),
            temperature=session.model_config.get("temperature", 0.7),
            max_tokens=session.model_config.get("max_tokens", 4096),
        )

        # 检查是否需要切换轮次
        should_transition, next_round = (
            InterviewFlowService.should_transition_to_next_round(
                session, messages, ai_response
            )
        )

        # 保存 AI 消息
        meta_info = {}
        if should_transition:
            meta_info["triggered_transition"] = next_round

        ai_message = await InterviewMessageService.create(
            db,
            session_id=session_id,
            role="ai",
            content=ai_response,
            round=session.current_round,
            meta_info=meta_info if meta_info else None,
        )

        # 如果需要切换轮次
        if should_transition:
            session = await InterviewFlowService.transition_to_next_round(
                db, session
            )

        return ai_message

    except Exception as e:
        logger.error(
            f"AI response failed: {e}",
            extra={"session_id": session_id},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 响应失败: {str(e)}",
        )


@router.post(
    "/stream",
    summary="发送消息（流式）",
    description="发送消息给 AI 面试官，使用 SSE 流式返回。",
)
async def send_message_stream(
    session_id: int,
    message_data: InterviewMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """发送消息（流式）。"""
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

    # 保存用户消息
    user_message = await InterviewMessageService.create(
        db,
        session_id=session_id,
        role="user",
        content=message_data.content,
        round=session.current_round,
    )

    # 获取历史消息
    messages = await InterviewMessageService.list_by_session(db, session_id)

    # 获取简历
    from sqlalchemy import select

    result = await db.execute(
        select(Resume).where(Resume.id == session.resume_id)
    )
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="关联简历不存在",
        )

    # 构建 Prompt
    system_prompt = PromptService.build_system_prompt(session, resume)
    prompt_messages = InterviewFlowService.build_full_prompt(
        session, system_prompt, messages
    )

    async def generate_stream():
        """生成 SSE 流。"""
        full_response = ""

        try:
            client = AIClientFactory.get_client(
                base_url=session.model_config["base_url"],
                api_key=session.model_config.get("api_key", ""),
            )

            # 发送开始标记
            yield f"data: {json.dumps({'type': 'start'})}\n\n"

            # 流式获取响应
            async for chunk in client.chat_stream(
                messages=prompt_messages,
                model=session.model_config.get("chat_model", "gpt-4"),
                temperature=session.model_config.get("temperature", 0.7),
                max_tokens=session.model_config.get("max_tokens", 4096),
            ):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

            # 检查是否需要切换轮次
            should_transition, next_round = (
                InterviewFlowService.should_transition_to_next_round(
                    session, messages, full_response
                )
            )

            # 保存 AI 消息
            meta_info = {}
            if should_transition:
                meta_info["triggered_transition"] = next_round

            ai_message = await InterviewMessageService.create(
                db,
                session_id=session_id,
                role="ai",
                content=full_response,
                round=session.current_round,
                meta_info=meta_info if meta_info else None,
            )

            # 如果需要切换轮次
            if should_transition:
                session = await InterviewFlowService.transition_to_next_round(
                    db, session
                )

            # 发送结束标记
            yield f"data: {json.dumps({'type': 'end', 'message_id': ai_message.id, 'transition': should_transition, 'next_round': next_round if should_transition else None})}\n\n"

        except Exception as e:
            logger.error(
                f"Stream error: {e}",
                extra={"session_id": session_id},
            )
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get(
    "/progress",
    summary="获取面试进度",
    description="获取当前面试的进度信息。",
)
async def get_progress(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """获取面试进度。"""
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

    messages = await InterviewMessageService.list_by_session(db, session_id)
    progress = InterviewFlowService.get_round_progress(session, messages)

    return progress


@router.post(
    "/next-round",
    summary="手动切换到下一轮",
    description="手动触发切换到下一轮面试。",
)
async def next_round(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """手动切换到下一轮。"""
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

    rounds = InterviewConfig.INTERVIEW_ROUNDS
    current_index = rounds.index(session.current_round)

    if current_index >= len(rounds) - 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已经是最后一轮",
        )

    session = await InterviewFlowService.transition_to_next_round(db, session)

    return {
        "current_round": session.current_round,
        "current_round_display": InterviewConfig.ROUND_DISPLAY_NAMES.get(
            session.current_round
        ),
        "round_index": current_index + 2,
        "total_rounds": len(rounds),
    }
