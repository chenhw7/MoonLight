"""AI 面试官集成测试。

测试完整的面试流程：
1. 创建面试会话
2. 发送消息
3. 轮次切换
4. 完成面试
5. 生成评价
"""

import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.resume import Resume
from app.models.ai_config import AIConfig
from app.models.interview import InterviewSession, InterviewMessage, InterviewEvaluation
from app.core.security import create_access_token, hash_password


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """创建测试用户。"""
    user = User(
        email="integration_test@example.com",
        username="integration_test_user",
        hashed_password=hash_password("TestPass123"),
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture
async def test_resume(db_session: AsyncSession, test_user: User) -> Resume:
    """创建测试简历。"""
    resume = Resume(
        user_id=test_user.id,
        title="集成测试简历",
        full_name="测试用户",
        resume_type="campus",
        current_city="北京",
        phone="13800138000",
        email="test@example.com",
        content={
            "basic_info": {"name": "测试用户", "school": "测试大学"},
            "education": [{"school": "测试大学", "major": "计算机科学"}],
            "projects": [{"name": "测试项目", "description": "项目描述"}],
        },
    )
    db_session.add(resume)
    await db_session.flush()
    return resume


@pytest.fixture
async def test_ai_config(db_session: AsyncSession, test_user: User) -> AIConfig:
    """创建测试 AI 配置。"""
    config = AIConfig(
        user_id=test_user.id,
        provider="openai",
        base_url="https://api.openai.com/v1",
        api_key="test-api-key",
        chat_model="gpt-4",
        reasoning_model="o1",
        vision_model="gpt-4-vision",
        voice_model="tts-1",
        temperature=0.7,
        max_tokens=4096,
    )
    db_session.add(config)
    await db_session.flush()
    return config


@pytest.fixture
async def auth_headers(test_user: User) -> dict:
    """创建认证头。"""
    token = create_access_token({"sub": str(test_user.id), "email": test_user.email})
    return {"Authorization": f"Bearer {token}"}


class TestInterviewFlow:
    """完整面试流程集成测试。"""

    @pytest.mark.asyncio
    async def test_complete_interview_flow(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        test_resume: Resume,
        test_ai_config: AIConfig,
        auth_headers: dict,
    ) -> None:
        """测试完整的面试流程。"""

        # 步骤 1: 创建面试会话
        create_response = await client.post(
            "/api/v1/interviews",
            headers=auth_headers,
            json={
                "resume_id": test_resume.id,
                "company_name": "字节跳动",
                "position_name": "后端开发工程师",
                "job_description": "负责后端服务开发",
                "recruitment_type": "campus",
                "interview_mode": "basic_knowledge",
                "interviewer_style": "strict",
            },
        )

        assert create_response.status_code == 201
        session_data = create_response.json()
        session_id = session_data["id"]
        assert session_data["status"] == "ongoing"
        assert session_data["current_round"] == "opening"
        assert session_data["company_name"] == "字节跳动"

        # 步骤 2: 获取会话详情
        get_response = await client.get(
            f"/api/v1/interviews/{session_id}",
            headers=auth_headers,
        )

        assert get_response.status_code == 200
        assert get_response.json()["id"] == session_id

        # 步骤 3: 发送用户消息
        message_response = await client.post(
            f"/api/v1/interviews/{session_id}/messages",
            headers=auth_headers,
            json={
                "role": "user",
                "content": "你好，我是测试用户",
                "round": "opening",
            },
        )

        assert message_response.status_code == 201
        message_data = message_response.json()
        assert message_data["role"] == "user"
        assert message_data["content"] == "你好，我是测试用户"

        # 步骤 4: 获取消息列表
        messages_response = await client.get(
            f"/api/v1/interviews/{session_id}/messages",
            headers=auth_headers,
        )

        assert messages_response.status_code == 200
        messages = messages_response.json()
        assert len(messages) >= 1  # 至少包含用户发送的消息

        # 步骤 5: 获取面试进度
        progress_response = await client.get(
            f"/api/v1/interviews/{session_id}/progress",
            headers=auth_headers,
        )

        assert progress_response.status_code == 200
        progress = progress_response.json()
        assert "current_round" in progress
        assert "round_index" in progress
        assert "total_rounds" in progress

        # 步骤 6: 切换到下一轮（如果满足条件）
        next_round_response = await client.post(
            f"/api/v1/interviews/{session_id}/next-round",
            headers=auth_headers,
        )

        # 可能返回 200（成功切换）或 400（不满足切换条件）
        assert next_round_response.status_code in [200, 400]

        # 步骤 7: 完成面试
        complete_response = await client.put(
            f"/api/v1/interviews/{session_id}/complete",
            headers=auth_headers,
        )

        assert complete_response.status_code == 200
        completed_session = complete_response.json()
        assert completed_session["status"] == "completed"
        assert completed_session["end_time"] is not None

        # 步骤 8: 创建评价（模拟 AI 评价）
        evaluation_response = await client.post(
            f"/api/v1/interviews/{session_id}/evaluation",
            headers=auth_headers,
            json={
                "overall_score": 85,
                "dimension_scores": {
                    "communication": 85,
                    "technical_depth": 80,
                    "project_experience": 90,
                    "adaptability": 85,
                    "job_match": 85,
                },
                "summary": "面试表现良好，技术基础扎实",
                "dimension_details": {
                    "communication": "沟通能力良好，表达清晰",
                    "technical_depth": "技术深度尚可，需要加强",
                    "project_experience": "项目经验丰富，有实际成果",
                    "adaptability": "应变能力良好",
                    "job_match": "与岗位匹配度良好",
                },
                "suggestions": [
                    "建议深入学习分布式系统",
                    "建议加强算法练习",
                ],
                "recommended_questions": [
                    "Redis 持久化机制",
                    "MySQL 索引优化",
                ],
            },
        )

        assert evaluation_response.status_code == 201
        evaluation = evaluation_response.json()
        assert evaluation["overall_score"] == 85
        assert evaluation["dimension_scores"]["communication"] == 85

        # 步骤 9: 获取评价
        get_evaluation_response = await client.get(
            f"/api/v1/interviews/{session_id}/evaluation",
            headers=auth_headers,
        )

        assert get_evaluation_response.status_code == 200
        assert get_evaluation_response.json()["overall_score"] == 85

        # 步骤 10: 列表面试历史
        list_response = await client.get(
            "/api/v1/interviews",
            headers=auth_headers,
            params={"skip": 0, "limit": 10},
        )

        assert list_response.status_code == 200
        list_data = list_response.json()
        assert list_data["total"] >= 1
        assert any(item["id"] == session_id for item in list_data["items"])


class TestInterviewErrorHandling:
    """面试错误处理集成测试。"""

    @pytest.mark.asyncio
    async def test_create_session_without_resume(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ) -> None:
        """测试使用不存在的简历创建会话。"""
        response = await client.post(
            "/api/v1/interviews",
            headers=auth_headers,
            json={
                "resume_id": 99999,  # 不存在的简历ID
                "company_name": "测试公司",
                "position_name": "测试岗位",
                "job_description": "测试描述",
                "recruitment_type": "campus",
                "interview_mode": "basic_knowledge",
                "interviewer_style": "strict",
            },
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_access_other_user_session(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
    ) -> None:
        """测试访问其他用户的面试会话。"""
        # 创建另一个用户
        other_user = User(
            email="other@example.com",
            username="other_user",
            hashed_password=hash_password("TestPass123"),
            is_active=True,
            is_verified=True,
        )
        db_session.add(other_user)
        await db_session.flush()

        # 创建另一个用户的简历
        other_resume = Resume(
            user_id=other_user.id,
            title="其他用户简历",
            full_name="其他用户",
            resume_type="campus",
            current_city="上海",
            phone="13900139000",
            email="other@example.com",
            content={"name": "其他用户"},
        )
        db_session.add(other_resume)
        await db_session.flush()

        # 创建另一个用户的会话
        other_session = InterviewSession(
            user_id=other_user.id,
            resume_id=other_resume.id,
            company_name="其他公司",
            position_name="其他岗位",
            job_description="其他描述",
            recruitment_type="campus",
            interview_mode="basic_knowledge",
            interviewer_style="strict",
            status="ongoing",
            current_round="opening",
            model_config={},
        )
        db_session.add(other_session)
        await db_session.flush()

        # 使用原用户尝试访问其他用户的会话
        token = create_access_token({"sub": str(test_user.id), "email": test_user.email})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(
            f"/api/v1/interviews/{other_session.id}",
            headers=headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_send_message_to_completed_session(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        test_resume: Resume,
        auth_headers: dict,
    ) -> None:
        """测试向已完成的会话发送消息。"""
        # 创建已完成的会话
        session = InterviewSession(
            user_id=test_user.id,
            resume_id=test_resume.id,
            company_name="测试公司",
            position_name="测试岗位",
            job_description="测试描述",
            recruitment_type="campus",
            interview_mode="basic_knowledge",
            interviewer_style="strict",
            status="completed",
            current_round="closing",
            end_time=datetime.now(timezone.utc),
            model_config={},
        )
        db_session.add(session)
        await db_session.flush()

        # 尝试发送消息
        response = await client.post(
            f"/api/v1/interviews/{session.id}/messages",
            headers=auth_headers,
            json={
                "role": "user",
                "content": "测试消息",
                "round": "closing",
            },
        )

        assert response.status_code == 400


class TestInterviewAuthorization:
    """面试授权集成测试。"""

    @pytest.mark.asyncio
    async def test_access_without_auth(
        self,
        client: AsyncClient,
    ) -> None:
        """测试未授权访问。"""
        # 不带认证头访问
        response = await client.get("/api/v1/interviews")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_access_with_invalid_token(
        self,
        client: AsyncClient,
    ) -> None:
        """测试使用无效令牌访问。"""
        headers = {"Authorization": "Bearer invalid_token"}

        response = await client.get("/api/v1/interviews", headers=headers)

        assert response.status_code == 401
