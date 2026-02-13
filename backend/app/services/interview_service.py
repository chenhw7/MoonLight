"""面试服务模块。

提供面试会话、消息和评价的 CRUD 操作。
"""

import json
from typing import Optional

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.ai_client import AIClient, AIClientError
from app.core.logging import get_logger
from app.models.interview import (
    AIConfig,
    InterviewEvaluation,
    InterviewMessage,
    InterviewSession,
)
from app.models.resume import Resume
from app.schemas.interview import InterviewSessionCreate, InterviewSessionUpdate

logger = get_logger(__name__)


class InterviewSessionService:
    """面试会话服务。"""

    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: int,
        session_data: InterviewSessionCreate,
        ai_config: AIConfig,
    ) -> InterviewSession:
        """创建面试会话。

        Args:
            db: 数据库会话
            user_id: 用户 ID
            session_data: 会话数据
            ai_config: AI 配置

        Returns:
            创建的面试会话
        """
        # 构建模型配置快照
        model_config = {
            "provider": ai_config.provider,
            "base_url": ai_config.base_url,
            "api_key": ai_config.api_key,
            "chat_model": ai_config.chat_model,
            "reasoning_model": ai_config.reasoning_model,
            "vision_model": ai_config.vision_model,
            "voice_model": ai_config.voice_model,
            "temperature": ai_config.temperature,
            "max_tokens": ai_config.max_tokens,
        }

        # 如果请求中有自定义配置，合并进去
        if session_data.ai_model_config:
            model_config.update(session_data.ai_model_config)

        session = InterviewSession(
            user_id=user_id,
            resume_id=session_data.resume_id,
            company_name=session_data.company_name,
            position_name=session_data.position_name,
            job_description=session_data.job_description,
            recruitment_type=session_data.recruitment_type,
            interview_mode=session_data.interview_mode,
            interviewer_style=session_data.interviewer_style,
            model_config=model_config,
            status="ongoing",
            current_round="opening",
        )

        db.add(session)
        await db.commit()
        await db.refresh(session)

        logger.info(
            "Interview session created",
            extra={
                "session_id": session.id,
                "user_id": user_id,
                "company": session.company_name,
            },
        )

        return session

    @staticmethod
    async def get_by_id(
        db: AsyncSession, session_id: int
    ) -> Optional[InterviewSession]:
        """根据 ID 获取面试会话。

        Args:
            db: 数据库会话
            session_id: 会话 ID

        Returns:
            面试会话，如果不存在返回 None
        """
        from app.models.resume import Resume

        result = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.id == session_id)
            .options(
                selectinload(InterviewSession.resume).selectinload(Resume.educations),
                selectinload(InterviewSession.resume).selectinload(Resume.work_experiences),
                selectinload(InterviewSession.resume).selectinload(Resume.projects),
                selectinload(InterviewSession.resume).selectinload(Resume.skills),
                selectinload(InterviewSession.resume).selectinload(Resume.languages),
                selectinload(InterviewSession.resume).selectinload(Resume.awards),
                selectinload(InterviewSession.resume).selectinload(Resume.portfolios),
                selectinload(InterviewSession.resume).selectinload(Resume.social_links),
                selectinload(InterviewSession.messages),
                selectinload(InterviewSession.evaluation),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id_with_messages(
        db: AsyncSession, session_id: int
    ) -> Optional[InterviewSession]:
        """根据 ID 获取面试会话（包含消息）。

        Args:
            db: 数据库会话
            session_id: 会话 ID

        Returns:
            面试会话，如果不存在返回 None
        """
        from app.models.resume import Resume

        result = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.id == session_id)
            .options(
                selectinload(InterviewSession.resume).selectinload(Resume.educations),
                selectinload(InterviewSession.resume).selectinload(Resume.work_experiences),
                selectinload(InterviewSession.resume).selectinload(Resume.projects),
                selectinload(InterviewSession.resume).selectinload(Resume.skills),
                selectinload(InterviewSession.resume).selectinload(Resume.languages),
                selectinload(InterviewSession.resume).selectinload(Resume.awards),
                selectinload(InterviewSession.resume).selectinload(Resume.portfolios),
                selectinload(InterviewSession.resume).selectinload(Resume.social_links),
                selectinload(InterviewSession.messages),
                selectinload(InterviewSession.evaluation),
            )
            .order_by(InterviewMessage.id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_user(
        db: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[InterviewSession], int]:
        """获取用户的面试会话列表。

        Args:
            db: 数据库会话
            user_id: 用户 ID
            skip: 跳过数量
            limit: 限制数量

        Returns:
            (会话列表, 总数)
        """
        # 查询总数
        count_result = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.user_id == user_id)
            .order_by(desc(InterviewSession.created_at))
        )
        total = len(count_result.scalars().all())

        # 查询列表
        result = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.user_id == user_id)
            .order_by(desc(InterviewSession.created_at))
            .offset(skip)
            .limit(limit)
        )
        sessions = result.scalars().all()

        return list(sessions), total

    @staticmethod
    async def update(
        db: AsyncSession,
        session: InterviewSession,
        update_data: InterviewSessionUpdate,
    ) -> InterviewSession:
        """更新面试会话。

        Args:
            db: 数据库会话
            session: 面试会话
            update_data: 更新数据

        Returns:
            更新后的面试会话
        """
        update_dict = update_data.model_dump(exclude_unset=True)

        for field, value in update_dict.items():
            if hasattr(session, field):
                setattr(session, field, value)

        await db.commit()
        await db.refresh(session)

        logger.info(
            "Interview session updated",
            extra={"session_id": session.id, "updates": list(update_dict.keys())},
        )

        return session

    @staticmethod
    async def complete(db: AsyncSession, session: InterviewSession) -> InterviewSession:
        """完成面试会话。

        Args:
            db: 数据库会话
            session: 面试会话

        Returns:
            更新后的面试会话
        """
        from datetime import datetime

        session.status = "completed"
        session.end_time = datetime.utcnow()

        await db.commit()
        await db.refresh(session)

        logger.info(
            "Interview session completed",
            extra={"session_id": session.id},
        )

        return session

    @staticmethod
    async def abort(db: AsyncSession, session: InterviewSession) -> InterviewSession:
        """放弃面试会话。

        Args:
            db: 数据库会话
            session: 面试会话

        Returns:
            更新后的面试会话
        """
        from datetime import datetime

        session.status = "aborted"
        session.end_time = datetime.utcnow()

        await db.commit()
        await db.refresh(session)

        logger.info(
            "Interview session aborted",
            extra={"session_id": session.id},
        )

        return session


class InterviewMessageService:
    """面试消息服务。"""

    @staticmethod
    async def create(
        db: AsyncSession,
        session_id: int,
        role: str,
        content: str,
        round: str,
        meta_info: Optional[dict] = None,
    ) -> InterviewMessage:
        """创建面试消息。

        Args:
            db: 数据库会话
            session_id: 会话 ID
            role: 消息角色
            content: 消息内容
            round: 所属轮次
            meta_info: 元数据

        Returns:
            创建的面试消息
        """
        message = InterviewMessage(
            session_id=session_id,
            role=role,
            content=content,
            round=round,
            meta_info=meta_info,
        )

        db.add(message)
        await db.commit()
        await db.refresh(message)

        return message

    @staticmethod
    async def list_by_session(
        db: AsyncSession, session_id: int
    ) -> list[InterviewMessage]:
        """获取会话的消息列表。

        Args:
            db: 数据库会话
            session_id: 会话 ID

        Returns:
            消息列表
        """
        result = await db.execute(
            select(InterviewMessage)
            .where(InterviewMessage.session_id == session_id)
            .order_by(InterviewMessage.id)
        )
        return list(result.scalars().all())


class InterviewEvaluationService:
    """面试评价服务。"""

    @staticmethod
    async def create(
        db: AsyncSession,
        session_id: int,
        evaluation_data: dict,
    ) -> InterviewEvaluation:
        """创建面试评价。

        Args:
            db: 数据库会话
            session_id: 会话 ID
            evaluation_data: 评价数据

        Returns:
            创建的面试评价
        """
        evaluation = InterviewEvaluation(
            session_id=session_id,
            overall_score=evaluation_data["overall_score"],
            dimension_scores=evaluation_data["dimension_scores"],
            summary=evaluation_data["summary"],
            dimension_details=evaluation_data["dimension_details"],
            suggestions=evaluation_data["suggestions"],
            recommended_questions=evaluation_data["recommended_questions"],
        )

        db.add(evaluation)
        await db.commit()
        await db.refresh(evaluation)

        logger.info(
            "Interview evaluation created",
            extra={"session_id": session_id, "score": evaluation.overall_score},
        )

        return evaluation

    @staticmethod
    async def get_by_session_id(
        db: AsyncSession, session_id: int
    ) -> Optional[InterviewEvaluation]:
        """根据会话 ID 获取评价。

        Args:
            db: 数据库会话
            session_id: 会话 ID

        Returns:
            面试评价，如果不存在返回 None
        """
        result = await db.execute(
            select(InterviewEvaluation).where(
                InterviewEvaluation.session_id == session_id
            )
        )
        return result.scalar_one_or_none()


class PromptService:
    """Prompt 服务。"""

    # 面试官风格 Prompt
    STYLE_PROMPTS = {
        "strict": """你是一位严格专业的面试官，来自大厂技术团队。
- 提问直接犀利，不拖泥带水
- 对模糊回答会深入追问
- 保持专业距离感，不闲聊
- 回答不充分时直接指出问题""",
        "gentle": """你是一位温和友善的面试官，像导师一样引导候选人。
- 提问循序渐进，由浅入深
- 给予候选人思考和组织语言的时间
- 回答不完善时会给出提示
- 以鼓励为主，帮助候选人建立信心""",
        "pressure": """你是一位压力面试官，目的是测试候选人的抗压能力。
- 提问快速连续，节奏紧凑
- 会质疑候选人的回答和观点
- 制造一定的紧张氛围
- 挑剔严格，找出所有不足之处""",
    }

    # 模式说明
    MODE_INSTRUCTIONS = {
        "basic_knowledge": "重点考察基础知识：算法、数据结构、计算机网络、操作系统等",
        "project_deep_dive": "深入挖掘项目经历：项目背景、技术选型、个人贡献、遇到的问题和解决方案",
        "coding": "考察编程能力：算法实现、代码质量、边界条件处理",
        "technical_deep_dive": "深入考察技术能力：架构设计、技术选型、性能优化、故障排查",
        "technical_qa": "技术问答：框架原理、设计模式、分布式系统、微服务架构",
        "scenario_design": "场景设计题：系统设计、功能设计、技术方案选型",
    }

    @classmethod
    def build_system_prompt(
        cls,
        session: InterviewSession,
        resume: Resume,
    ) -> str:
        """构建系统 Prompt。

        Args:
            session: 面试会话
            resume: 简历

        Returns:
            系统 Prompt
        """
        style_prompt = cls.STYLE_PROMPTS.get(
            session.interviewer_style, cls.STYLE_PROMPTS["strict"]
        )
        mode_instruction = cls.MODE_INSTRUCTIONS.get(
            session.interview_mode, ""
        )

        # 构建简历内容摘要
        resume_summary = cls._build_resume_summary(resume)

        prompt = f"""你是一位经验丰富的{session.company_name}技术面试官，正在面试{session.position_name}岗位。

## 面试信息
- 招聘类型: {"校招" if session.recruitment_type == "campus" else "社招"}
- 面试模式: {mode_instruction}
- 面试官风格: {session.interviewer_style}

## 岗位描述
{session.job_description}

## 候选人简历
{resume_summary}

## 你的角色设定
{style_prompt}

## 面试流程
当前轮次: {session.current_round}
1. opening: 开场白，自我介绍和流程说明（1-2句话）
2. self_intro: 请候选人自我介绍，针对性追问
3. qa: 核心问答环节，根据面试模式提问（5-8个问题）
4. reverse_qa: 反问环节，让候选人提问
5. closing: 结束面试

## 要求
- 每次只问一个问题
- 根据候选人回答进行追问
- 保持面试官角色，不要跳出角色
- 回答要简洁，不要长篇大论
- 不要一次性问多个问题
"""
        return prompt

    @classmethod
    def _build_resume_summary(cls, resume: Resume) -> str:
        """构建简历摘要。

        Args:
            resume: 简历

        Returns:
            简历摘要文本
        """
        parts = []

        # 基本信息
        parts.append(f"姓名: {resume.full_name}")
        if resume.target_position:
            parts.append(f"求职意向: {resume.target_position}")

        # 教育经历
        if resume.educations:
            parts.append("\n教育经历:")
            for edu in resume.educations:
                parts.append(
                    f"- {edu.school_name}, {edu.major}, {edu.degree}"
                )

        # 工作经历
        if resume.work_experiences:
            parts.append("\n工作经历:")
            for work in resume.work_experiences:
                parts.append(f"- {work.company_name}, {work.position}")
                if work.achievements:
                    parts.append(f"  成果: {work.achievements}")

        # 项目经历
        if resume.projects:
            parts.append("\n项目经历:")
            for proj in resume.projects:
                parts.append(f"- {proj.project_name}: {proj.description}")

        # 技能
        if resume.skills:
            parts.append("\n技能:")
            for skill in resume.skills:
                parts.append(f"- {skill.skill_name} ({skill.proficiency})")

        return "\n".join(parts)

    @classmethod
    def build_evaluation_prompt(
        cls,
        session: InterviewSession,
        messages: list[InterviewMessage],
    ) -> str:
        """构建评价 Prompt。

        Args:
            session: 面试会话
            messages: 消息列表

        Returns:
            评价 Prompt
        """
        # 构建对话记录
        conversation = []
        for msg in messages:
            role = "面试官" if msg.role == "ai" else "候选人"
            conversation.append(f"{role}: {msg.content}")

        conversation_text = "\n".join(conversation)

        prompt = f"""请对以下面试进行评价：

## 面试信息
- 岗位: {session.position_name}
- 招聘类型: {"校招" if session.recruitment_type == "campus" else "社招"}
- 面试模式: {session.interview_mode}

## 完整对话记录
{conversation_text}

## 评价要求
请从以下维度进行评价（每项 0-100 分）：
1. communication: 沟通能力 - 表达清晰度、逻辑性
2. technical_depth: 技术深度 - 知识掌握程度、原理理解
3. project_experience: 项目经验 - 项目描述、技术亮点
4. adaptability: 应变能力 - 追问回答、思维灵活性
5. job_match: 岗位匹配度 - 与目标岗位的匹配程度

请按以下 JSON 格式输出：
{{
  "overall_score": 85,
  "dimension_scores": {{
    "communication": 85,
    "technical_depth": 78,
    "project_experience": 82,
    "adaptability": 80,
    "job_match": 88
  }},
  "summary": "总体评价...",
  "dimension_details": {{
    "communication": "详细评价...",
    "technical_depth": "详细评价...",
    "project_experience": "详细评价...",
    "adaptability": "详细评价...",
    "job_match": "详细评价..."
  }},
  "suggestions": ["建议1", "建议2", ...],
  "recommended_questions": ["推荐练习1", ...]
}}

注意：只输出 JSON，不要输出其他内容。
"""
        return prompt
