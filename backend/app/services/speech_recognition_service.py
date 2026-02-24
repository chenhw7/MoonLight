"""语音识别服务模块.

使用 faster-whisper 进行本地语音识别，支持中英文。
"""

import os
import tempfile
from pathlib import Path
from typing import Optional

import structlog

logger = structlog.get_logger()

# 设置国内镜像（在导入 faster_whisper 之前）
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

from faster_whisper import WhisperModel

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent.parent
MODELS_DIR = PROJECT_ROOT / "models"

# 默认模型配置
DEFAULT_MODEL_NAME = "base"
LOCAL_MODEL_PATH = MODELS_DIR / f"faster-whisper-{DEFAULT_MODEL_NAME}"


def get_model_path() -> str:
    """获取模型路径.

    优先使用本地模型，如果不存在则使用模型名称（自动下载）.

    Returns:
        模型路径或模型名称
    """
    if LOCAL_MODEL_PATH.exists():
        logger.info(f"使用本地模型: {LOCAL_MODEL_PATH}")
        return str(LOCAL_MODEL_PATH)
    else:
        logger.info(f"本地模型不存在，使用在线模型: {DEFAULT_MODEL_NAME}")
        return DEFAULT_MODEL_NAME


class SpeechRecognitionService:
    """语音识别服务.

    使用 faster-whisper base 模型，CPU + INT8 量化模式，
    适合无 GPU 环境，兼顾速度和准确率。

    支持本地模型和在线模型两种方式：
    1. 如果 models/faster-whisper-base/ 目录存在，使用本地模型
    2. 否则从 HuggingFace 自动下载（需要网络）
    """

    _instance: Optional["SpeechRecognitionService"] = None
    _model: Optional[WhisperModel] = None

    def __new__(cls) -> "SpeechRecognitionService":
        """单例模式."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        """初始化语音识别服务."""
        if self._model is not None:
            return

        logger.info("正在加载语音识别模型...")

        try:
            model_path = get_model_path()
            local_files_only = LOCAL_MODEL_PATH.exists()

            # 使用 base 模型，CPU + INT8 量化
            # 内存占用约 1GB，30秒音频处理时间约 1-2 秒
            self._model = WhisperModel(
                model_path,
                device="cpu",
                compute_type="int8",  # INT8 量化，减少内存占用并加速
                cpu_threads=4,  # 使用 4 个 CPU 线程
                local_files_only=local_files_only,
            )

            if local_files_only:
                logger.info("本地语音识别模型加载完成")
            else:
                logger.info("在线语音识别模型加载完成")

        except Exception as e:
            logger.error("模型加载失败", error=str(e))
            raise

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: str = "zh",
        filename: Optional[str] = None,
    ) -> dict:
        """将音频转换为文字.

        Args:
            audio_bytes: 音频文件二进制数据
            language: 语言代码，"zh" 中文，"en" 英文，"auto" 自动检测
            filename: 原始文件名（用于日志）

        Returns:
            包含识别结果的字典:
            {
                "text": "识别出的文字",
                "language": "检测到的语言",
                "duration": "音频时长（秒）",
                "processing_time": "处理时间（秒）"
            }
        """
        import time

        start_time = time.time()

        # 创建临时文件保存音频
        suffix = Path(filename).suffix if filename else ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            logger.info(
                "开始语音识别",
                language=language,
                file_size=len(audio_bytes),
                filename=filename,
            )

            # 执行语音识别
            segments, info = self._model.transcribe(
                tmp_path,
                language=language if language != "auto" else None,
                task="transcribe",
                beam_size=3,  # 减小 beam_size 提升速度
                best_of=3,
                patience=1.0,
                condition_on_previous_text=False,  # 禁用上下文，提速
                vad_filter=True,  # 启用 VAD 过滤静音
                vad_parameters={
                    "threshold": 0.5,
                    "min_speech_duration_ms": 250,
                    "min_silence_duration_ms": 500,  # 缩短静音检测，提升响应
                },
            )

            # 合并识别结果
            text_parts = []
            for segment in segments:
                text_parts.append(segment.text.strip())

            text = " ".join(text_parts).strip()

            processing_time = time.time() - start_time

            result = {
                "text": text,
                "language": info.language if info else language,
                "duration": info.duration if info else 0,
                "processing_time": round(processing_time, 2),
            }

            logger.info(
                "语音识别完成",
                text_length=len(text),
                processing_time=processing_time,
                detected_language=info.language if info else None,
            )

            return result

        except Exception as e:
            logger.error("语音识别失败", error=str(e))
            raise
        finally:
            # 清理临时文件
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    async def transcribe_file(
        self,
        file_path: str,
        language: str = "zh",
    ) -> dict:
        """识别本地音频文件.

        Args:
            file_path: 音频文件路径
            language: 语言代码

        Returns:
            识别结果字典
        """
        import time

        start_time = time.time()

        logger.info("开始识别本地文件", file_path=file_path, language=language)

        segments, info = self._model.transcribe(
            file_path,
            language=language if language != "auto" else None,
            task="transcribe",
            beam_size=3,
            best_of=3,
            patience=1.0,
            condition_on_previous_text=False,
            vad_filter=True,
            vad_parameters={
                "threshold": 0.5,
                "min_speech_duration_ms": 250,
                "min_silence_duration_ms": 500,
            },
        )

        text_parts = []
        for segment in segments:
            text_parts.append(segment.text.strip())

        text = " ".join(text_parts).strip()
        processing_time = time.time() - start_time

        return {
            "text": text,
            "language": info.language if info else language,
            "duration": info.duration if info else 0,
            "processing_time": round(processing_time, 2),
        }


# 全局服务实例
_speech_service: Optional[SpeechRecognitionService] = None


async def get_speech_service() -> SpeechRecognitionService:
    """获取语音识别服务实例（懒加载）."""
    global _speech_service
    if _speech_service is None:
        _speech_service = SpeechRecognitionService()
    return _speech_service
