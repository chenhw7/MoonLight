"""AI 客户端模块。

封装 OpenAI 兼容接口的调用，支持流式和非流式响应。
"""

from typing import AsyncGenerator, Optional

import httpx
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionChunk

from app.core.logging import get_logger

logger = get_logger(__name__)


class AIClientError(Exception):
    """AI 客户端错误。"""

    def __init__(self, message: str, original_error: Optional[Exception] = None):
        self.message = message
        self.original_error = original_error
        super().__init__(self.message)


class AIClient:
    """AI 客户端。

    封装 OpenAI 兼容接口的调用，支持：
    - 流式对话 (SSE)
    - 非流式对话
    - 获取模型列表
    """

    def __init__(
        self,
        base_url: str,
        api_key: str,
        timeout: float = 60.0,
    ):
        """初始化 AI 客户端。

        Args:
            base_url: API 基础 URL
            api_key: API 密钥
            timeout: 请求超时时间（秒）
        """
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

        self.client = AsyncOpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
            timeout=httpx.Timeout(timeout),
        )

        logger.info(
            "AI client initialized",
            extra={"base_url": self.base_url, "timeout": timeout},
        )

    async def chat_stream(
        self,
        messages: list[dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """流式对话。

        Args:
            messages: 消息列表
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大 token 数

        Yields:
            生成的文本片段

        Raises:
            AIClientError: 调用失败时
        """
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,  # type: ignore
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )

            async for chunk in stream:
                chunk: ChatCompletionChunk
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error(
                "Chat stream failed",
                extra={
                    "model": model,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            raise AIClientError(f"Chat stream failed: {str(e)}", e)

    async def chat_complete(
        self,
        messages: list[dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """非流式对话。

        Args:
            messages: 消息列表
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大 token 数

        Returns:
            完整的回复文本

        Raises:
            AIClientError: 调用失败时
        """
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,  # type: ignore
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False,
            )

            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content
            return ""

        except Exception as e:
            logger.error(
                "Chat complete failed",
                extra={
                    "model": model,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            raise AIClientError(f"Chat complete failed: {str(e)}", e)

    async def list_models(self) -> list[str]:
        """获取可用模型列表。

        Returns:
            模型 ID 列表

        Raises:
            AIClientError: 调用失败时
        """
        try:
            models = await self.client.models.list()
            return [model.id for model in models.data]

        except Exception as e:
            logger.error(
                "List models failed",
                extra={
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            raise AIClientError(f"List models failed: {str(e)}", e)

    async def test_connection(self) -> bool:
        """测试连接是否可用。

        Returns:
            连接是否成功
        """
        try:
            await self.list_models()
            return True
        except Exception:
            return False


class AIClientFactory:
    """AI 客户端工厂。

    用于创建和管理 AI 客户端实例。
    """

    _instances: dict[str, AIClient] = {}

    @classmethod
    def get_client(
        cls,
        base_url: str,
        api_key: str,
    ) -> AIClient:
        """获取或创建 AI 客户端实例。

        Args:
            base_url: API 基础 URL
            api_key: API 密钥

        Returns:
            AI 客户端实例
        """
        key = f"{base_url}:{api_key[:8]}"

        if key not in cls._instances:
            cls._instances[key] = AIClient(
                base_url=base_url,
                api_key=api_key,
            )

        return cls._instances[key]

    @classmethod
    def clear_cache(cls) -> None:
        """清除客户端缓存。"""
        cls._instances.clear()
