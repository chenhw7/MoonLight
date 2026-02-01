/**
 * 认证相关类型定义
 */

export interface User {
  id: number;
  email: string;
  username: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  verification_code: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface CheckEmailResponse {
  exists: boolean;
}

export interface SendCodeRequest {
  email: string;
  code_type: 'register' | 'reset_password';
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
  code_type: 'register' | 'reset_password';
}

export interface VerifyCodeResponse {
  valid: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
