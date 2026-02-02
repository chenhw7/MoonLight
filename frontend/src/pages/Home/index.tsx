/**
 * 主页入口
 *
 * 登录成功后进入的主页面，包含仪表盘和相关功能入口
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Dashboard } from './Dashboard';

export function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Dashboard />;
}

export default HomePage;
