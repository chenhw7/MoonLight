import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createLogger } from '@/utils/logger';

const logger = createLogger('CodeStep');

interface CodeStepProps {
  email: string;
  onSubmit: (code: string) => void;
  onBack: () => void;
  onResend: () => void;
}

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

/**
 * 验证码输入步骤
 *
 * 新用户输入邮箱验证码进行验证
 */
export function CodeStep({
  email,
  onSubmit,
  onBack,
  onResend,
}: CodeStepProps) {
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (error) setError('');

    // 自动聚焦到下一个输入框
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // 检查是否输入完成
    if (newCode.every((digit) => digit !== '')) {
      void handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, CODE_LENGTH);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length && i < CODE_LENGTH; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);

    // 聚焦到最后一个输入的框或下一个空框
    const lastFilledIndex = Math.min(pastedData.length, CODE_LENGTH - 1);
    inputRefs.current[lastFilledIndex]?.focus();

    if (newCode.every((digit) => digit !== '')) {
      void handleSubmit(newCode.join(''));
    }
  };

  const handleSubmit = async (fullCode: string) => {
    // 日志中脱敏处理，只显示后两位
    const maskedCode = '*'.repeat(CODE_LENGTH - 2) + fullCode.slice(-2);
    logger.info('Code submitted', { email, code: maskedCode });

    setIsLoading(true);
    setError('');

    try {
      // TODO: 验证验证码
      // await authApi.verifyCode({ email, code: fullCode });

      onSubmit(fullCode);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Code verification failed', { error: errorMessage });
      setError('验证码错误，请重试');
      setCode(new Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;

    logger.info('Resend code requested', { email });
    onResend();
    setCountdown(RESEND_COOLDOWN);
  };

  return (
    <form className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isLoading}
              className="w-12 h-14 text-center text-2xl font-bold"
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center animate-fade-in">
            {error}
          </p>
        )}
      </div>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          没有收到验证码？
          {countdown > 0 ? (
            <span className="ml-1">{countdown}秒后重试</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="ml-1 text-primary hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              重新发送
            </button>
          )}
        </p>
      </div>

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

export default CodeStep;
