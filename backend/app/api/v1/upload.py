"""文件上传 API 模块。

提供图片上传和处理功能，包括头像上传。
"""

import base64
import io
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from PIL import Image

from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/upload", tags=["文件上传"])

# 上传文件大小限制 (5MB)
MAX_UPLOAD_SIZE = 5 * 1024 * 1024
# 不压缩的阈值 (2MB)
NO_COMPRESS_THRESHOLD = 2 * 1024 * 1024
# 最大边长限制 (防止超大图)
MAX_IMAGE_DIMENSION = 1600


def process_image(image: Image.Image, original_size: int, original_bytes: bytes) -> bytes:
    """处理图片，智能决定是否压缩。
    
    策略：
    1. 原图 > 2MB：需要压缩
    2. 原图 ≤ 2MB：尝试用高质量 95% 保存，如果比原图大则返回原图
    
    Args:
        image: PIL Image 对象
        original_size: 原始文件大小
        original_bytes: 原始文件字节数据
        
    Returns:
        处理后的图片字节数据
    """
    # 如果原图 > 2MB，需要压缩
    if original_size > NO_COMPRESS_THRESHOLD:
        return compress_large_image(image, original_size)
    
    # 原图 ≤ 2MB，尝试用高质量保存
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=95, optimize=True)
    processed_data = buffer.getvalue()
    
    # 如果处理后比原图大，返回原图数据
    if len(processed_data) > original_size:
        logger.info(f"原图 ≤ 2MB，处理后变大 ({len(processed_data) // 1024}KB > {original_size // 1024}KB)，使用原图")
        return original_bytes
    
    logger.info(f"原图 ≤ 2MB，优化后: {original_size // 1024}KB → {len(processed_data) // 1024}KB")
    return processed_data


def compress_large_image(image: Image.Image, original_size: int) -> bytes:
    """压缩大图片（> 2MB）。
    
    策略：
    1. 限制最大边长 1600px
    2. 目标大小：原图的 70%
    3. 从高质量开始尝试，直到达到目标大小
    
    Args:
        image: PIL Image 对象
        original_size: 原始文件大小
        
    Returns:
        压缩后的图片字节数据
    """
    target_size = int(original_size * 0.7)
    current_image = image.copy()
    
    # 步骤 1: 限制最大边长
    if max(current_image.size) > MAX_IMAGE_DIMENSION:
        ratio = MAX_IMAGE_DIMENSION / max(current_image.size)
        new_size = tuple(int(dim * ratio) for dim in current_image.size)
        current_image = current_image.resize(new_size, Image.Resampling.LANCZOS)
    
    # 步骤 2: 尝试不同的 JPEG 质量，从高质量开始
    for quality in [95, 90, 85, 80, 75, 70]:
        buffer = io.BytesIO()
        current_image.save(buffer, format="JPEG", quality=quality, optimize=True)
        data = buffer.getvalue()
        
        if len(data) <= target_size:
            logger.info(f"大图片压缩成功: 质量={quality}, {original_size // 1024}KB → {len(data) // 1024}KB")
            return data
    
    # 步骤 3: 如果质量调整到 70% 仍不达标，缩小尺寸
    current_size = current_image.size
    while True:
        current_size = tuple(int(dim * 0.9) for dim in current_size)
        current_image = current_image.resize(current_size, Image.Resampling.LANCZOS)
        
        buffer = io.BytesIO()
        current_image.save(buffer, format="JPEG", quality=70, optimize=True)
        data = buffer.getvalue()
        
        if len(data) <= target_size or max(current_size) < 400:
            logger.info(f"大图片压缩成功(尺寸调整): {original_size // 1024}KB → {len(data) // 1024}KB")
            return data


@router.post("/avatar", response_model=dict)
async def upload_avatar(file: UploadFile = File(...)):
    """上传头像图片。

    智能压缩策略：
    - 上传限制：最大 5MB
    - 原图 ≤ 2MB：尽量保持原图画质，如果重新编码会变大则使用原图
    - 原图 > 2MB：压缩到原图的 70%
    - 最大边长限制：1600px

    Args:
        file: 上传的图片文件

    Returns:
        包含 Base64 编码图片的字典
    """
    # 验证文件类型
    allowed_types = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只支持 JPG、PNG、WebP 格式的图片",
        )

    try:
        # 读取文件内容
        original_bytes = await file.read()
        original_size = len(original_bytes)

        # 验证文件大小
        if original_size > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"图片大小不能超过 {MAX_UPLOAD_SIZE // 1024 // 1024}MB",
            )

        # 使用 PIL 处理图片
        image = Image.open(io.BytesIO(original_bytes))

        # 转换为 RGB (处理 PNG 透明通道)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # 处理图片
        processed_data = process_image(image, original_size, original_bytes)
        
        # 转换为 Base64
        base64_data = base64.b64encode(processed_data).decode("utf-8")

        # 计算压缩率
        compression_ratio = round((1 - len(processed_data) / original_size) * 100)
        
        logger.info(
            f"头像上传成功: {file.filename}, "
            f"{original_size // 1024}KB → {len(processed_data) // 1024}KB "
            f"({compression_ratio:+d}%)"
        )

        return {
            "code": 200,
            "message": "上传成功",
            "data": {
                "avatar": f"data:image/jpeg;base64,{base64_data}",
                "original_size": original_size,
                "compressed_size": len(processed_data),
                "base64_size": len(base64_data),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"头像上传失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="图片处理失败，请重试",
        )
