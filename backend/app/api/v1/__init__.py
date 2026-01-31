"""API v1 路由模块。

导出所有 v1 版本的 API 路由。
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router

router = APIRouter(prefix="/v1")
router.include_router(auth_router)

__all__ = ["router"]
