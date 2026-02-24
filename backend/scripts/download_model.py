"""下载 Faster-Whisper 模型到本地.

用于将模型下载到项目目录，方便离线部署。
"""

import os
import sys
from pathlib import Path

# 设置国内镜像
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

# 支持的模型
AVAILABLE_MODELS = {
    "tiny": "Systran/faster-whisper-tiny",
    "base": "Systran/faster-whisper-base",
    "small": "Systran/faster-whisper-small",
    "medium": "Systran/faster-whisper-medium",
    "large-v3": "Systran/faster-whisper-large-v3",
}

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
MODELS_DIR = PROJECT_ROOT / "models"


def download_model(model_name: str = "base") -> Path:
    """下载指定模型到本地.

    Args:
        model_name: 模型名称，可选 tiny/base/small/medium/large-v3

    Returns:
        模型本地路径
    """
    if model_name not in AVAILABLE_MODELS:
        print(f"错误：不支持的模型 '{model_name}'")
        print(f"支持的模型: {', '.join(AVAILABLE_MODELS.keys())}")
        sys.exit(1)

    repo_id = AVAILABLE_MODELS[model_name]
    local_dir = MODELS_DIR / f"faster-whisper-{model_name}"

    print(f"正在下载模型: {model_name}")
    print(f"模型仓库: {repo_id}")
    print(f"下载镜像: {os.environ['HF_ENDPOINT']}")
    print(f"保存位置: {local_dir}")
    print("-" * 50)

    try:
        from huggingface_hub import snapshot_download
    except ImportError:
        print("错误：需要安装 huggingface-hub")
        print("请运行: pip install huggingface-hub")
        sys.exit(1)

    try:
        # 下载模型
        downloaded_path = snapshot_download(
            repo_id=repo_id,
            local_dir=str(local_dir),
            local_dir_use_symlinks=False,
            resume_download=True,
        )

        print("-" * 50)
        print(f"✓ 模型下载成功!")
        print(f"  模型路径: {downloaded_path}")

        # 显示模型大小
        total_size = 0
        for file in Path(downloaded_path).rglob("*"):
            if file.is_file():
                total_size += file.stat().st_size

        size_mb = total_size / (1024 * 1024)
        print(f"  模型大小: {size_mb:.1f} MB")
        print()
        print("使用方式:")
        print(f'  model = WhisperModel("{local_dir}", local_files_only=True)')

        return Path(downloaded_path)

    except Exception as e:
        print(f"✗ 下载失败: {e}")
        sys.exit(1)


def main():
    """主函数."""
    import argparse

    parser = argparse.ArgumentParser(
        description="下载 Faster-Whisper 模型到本地",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 下载 base 模型（默认）
  python scripts/download_model.py

  # 下载 tiny 模型
  python scripts/download_model.py --model tiny

  # 下载 small 模型
  python scripts/download_model.py --model small

  # 查看所有可用模型
  python scripts/download_model.py --list
        """,
    )

    parser.add_argument(
        "--model",
        type=str,
        default="base",
        help="要下载的模型名称 (默认: base)",
    )

    parser.add_argument(
        "--list",
        action="store_true",
        help="列出所有可用模型",
    )

    args = parser.parse_args()

    if args.list:
        print("可用模型:")
        for name, repo_id in AVAILABLE_MODELS.items():
            marker = " *" if name == "base" else ""
            print(f"  - {name}: {repo_id}{marker}")
        print("\n* 为默认模型")
        return

    # 创建模型目录
    MODELS_DIR.mkdir(exist_ok=True)

    # 下载模型
    download_model(args.model)


if __name__ == "__main__":
    main()
