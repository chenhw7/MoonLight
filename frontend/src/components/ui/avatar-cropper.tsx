/**
 * 头像裁剪组件
 *
 * 基于 react-cropper 的图片裁剪功能
 * 支持两种比例：1:1.4（证件照）、1:1（正方形）
 * 支持两种裁剪形状：矩形（rect）、圆形（circle）
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Cropper, ReactCropperElement } from 'react-cropper';
import { X, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './button';
import type { AvatarRatio } from '@/types/resume';
import 'react-cropper/node_modules/cropperjs/dist/cropper.css';

/**
 * 裁剪比例选项
 */
type AspectRatio = number;

interface RatioOption {
  label: string;
  value: AspectRatio;
  ratioType: AvatarRatio;
  description: string;
}

/**
 * 预设比例选项
 */
const RATIO_OPTIONS: RatioOption[] = [
  { label: '证件照', value: 1 / 1.4, ratioType: '1.4', description: '1:1.4 标准证件照比例' },
  { label: '正方形', value: 1, ratioType: '1', description: '1:1 正方形比例' },
];

/**
 * 裁剪形状
 */
type CropShape = 'rect' | 'circle';

interface AvatarCropperProps {
  /** 图片源（File 或 URL） */
  src: string;
  /** 是否显示弹窗 */
  open: boolean;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 确认裁剪回调，返回裁剪后的图片和比例 */
  onConfirm: (croppedImage: string, ratio: AvatarRatio) => void;
  /** 默认比例类型 */
  defaultRatioType?: AvatarRatio;
  /** 裁剪形状：矩形或圆形 */
  cropShape?: CropShape;
  /** 弹窗标题 */
  title?: string;
  /** 弹窗描述 */
  description?: string;
}

/**
 * 头像裁剪组件
 *
 * 提供弹窗式的图片裁剪功能，支持多种比例选择和裁剪形状
 *
 * @example
 * ```tsx
 * // 简历头像（矩形）
 * <AvatarCropper
 *   src={imageUrl}
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={(croppedImage) => console.log(croppedImage)}
 * />
 * 
 * // 个人资料头像（圆形预览）
 * <AvatarCropper
 *   src={imageUrl}
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={(croppedImage) => console.log(croppedImage)}
 *   cropShape="circle"
 *   defaultRatioType="1"
 * />
 * ```
 */
export const AvatarCropper: React.FC<AvatarCropperProps> = ({
  src,
  open,
  onClose,
  onConfirm,
  defaultRatioType = '1.4',
  cropShape = 'rect',
  title = '裁剪头像',
  description = '调整图片区域和比例',
}) => {
  const cropperRef = useRef<ReactCropperElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultRatio = RATIO_OPTIONS.find(r => r.ratioType === defaultRatioType)?.value || 1 / 1.4;
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultRatio);
  const [currentRatioType, setCurrentRatioType] = useState<AvatarRatio>(defaultRatioType);
  const [scale, setScale] = useState(1);

  /**
   * 应用圆形裁剪框样式
   */
  useEffect(() => {
    if (!open || cropShape !== 'circle') return;

    // 使用 setTimeout 确保 Cropper 已经渲染完成
    const timer = setTimeout(() => {
      const cropper = cropperRef.current?.cropper;
      if (cropper) {
        // 获取裁剪框元素并应用圆形样式
        const cropBox = document.querySelector('.cropper-crop-box') as HTMLElement;
        const viewBox = document.querySelector('.cropper-view-box') as HTMLElement;
        const face = document.querySelector('.cropper-face') as HTMLElement;

        if (cropBox) {
          cropBox.style.borderRadius = '50%';
          cropBox.style.overflow = 'hidden';
        }
        if (viewBox) {
          viewBox.style.borderRadius = '50%';
          viewBox.style.overflow = 'hidden';
        }
        if (face) {
          face.style.borderRadius = '50%';
        }

        // 强制设置为正方形比例
        if (aspectRatio !== 1) {
          setAspectRatio(1);
          setCurrentRatioType('1');
          cropper.setAspectRatio(1);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [open, cropShape, aspectRatio]);

  /**
   * 获取裁剪后的图片
   */
  const getCroppedImage = useCallback((): string => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return '';

    // 如果是圆形裁剪，需要特殊处理
    if (cropShape === 'circle') {
      const canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      // 创建圆形裁剪
      const size = Math.min(canvas.width, canvas.height);
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = size;
      outputCanvas.height = size;
      const ctx = outputCanvas.getContext('2d');

      if (ctx) {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          canvas,
          (canvas.width - size) / 2,
          (canvas.height - size) / 2,
          size,
          size,
          0,
          0,
          size,
          size
        );
        return outputCanvas.toDataURL('image/jpeg', 0.95);
      }
    }

    // 矩形裁剪（默认）
    return cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    }).toDataURL('image/jpeg', 0.95);
  }, [cropShape]);

  /**
   * 处理确认裁剪
   */
  const handleConfirm = useCallback(() => {
    const croppedImage = getCroppedImage();
    if (croppedImage) {
      onConfirm(croppedImage, currentRatioType);
    }
  }, [getCroppedImage, onConfirm, currentRatioType]);

  /**
   * 处理比例切换
   */
  const handleRatioChange = useCallback((option: RatioOption) => {
    // 圆形裁剪时强制使用正方形比例
    if (cropShape === 'circle' && option.ratioType !== '1') {
      return;
    }

    setAspectRatio(option.value);
    setCurrentRatioType(option.ratioType);
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.setAspectRatio(option.value);
    }
  }, [cropShape]);

  /**
   * 处理缩放
   */
  const handleZoom = useCallback((delta: number) => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const newScale = Math.max(0.1, Math.min(3, scale + delta));
      setScale(newScale);
      cropper.zoomTo(newScale);
    }
  }, [scale]);

  /**
   * 处理旋转
   */
  const handleRotate = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.rotate(90);
    }
  }, []);

  /**
   * 重置裁剪区域
   */
  const handleReset = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.reset();
      setScale(1);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 裁剪区域 */}
        <div className="p-6">
          <div
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg overflow-hidden"
            style={{ height: '400px' }}
          >
            <Cropper
              ref={cropperRef}
              src={src}
              style={{ height: '100%', width: '100%' }}
              aspectRatio={aspectRatio}
              guides={true}
              viewMode={1}
              dragMode="move"
              scalable={true}
              zoomable={true}
              zoomOnTouch={true}
              zoomOnWheel={true}
              cropBoxMovable={true}
              cropBoxResizable={cropShape !== 'circle'}
              toggleDragModeOnDblclick={false}
              background={false}
              responsive={true}
              checkOrientation={true}
              autoCropArea={0.8}
              ready={() => {
                // 裁剪框准备好后应用圆形样式
                if (cropShape === 'circle') {
                  const cropBox = document.querySelector('.cropper-crop-box') as HTMLElement;
                  const viewBox = document.querySelector('.cropper-view-box') as HTMLElement;
                  const face = document.querySelector('.cropper-face') as HTMLElement;

                  if (cropBox) {
                    cropBox.style.borderRadius = '50%';
                    cropBox.style.overflow = 'hidden';
                  }
                  if (viewBox) {
                    viewBox.style.borderRadius = '50%';
                    viewBox.style.overflow = 'hidden';
                  }
                  if (face) {
                    face.style.borderRadius = '50%';
                  }
                }
              }}
            />
          </div>

          {/* 比例选择 - 仅在矩形裁剪时显示 */}
          {cropShape === 'rect' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择裁剪比例
              </label>
              <div className="flex gap-2">
                {RATIO_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleRatioChange(option)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${currentRatioType === option.ratioType
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {RATIO_OPTIONS.find(o => o.ratioType === currentRatioType)?.description}
              </p>
            </div>
          )}

          {/* 圆形裁剪提示 */}
          {cropShape === 'circle' && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                <span className="inline-block w-4 h-4 rounded-full border-2 border-primary mr-2 align-middle"></span>
                圆形头像模式：裁剪结果将显示为圆形
              </p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <button
                onClick={() => handleZoom(-0.1)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="缩小"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleZoom(0.1)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="放大"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="旋转 90°"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                重置
              </button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={handleConfirm}>
                <Check className="w-4 h-4 mr-2" />
                确认裁剪
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;
