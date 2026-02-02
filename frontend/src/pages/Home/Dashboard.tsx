/**
 * 仪表盘页面
 *
 * 主页的主要内容区域，包含问候语、统计卡片和最近活动
 */

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">👋 欢迎回来！</h1>
        <p className="text-muted-foreground mt-2">
          这里是您的工作台，一切尽在掌握。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in delay-100">
        {['待处理', '已完成', '进行中', '总计'].map((title, index) => (
          <div
            key={title}
            className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm card-hover"
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {title}
              </span>
            </div>
            <div className="text-2xl font-bold">{[12, 45, 8, 65][index]}</div>
            <p className="text-xs text-muted-foreground mt-1">
              比上周 {index === 0 ? '增加' : '增长'} {Math.floor(Math.random() * 20)}%
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm animate-fade-in delay-200">
        <h2 className="text-lg font-semibold mb-4">📋 最近活动</h2>
        <div className="space-y-4">
          {[
            { action: '完成任务 "用户认证模块"', time: '2小时前' },
            { action: '更新了文档 "API 接口规范"', time: '5小时前' },
            { action: '提交了代码变更', time: '昨天' },
          ].map((item, index) => (
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
