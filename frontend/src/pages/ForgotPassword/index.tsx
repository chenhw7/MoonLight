import { Moon, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export function ForgotPasswordPage() {
  const handleNavigateToLogin = () => {
    window.location.href = '/login';
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
          <p className="text-white/80 mt-2">找回密码</p>
        </div>

        {/* 找回密码卡片 - 适配深色模式 */}
        <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-8">
          <ForgotPasswordForm onNavigateToLogin={handleNavigateToLogin} />
        </div>

        {/* 返回登录按钮 */}
        <div className="fixed bottom-4 left-0 right-0 text-center">
          <button
            onClick={handleNavigateToLogin}
            className="text-sm text-white/60 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回登录
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
