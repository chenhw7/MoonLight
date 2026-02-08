/**
 * 头像上传组件
 *
 * 支持图片选择、裁剪、预览和上传
 * 流程：选择图片 → 裁剪对话框 → 上传服务器
 *
 * 压缩策略由后端处理：
 * - 上传限制：最大 5MB
 * - 原图 ≤ 2MB：原样存储
 * - 原图 > 2MB：智能压缩到 70%
 */

import React, { useRef, useState, useCallback } from 'react';
import { User, Upload, X, Info } from 'lucide-react';
import { Button } from './button';
import { AvatarCropper } from './avatar-cropper';
import { uploadAvatar } from '@/services/upload';
import { createLogger } from '@/utils/logger';
import type { AvatarRatio } from '@/types/resume';

const logger = createLogger('AvatarUpload');

interface AvatarUploadProps {
  value?: string;
  ratio?: AvatarRatio;
  onChange: (avatar: string, ratio?: AvatarRatio) => void;
  disabled?: boolean;
}

/**
 * 将 Base64 转换为 File 对象
 */
function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  value,
  ratio = '1.4',
  onChange,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<string>('');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentRatio, setCurrentRatio] = useState<AvatarRatio>(ratio);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * 根据比例获取尺寸类名
   */
  const getSizeClasses = () => {
    switch (currentRatio) {
      case '1':
        return 'w-32 h-32'; // 1:1 正方形
      case '1.4':
      default:
        return 'w-32 h-44'; // 1:1.4 证件照
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setUploadInfo('');
  };

  /**
   * 处理文件选择
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('只支持 JPG、PNG、WebP 格式的图片');
      return;
    }

    // 验证文件大小 (最大 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert('图片大小不能超过 5MB');
      return;
    }

    // 读取图片并显示裁剪对话框
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setSelectedFile(file);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // 清空 input 以便可以重复选择同一文件
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  /**
   * 处理裁剪确认
   */
  const handleCropConfirm = useCallback(async (croppedImage: string, selectedRatio: AvatarRatio) => {
    if (!selectedFile) return;

    setLoading(true);
    setUploadInfo('上传中...');
    setCropperOpen(false);

    try {
      // 将裁剪后的 Base64 转换为 File
      const croppedFile = base64ToFile(croppedImage, selectedFile.name);

      // 上传裁剪后的图片
      const result = await uploadAvatar(croppedFile);
      
      // 更新当前比例
      setCurrentRatio(selectedRatio);
      
      // 通知父组件头像和比例
      onChange(result.data.avatar, selectedRatio);

      // 显示压缩信息
      const originalSize = result.data.original_size || croppedFile.size;
      const compressedSize = result.data.compressed_size || originalSize;

      if (originalSize !== compressedSize) {
        const compressRatio = Math.round((1 - compressedSize / originalSize) * 100);
        setUploadInfo(
          `已压缩: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (-${compressRatio}%)`
        );
      } else {
        setUploadInfo(`原图: ${(originalSize / 1024).toFixed(0)}KB`);
      }

      logger.info('头像上传成功', {
        originalSize,
        compressedSize,
        base64Size: result.data.base64_size,
        ratio: selectedRatio,
      });
    } catch (error) {
      logger.error('头像上传失败', { error: String(error) });
      alert('上传失败，请重试');
      setUploadInfo('');
    } finally {
      setLoading(false);
      setSelectedImage('');
      setSelectedFile(null);
    }
  }, [selectedFile, onChange]);

  /**
   * 处理裁剪取消
   */
  const handleCropClose = useCallback(() => {
    setCropperOpen(false);
    setSelectedImage('');
    setSelectedFile(null);
  }, []);

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        {/* 矩形头像预览区域 - 根据比例显示 */}
        <div
          onClick={handleClick}
          className={`
            relative ${getSizeClasses()} border-2 border-dashed rounded-lg
            flex items-center justify-center overflow-hidden
            transition-colors cursor-pointer
            bg-gray-50 dark:bg-gray-800/50
            ${value ? 'border-primary' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${loading ? 'opacity-70' : ''}
          `}
        >
          {value ? (
            <>
              <img src={value} alt="头像" className="w-full h-full object-cover" />
              {!disabled && (
                <button
                  onClick={handleClear}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                  title="删除头像"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500 p-4">
              {loading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              ) : (
                <>
                  <User className="w-12 h-12 mb-2" />
                  <span className="text-sm">点击上传头像</span>
                  <span className="text-xs mt-1">支持 JPG/PNG</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* 上传信息和操作按钮 */}
        <div className="flex flex-col items-center gap-2">
          {uploadInfo && (
            <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
              {uploadInfo}
            </span>
          )}

          {value ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled={disabled || loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              更换头像
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Info className="w-3 h-3" />
              <span>最大 5MB，建议 {currentRatio === '1' ? '300×300' : '295×413'} 像素</span>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || loading}
        />
      </div>

      {/* 裁剪对话框 */}
      <AvatarCropper
        src={selectedImage}
        open={cropperOpen}
        onClose={handleCropClose}
        onConfirm={handleCropConfirm}
        defaultRatioType={currentRatio}
      />
    </>
  );
};
