"""面试流程服务模块。

管理面试流程的轮次切换逻辑。
"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.interview import InterviewMessage, InterviewSession
from app.schemas.interview import InterviewConfig
from app.services.interview_service import InterviewSessionService

logger = get_logger(__name__)


class InterviewFlowService:
    """面试流程服务。

    管理面试的轮次切换逻辑：
    - opening: 开场白（1-2 句话）
    - self_intro: 自我介绍（2-3 个追问）
    - qa: 核心问答（5-8 个问题）
    - reverse_qa: 反问环节（候选人提问）
    - closing: 结束面试
    """

    # 每轮最少/最多消息数（候选人回复）
    ROUND_MESSAGE_LIMITS = {
        "opening": (0, 0),  # AI 开场，不需要候选人回复
        "self_intro": (1, 3),  # 自我介绍 + 0-2 个追问
        "qa": (5, 10),  # 5-10 个问答
        "reverse_qa": (0, 5),  # 候选人提问环节，0-5 个问题
        "closing": (0, 0),  # AI 结束语
    }

    # 轮次切换触发词（AI 可以输出这些词来触发切换）
    # 支持模糊匹配，只要包含关键词即可
    ROUND_TRANSITION_MARKERS = {
        "opening": [
            "[NEXT:self_intro]",
            "请开始自我介绍",
            "请开始你的自我介绍",
            "请先介绍一下",
            "请先介绍",
        ],
        "self_intro": [
            "[NEXT:qa]",
            "接下来进入技术问答",
            "让我们开始技术问题",
            "进入技术问答",
            "开始技术问题",
        ],
        "qa": [
            "[NEXT:reverse_qa]",
            "你有什么问题要问我吗",
            "你有什么问题想问",
            "反问环节",
            "你有什么想了解",
        ],
        "reverse_qa": [
            "[NEXT:closing]",
            "面试到此结束",
            "今天的面试就到这里",
            "面试结束",
            "感谢你的参与",
        ],
    }

    @classmethod
    def should_transition_to_next_round(
        cls,
        session: InterviewSession,
        messages: list[InterviewMessage],
        ai_response: Optional[str] = None,
    ) -> tuple[bool, str]:
        """判断是否应该切换到下一轮。

        Args:
            session: 当前会话
            messages: 当前轮次的消息列表
            ai_response: AI 的最新回复（可选）

        Returns:
            (是否应该切换, 下一轮的名称)
        """
        current_round = session.current_round
        rounds = InterviewConfig.INTERVIEW_ROUNDS

        # 获取当前轮次的索引
        try:
            current_index = rounds.index(current_round)
        except ValueError:
            logger.error(f"Unknown round: {current_round}")
            return False, current_round

        # 如果已经是最后一轮，不再切换
        if current_index >= len(rounds) - 1:
            return False, current_round

        next_round = rounds[current_index + 1]

        # 检查 AI 回复中是否包含切换标记
        if ai_response:
            markers = cls.ROUND_TRANSITION_MARKERS.get(current_round, [])
            for marker in markers:
                if marker in ai_response:
                    logger.info(
                        f"Round transition triggered by marker: {marker}",
                        extra={
                            "session_id": session.id,
                            "from": current_round,
                            "to": next_round,
                        },
                    )
                    return True, next_round

        # 统计当前轮次的候选人回复数
        user_message_count = sum(
            1 for msg in messages
            if msg.role == "user" and msg.round == current_round
        )

        min_messages, max_messages = cls.ROUND_MESSAGE_LIMITS.get(
            current_round, (0, 999)
        )

        # 如果超过最大消息数，强制切换
        if user_message_count >= max_messages and max_messages > 0:
            logger.info(
                f"Round transition triggered by max messages limit",
                extra={
                    "session_id": session.id,
                    "from": current_round,
                    "to": next_round,
                    "user_messages": user_message_count,
                },
            )
            return True, next_round

        return False, current_round

    @classmethod
    def get_round_instruction(cls, round_name: str) -> str:
        """获取当前轮次的指令。

        Args:
            round_name: 轮次名称

        Returns:
            轮次指令
        """
        instructions = {
            "opening": """当前是【开场白】轮次。

【任务】
请做简短的开场白（1-2句话），介绍面试流程，然后请候选人自我介绍。

【重要】
结束时必须说："请开始你的自我介绍。"（这句话会触发轮次切换）""",

            "self_intro": """当前是【自我介绍】轮次。

【任务】
请听候选人自我介绍，根据简历内容进行追问（0-2个问题）。

【进度】
- 最少需要 1 次候选人回复（自我介绍）
- 最多 3 次回复（自我介绍 + 2个追问）

【切换条件】
追问结束后，必须说："接下来我们进入技术问答环节。"（触发切换）""",

            "qa": """当前是【核心问答】轮次。

【任务】
根据面试模式进行技术提问，每次只问一个问题。

【进度】
- 最少需要 5 个问答
- 最多 10 个问答

【切换条件】
问完后，必须说："你有什么问题要问我吗？"（触发切换）""",

            "reverse_qa": """当前是【反问环节】。

【任务】
让候选人提问，回答他们关于公司、团队、岗位的问题。

【进度】
- 最少 0 个问题
- 最多 5 个问题

【切换条件】
回答完问题后，必须说："今天的面试就到这里，感谢你的参与。"（触发切换）""",

            "closing": """当前是【结束】轮次。

【任务】
做简短的结束语，告知候选人后续流程（如：HR 会在 X 天内联系你）。

【注意】
不要问新问题。""",
        }
        return instructions.get(round_name, "")

    @classmethod
    def get_round_progress(cls, session: InterviewSession, messages: list[InterviewMessage]) -> dict:
        """获取当前轮次的进度信息。

        Args:
            session: 当前会话
            messages: 消息列表

        Returns:
            进度信息
        """
        current_round = session.current_round
        rounds = InterviewConfig.INTERVIEW_ROUNDS

        # 当前轮次索引
        current_index = rounds.index(current_round)

        # 统计当前轮次的消息数
        round_messages = [msg for msg in messages if msg.round == current_round]
        user_message_count = sum(1 for msg in round_messages if msg.role == "user")
        ai_message_count = sum(1 for msg in round_messages if msg.role == "ai")

        min_messages, max_messages = cls.ROUND_MESSAGE_LIMITS.get(
            current_round, (0, 0)
        )

        # 计算进度百分比
        if max_messages > 0:
            progress = min(100, int(user_message_count / max_messages * 100))
        else:
            progress = 100 if ai_message_count > 0 else 0

        return {
            "current_round": current_round,
            "current_round_display": InterviewConfig.ROUND_DISPLAY_NAMES.get(
                current_round, current_round
            ),
            "round_index": current_index + 1,
            "total_rounds": len(rounds),
            "user_messages": user_message_count,
            "ai_messages": ai_message_count,
            "min_messages": min_messages,
            "max_messages": max_messages,
            "progress": progress,
            "can_transition": user_message_count >= min_messages,
        }

    @classmethod
    async def transition_to_next_round(
        cls,
        db: AsyncSession,
        session: InterviewSession,
    ) -> InterviewSession:
        """切换到下一轮。

        Args:
            db: 数据库会话
            session: 当前会话

        Returns:
            更新后的会话
        """
        rounds = InterviewConfig.INTERVIEW_ROUNDS
        current_index = rounds.index(session.current_round)

        if current_index < len(rounds) - 1:
            next_round = rounds[current_index + 1]

            from app.schemas.interview import InterviewSessionUpdate

            update_data = InterviewSessionUpdate(current_round=next_round)
            session = await InterviewSessionService.update(
                db, session, update_data
            )

            logger.info(
                f"Round transitioned",
                extra={
                    "session_id": session.id,
                    "from": rounds[current_index],
                    "to": next_round,
                },
            )

        return session

    @classmethod
    def build_full_prompt(
        cls,
        session: InterviewSession,
        system_prompt: str,
        messages: list[InterviewMessage],
    ) -> list[dict]:
        """构建完整的对话 Prompt。

        Args:
            session: 当前会话
            system_prompt: 系统 Prompt
            messages: 历史消息列表

        Returns:
            完整的消息列表
        """
        # 获取当前轮次指令
        round_instruction = cls.get_round_instruction(session.current_round)

        # 构建完整系统提示
        full_system = f"""{system_prompt}

## 当前轮次指令
{round_instruction}

## 轮次进度
当前是第 {InterviewConfig.INTERVIEW_ROUNDS.index(session.current_round) + 1} / {len(InterviewConfig.INTERVIEW_ROUNDS)} 轮
"""

        # 构建消息列表
        prompt_messages = [{"role": "system", "content": full_system}]

        # 添加历史消息
        for msg in messages:
            role = "assistant" if msg.role == "ai" else "user"
            prompt_messages.append({"role": role, "content": msg.content})

        return prompt_messages
