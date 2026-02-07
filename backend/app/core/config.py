"""应用配置模块。

提供统一的配置管理，支持从环境变量加载配置。
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置类。

    所有配置项都可以通过环境变量覆盖。
    环境变量名自动转换为大写，使用下划线分隔。

    Attributes:
        app_env: 应用环境 (development/production)
        app_name: 应用名称
        app_version: 应用版本
        debug: 是否开启调试模式
        database_url: 数据库连接 URL
        redis_url: Redis 连接 URL
        secret_key: JWT 密钥
        access_token_expire_minutes: 访问令牌过期时间（分钟）
        refresh_token_expire_days: 刷新令牌过期时间（天）
        rate_limit_per_minute: 每分钟请求限制
        verification_code_expire_minutes: 验证码过期时间（分钟）
        verification_code_cooldown_seconds: 验证码发送冷却时间（秒）
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: str = "development"
    app_name: str = "MoonLight Backend"
    app_version: str = "1.0.0"
    debug: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:15432/moonlight"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Security
    secret_key: str = "your-secret-key-here-change-in-production"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Rate Limiting
    rate_limit_per_minute: int = 60
    verification_code_expire_minutes: int = 10
    verification_code_cooldown_seconds: int = 60

    # Email (QQ邮箱SMTP)
    email_enabled: bool = True
    email_smtp_host: str = "smtp.qq.com"
    email_smtp_port: int = 465
    email_username: str = ""
    email_password: str = ""  # QQ邮箱授权码
    email_sender: str = ""

    @property
    def is_development(self) -> bool:
        """检查是否为开发环境。"""
        return self.app_env.lower() == "development"

    @property
    def is_production(self) -> bool:
        """检查是否为生产环境。"""
        return self.app_env.lower() == "production"


@lru_cache()
def get_settings() -> Settings:
    """获取应用配置实例。

    使用 lru_cache 确保配置只被加载一次。

    Returns:
        Settings: 应用配置实例

    Example:
        >>> settings = get_settings()
        >>> print(settings.app_name)
        'MoonLight Backend'
    """
    return Settings()
