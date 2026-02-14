"""AI 配置相关 Schema 模块。

定义 AI 配置相关的 Pydantic 模型，包括请求和响应格式。
"""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class AIConfigBase(BaseModel):
    """AI 配置基础模型。"""

    provider: str = Field(default="openai-compatible", max_length=50)
    base_url: str = Field(..., max_length=500)
    chat_model: str = Field(default="gpt-4", max_length=100)
    reasoning_model: Optional[str] = Field(default=None, max_length=100)
    vision_model: Optional[str] = Field(default=None, max_length=100)
    voice_model: Optional[str] = Field(default=None, max_length=100)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, ge=1, le=8192)

    model_config = ConfigDict(from_attributes=True)


class AIConfigCreate(AIConfigBase):
    """AI 配置创建模型。

    用于创建或更新 AI 配置。
    """

    api_key: str = Field(..., min_length=1, max_length=500)

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: str) -> str:
        """验证 base_url 格式。"""
        if not v.startswith(("http://", "https://")):
            raise ValueError("base_url 必须以 http:// 或 https:// 开头")
        return v.rstrip("/")


class AIConfigUpdate(BaseModel):
    """AI 配置更新模型。

    用于部分更新 AI 配置。
    """

    provider: Optional[str] = Field(default=None, max_length=50)
    base_url: Optional[str] = Field(default=None, max_length=500)
    api_key: Optional[str] = Field(default=None, min_length=1, max_length=500)
    chat_model: Optional[str] = Field(default=None, max_length=100)
    reasoning_model: Optional[str] = Field(default=None, max_length=100)
    vision_model: Optional[str] = Field(default=None, max_length=100)
    voice_model: Optional[str] = Field(default=None, max_length=100)
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1, le=8192)

    model_config = ConfigDict(from_attributes=True)


class AIConfigResponse(AIConfigBase):
    """AI 配置响应模型。

    用于返回 AI 配置信息（不包含 api_key）。
    """

    id: int
    user_id: int
    api_key_masked: str = Field(
        ..., description="脱敏后的 API Key，如 sk-****1234"
    )

    model_config = ConfigDict(from_attributes=True)

    @field_validator("api_key_masked", mode="before")
    @classmethod
    def mask_api_key(cls, v: Optional[str]) -> str:
        """脱敏 API Key。"""
        if not v:
            return ""
        if len(v) <= 8:
            return "****"
        return f"{v[:4]}****{v[-4:]}"


class AIConfigTestRequest(BaseModel):
    """AI 配置测试请求模型。"""

    base_url: str = Field(..., max_length=500)
    api_key: str = Field(..., min_length=1, max_length=500)

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: str) -> str:
        """验证 base_url 格式。"""
        if not v.startswith(("http://", "https://")):
            raise ValueError("base_url 必须以 http:// 或 https:// 开头")
        return v.rstrip("/")


class AIConfigTestResponse(BaseModel):
    """AI 配置测试响应模型。"""

    success: bool
    message: str
    models: list[str] = Field(default_factory=list)


class ModelListResponse(BaseModel):
    """模型列表响应模型。"""

    models: list[str]
