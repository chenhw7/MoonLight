/**
 * 文件上传服务
 *
 * 提供文件上传相关 API 调用
 */

import api from './api';
import { createLogger } from '@/utils/logger';

const logger = createLogger('UploadService');

/**
 * 上传结果类型
 */
interface UploadAvatarResponse {
  code: number;
  message: string;
  data: {
    avatar: string;
    original_size: number;
    compressed_size: number;
    base64_size: number;
  };
}

/**
 * 上传头像
 *
 * @param file - 图片文件
 * @returns 上传结果，包含 Base64 编码的图片
 */
export async function uploadAvatar(file: File): Promise<UploadAvatarResponse> {
  logger.info('Uploading avatar', { name: file.name, size: file.size });

  const formData = new FormData();
  formData.append('file', file);

  const data = await api.post<UploadAvatarResponse>('/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
}
