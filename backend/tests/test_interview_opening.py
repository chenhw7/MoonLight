"""AI面试开场白功能测试。

测试面试会话创建时自动生成开场白消息的功能。
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interview import InterviewSession, InterviewMessage
from app.models.resume import Resume
from app.models.user import User
from app.models.ai_config import AIConfig
from app.schemas.interview import InterviewSessionCreate
from app.services.interview_service import InterviewSessionService, InterviewMessageService


class TestInterviewOpening:
    """面试开场白测试类。"""

    @pytest.fixture
    async def test_user(self, db_session: AsyncSession) -> User:
        """创建测试用户。"""
        from app.core.security import hash_password

        user = User(
            email="opening_test@example.com",
            username="opening_test_user",
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
    async def test_ai_config(self, db_session: AsyncSession, test_user: User) -> AIConfig:
        """创建测试 AI 配置。"""
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
    async def test_create_session_generates_opening_message(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_resume: Resume,
        test_ai_config: AIConfig,
    ) -> None:
        """测试创建面试会话时自动生成开场白消息。"""
        session_data = InterviewSessionCreate(
            resume_id=test_resume.id,
            company_name="测试公司",
            position_name="测试岗位",
            job_description="测试岗位描述",
            recruitment_type="campus",
            interview_mode="basic_knowledge",
            interviewer_style="strict",
        )

        session = await InterviewSessionService.create(
            db_session, test_user.id, session_data, test_ai_config
        )

        # 验证会话创建成功
        assert session.user_id == test_user.id
        assert session.resume_id == test_resume.id
        # 开场白后应自动切换到 self_intro 轮次
        assert session.current_round == "self_intro"

        # 验证开场白消息已生成
        messages = await InterviewMessageService.list_by_session(db_session, session.id)
        assert len(messages) == 1

        opening_message = messages[0]
        assert opening_message.role == "ai"
        # 消息记录在 opening 轮次
        assert opening_message.round == "opening"
        assert opening_message.session_id == session.id
        assert "测试公司" in opening_message.content
        assert "测试岗位" in opening_message.content
        assert opening_message.meta_info.get("is_opening") is True

    @pytest.mark.asyncio
    async def test_opening_message_with_different_styles(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_resume: Resume,
        test_ai_config: AIConfig,
    ) -> None:
        """测试不同面试官风格的开场白内容。"""
        styles = ["strict", "gentle", "pressure"]

        for style in styles:
            session_data = InterviewSessionCreate(
                resume_id=test_resume.id,
                company_name=f"公司_{style}",
                position_name=f"岗位_{style}",
                job_description="测试岗位描述",
                recruitment_type="campus",
                interview_mode="basic_knowledge",
                interviewer_style=style,
            )

            session = await InterviewSessionService.create(
                db_session, test_user.id, session_data, test_ai_config
            )

            messages = await InterviewMessageService.list_by_session(db_session, session.id)
            assert len(messages) == 1

            opening_message = messages[0]
            assert opening_message.role == "ai"
            assert f"公司_{style}" in opening_message.content
            assert f"岗位_{style}" in opening_message.content

            # 验证开场白包含自我介绍引导
            assert "自我介绍" in opening_message.content

    @pytest.mark.asyncio
    async def test_opening_message_content_structure(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_resume: Resume,
        test_ai_config: AIConfig,
    ) -> None:
        """测试开场白内容结构。"""
        session_data = InterviewSessionCreate(
            resume_id=test_resume.id,
            company_name="阿里巴巴",
            position_name="Java开发工程师",
            job_description="测试岗位描述",
            recruitment_type="campus",
            interview_mode="basic_knowledge",
            interviewer_style="gentle",
        )

        session = await InterviewSessionService.create(
            db_session, test_user.id, session_data, test_ai_config
        )

        messages = await InterviewMessageService.list_by_session(db_session, session.id)
        opening_message = messages[0]

        # 验证开场白包含必要元素
        content = opening_message.content
        assert "阿里巴巴" in content
        assert "Java开发工程师" in content
        assert "自我介绍" in content
        assert opening_message.meta_info == {"is_opening": True}

        # 验证轮次已切换到 self_intro
        assert session.current_round == "self_intro"

    @pytest.mark.asyncio
    async def test_opening_to_self_intro_round_transition(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_resume: Resume,
        test_ai_config: AIConfig,
    ) -> None:
        """测试开场白后自动切换到自我介绍轮次。"""
        session_data = InterviewSessionCreate(
            resume_id=test_resume.id,
            company_name="测试公司",
            position_name="测试岗位",
            job_description="测试岗位描述",
            recruitment_type="campus",
            interview_mode="basic_knowledge",
            interviewer_style="strict",
        )

        session = await InterviewSessionService.create(
            db_session, test_user.id, session_data, test_ai_config
        )

        # 验证轮次已从 opening 切换到 self_intro
        assert session.current_round == "self_intro"

        # 验证消息仍记录在 opening 轮次
        messages = await InterviewMessageService.list_by_session(db_session, session.id)
        assert messages[0].round == "opening"

    def test_generate_opening_message_strict_style(self) -> None:
        """测试严格风格开场白生成。"""
        content = InterviewSessionService.generate_opening_message(
            company_name="腾讯",
            position_name="后端开发",
            interviewer_style="strict",
        )

        assert "腾讯" in content
        assert "后端开发" in content
        assert "面试官" in content

    def test_generate_opening_message_gentle_style(self) -> None:
        """测试温和风格开场白生成。"""
        content = InterviewSessionService.generate_opening_message(
            company_name="字节跳动",
            position_name="前端开发",
            interviewer_style="gentle",
        )

        assert "字节跳动" in content
        assert "前端开发" in content
        assert "欢迎" in content

    def test_generate_opening_message_pressure_style(self) -> None:
        """测试压力风格开场白生成。"""
        content = InterviewSessionService.generate_opening_message(
            company_name="美团",
            position_name="算法工程师",
            interviewer_style="pressure",
        )

        assert "美团" in content
        assert "算法工程师" in content
        assert "时间有限" in content or "面试流程" in content

    def test_generate_opening_message_default_style(self) -> None:
        """测试未知风格时使用默认严格风格。"""
        content = InterviewSessionService.generate_opening_message(
            company_name="百度",
            position_name="测试工程师",
            interviewer_style="unknown_style",
        )

        assert "百度" in content
        assert "测试工程师" in content
        # 未知风格应使用默认严格风格模板
        assert "面试官" in content
