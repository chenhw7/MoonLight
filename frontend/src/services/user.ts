/**
 * 用户相关 API
 *
 * 提供用户资料管理接口
 */

import { api } from './api';
import type { User, ApiResponse } from '@/types/auth';

export interface UpdateProfileRequest {
  username: string;
}

export interface UpdateAvatarRequest {
  avatar: string;
}

export const userApi = {
  /**
   * 获取用户资料
   */
  getProfile: () => api.get<ApiResponse<User>>('/users/profile'),

  /**
   * 更新用户资料
   */
  updateProfile: (data: UpdateProfileRequest) =>
    api.put<ApiResponse<User>>('/users/profile', data),

  /**
   * 更新用户头像
   */
  updateAvatar: (data: UpdateAvatarRequest) =>
    api.put<ApiResponse<User>>('/users/avatar', data),
};
