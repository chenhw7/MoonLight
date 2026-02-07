/**
 * 仪表盘页面
 *
 * 主页的主要内容区域，包含问候语、统计卡片和最近活动
 * 采用大厂标准：静态数据，避免随机数导致的重渲染
 */

import { useMemo } from 'react';

interface StatItem {
  title: string;
  value: number;
  change: number;
  trend: string;
}

interface ActivityItem {
  action: string;
  time: string;
}

// 静态数据定义，避免每次渲染重新生成
const STATS_DATA: StatItem[] = [
  { title: '待处理', value: 12, change: 17, trend: '增加' },
  { title: '已完成', value: 45, change: 12, trend: '增长' },
  { title: '进行中', value: 8, change: 2, trend: '增长' },
  { title: '总计', value: 65, change: 12, trend: '增长' },
];

const ACTIVITIES_DATA: ActivityItem[] = [
  { action: '完成任务 "用户认证模块"', time: '2小时前' },
  { action: '更新了文档 "API 接口规范"', time: '5小时前' },
  { action: '提交了代码变更', time: '昨天' },
];

export function Dashboard() {
  // 使用 useMemo 确保数据稳定性
  const stats = useMemo(() => STATS_DATA, []);
  const activities = useMemo(() => ACTIVITIES_DATA, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">👋 欢迎回来！</h1>
        <p className="text-muted-foreground mt-2">
          这里是您的工作台，一切尽在掌握。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm"
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              比上周 {stat.trend} {stat.change}%
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-lg font-semibold mb-4">📋 最近活动</h2>
        <div className="space-y-4">
          {activities.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b last:border-0 last:pb-0"
            >
              <span className="text-sm">{item.action}</span>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
