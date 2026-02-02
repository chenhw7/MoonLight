/**
 * 路由保护组件
 *
 * 用于保护需要登录才能访问的路由，未登录用户将跳转到登录页
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ProtectedRoute');

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

export function ProtectedRoute({
  redirectPath = '/login',
  children,
}: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    logger.debug('User not authenticated, redirecting to login', {
      from: location.pathname,
    });

    return (
      <Navigate
        to={redirectPath}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  logger.debug('User authenticated, rendering protected content', {
    path: location.pathname,
  });

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
