import { Moon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { RegisterForm } from './RegisterForm';

export function RegisterPage() {
  const handleNavigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <ThemeToggle />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Moon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">MoonLight</h1>
          <p className="text-white/80 mt-2">创建您的账户</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <RegisterForm onNavigateToLogin={handleNavigateToLogin} />
        </div>

        <div className="fixed bottom-4 text-center text-sm text-white/60">
          <p>© 2026 MoonLight. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
