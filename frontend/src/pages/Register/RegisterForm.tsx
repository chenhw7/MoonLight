import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLogger } from '@/utils/logger';
import { authApi } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import type { AuthResponse, ApiResponse } from '@/types/auth';

const logger = createLogger('RegisterForm');
const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

interface RegisterFormProps {
  onNavigateToLogin: () => void;
}

export function RegisterForm({ onNavigateToLogin }: RegisterFormProps) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback((pwd: string): { valid: boolean; message: string } => {
    if (pwd.length < 8) {
      return { valid: false, message: '密码至少需要8位字符' };
    }
    if (!/[a-z]/.test(pwd)) {
      return { valid: false, message: '密码需要包含小写字母' };
    }
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, message: '密码需要包含大写字母' };
    }
    if (!/\d/.test(pwd)) {
      return { valid: false, message: '密码需要包含数字' };
    }
    return { valid: true, message: '' };
  }, []);

  const generateUsername = useCallback((email: string): string => {
    const localPart = email.split('@')[0];
    let username = localPart.replace(/[^a-zA-Z0-9_]/g, '');
    if (!username || !/^[a-zA-Z]/.test(username)) {
      username = 'user' + username;
    }
    if (username.length < 3) {
      username = username.padEnd(3, '0');
    }
    return username.slice(0, 20);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email || !validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setIsSendingCode(true);
    setError('');

    try {
      await authApi.sendCode({ email, code_type: 'register' });
      logger.info('Verification code sent', { email });
      setCountdown(RESEND_COOLDOWN);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Send verification code failed', { error: errorMessage });
      setError('发送验证码失败，请重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleRegister = async () => {
    setError('');

    if (!email || !validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    const fullCode = code.join('');
    if (fullCode.length !== CODE_LENGTH) {
      setError('请输入完整的验证码');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        email,
        password,
        verification_code: fullCode,
        username: generateUsername(email),
      }) as unknown as ApiResponse<any>;

      const { user, access_token, refresh_token } = response.data;
      setAuth(user, access_token, refresh_token);
      logger.info('Registration successful', { userId: user.id, email: user.email });

      navigate('/home');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Registration failed', { error: errorMessage, email });

      if (errorMessage.includes('已注册') || errorMessage.includes('exists') || errorMessage.includes('400')) {
        setError('该邮箱已注册，请直接登录');
      } else if (errorMessage.includes('验证码') || errorMessage.includes('code')) {
        setError('验证码错误或已过期');
      } else {
        setError('注册失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < CODE_LENGTH - 1) {
      const nextInput = document.querySelector<HTMLInputElement>(`#code-${index + 1}`);
      nextInput?.focus();
    }

    if (error) setError('');
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.querySelector<HTMLInputElement>(`#code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleRegister();
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          邮箱地址
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            className="pl-10 h-11"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          设置密码
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
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">密码需8位以上，包含大小写字母和数字</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          确认密码
        </Label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="请再次输入密码"
            className="pl-10 h-11"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError('');
            }}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">验证码</Label>
        <div className="flex gap-2">
          <div className="flex-1 flex gap-1">
            {code.map((digit, index) => (
              <Input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                className="w-10 h-11 text-center"
                disabled={isLoading}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleSendCode}
            disabled={isSendingCode || countdown > 0}
            className="min-w-28"
          >
            {isSendingCode ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin">⏳</span>
              </span>
            ) : countdown > 0 ? (
              `${countdown}s后重试`
            ) : (
              '获取验证码'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 animate-fade-in">{error}</p>
      )}

      <Button
        type="submit"
        className="w-full h-11 btn-hover"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            注册中...
          </span>
        ) : (
          '注册'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        已有账号？{' '}
        <button type="button" onClick={onNavigateToLogin} className="text-primary hover:underline">
          立即登录
        </button>
      </p>
    </form>
  );
}

export default RegisterForm;
