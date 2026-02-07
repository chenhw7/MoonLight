import { Moon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { RegisterForm } from './RegisterForm';

export function RegisterPage() {
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
          <p className="text-white/80 mt-2">创建您的账户</p>
        </div>

        {/* 注册卡片 - 适配深色模式 */}
        <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-8">
          <RegisterForm onNavigateToLogin={handleNavigateToLogin} />
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
