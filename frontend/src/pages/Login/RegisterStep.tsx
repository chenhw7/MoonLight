import { useState } from 'react';
import { User, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLogger } from '@/utils/logger';
import { authApi } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import type { AuthResponse, User as UserType, ApiResponse } from '@/types/auth';

const logger = createLogger('RegisterStep');

interface RegisterStepProps {
  email: string;
  code: string;
  onSubmit: (username: string, password: string, user: UserType, accessToken: string, refreshToken: string) => void;
}

/**
 * 注册步骤
 *
 * 新用户设置用户名和密码
 */
export function RegisterStep({ email, code, onSubmit }: RegisterStepProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUsername = (value: string): boolean => {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    return usernameRegex.test(value) && value.length >= 3 && value.length <= 20;
  };

  const validatePassword = (value: string): boolean => {
    return value.length >= 8 && value.length <= 32;
  };

  const getPasswordStrength = (value: string): number => {
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
    if (/\d/.test(value)) strength++;
    if (/[^a-zA-Z0-9]/.test(value)) strength++;
    return strength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('Register submitted', { email, username });

    const newErrors: Record<string, string> = {};

    if (!username || !validateUsername(username)) {
      newErrors.username =
        '用户名必须以字母开头，只能包含字母、数字和下划线，长度3-20位';
    }

    if (!password || !validatePassword(password)) {
      newErrors.password = '密码长度必须为8-32位';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    if (Object.keys(newErrors).length > 0) {
      logger.warn('Validation failed', { errors: newErrors });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await authApi.register({
        email,
        username,
        password,
        verification_code: code,
      }) as unknown as ApiResponse<AuthResponse>;

      const { user, accessToken, refreshToken } = response.data;
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      
      logger.info('Registration successful', { userId: user.id, email: user.email });
      onSubmit(username, password, user, accessToken, refreshToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Registration failed', { error: errorMessage });
      setErrors({ submit: '注册失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['弱', '中', '强', '很强'];
  const strengthColors = [
    'bg-destructive',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-sm font-medium">
          用户名
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="username"
            type="text"
            placeholder="设置用户名"
            className="pl-10 h-11"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) {
                setErrors((prev) => ({ ...prev, username: '' }));
              }
            }}
            disabled={isLoading}
            autoFocus
          />
        </div>
        {errors.username && (
          <p className="text-sm text-destructive animate-fade-in">
            {errors.username}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          密码
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="设置密码"
            className="pl-10 pr-10 h-11"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: '' }));
              }
            }}
            disabled={isLoading}
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

        {/* 密码强度指示器 */}
        {password && (
          <div className="space-y-1">
            <div className="flex gap-1 h-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`flex-1 rounded-full transition-colors ${
                    level <= passwordStrength
                      ? strengthColors[passwordStrength - 1]
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              密码强度: {strengthLabels[passwordStrength - 1] || '未输入'}
            </p>
          </div>
        )}

        {errors.password && (
          <p className="text-sm text-destructive animate-fade-in">
            {errors.password}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          确认密码
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="再次输入密码"
            className="pl-10 h-11"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }
            }}
            disabled={isLoading}
          />
        </div>
        {confirmPassword && (
          <div className="flex items-center gap-1 text-sm">
            {password === confirmPassword ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-500">密码匹配</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">密码不匹配</span>
              </>
            )}
          </div>
        )}
        {errors.confirmPassword && (
          <p className="text-sm text-destructive animate-fade-in">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {errors.submit && (
        <p className="text-sm text-destructive text-center animate-fade-in">
          {errors.submit}
        </p>
      )}

      <Button
        type="submit"
        className="w-full h-11 btn-hover"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            创建账户中...
          </span>
        ) : (
          '创建账户'
        )}
      </Button>
    </form>
  );
}

export default RegisterStep;
