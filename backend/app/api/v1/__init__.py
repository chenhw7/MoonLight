"""API v1 路由模块。

导出所有 v1 版本的 API 路由。
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.resume import router as resume_router
from app.api.v1.upload import router as upload_router

router = APIRouter(prefix="/v1")
router.include_router(auth_router)
router.include_router(resume_router)
router.include_router(upload_router)

__all__ = ["router"]
