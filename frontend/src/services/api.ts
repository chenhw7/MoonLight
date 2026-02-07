/**
 * API 基础配置
 *
 * 配置 axios 实例，包含拦截器和错误处理
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createLogger } from '@/utils/logger';

const logger = createLogger('API');

// API 基础配置
// 后端 API 路径结构: /api/v1/{resource}/{action}
// 符合 RESTful API 版本化规范
const apiConfig: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// 创建 axios 实例
export const api = axios.create(apiConfig);

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    logger.debug(`${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });

    // 从 localStorage 获取 token
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    logger.error('Request error', {
      url: error.config?.url,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.debug(`Response ${response.status}`, {
      url: response.config.url,
      data: response.data,
    });
    return response.data;
  },
  async (error: AxiosError) => {
    const { response, config } = error;

    logger.error('Response error', {
      url: config?.url,
      status: response?.status,
      message: error.message,
      data: response?.data,
    });

    // 处理 401 未授权错误
    if (response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthEndpoint = config?.url?.includes('/auth/');
      const isLoginPage = currentPath === '/login';

      // 如果是登录相关接口或已在登录页，不自动跳转，让调用方处理错误
      if (isAuthEndpoint || isLoginPage) {
        return Promise.reject(error);
      }

      // 清除本地存储的 token
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      // 跳转到登录页
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export default api;
