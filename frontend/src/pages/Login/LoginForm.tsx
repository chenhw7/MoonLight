import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { createLogger } from '@/utils/logger';
import { authApi } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import type { AuthResponse, ApiResponse } from '@/types/auth';

const logger = createLogger('LoginForm');

interface LoginFormProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

type LoginErrorType = 'none' | 'email' | 'password' | 'network';

export function LoginForm({ onNavigateToRegister, onNavigateToForgotPassword }: LoginFormProps) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setRememberMe = useAuthStore((state) => state.setRememberMe);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMeState] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorType, setErrorType] = useState<LoginErrorType>('none');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMeState(checked);
    setRememberMe(checked);
  };

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('Login form submitted', { email });

    if (!email || !validateEmail(email)) {
      setErrorType('email');
      setErrorMessage('请输入有效的邮箱地址');
      return;
    }

    if (!password || password.length < 8) {
      setErrorType('password');
      setErrorMessage('密码至少需要8位字符');
      return;
    }

    setIsLoading(true);
    setErrorType('none');
    setErrorMessage('');

    try {
      const response = await authApi.login({ email, password }) as unknown as ApiResponse<AuthResponse>;
      const { user, accessToken, refreshToken } = response.data;

      setAuth(user, accessToken, refreshToken);
      logger.info('Login successful', { userId: user.id, email: user.email, rememberMe });

      navigate('/home');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Login failed', { error: errorMessage, email });

      if (errorMessage.includes('未注册') || errorMessage.includes('not found') || errorMessage.includes('404')) {
        setErrorType('email');
        setErrorMessage('该邮箱尚未注册，请先注册账号');
      } else if (errorMessage.includes('密码错误') || errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        setErrorType('password');
        setErrorMessage('密码错误，请重试');
      } else {
        setErrorType('network');
        setErrorMessage('网络连接异常，请检查网络');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 邮箱输入 */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          邮箱地址
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            className="pl-10 h-11 bg-background text-foreground"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorType === 'email') {
                setErrorType('none');
                setErrorMessage('');
              }
            }}
            disabled={isLoading}
            autoFocus
          />
        </div>
        {errorType === 'email' && (
          <p className="text-sm text-amber-600 dark:text-amber-400 animate-fade-in flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </p>
        )}
      </div>

      {/* 密码输入 */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          密码
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入密码"
            className="pl-10 pr-10 h-11 bg-background text-foreground"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorType === 'password') {
                setErrorType('none');
                setErrorMessage('');
              }
            }}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errorType === 'password' && (
          <p className="text-sm text-red-600 dark:text-red-400 animate-fade-in flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </p>
        )}
      </div>

      {/* 记住我和忘记密码 */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(checked) => handleRememberMeChange(checked === true)}
            disabled={isLoading}
          />
          <span className="text-sm text-foreground">记住我</span>
        </label>
        <button
          type="button"
          onClick={onNavigateToForgotPassword}
          className="text-sm text-primary hover:underline"
        >
          忘记密码？
        </button>
      </div>

      {/* 登录按钮 */}
      <Button type="submit" className="w-full h-11 btn-hover" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            登录中...
          </span>
        ) : (
          '登录'
        )}
      </Button>

      {/* 注册链接 */}
      <p className="text-center text-sm text-muted-foreground">
        还没有账号？{' '}
        <button type="button" onClick={onNavigateToRegister} className="text-primary hover:underline">
          立即注册
        </button>
      </p>
    </form>
  );
}
