/**
 * 认证状态管理
 *
 * 使用 Zustand 管理用户认证状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createLogger } from '@/utils/logger';
import type { User } from '@/types/auth';

const logger = createLogger('AuthStore');

interface AuthState {
  // 状态
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  rememberMe: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setAccessToken: (token: string) => void;
  setRememberMe: (remember: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      rememberMe: false,

      /**
       * 设置认证信息
       */
      setAuth: (user, accessToken, refreshToken) => {
        logger.info('Auth set', { userId: user.id, email: user.email, rememberMe: get().rememberMe });

        // 根据 rememberMe 决定存储位置
        const storage = get().rememberMe ? localStorage : sessionStorage;
        storage.setItem('access_token', accessToken);
        storage.setItem('refresh_token', refreshToken);

        set({
          user,
          isAuthenticated: true,
          accessToken,
          refreshToken,
        });
      },

      /**
       * 清除认证信息
       */
      clearAuth: () => {
        logger.info('Auth cleared');

        // 清除两种存储
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');

        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          rememberMe: false,
        });
      },

      /**
       * 更新用户信息
       */
      updateUser: (userData) => {
        const currentUser = get().user;
        if (!currentUser) return;

        logger.info('User updated', { userId: currentUser.id, updates: userData });

        set({
          user: { ...currentUser, ...userData },
        });
      },

      /**
       * 更新访问令牌
       */
      setAccessToken: (token) => {
        logger.debug('Access token updated');

        const storage = get().rememberMe ? localStorage : sessionStorage;
        storage.setItem('access_token', token);

        set({
          accessToken: token,
        });
      },

      /**
       * 设置记住我状态
       */
      setRememberMe: (remember) => {
        logger.debug('Remember me set', { remember });

        // 如果切换为记住我，将 token 从 sessionStorage 移到 localStorage
        if (remember) {
          const accessToken = sessionStorage.getItem('access_token');
          const refreshToken = sessionStorage.getItem('refresh_token');

          if (accessToken) {
            localStorage.setItem('access_token', accessToken);
            sessionStorage.removeItem('access_token');
          }
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
            sessionStorage.removeItem('refresh_token');
          }
        }

        set({ rememberMe: remember });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
        // token 不在这里持久化，由上面的方法手动管理
      }),
    }
  )
);

/**
 * 获取当前认证状态
 */
export const getAuthState = () => useAuthStore.getState();

/**
 * 检查是否已登录
 */
export const isLoggedIn = () => useAuthStore.getState().isAuthenticated;

/**
 * 获取当前用户
 */
export const getCurrentUser = () => useAuthStore.getState().user;

export default useAuthStore;
