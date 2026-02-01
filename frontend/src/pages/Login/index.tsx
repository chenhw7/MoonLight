import { useState } from 'react';
import { Moon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { createLogger } from '@/utils/logger';
import { authApi } from '@/services/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { EmailStep } from './EmailStep';
import { PasswordStep } from './PasswordStep';
import { CodeStep } from './CodeStep';
import { RegisterStep } from './RegisterStep';

const logger = createLogger('LoginPage');

type LoginStep = 'email' | 'password' | 'code' | 'register';

/**
 * 登录页面
 *
 * 统一的登录/注册入口，根据邮箱是否存在自动切换流程
 */
export function LoginPage() {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [verifiedCode, setVerifiedCode] = useState('');

  logger.debug('LoginPage rendered', { step, email });

  const handleEmailSubmit = (submittedEmail: string, exists: boolean) => {
    setEmail(submittedEmail);
    setStep(exists ? 'password' : 'code');
    logger.info('Email checked', { email: submittedEmail, exists });
  };

  const handleCodeSubmit = (code: string) => {
    setVerifiedCode(code);
    setStep('register');
    logger.info('Code verified', { email });
  };

  const handleRegisterSubmit = (username: string, _password: string) => {
    // verifiedCode 用于注册时验证，后续会传递给 API
    logger.info('Registration completed', { email, username, code: verifiedCode });
    // TODO: 调用注册 API 并跳转到主页
    // navigate('/');
  };

  const handlePasswordSubmit = (_password: string) => {
    logger.info('Login completed', { email });
    // TODO: 调用登录 API 并跳转到主页
    // navigate('/');
  };

  const handleBackToEmail = () => {
    setStep('email');
    setEmail('');
    setVerifiedCode('');
  };

  const handleForgotPassword = () => {
    logger.info('Forgot password clicked', { email });
    // TODO: 实现忘记密码流程
  };

  const handleResendCode = async () => {
    logger.info('Resend code', { email });
    try {
      await authApi.sendCode({ email, code_type: 'register' });
      logger.info('Resend code successful', { email });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Resend code failed', { error: errorMessage });
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email':
        return '欢迎回来';
      case 'password':
        return '输入密码';
      case 'code':
        return '验证邮箱';
      case 'register':
        return '创建账户';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email':
        return '请输入您的邮箱地址以继续';
      case 'password':
        return `欢迎回来，${email}`;
      case 'code':
        return `验证码已发送至 ${email}`;
      case 'register':
        return '请完善您的账户信息';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      {/* 主题切换按钮 */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md animate-scale-in glass border-0 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Moon className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">{getStepTitle()}</CardTitle>
            <CardDescription className="text-base">
              {getStepDescription()}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-8">
          {step === 'email' && <EmailStep onSubmit={handleEmailSubmit} />}

          {step === 'password' && (
            <PasswordStep
              email={email}
              onSubmit={handlePasswordSubmit}
              onBack={handleBackToEmail}
              onForgotPassword={handleForgotPassword}
            />
          )}

          {step === 'code' && (
            <CodeStep
              email={email}
              onSubmit={handleCodeSubmit}
              onBack={handleBackToEmail}
              onResend={handleResendCode}
            />
          )}

          {step === 'register' && (
            <RegisterStep email={email} code={verifiedCode} onSubmit={handleRegisterSubmit} />
          )}
        </CardContent>
      </Card>

      {/* 底部版权信息 */}
      <div className="fixed bottom-4 text-center text-sm text-white/60">
        <p>© 2026 MoonLight. All rights reserved.</p>
      </div>
    </div>
  );
}

export default LoginPage;
