/**
 * 分数趋势组件
 *
 * 展示面试分数变化趋势
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ScoreTrendItem } from '@/types/dashboard';
import { formatDistanceToNow } from '@/utils/date';

interface ScoreTrendProps {
  /** 分数趋势数据 */
  data: ScoreTrendItem[];
  /** 图表高度 */
  height?: number;
}

export function ScoreTrend({ data, height = 150 }: ScoreTrendProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        暂无数据
      </div>
    );
  }

  // 转换数据格式
  const chartData = data.map((item, index) => ({
    index: index + 1,
    score: item.overall_score,
    company: item.company_name,
    date: formatDistanceToNow(item.start_time),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="index"
          tick={{ fill: '#6b7280', fontSize: 10 }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#6b7280', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-popover border rounded-lg p-2 shadow-lg text-sm">
                  <div className="font-medium">{data.company}</div>
                  <div className="text-muted-foreground">{data.date}</div>
                  <div className="text-primary font-bold mt-1">{data.score}分</div>
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, fill: '#8b5cf6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
