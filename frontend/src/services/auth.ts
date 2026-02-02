/**
 * 认证相关 API
 *
 * 提供登录、注册、验证码等接口
 */

import { api } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CheckEmailResponse,
  SendCodeRequest,
  VerifyCodeRequest,
  VerifyCodeResponse,
  ApiResponse,
} from '@/types/auth';

export const authApi = {
  /**
   * 检查邮箱是否存在
   */
  checkEmail: (email: string) =>
    api.post<ApiResponse<CheckEmailResponse>>('/auth/check-email', { email }),

  /**
   * 发送验证码
   */
  sendCode: (data: SendCodeRequest) =>
    api.post<ApiResponse<void>>('/auth/send-code', data),

  /**
   * 验证验证码
   */
  verifyCode: (data: VerifyCodeRequest) =>
    api.post<ApiResponse<VerifyCodeResponse>>('/auth/verify-code', data),

  /**
   * 用户登录
   */
  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  /**
   * 用户注册
   */
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  /**
   * 发送重置密码验证码
   */
  sendResetCode: (email: string) =>
    api.post<ApiResponse<void>>('/auth/send-code', {
      email,
      code_type: 'reset_password',
    }),

  /**
   * 验证重置密码验证码
   */
  verifyResetCode: (email: string, code: string) =>
    api.post<ApiResponse<VerifyCodeResponse>>('/auth/verify-code', {
      email,
      code,
      code_type: 'reset_password',
    }),

  /**
   * 重置密码
   */
  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post<ApiResponse<void>>('/auth/reset-password', {
      email,
      code,
      newPassword,
    }),

  /**
   * 刷新令牌
   */
  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken }),
};

export default authApi;
