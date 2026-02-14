/**
 * 能力雷达图组件
 *
 * 展示面试能力维度评分
 */

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { DimensionScores } from '@/types/dashboard';
import { DIMENSION_NAMES } from '@/types/dashboard';

interface RadarChartProps {
  /** 维度评分数据 */
  data: DimensionScores | null;
  /** 图表高度 */
  height?: number;
}

export function RadarChartComponent({ data, height = 200 }: RadarChartProps) {
  if (!data) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        暂无数据
      </div>
    );
  }

  // 转换数据为 recharts 格式
  const chartData = [
    { subject: DIMENSION_NAMES.communication, A: data.communication, fullMark: 100 },
    { subject: DIMENSION_NAMES.technical_depth, A: data.technical_depth, fullMark: 100 },
    { subject: DIMENSION_NAMES.project_experience, A: data.project_experience, fullMark: 100 },
    { subject: DIMENSION_NAMES.adaptability, A: data.adaptability, fullMark: 100 },
    { subject: DIMENSION_NAMES.job_match, A: data.job_match, fullMark: 100 },
  ];

  // 计算平均分
  const average = Math.round(
    (data.communication +
      data.technical_depth +
      data.project_experience +
      data.adaptability +
      data.job_match) /
      5
  );

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="能力评分"
            dataKey="A"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="#8b5cf6"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
      {/* 中心显示平均分 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{average}</div>
          <div className="text-xs text-muted-foreground">均分</div>
        </div>
      </div>
    </div>
  );
}
