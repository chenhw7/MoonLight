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

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,

      /**
       * 设置认证信息
       */
      setAuth: (user, accessToken, refreshToken) => {
        logger.info('Auth set', { userId: user.id, email: user.email });

        // 保存到 localStorage
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

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

        // 清除 localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
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

        localStorage.setItem('access_token', token);

        set({
          accessToken: token,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
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
