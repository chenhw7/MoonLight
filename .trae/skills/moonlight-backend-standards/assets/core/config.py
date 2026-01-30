"""
应用配置模块

管理应用的所有配置项
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置类。
    
    从环境变量加载配置
    
    Attributes:
        APP_NAME: 应用名称
        DEBUG: 调试模式
        LOG_LEVEL: 日志级别
        DATABASE_URL: 数据库连接URL
        REDIS_URL: Redis连接URL
        SECRET_KEY: JWT密钥
        ACCESS_TOKEN_EXPIRE_MINUTES: 访问令牌过期时间(分钟)
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )
    
    # 应用配置
    APP_NAME: str = "MoonLight API"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # 数据库配置
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/moonlight"
    
    # Redis 配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # 安全配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS 配置
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # 邮件配置
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@moonlight.com"
    
    @property
    def async_database_url(self) -> str:
        """获取异步数据库URL。"""
        return self.DATABASE_URL.replace(
            "postgresql://", "postgresql+asyncpg://"
        )


@lru_cache()
def get_settings() -> Settings:
    """获取配置实例（单例模式）。
    
    Returns:
        Settings: 应用配置实例
    """
    return Settings()
