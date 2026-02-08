"""服务模块。

导出所有服务类。
"""

from app.services.auth_service import AuthService
from app.services.resume_service import ResumeService

__all__ = ["AuthService", "ResumeService"]
