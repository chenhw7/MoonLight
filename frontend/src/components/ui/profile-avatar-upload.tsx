/**
 * 个人资料头像上传组件
 *
 * 专门用于个人资料页面的圆形头像上传
 * 支持图片选择、裁剪、预览和上传
 */

import React, { useRef, useState, useCallback } from 'react';
import { User, Upload, X } from 'lucide-react';
import { Button } from './button';
import { AvatarCropper } from './avatar-cropper';
import { uploadAvatar } from '@/services/upload';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ProfileAvatarUpload');

interface ProfileAvatarUploadProps {
  value?: string;
  onChange: (avatar: string) => void;
  onCancel?: () => void;
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

export const ProfileAvatarUpload: React.FC<ProfileAvatarUploadProps> = ({
  value,
  onChange,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<string>('');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
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
  const handleCropConfirm = useCallback(
    async (croppedImage: string) => {
      if (!selectedFile) return;

      setLoading(true);
      setUploadInfo('上传中...');
      setCropperOpen(false);

      try {
        // 将裁剪后的 Base64 转换为 File
        const croppedFile = base64ToFile(croppedImage, selectedFile.name);

        // 上传裁剪后的图片
        const result = await uploadAvatar(croppedFile);

        // 通知父组件头像 URL
        onChange(result.data.avatar);

        // 显示压缩信息
        const originalSize = result.data.original_size || croppedFile.size;
        const compressedSize = result.data.compressed_size || originalSize;

        if (originalSize !== compressedSize) {
          const compressRatio = Math.round(
            (1 - compressedSize / originalSize) * 100
          );
          setUploadInfo(
            `已压缩: ${(originalSize / 1024).toFixed(0)}KB → ${(
              compressedSize / 1024
            ).toFixed(0)}KB (-${compressRatio}%)`
          );
        } else {
          setUploadInfo(`原图: ${(originalSize / 1024).toFixed(0)}KB`);
        }

        logger.info('头像上传成功', {
          originalSize,
          compressedSize,
          base64Size: result.data.base64_size,
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
    },
    [selectedFile, onChange]
  );

  /**
   * 处理裁剪取消
   */
  const handleCropClose = useCallback(() => {
    setCropperOpen(false);
    setSelectedImage('');
    setSelectedFile(null);
    onCancel?.();
  }, [onCancel]);

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        {/* 圆形头像预览区域 */}
        <div
          onClick={handleClick}
          className={`
            relative w-40 h-40 rounded-full border-2 border-dashed
            flex items-center justify-center overflow-hidden
            transition-colors cursor-pointer
            bg-gray-50 dark:bg-gray-800/50
            ${value ? 'border-primary' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
            ${loading ? 'opacity-70' : ''}
          `}
        >
          {value ? (
            <img
              src={value}
              alt="头像预览"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <User size={48} />
              <span className="text-sm">点击上传头像</span>
            </div>
          )}

          {/* 上传中遮罩 */}
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <Upload size={24} className="mx-auto mb-1 animate-bounce" />
                <span className="text-xs">{uploadInfo}</span>
              </div>
            </div>
          )}
        </div>

        {/* 上传信息 */}
        {uploadInfo && !loading && (
          <p className="text-xs text-muted-foreground">{uploadInfo}</p>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={loading}
          >
            {value ? '更换头像' : '选择图片'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => handleClear(e as unknown as React.MouseEvent)}
              disabled={loading}
            >
              清除
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 裁剪对话框 */}
      <AvatarCropper
        src={selectedImage}
        open={cropperOpen}
        onClose={handleCropClose}
        onConfirm={handleCropConfirm}
        defaultRatioType="1"
        cropShape="circle"
        title="裁剪头像"
        description="调整图片区域，预览圆形头像效果"
      />
    </>
  );
};
