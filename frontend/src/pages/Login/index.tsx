import { Moon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoginForm } from './LoginForm';

export function LoginPage() {
  const handleNavigateToRegister = () => {
    window.location.href = '/register';
  };

  const handleNavigateToForgotPassword = () => {
    window.location.href = '/forgot-password';
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative">
      {/* 主题切换按钮 - 固定在右上角 */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo 和标题区域 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/10 dark:bg-white/5 flex items-center justify-center mb-4">
            <Moon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">MoonLight</h1>
        </div>

        {/* 登录卡片 - 适配深色模式 */}
        <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-8">
          <LoginForm
            onNavigateToRegister={handleNavigateToRegister}
            onNavigateToForgotPassword={handleNavigateToForgotPassword}
          />
        </div>

        {/* 底部版权 */}
        <div className="fixed bottom-4 left-0 right-0 text-center text-sm text-white/60">
          <p>© 2026 MoonLight. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
