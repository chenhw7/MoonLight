/**
 * 维度变化组件
 *
 * 展示能力维度的变化情况
 */

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { DimensionChangeItem } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface DimensionChangeProps {
  /** 维度变化数据 */
  data: DimensionChangeItem[];
}

export function DimensionChange({ data }: DimensionChangeProps) {
  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        暂无数据
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {data.map((item) => (
        <div key={item.key} className="text-center p-2 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground mb-1">{item.name}</div>
          <div className="flex items-center justify-center gap-1">
            <span className="font-semibold">{item.current}</span>
            <ChangeIndicator change={item.change} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="text-green-500 text-xs flex items-center">
        <ArrowUp className="h-3 w-3" />
        {change}
      </span>
    );
  }

  if (change < 0) {
    return (
      <span className="text-red-500 text-xs flex items-center">
        <ArrowDown className="h-3 w-3" />
        {Math.abs(change)}
      </span>
    );
  }

  return (
    <span className="text-muted-foreground text-xs flex items-center">
      <Minus className="h-3 w-3" />
    </span>
  );
}
