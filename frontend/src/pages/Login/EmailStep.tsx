import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLogger } from '@/utils/logger';

const logger = createLogger('EmailStep');

interface EmailStepProps {
  onSubmit: (email: string, exists: boolean) => void;
}

/**
 * 邮箱输入步骤
 *
 * 用户输入邮箱地址，系统检测该邮箱是否已注册
 */
export function EmailStep({ onSubmit }: EmailStepProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('Email submitted', { email });

    // 验证邮箱格式
    if (!email || !validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      logger.warn('Invalid email format', { email });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: 调用 API 检查邮箱是否存在
      // const response = await authApi.checkEmail(email);
      // const exists = response.data.exists;

      // 临时模拟
      const exists = false;

      logger.info('Email check result', { email, exists });
      onSubmit(email, exists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Check email failed', { error: errorMessage });
      setError('检查邮箱失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            autoFocus
          />
        </div>
        {error && (
          <p className="text-sm text-destructive animate-fade-in">{error}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-11 btn-hover"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            检查中...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            继续
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </form>
  );
}

export default EmailStep;
