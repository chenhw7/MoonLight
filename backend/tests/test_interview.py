"""AI 面试官模块单元测试。

测试面试相关的 API 端点和业务逻辑。
"""

import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interview import InterviewSession, InterviewMessage, InterviewEvaluation
from app.models.resume import Resume
from app.models.user import User
from app.schemas.interview import (
    InterviewSessionCreate,
    InterviewMessageCreate,
    InterviewEvaluationCreate,
)
from app.services.interview_service import InterviewService


class TestInterviewSession:
    """面试会话测试类。"""

    @pytest.fixture
    async def test_user(self, db_session: AsyncSession) -> User:
        """创建测试用户。"""
        from app.core.security import hash_password

        user = User(
            email="interview_test@example.com",
            username="interview_test_user",
            hashed_password=hash_password("TestPass123"),
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.flush()
        return user

    @pytest.fixture
    async def test_resume(self, db_session: AsyncSession, test_user: User) -> Resume:
        """创建测试简历。"""
        resume = Resume(
            user_id=test_user.id,
            title="测试简历",
            full_name="测试用户",
            resume_type="campus",
            current_city="北京",
            phone="13800138000",
            email="test@example.com",
            content={"name": "测试用户"},
        )
        db_session.add(resume)
        await db_session.flush()
        return resume

    @pytest.fixture
    async def test_ai_config(self, db_session: AsyncSession, test_user: User):
        """创建测试 AI 配置。"""
        from app.models.ai_config import AIConfig

        config = AIConfig(
            user_id=test_user.id,
            provider="openai",
            base_url="https://api.openai.com/v1",
            api_key="test-api-key",
            chat_model="gpt-4",
            temperature=0.7,
            max_tokens=4096,
        )
        db_session.add(config)
        await db_session.flush()
        return config

    @pytest.mark.asyncio
    async def test_create_session(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_resume: Resume,
        test_ai_config,
    ) -> None:
        """测试创建面试会话。"""
        interview_service = InterviewService(db_session)

        session_data = InterviewSessionCreate(
            resume_id=test_resume.id,
            company_name="测试公司",
            position_name="测试岗位",
            job_description="测试岗位描述",
            recruitment_type="campus",
            interview_mode="basic_knowledge",
            interviewer_style="strict",
        )

        session = await interview_service.create_session(
            user_id=test_user.id,
            session_data=session_data,
            ai_config=test_ai_config,
        )

        assert session.user_id == test_user.id
        assert session.resume_id == test_resume.id
        assert session.company_name == "测试公司"
        assert session.position_name == "测试岗位"
        assert session.status == "ongoing"
        assert session.current_round == "opening"
        assert session.model_config is not None

    @pytest.mark.asyncio
    async def test_get_session(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_resume: Resume,
        test_ai_config,
    ) -> None:
        """测试获取面试会话。"""
        interview_service = InterviewService(db_session)

        # 创建会话
        session_data = InterviewSessionCreate(
            resume_id=test_resume.id,
            company_name="测试公司",
            position_name="测试岗位",
            job_description="测试岗位描述",
            recruitment_type="campus",
            interview_mode="basic_knowledge",
            interviewer_style="strict",
        )

        created_session = await interview_service.create_session(
            user_id=test_user.id,
            session_data=session_data,
            ai_config=test_ai_config,
        )

        # 获取会话
        session = await interview_service.get_session(
            session_id=created_session.id,
            user_id=test_user.id,
        )

        assert session is not None
        assert session.id == created_session.id

    @pytest.mark.asyncio
    async def test_get_session_not_found(
        self, db_session: AsyncSession, test_user: User
    ) -> None:
        """测试获取不存在的会话。"""
        interview_service = InterviewService(db_session)

        session = await interview_service.get_session(
            session_id=99999,
            user_id=test_user.id,
        )

        assert session is None

    @pytest.mark.asyncio
    async def test_list_sessions(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_resume: Resume,
        test_ai_config,
    ) -> None:
        """测试列表面试会话。"""
        interview_service = InterviewService(db_session)

        # 创建多个会话
        for i in range(3):
            session_data = InterviewSessionCreate(
                resume_id=test_resume.id,
                company_name=f"测试公司{i}",
                position_name=f"测试岗位{i}",
                job_description="测试岗位描述",
                recruitment_type="campus",
                interview_mode="basic_knowledge",
                interviewer_style="strict",
            )
            await interview_service.create_session(
                user_id=test_user.id,
                session_data=session_data,
                ai_config=test_ai_config,
            )

        # 列表面试
        sessions = await interview_service.list_sessions(
            user_id=test_user.id,
            skip=0,
            limit=10,
        )

        assert len(sessions) == 3


class TestInterviewMessage:
    """面试消息测试类。"""

    @pytest.fixture
    async def test_user(self, db_session: AsyncSession) -> User:
        """创建测试用户。"""
        from app.core.security import hash_password

        user = User(
            email="msg_test@example.com",
            username="msg_test_user",
            hashed_password=hash_password("TestPass123"),
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.flush()
        return user

    @pytest.fixture
    async def test_resume(self, db_session: AsyncSession, test_user: User) -> Resume:
        """创建测试简历。"""
        resume = Resume(
            user_id=test_user.id,
            title="测试简历",
            full_name="测试用户",
            resume_type="campus",
            current_city="北京",
            phone="13800138000",
            email="test@example.com",
            content={"name": "测试用户"},
        )
        db_session.add(resume)
        await db_session.flush()
        return resume

    @pytest.fixture
    async def test_session(
        self, db_session: AsyncSession, test_user: User, test_resume: Resume
    ) -> InterviewSession:
        """创建测试会话。"""
        session = InterviewSession(
            user_id=test_user.id,
            resume_id=test_resume.id,
            company_name="测试公司",
            position_name="测试岗位",
            job_description="测试岗位描述",
            recruitment_type="campus",
            interview_mode="basic_knowledge",
            interviewer_style="strict",
            status="ongoing",
            current_round="qa",
            model_config={"provider": "openai", "model": "gpt-4"},
        )
        db_session.add(session)
        await db_session.flush()
        return session

    @pytest.mark.asyncio
    async def test_create_message(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_session: InterviewSession,
    ) -> None:
        """测试创建消息。"""
        from app.services.interview_message_service import InterviewMessageService

        message_service = InterviewMessageService(db_session)

        message_data = InterviewMessageCreate(
            role="user",
            content="你好",
            round="qa",
        )

        message = await message_service.create_message(
            session_id=test_session.id,
            user_id=test_user.id,
            message_data=message_data,
        )

        assert message.session_id == test_session.id
        assert message.role == "user"
        assert message.content == "你好"
        assert message.round == "qa"

    @pytest.mark.asyncio
    async def test_list_messages(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_session: InterviewSession,
    ) -> None:
        """测试列出消息。"""
        # 创建多条消息
        for i in range(5):
            message = InterviewMessage(
                session_id=test_session.id,
                role="user" if i % 2 == 0 else "assistant",
                content=f"消息内容{i}",
                round="qa",
            )
            db_session.add(message)
        await db_session.flush()

        from app.services.interview_message_service import InterviewMessageService

        message_service = InterviewMessageService(db_session)

        messages = await message_service.list_messages(
            session_id=test_session.id,
            user_id=test_user.id,
        )

        assert len(messages) == 5


class TestInterviewEvaluation:
    """面试评价测试类。"""

    @pytest.fixture
    async def test_user(self, db_session: AsyncSession) -> User:
        """创建测试用户。"""
        from app.core.security import hash_password

        user = User(
            email="eval_test@example.com",
            username="eval_test_user",
            hashed_password=hash_password("TestPass123"),
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.flush()
        return user

    @pytest.fixture
    async def test_resume(self, db_session: AsyncSession, test_user: User) -> Resume:
        """创建测试简历。"""
        resume = Resume(
            user_id=test_user.id,
            title="测试简历",
            full_name="测试用户",
            resume_type="campus",
            current_city="北京",
            phone="13800138000",
            email="test@example.com",
            content={"name": "测试用户"},
        )
        db_session.add(resume)
        await db_session.flush()
        return resume

    @pytest.fixture
    async def test_session(
        self, db_session: AsyncSession, test_user: User, test_resume: Resume
    ) -> InterviewSession:
        """创建测试会话。"""
        session = InterviewSession(
            user_id=test_user.id,
            resume_id=test_resume.id,
            company_name="测试公司",
            position_name="测试岗位",
            job_description="测试岗位描述",
            recruitment_type="campus",
            interview_mode="basic_knowledge",
            interviewer_style="strict",
            status="completed",
            current_round="closing",
            model_config={"provider": "openai", "model": "gpt-4"},
        )
        db_session.add(session)
        await db_session.flush()
        return session

    @pytest.mark.asyncio
    async def test_create_evaluation(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_session: InterviewSession,
    ) -> None:
        """测试创建评价。"""
        from app.services.interview_evaluation_service import InterviewEvaluationService

        eval_service = InterviewEvaluationService(db_session)

        evaluation_data = InterviewEvaluationCreate(
            session_id=test_session.id,
            overall_score=85,
            dimension_scores={
                "communication": 85,
                "technical_depth": 80,
                "project_experience": 90,
                "adaptability": 85,
                "job_match": 85,
            },
            summary="测试评价总结",
            dimension_details={
                "communication": "沟通能力良好",
                "technical_depth": "技术深度尚可",
                "project_experience": "项目经验丰富",
                "adaptability": "应变能力良好",
                "job_match": "岗位匹配度良好",
            },
            suggestions=["建议1", "建议2"],
            recommended_questions=["问题1", "问题2"],
        )

        evaluation = await eval_service.create_evaluation(
            user_id=test_user.id,
            evaluation_data=evaluation_data,
        )

        assert evaluation.session_id == test_session.id
        assert evaluation.overall_score == 85
        assert evaluation.dimension_scores["communication"] == 85

    @pytest.mark.asyncio
    async def test_get_evaluation(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_session: InterviewSession,
    ) -> None:
        """测试获取评价。"""
        # 创建评价
        evaluation = InterviewEvaluation(
            session_id=test_session.id,
            overall_score=85,
            dimension_scores={
                "communication": 85,
                "technical_depth": 80,
                "project_experience": 90,
                "adaptability": 85,
                "job_match": 85,
            },
            summary="测试评价总结",
            dimension_details={
                "communication": "沟通能力良好",
                "technical_depth": "技术深度尚可",
                "project_experience": "项目经验丰富",
                "adaptability": "应变能力良好",
                "job_match": "岗位匹配度良好",
            },
            suggestions=["建议1", "建议2"],
            recommended_questions=["问题1", "问题2"],
        )
        db_session.add(evaluation)
        await db_session.flush()

        from app.services.interview_evaluation_service import InterviewEvaluationService

        eval_service = InterviewEvaluationService(db_session)

        result = await eval_service.get_evaluation(
            session_id=test_session.id,
            user_id=test_user.id,
        )

        assert result is not None
        assert result.overall_score == 85


class TestInterviewRoundTransition:
    """面试轮次切换测试类。"""

    def test_round_order(self) -> None:
        """测试轮次顺序。"""
        from app.services.interview_message_service import ROUND_ORDER

        assert ROUND_ORDER == ["opening", "self_intro", "qa", "reverse_qa", "closing"]

    def test_get_next_round(self) -> None:
        """测试获取下一轮次。"""
        from app.services.interview_message_service import InterviewMessageService

        # 测试正常切换
        assert InterviewMessageService.get_next_round("opening") == "self_intro"
        assert InterviewMessageService.get_next_round("self_intro") == "qa"
        assert InterviewMessageService.get_next_round("qa") == "reverse_qa"
        assert InterviewMessageService.get_next_round("reverse_qa") == "closing"

        # 测试最后一轮
        assert InterviewMessageService.get_next_round("closing") is None

    def test_can_transition_to_next_round(self) -> None:
        """测试是否可以切换到下一轮。"""
        from app.services.interview_message_service import InterviewMessageService

        # opening 轮次可以切换（消息数 >= 2）
        assert InterviewMessageService.can_transition_to_next_round("opening", 2) is True
        assert InterviewMessageService.can_transition_to_next_round("opening", 1) is False

        # qa 轮次可以切换（消息数 >= 6）
        assert InterviewMessageService.can_transition_to_next_round("qa", 6) is True
        assert InterviewMessageService.can_transition_to_next_round("qa", 5) is False

        # closing 轮次不能切换
        assert InterviewMessageService.can_transition_to_next_round("closing", 10) is False
