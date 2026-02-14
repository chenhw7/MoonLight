/**
 * API 基础配置
 *
 * 配置 axios 实例，包含拦截器和错误处理
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { createLogger } from '@/utils/logger';

const logger = createLogger('API');

// 全局认证清除回调（避免循环依赖）
let clearAuthCallback: (() => void) | null = null;

/**
 * 设置认证清除回调
 * 由 authStore 在初始化时注册
 */
export function setClearAuthCallback(callback: () => void) {
  clearAuthCallback = callback;
}

/**
 * 清除认证状态
 * 同时清除 storage 和 authStore 状态
 */
function clearAuth() {
  // 清除 token 存储
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  
  // 清除 authStore 状态
  if (clearAuthCallback) {
    clearAuthCallback();
  }
}

// API 基础配置
// 后端 API 路径结构: /api/v1/{resource}/{action}
// 符合 RESTful API 版本化规范
const apiConfig: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// 刷新 Token 相关的状态
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// 创建 axios 实例
const axiosInstance = axios.create(apiConfig);

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    logger.debug(`${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });

    // 从 localStorage 或 sessionStorage 获取 token
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
axiosInstance.interceptors.response.use(
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
    if (response?.status === 401 && config) {
      const currentPath = window.location.pathname;
      const isAuthEndpoint = config.url?.includes('/auth/');
      const isLoginPage = currentPath === '/login';

      // 如果是登录相关接口或已在登录页，不自动跳转，让调用方处理错误
      if (isAuthEndpoint || isLoginPage) {
        return Promise.reject(error);
      }

      // 如果正在刷新，将请求加入队列
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            config.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(config);
          })
          .catch((err) => Promise.reject(err));
      }

      const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

      // 尝试刷新 Token
      if (refreshToken && !(config as any)._retry) {
        (config as any)._retry = true;
        isRefreshing = true;

        try {
          logger.info('Refreshing access token...');
          // 使用原生 axios 发送请求，避免拦截器循环
          // 注意：baseURL 可能以 / 结尾，也可能不
          const baseURL = apiConfig.baseURL?.endsWith('/') ? apiConfig.baseURL.slice(0, -1) : apiConfig.baseURL;
          const refreshUrl = `${baseURL}/auth/refresh`;
          
          const refreshResponse = await axios.post(
            refreshUrl,
            { refresh_token: refreshToken }
          );

          // 假设后端返回结构是 { code: 200, message: 'success', data: { access_token: '...' } }
          const { access_token } = refreshResponse.data.data;

          if (!access_token) {
            throw new Error('No access token in refresh response');
          }

          logger.info('Token refreshed successfully');

          // 更新 token
          const storage = localStorage.getItem('refresh_token') ? localStorage : sessionStorage;
          storage.setItem('access_token', access_token);

          // 处理队列
          processQueue(null, access_token);

          // 重试当前请求
          config.headers.Authorization = `Bearer ${access_token}`;
          return axiosInstance(config);
        } catch (refreshError) {
          logger.error('Token refresh failed', { error: refreshError });
          processQueue(refreshError, null);
          
          // 刷新失败，清除认证状态并跳转
          clearAuth();
          
          if (currentPath !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // 无 refresh token 或重试失败，清除认证状态并跳转
      clearAuth();

      // 跳转到登录页
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// 包装 API 实例，提供正确的类型
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get<T, T>(url, config),
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.post<T, T>(url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.put<T, T>(url, data, config),
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.patch<T, T>(url, data, config),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete<T, T>(url, config),
};

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
