import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLogger } from '@/utils/logger';
import { authApi } from '@/services/auth';

const logger = createLogger('ForgotPasswordForm');
const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

interface ForgotPasswordFormProps {
  onNavigateToLogin: () => void;
}

type Step = 1 | 2 | 3;

export function ForgotPasswordForm({ onNavigateToLogin: _onNavigateToLogin }: ForgotPasswordFormProps) {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, message: '密码需要包含大写字母' };
    }
    if (!/[a-z]/.test(pwd)) {
      return { valid: false, message: '密码需要包含小写字母' };
    }
    if (!/\d/.test(pwd)) {
      return { valid: false, message: '密码需要包含数字' };
    }
    return { valid: true, message: '' };
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
      await authApi.sendResetCode(email);
      logger.info('Reset code sent', { email });
      setCountdown(RESEND_COOLDOWN);
      // 发送成功后自动进入下一步（输入验证码）
      setStep(2);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Send reset code failed', { error: errorMessage, email });

      if (errorMessage.includes('未注册') || errorMessage.includes('not found') || errorMessage.includes('404')) {
        setError('该邮箱未注册');
      } else {
        setError('发送验证码失败，请重试');
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');

    if (fullCode.length !== CODE_LENGTH) {
      setError('请输入完整的验证码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.verifyResetCode(email, fullCode);
      const verifyResponse = response.data as unknown as { valid: boolean };
      if (verifyResponse.valid) {
        logger.info('Reset code verified', { email });
        setStep(3);
      } else {
        logger.warn('Invalid reset code', { email });
        setError('验证码错误或已过期');
        setCode(new Array(CODE_LENGTH).fill(''));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Verify reset code failed', { error: errorMessage, email });
      setError('验证码验证失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    const fullCode = code.join('');

    setIsLoading(true);

    try {
      await authApi.resetPassword(email, fullCode, newPassword);
      logger.info('Password reset successful', { email });

      alert('密码重置成功，请使用新密码登录');
      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Reset password failed', { error: errorMessage, email });

      if (errorMessage.includes('过期') || errorMessage.includes('expired')) {
        setError('验证码已过期，请重新获取');
        setStep(1);
      } else {
        setError('重置密码失败，请重试');
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
      const nextInput = document.querySelector<HTMLInputElement>(`#reset-code-${index + 1}`);
      nextInput?.focus();
    }

    if (error) setError('');
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.querySelector<HTMLInputElement>(`#reset-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
            <div className={`w-16 h-0.5 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <StepIndicator />

      {/* 步骤 1: 输入邮箱 */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground">输入邮箱</h3>
            <p className="text-sm text-muted-foreground mt-1">请输入您注册时使用的邮箱</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-foreground">邮箱地址</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="name@example.com"
                className="pl-10 h-11 bg-background text-foreground"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                disabled={isSendingCode || countdown > 0}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 animate-fade-in flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}

          <Button
            onClick={handleSendCode}
            className="w-full h-11"
            disabled={isSendingCode || countdown > 0}
          >
            {isSendingCode ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                发送中...
              </span>
            ) : countdown > 0 ? (
              `${countdown}秒后重试`
            ) : (
              '发送验证码'
            )}
          </Button>
        </div>
      )}

      {/* 步骤 2: 输入验证码 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground">输入验证码</h3>
            <p className="text-sm text-muted-foreground mt-1">
              验证码已发送至 {email}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">验证码</Label>
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  id={`reset-code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="w-10 h-11 text-center bg-background text-foreground"
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 animate-fade-in flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}

          <p className="text-sm text-muted-foreground text-center">
            没有收到验证码？
            {countdown > 0 ? (
              <span className="ml-1">{countdown}秒后重试</span>
            ) : (
              <button
                type="button"
                onClick={handleSendCode}
                className="ml-1 text-primary hover:underline"
              >
                重新发送
              </button>
            )}
          </p>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 h-11"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <Button
              onClick={handleVerifyCode}
              className="flex-1 h-11"
              disabled={isLoading}
            >
              下一步
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* 步骤 3: 设置新密码 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground">设置新密码</h3>
            <p className="text-sm text-muted-foreground mt-1">请输入您的新密码</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-foreground">新密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入新密码"
                className="pl-10 pr-10 h-11 bg-background text-foreground"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError('');
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
            <p className="text-xs text-muted-foreground">密码需8位以上，包含字母和数字</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-new-password" className="text-foreground">确认密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请再次输入新密码"
                className="pl-10 h-11 bg-background text-foreground"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 animate-fade-in flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1 h-11"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <Button
              onClick={handleResetPassword}
              className="flex-1 h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  重置中...
                </span>
              ) : (
                '重置密码'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForgotPasswordForm;
