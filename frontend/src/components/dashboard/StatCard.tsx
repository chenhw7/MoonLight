/**
 * 统计卡片组件
 *
 * 展示仪表盘核心指标
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface StatCardProps {
  /** 图标 */
  icon: LucideIcon;
  /** 标签 */
  label: string;
  /** 数值 */
  value: string | number;
  /** 点击跳转路径 */
  href?: string;
  /** 自定义样式 */
  className?: string;
}

export function StatCard({ icon: Icon, label, value, href, className }: StatCardProps) {
  const content = (
    <Card className={cn(
      'transition-all duration-200',
      href && 'cursor-pointer hover:shadow-md hover:border-primary/50',
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {href && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            查看 <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}
