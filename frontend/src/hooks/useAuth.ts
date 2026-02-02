/**
 * 认证相关 Hooks
 *
 * 提供认证状态相关的自定义 Hooks
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useAuth');

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const logout = useCallback(() => {
    logger.info('User logged out via hook', { userId: user?.id });
    clearAuth();
    navigate('/login', { replace: true });
  }, [clearAuth, navigate, user?.id]);

  return {
    isAuthenticated,
    user,
    logout,
  };
}

export default useAuth;
