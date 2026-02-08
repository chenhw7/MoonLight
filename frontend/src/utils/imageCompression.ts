/**
 * 图片压缩工具模块
 *
 * 提供前端图片压缩功能，使用 Canvas API 实现
 */

import { createLogger } from './logger';

const logger = createLogger('ImageCompression');

/**
 * 压缩选项
 */
export interface CompressionOptions {
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 压缩质量 (0-1) */
  quality?: number;
  /** 输出格式 */
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** 目标文件大小 (KB) */
  targetSizeKB?: number;
}

/**
 * 压缩结果
 */
export interface CompressionResult {
  /** 压缩后的 Blob */
  blob: Blob;
  /** 压缩后的 Base64 */
  base64: string;
  /** 原始文件大小 */
  originalSize: number;
  /** 压缩后文件大小 */
  compressedSize: number;
  /** 压缩比例 */
  compressionRatio: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 默认压缩选项
 */
const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.85,
  outputType: 'image/jpeg',
  targetSizeKB: 500,
};

/**
 * 读取文件为 Image 对象
 *
 * @param file - 图片文件
 * @returns Image 对象
 */
function readFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}

/**
 * 将 Canvas 转换为 Blob
 *
 * @param canvas - Canvas 元素
 * @param type - 图片格式
 * @param quality - 压缩质量
 * @returns Blob 对象
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas 转换失败'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * 计算缩放后的尺寸
 *
 * @param width - 原始宽度
 * @param height - 原始高度
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @returns 缩放后的尺寸
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let newWidth = width;
  let newHeight = height;

  // 如果图片尺寸在限制范围内，不缩放
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // 计算缩放比例
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);

  newWidth = Math.floor(width * ratio);
  newHeight = Math.floor(height * ratio);

  return { width: newWidth, height: newHeight };
}

/**
 * 压缩图片
 *
 * @param file - 图片文件
 * @param options - 压缩选项
 * @returns 压缩结果
 *
 * @example
 * ```typescript
 * const result = await compressImage(file, {
 *   maxWidth: 800,
 *   maxHeight: 800,
 *   quality: 0.85,
 * });
 * console.log(`压缩比例: ${result.compressionRatio}%`);
 * ```
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  logger.info('开始压缩图片', {
    name: file.name,
    size: file.size,
    type: file.type,
    options: opts,
  });

  try {
    // 读取图片
    const img = await readFileAsImage(file);
    const originalWidth = img.width;
    const originalHeight = img.height;

    // 计算压缩后的尺寸
    const { width, height } = calculateDimensions(
      originalWidth,
      originalHeight,
      opts.maxWidth,
      opts.maxHeight
    );

    // 创建 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 上下文获取失败');
    }

    // 填充白色背景（处理透明 PNG）
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 绘制图片
    ctx.drawImage(img, 0, 0, width, height);

    // 转换为 Blob
    let blob = await canvasToBlob(canvas, opts.outputType, opts.quality);

    // 如果指定了目标大小且压缩后仍然过大，进一步降低质量
    if (opts.targetSizeKB && blob.size > opts.targetSizeKB * 1024) {
      logger.info('图片仍然过大，进一步压缩', {
        currentSize: blob.size,
        targetSize: opts.targetSizeKB * 1024,
      });

      // 逐步降低质量直到满足要求
      let quality = opts.quality;
      while (quality > 0.3 && blob.size > opts.targetSizeKB * 1024) {
        quality -= 0.1;
        blob = await canvasToBlob(canvas, opts.outputType, quality);
      }
    }

    // 转换为 Base64
    const base64 = canvas.toDataURL(opts.outputType, opts.quality);

    const result: CompressionResult = {
      blob,
      base64,
      originalSize: file.size,
      compressedSize: blob.size,
      compressionRatio: Math.round((1 - blob.size / file.size) * 100),
      width,
      height,
    };

    logger.info('图片压缩完成', {
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      compressionRatio: result.compressionRatio,
      width: result.width,
      height: result.height,
    });

    return result;
  } catch (error) {
    logger.error('图片压缩失败', { error: String(error) });
    throw error;
  }
}

/**
 * 快速压缩头像（预设配置）
 *
 * @param file - 图片文件
 * @returns 压缩结果
 *
 * @example
 * ```typescript
 * const result = await compressAvatar(file);
 * uploadAvatar(result.blob);
 * ```
 */
export async function compressAvatar(file: File): Promise<CompressionResult> {
  return compressImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    outputType: 'image/jpeg',
    targetSizeKB: 200,
  });
}

/**
 * 检查文件是否需要压缩
 *
 * @param file - 图片文件
 * @param maxSizeKB - 最大文件大小 (KB)
 * @returns 是否需要压缩
 */
export function needsCompression(file: File, maxSizeKB: number = 500): boolean {
  return file.size > maxSizeKB * 1024;
}

/**
 * 获取图片尺寸
 *
 * @param file - 图片文件
 * @returns 图片尺寸
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  const img = await readFileAsImage(file);
  return { width: img.width, height: img.height };
}
