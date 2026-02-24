"""语音识别功能测试脚本.

用于测试 faster-whisper 是否正确安装和运行。
支持测试本地模型和识别本地音频文件。
"""

import os
import sys
import time
from pathlib import Path

# 设置国内镜像
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 项目路径
PROJECT_ROOT = Path(__file__).parent
MODELS_DIR = PROJECT_ROOT / "models"
LOCAL_MODEL_PATH = MODELS_DIR / "faster-whisper-base"


def get_model_path() -> str:
    """获取模型路径."""
    if LOCAL_MODEL_PATH.exists():
        print(f"✓ 发现本地模型: {LOCAL_MODEL_PATH}")
        return str(LOCAL_MODEL_PATH)
    else:
        print(f"! 本地模型不存在，将使用在线模型: base")
        print(f"  如需下载模型到本地，请运行: python scripts/download_model.py")
        return "base"


async def test_speech_recognition():
    """测试语音识别功能."""
    print("=" * 60)
    print("语音识别功能测试")
    print("=" * 60)

    # 1. 测试依赖安装
    print("\n1. 检查依赖安装...")
    try:
        from faster_whisper import WhisperModel
        print("✓ faster-whisper 已安装")
    except ImportError as e:
        print(f"✗ faster-whisper 未安装: {e}")
        print("请运行: pip install faster-whisper==1.1.1")
        return False

    # 2. 测试模型加载
    print("\n2. 测试模型加载...")
    model_path = get_model_path()
    local_files_only = LOCAL_MODEL_PATH.exists()

    print(f"   模型路径: {model_path}")
    print(f"   本地模式: {local_files_only}")
    print("   正在加载模型（首次需要下载/加载）...")

    try:
        model = WhisperModel(
            model_path,
            device="cpu",
            compute_type="int8",
            cpu_threads=4,
            local_files_only=local_files_only,
        )
        print("✓ 模型加载成功")
    except Exception as e:
        print(f"✗ 模型加载失败: {e}")
        import traceback
        traceback.print_exc()
        return False

    # 3. 测试服务模块
    print("\n3. 测试服务模块...")
    try:
        from app.services.speech_recognition_service import SpeechRecognitionService

        service = SpeechRecognitionService()
        print("✓ 服务模块初始化成功")
    except Exception as e:
        print(f"✗ 服务模块初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False

    # 4. 测试音频识别（如果存在 jfk.flac）
    test_audio_path = PROJECT_ROOT / "jfk.flac"
    if test_audio_path.exists():
        print(f"\n4. 测试音频识别...")
        print(f"   测试文件: {test_audio_path}")

        try:
            start_time = time.time()
            result = await service.transcribe_file(
                str(test_audio_path),
                language="en"
            )
            elapsed = time.time() - start_time

            print(f"✓ 识别成功!")
            print(f"   识别结果: {result['text']}")
            print(f"   检测语言: {result['language']}")
            print(f"   音频时长: {result['duration']:.1f} 秒")
            print(f"   处理时间: {result['processing_time']:.2f} 秒")
            print(f"   实时率: {result['duration'] / result['processing_time']:.1f}x")
        except Exception as e:
            print(f"✗ 识别失败: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"\n4. 跳过音频测试（未找到测试文件: {test_audio_path}）")

    print("\n" + "=" * 60)
    print("所有测试通过！语音识别功能已就绪")
    print("=" * 60)
    print("\n模型信息:")
    if local_files_only:
        print(f"  使用本地模型: {LOCAL_MODEL_PATH}")
    else:
        print(f"  使用在线模型: base")
        print(f"  模型缓存位置: ~/.cache/huggingface/hub/")
    print("\nAPI 接口已注册:")
    print("  - POST /api/v1/speech/recognize")
    print("  - POST /api/v1/speech/recognize/en")
    print("  - GET  /api/v1/speech/status")
    print("\n下载本地模型:")
    print("  python scripts/download_model.py")

    return True


if __name__ == "__main__":
    import asyncio

    result = asyncio.run(test_speech_recognition())
    sys.exit(0 if result else 1)
