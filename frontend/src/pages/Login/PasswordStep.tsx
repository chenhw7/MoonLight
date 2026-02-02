import { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLogger } from '@/utils/logger';
import { authApi } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import type { AuthResponse, ApiResponse } from '@/types/auth';

const logger = createLogger('PasswordStep');

interface PasswordStepProps {
  email: string;
  onSubmit: (password: string, user: { id: number; email: string; username: string }, accessToken: string, refreshToken: string) => void;
  onBack: () => void;
  onForgotPassword: () => void;
}

/**
 * 密码输入步骤
 *
 * 已注册用户输入密码进行登录
 */
export function PasswordStep({
  email,
  onSubmit,
  onBack,
  onForgotPassword,
}: PasswordStepProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('Password submitted', { email });

    if (!password || password.length < 8) {
      setError('密码至少需要8位字符');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email, password }) as unknown as ApiResponse<AuthResponse>;
      const { user, accessToken, refreshToken } = response.data;
      
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      logger.info('Login successful', { userId: user.id, email: user.email });

      onSubmit(password, user, accessToken, refreshToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Login failed', { error: errorMessage, email });
      setError('邮箱或密码错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          密码
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入密码"
            className="pl-10 pr-10 h-11"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {error && (
          <p className="text-sm text-destructive animate-fade-in">{error}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-primary hover:underline"
        >
          忘记密码？
        </button>
      </div>

      <Button
        type="submit"
        className="w-full h-11 btn-hover"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            登录中...
          </span>
        ) : (
          '登录'
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full h-11"
        onClick={onBack}
        disabled={isLoading}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>
    </form>
  );
}

export default PasswordStep;
