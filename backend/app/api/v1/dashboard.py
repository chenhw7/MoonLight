"""仪表盘路由模块。

提供仪表盘数据聚合接口。
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import get_logger
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.common import ResponseModel
from app.schemas.dashboard import DashboardData
from app.services.dashboard_service import DashboardService

logger = get_logger(__name__)

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])


@router.get(
    "",
    response_model=ResponseModel[DashboardData],
    summary="获取仪表盘数据",
    description="获取当前用户的仪表盘完整数据，包括简历统计、面试统计等。",
)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[DashboardData]:
    """获取仪表盘数据。

    Args:
        current_user: 当前用户
        db: 数据库会话

    Returns:
        仪表盘数据
    """
    logger.info("Dashboard API called", extra={"user_id": current_user.id})

    data = await DashboardService.get_dashboard_data(db, current_user.id)

    return ResponseModel(
        code=status.HTTP_200_OK,
        message="success",
        data=data,
    )
