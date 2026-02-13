"""仪表盘服务模块。

提供仪表盘数据聚合和计算服务。
"""

from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.interview import InterviewEvaluation, InterviewSession
from app.models.resume import Resume
from app.schemas.dashboard import (
    DashboardData,
    DashboardStats,
    DimensionChangeItem,
    DimensionScores,
    InterviewStats,
    RecentInterviewItem,
    RecentResumeItem,
    ScoreTrendItem,
)

logger = get_logger(__name__)


class DashboardService:
    """仪表盘服务类。"""

    @staticmethod
    async def get_dashboard_data(
        db: AsyncSession, user_id: int
    ) -> DashboardData:
        """获取仪表盘完整数据。

        Args:
            db: 数据库会话
            user_id: 用户 ID

        Returns:
            仪表盘完整数据
        """
        logger.info("Getting dashboard data", extra={"user_id": user_id})

        # 并行获取各项数据
        stats = await DashboardService._get_stats(db, user_id)
        recent_resumes = await DashboardService._get_recent_resumes(db, user_id)
        interview_stats = await DashboardService._get_interview_stats(db, user_id)

        return DashboardData(
            stats=stats,
            recent_resumes=recent_resumes,
            interview_stats=interview_stats,
        )

    @staticmethod
    async def _get_stats(
        db: AsyncSession, user_id: int
    ) -> DashboardStats:
        """获取核心统计数据。

        Args:
            db: 数据库会话
            user_id: 用户 ID

        Returns:
            核心统计数据
        """
        # 简历数量
        resume_count_result = await db.execute(
            select(func.count()).select_from(
                select(Resume).where(Resume.user_id == user_id).subquery()
            )
        )
        resume_count = resume_count_result.scalar() or 0

        # 面试次数（已完成）
        interview_count_result = await db.execute(
            select(func.count()).select_from(
                select(InterviewSession)
                .where(
                    InterviewSession.user_id == user_id,
                    InterviewSession.status == "completed",
                )
                .subquery()
            )
        )
        interview_count = interview_count_result.scalar() or 0

        # 平均分数
        average_score = await DashboardService._get_average_score(db, user_id)

        # 连续练习天数
        streak_days = await DashboardService._calculate_streak_days(db, user_id)

        return DashboardStats(
            resume_count=resume_count,
            interview_count=interview_count,
            average_score=average_score,
            streak_days=streak_days,
        )

    @staticmethod
    async def _get_average_score(
        db: AsyncSession, user_id: int
    ) -> Optional[int]:
        """获取平均面试分数。

        Args:
            db: 数据库会话
            user_id: 用户 ID

        Returns:
            平均分数，如果没有面试记录返回 None
        """
        result = await db.execute(
            select(func.avg(InterviewEvaluation.overall_score))
            .join(InterviewSession)
            .where(
                InterviewSession.user_id == user_id,
                InterviewSession.status == "completed",
            )
        )
        avg = result.scalar()
        return round(avg) if avg else None

    @staticmethod
    async def _calculate_streak_days(
        db: AsyncSession, user_id: int
    ) -> int:
        """计算连续练习天数。

        从最近有面试的日期开始，倒序检查连续天数。
        如果今天没有面试，从昨天开始算。

        Args:
            db: 数据库会话
            user_id: 用户 ID

        Returns:
            连续练习天数
        """
        # 获取所有面试日期（去重，只取日期部分）
        result = await db.execute(
            select(
                func.distinct(
                    func.date(InterviewSession.start_time)
                ).label("interview_date")
            )
            .where(
                InterviewSession.user_id == user_id,
                InterviewSession.status == "completed",
            )
            .order_by("interview_date")
        )
        dates = [row.interview_date for row in result.all()]

        if not dates:
            return 0

        today = datetime.now().date()
        streak = 0
        check_date = today

        # 如果今天没有面试，从昨天开始算
        if check_date not in dates:
            check_date = today - timedelta(days=1)

        # 倒序检查连续天数
        date_set = set(dates)
        while check_date in date_set:
            streak += 1
            check_date -= timedelta(days=1)

        return streak

    @staticmethod
    async def _get_recent_resumes(
        db: AsyncSession, user_id: int, limit: int = 2
    ) -> list[RecentResumeItem]:
        """获取最近编辑的简历。

        Args:
            db: 数据库会话
            user_id: 用户 ID
            limit: 数量限制

        Returns:
            最近编辑的简历列表
        """
        result = await db.execute(
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.updated_at.desc())
            .limit(limit)
        )
        resumes = result.scalars().all()

        return [
            RecentResumeItem(
                id=resume.id,
                resume_name=resume.title or f"简历 #{resume.id}",
                location=resume.target_city,
                updated_at=resume.updated_at,
            )
            for resume in resumes
        ]

    @staticmethod
    async def _get_interview_stats(
        db: AsyncSession, user_id: int
    ) -> InterviewStats:
        """获取面试统计数据。

        Args:
            db: 数据库会话
            user_id: 用户 ID

        Returns:
            面试统计数据
        """
        dimension_scores = await DashboardService._get_dimension_scores(db, user_id)
        recent_interviews = await DashboardService._get_recent_interviews(db, user_id)
        score_trend = await DashboardService._get_score_trend(db, user_id)
        dimension_changes = await DashboardService._get_dimension_changes(db, user_id)
        insight = DashboardService._generate_insight(dimension_changes)

        return InterviewStats(
            dimension_scores=dimension_scores,
            recent_interviews=recent_interviews,
            score_trend=score_trend,
            dimension_changes=dimension_changes,
            insight=insight,
        )

    @staticmethod
    async def _get_dimension_scores(
        db: AsyncSession, user_id: int, limit: int = 3
    ) -> Optional[DimensionScores]:
        """获取最近 N 场面试的维度平均分。

        Args:
            db: 数据库会话
            user_id: 用户 ID
            limit: 面试场次限制

        Returns:
            维度平均分，如果没有足够数据返回 None
        """
        result = await db.execute(
            select(InterviewEvaluation)
            .join(InterviewSession)
            .where(
                InterviewSession.user_id == user_id,
                InterviewSession.status == "completed",
            )
            .order_by(InterviewEvaluation.created_at.desc())
            .limit(limit)
        )
        evaluations = result.scalars().all()

        if not evaluations:
            return None

        # 计算各维度平均
        count = len(evaluations)
        return DimensionScores(
            communication=round(
                sum(e.dimension_scores["communication"] for e in evaluations) / count
            ),
            technical_depth=round(
                sum(e.dimension_scores["technical_depth"] for e in evaluations) / count
            ),
            project_experience=round(
                sum(e.dimension_scores["project_experience"] for e in evaluations) / count
            ),
            adaptability=round(
                sum(e.dimension_scores["adaptability"] for e in evaluations) / count
            ),
            job_match=round(
                sum(e.dimension_scores["job_match"] for e in evaluations) / count
            ),
        )

    @staticmethod
    async def _get_recent_interviews(
        db: AsyncSession, user_id: int, limit: int = 3
    ) -> list[RecentInterviewItem]:
        """获取最近面试列表。

        Args:
            db: 数据库会话
            user_id: 用户 ID
            limit: 数量限制

        Returns:
            最近面试列表
        """
        result = await db.execute(
            select(
                InterviewSession.id,
                InterviewSession.company_name,
                InterviewSession.position_name,
                InterviewEvaluation.overall_score,
                InterviewSession.start_time,
            )
            .join(InterviewEvaluation)
            .where(
                InterviewSession.user_id == user_id,
                InterviewSession.status == "completed",
            )
            .order_by(InterviewSession.start_time.desc())
            .limit(limit)
        )
        rows = result.all()

        return [
            RecentInterviewItem(
                id=row.id,
                company_name=row.company_name,
                position_name=row.position_name,
                overall_score=row.overall_score,
                start_time=row.start_time,
            )
            for row in rows
        ]

    @staticmethod
    async def _get_score_trend(
        db: AsyncSession, user_id: int, limit: int = 10
    ) -> list[ScoreTrendItem]:
        """获取分数趋势。

        Args:
            db: 数据库会话
            user_id: 用户 ID
            limit: 数量限制

        Returns:
            分数趋势列表（时间顺序）
        """
        result = await db.execute(
            select(
                InterviewSession.id,
                InterviewSession.company_name,
                InterviewEvaluation.overall_score,
                InterviewSession.start_time,
            )
            .join(InterviewEvaluation)
            .where(
                InterviewSession.user_id == user_id,
                InterviewSession.status == "completed",
            )
            .order_by(InterviewSession.start_time.asc())  # 时间顺序
            .limit(limit)
        )
        rows = result.all()

        return [
            ScoreTrendItem(
                session_id=row.id,
                company_name=row.company_name,
                overall_score=row.overall_score,
                start_time=row.start_time,
            )
            for row in rows
        ]

    @staticmethod
    async def _get_dimension_changes(
        db: AsyncSession, user_id: int, compare_count: int = 3
    ) -> list[DimensionChangeItem]:
        """获取维度变化。

        对比最近 N 场和前 N 场的平均分。

        Args:
            db: 数据库会话
            user_id: 用户 ID
            compare_count: 对比场次

        Returns:
            维度变化列表
        """
        # 获取所有评价（时间倒序）
        result = await db.execute(
            select(InterviewEvaluation)
            .join(InterviewSession)
            .where(
                InterviewSession.user_id == user_id,
                InterviewSession.status == "completed",
            )
            .order_by(InterviewEvaluation.created_at.desc())
        )
        evaluations = result.scalars().all()

        if len(evaluations) < compare_count * 2:
            # 数据不足，只返回当前值，变化为0
            if not evaluations:
                return []

            # 计算所有数据的平均作为当前值
            current = DashboardService._calc_dimension_avg(evaluations)
            return [
                DimensionChangeItem(
                    key=key,
                    name=name,
                    current=getattr(current, key),
                    previous=getattr(current, key),
                    change=0,
                )
                for key, name in [
                    ("communication", "沟通能力"),
                    ("technical_depth", "技术深度"),
                    ("project_experience", "项目经验"),
                    ("adaptability", "应变能力"),
                    ("job_match", "岗位匹配度"),
                ]
            ]

        # 最近 N 场
        recent = evaluations[:compare_count]
        # 前 N 场
        previous = evaluations[compare_count : compare_count * 2]

        recent_avg = DashboardService._calc_dimension_avg(recent)
        previous_avg = DashboardService._calc_dimension_avg(previous)

        return [
            DimensionChangeItem(
                key=key,
                name=name,
                current=getattr(recent_avg, key),
                previous=getattr(previous_avg, key),
                change=getattr(recent_avg, key) - getattr(previous_avg, key),
            )
            for key, name in [
                ("communication", "沟通能力"),
                ("technical_depth", "技术深度"),
                ("project_experience", "项目经验"),
                ("adaptability", "应变能力"),
                ("job_match", "岗位匹配度"),
            ]
        ]

    @staticmethod
    def _calc_dimension_avg(
        evaluations: list[InterviewEvaluation],
    ) -> DimensionScores:
        """计算维度平均分。

        Args:
            evaluations: 评价列表

        Returns:
            维度平均分
        """
        count = len(evaluations)
        return DimensionScores(
            communication=round(
                sum(e.dimension_scores["communication"] for e in evaluations) / count
            ),
            technical_depth=round(
                sum(e.dimension_scores["technical_depth"] for e in evaluations) / count
            ),
            project_experience=round(
                sum(e.dimension_scores["project_experience"] for e in evaluations) / count
            ),
            adaptability=round(
                sum(e.dimension_scores["adaptability"] for e in evaluations) / count
            ),
            job_match=round(
                sum(e.dimension_scores["job_match"] for e in evaluations) / count
            ),
        )

    @staticmethod
    def _generate_insight(
        dimension_changes: list[DimensionChangeItem],
    ) -> Optional[str]:
        """生成洞察文字。

        Args:
            dimension_changes: 维度变化列表

        Returns:
            洞察文字
        """
        if not dimension_changes:
            return None

        # 找出变化最大的维度
        max_change = max(dimension_changes, key=lambda x: abs(x.change))

        if max_change.change >= 5:
            return f"{max_change.name}提升明显，继续保持！"
        elif max_change.change <= -5:
            return f"{max_change.name}有所下降，建议加强练习。"
        else:
            # 整体稳定
            improvements = [d for d in dimension_changes if d.change > 0]
            if len(improvements) >= 3:
                return "整体表现稳步提升，继续保持！"
            elif len(improvements) >= 1:
                return "整体表现稳定，部分维度有所提升。"
            else:
                return "整体表现稳定，继续加油！"
