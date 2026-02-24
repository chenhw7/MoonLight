"""语音识别 API 模块.

提供语音转文字接口，支持上传音频文件进行识别。
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.core.exceptions import ValidationError
from app.core.logging import get_logger
from app.services.speech_recognition_service import get_speech_service, SpeechRecognitionService

logger = get_logger(__name__)

router = APIRouter(prefix="/speech", tags=["语音识别"])


class SpeechRecognitionResponse(BaseModel):
    """语音识别响应模型."""

    text: str = Field(..., description="识别出的文字")
    language: str = Field(..., description="检测到的语言")
    duration: float = Field(..., description="音频时长（秒）")
    processing_time: float = Field(..., description="处理时间（秒）")


class SpeechRecognitionRequest(BaseModel):
    """语音识别请求模型（用于 WebSocket 或 JSON 接口）."""

    language: str = Field(default="auto", description="语言代码：zh 中文，en 英文，auto 自动检测")


@router.post(
    "/recognize",
    response_model=SpeechRecognitionResponse,
    summary="语音识别",
    description="上传音频文件进行语音识别，支持中文和英文。",
)
async def recognize_speech(
    audio: UploadFile = File(..., description="音频文件，支持 webm, wav, mp3, m4a 等格式"),
    language: str = "auto",
    speech_service: SpeechRecognitionService = Depends(get_speech_service),
) -> SpeechRecognitionResponse:
    """语音识别接口.

    Args:
        audio: 上传的音频文件
        language: 语言代码，可选值：zh（中文）、en（英文）、auto（自动检测）
        speech_service: 语音识别服务

    Returns:
        语音识别结果

    Raises:
        ValidationError: 音频文件格式不支持或识别失败
    """
    # 验证语言参数
    valid_languages = ["zh", "en", "auto"]
    if language not in valid_languages:
        raise ValidationError(
            f"不支持的语言代码: {language}，支持的语言: {', '.join(valid_languages)}"
        )

    # 验证文件类型
    allowed_extensions = {".webm", ".wav", ".mp3", ".m4a", ".ogg", ".flac"}
    file_ext = f".{audio.filename.split('.')[-1].lower()}" if audio.filename else ""

    if file_ext not in allowed_extensions:
        raise ValidationError(
            f"不支持的音频格式: {file_ext}，支持的格式: {', '.join(allowed_extensions)}"
        )

    try:
        # 读取音频数据
        audio_bytes = await audio.read()

        if len(audio_bytes) == 0:
            raise ValidationError("音频文件为空")

        if len(audio_bytes) > 50 * 1024 * 1024:  # 50MB 限制
            raise ValidationError("音频文件过大，请上传小于 50MB 的文件")

        logger.info(
            "收到语音识别请求",
            filename=audio.filename,
            language=language,
            file_size=len(audio_bytes),
        )

        # 执行语音识别
        result = await speech_service.transcribe(
            audio_bytes=audio_bytes,
            language=language,
            filename=audio.filename,
        )

        return SpeechRecognitionResponse(**result)

    except ValidationError:
        raise
    except Exception as e:
        logger.error("语音识别失败", error=str(e), filename=audio.filename)
        raise ValidationError(f"语音识别失败: {str(e)}")


@router.post(
    "/recognize/en",
    response_model=SpeechRecognitionResponse,
    summary="英文语音识别",
    description="上传音频文件进行英文语音识别（快捷接口）。",
)
async def recognize_english_speech(
    audio: UploadFile = File(..., description="音频文件"),
    speech_service: SpeechRecognitionService = Depends(get_speech_service),
) -> SpeechRecognitionResponse:
    """英文语音识别快捷接口."""
    return await recognize_speech(audio, "en", speech_service)


@router.get(
    "/status",
    summary="服务状态",
    description="检查语音识别服务状态。",
)
async def speech_status() -> dict:
    """检查语音识别服务状态."""
    try:
        # 尝试初始化服务（如果尚未初始化）
        service = await get_speech_service()
        return {
            "status": "ready",
            "model": "base",
            "device": "cpu",
            "compute_type": "int8",
        }
    except Exception as e:
        logger.error("语音识别服务未就绪", error=str(e))
        return {
            "status": "not_ready",
            "error": str(e),
        }
