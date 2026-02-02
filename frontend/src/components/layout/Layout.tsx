/**
 * 布局组件
 *
 * 提供页面整体布局框架，包含顶部导航栏和主内容区
 */

import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Layout');

export function Layout() {
  logger.debug('Layout rendered');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
