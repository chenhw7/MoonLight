/**
 * 最近面试列表组件
 *
 * 展示最近的面试记录
 */

import { ChevronRight } from 'lucide-react';
import type { RecentInterviewItem } from '@/types/dashboard';
import { formatDistanceToNow } from '@/utils/date';
import { cn } from '@/lib/utils';

interface InterviewListProps {
  /** 面试列表数据 */
  data: RecentInterviewItem[];
  /** 点击回调 */
  onItemClick?: (id: number) => void;
}

export function InterviewList({ data, onItemClick }: InterviewListProps) {
  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        暂无面试记录
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick?.(item.id)}
          className={cn(
            'w-full flex items-center justify-between p-3 rounded-lg',
            'bg-muted/50 hover:bg-muted transition-colors',
            'text-left group'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg">🏢</span>
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">
                {item.company_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.position_name}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm font-semibold text-primary">
              {item.overall_score}分
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(item.start_time)}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      ))}
    </div>
  );
}
