# 综合仪表盘设计文档

## 文档信息
- **创建日期**: 2026-02-13
- **功能名称**: 综合仪表盘 - 简历与面试数据统一展示
- **文档类型**: DESIGN - 产品设计方案
- **关联功能**: 简历管理、AI 面试官

---

## 1. 设计目标

### 1.1 核心目标
将 AI 面试功能的统计信息整合到现有仪表盘，实现简历管理与面试练习的统一展示，帮助用户一站式了解求职准备进度。

### 1.2 设计原则
- **平衡布局**: 简历管理与面试练习 50/50 等分展示
- **信息分层**: 核心指标 → 功能模块 → 深度洞察
- **可扩展性**: 为未来功能预留扩展空间
- **数据驱动**: 用可视化图表替代纯文字描述

---

## 2. 整体布局

```
┌─────────────────────────────────────────────────────────────┐
│  👋 欢迎回来！                    [+ 快速创建] [通知]      │
│  这里是您的工作台，继续完善您的简历吧。                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  📄 简历  │  │  🤖 面试  │  │  ⭐ 均分  │  │  🔥 连续  │    │
│  │    5     │  │   12     │  │   78分   │  │   5天    │    │
│  │ [管理→]  │  │ [开始→]  │  │ [详情→]  │  │ [趋势→]  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├───────────────────────────────┬─────────────────────────────┤
│                               │                             │
│  📄 简历管理 (50%)             │  🤖 面试练习 (50%)           │
│                               │                             │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ [最近编辑的简历卡片]      │  │  │    [能力雷达图]          │ │
│  │                         │  │  │                         │ │
│  │ 简历名称、地点、时间      │  │  │   5维度能力展示          │ │
│  │ 快捷操作按钮             │  │  │   近3场均分              │ │
│  └─────────────────────────┘  │  │                         │ │
│                               │  │ [最近面试列表]            │ │
│  [+ 新建简历] [查看全部 →]      │  │                         │ │
│                               │  │ [+ 开始新面试]            │ │
│                               │  └─────────────────────────┘ │
│                               │                             │
├───────────────────────────────┴─────────────────────────────┤
│  📈 成长趋势区域 (全宽)                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [分数趋势折线图] + [能力维度变化] + [文字洞察]        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 模块详细设计

### 3.1 核心数据概览区

#### 展示指标

| 指标 | 图标 | 数据来源 | 点击行为 |
|-----|------|---------|---------|
| 简历数量 | 📄 | resumes 表计数 | 跳转简历列表 |
| 面试次数 | 🤖 | interview_sessions 表计数 | 跳转面试历史 |
| 平均分数 | ⭐ | 已完成面试的 overall_score 平均 | 跳转面试历史 |
| 连续练习 | 🔥 | 按天统计有面试记录的连续天数 | 无/展示tooltip |

#### 数据计算逻辑

```typescript
// 连续练习天数计算
function calculateStreakDays(interviews: InterviewSession[]): number {
  const today = new Date();
  const interviewDates = new Set(
    interviews.map(i => i.start_time.split('T')[0])
  );
  
  let streak = 0;
  let checkDate = new Date(today);
  
  // 如果今天没有面试，从昨天开始算
  if (!interviewDates.has(formatDate(checkDate))) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  while (interviewDates.has(formatDate(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return streak;
}
```

---

### 3.2 简历管理区 (左侧 50%)

#### 功能描述
展示最近编辑的简历，保持与现有仪表盘一致。

#### 展示内容
- **最近编辑简历卡片**: 1-2 张卡片
  - 简历名称
  - 期望地点
  - 最后更新时间
  - 快捷操作: 编辑、预览、面试

- **操作按钮**:
  - [+ 新建简历]: 跳转到简历创建页
  - [查看全部 →]: 跳转到简历列表页

#### 空状态
当用户没有简历时:
```
┌─────────────────────────┐
│     📄                  │
│   还没有简历            │
│                         │
│  创建第一份简历，       │
│  开启求职之旅           │
│                         │
│  [创建简历]             │
└─────────────────────────┘
```

---

### 3.3 面试练习区 (右侧 50%)

#### 3.3.1 能力雷达图

**展示数据**: 最近 3 场已完成面试的各维度平均分

**5 个维度**:
| 维度 | 英文标识 | 说明 |
|-----|---------|------|
| 沟通能力 | communication | 表达清晰度、逻辑性 |
| 技术深度 | technical_depth | 技术问题回答质量 |
| 项目经验 | project_experience | 项目描述和深挖表现 |
| 应变能力 | adaptability | 追问和压力下的表现 |
| 岗位匹配度 | job_match | 与目标岗位的契合度 |

**雷达图样式**:
- 使用 recharts 的 RadarChart
- 5 边形，每个维度一个轴
- 填充色带透明度，边框实线
- 中心显示综合平均分

**数据计算**:
```typescript
// 获取最近3场面试的维度平均分
function getRecentDimensionScores(
  evaluations: InterviewEvaluation[]
): DimensionScores {
  const recent3 = evaluations.slice(0, 3);
  const count = recent3.length;
  
  return {
    communication: Math.round(
      recent3.reduce((sum, e) => sum + e.dimension_scores.communication, 0) / count
    ),
    technical_depth: Math.round(
      recent3.reduce((sum, e) => sum + e.dimension_scores.technical_depth, 0) / count
    ),
    project_experience: Math.round(
      recent3.reduce((sum, e) => sum + e.dimension_scores.project_experience, 0) / count
    ),
    adaptability: Math.round(
      recent3.reduce((sum, e) => sum + e.dimension_scores.adaptability, 0) / count
    ),
    job_match: Math.round(
      recent3.reduce((sum, e) => sum + e.dimension_scores.job_match, 0) / count
    ),
  };
}
```

#### 3.3.2 最近面试列表

**展示数量**: 2-3 条

**展示字段**:
- 企业名称 (company_name)
- 岗位名称 (position_name)
- 综合分数 (overall_score)
- 时间 (start_time 相对时间)

**示例**:
```
🏢 字节跳动  |  前端工程师  |  82分  |  2天前  →
🏢 阿里巴巴  |  Java工程师  |  75分  |  5天前  →
```

**点击行为**: 跳转到该面试的评价报告页

#### 3.3.3 快速操作

**[+ 开始新面试]** 按钮:
- 位置: 雷达图下方
- 样式: 主按钮样式
- 点击: 跳转到面试配置页 `/interview/config`

#### 空状态
当用户没有面试记录时:
```
┌─────────────────────────┐
│    🤖                   │
│   还没有面试练习         │
│                         │
│  AI 面试官可以帮你        │
│  模拟真实面试场景         │
│                         │
│  [开始第一场面试]        │
└─────────────────────────┘
```

---

### 3.4 成长趋势区 (底部全宽)

#### 展示内容

**1. 分数趋势折线图**
- X轴: 最近 10 场面试（时间顺序）
- Y轴: 综合分数 (0-100)
- 折线: 显示分数变化趋势
- 数据点: 悬停显示具体分数和面试信息

**2. 能力维度变化**
- 对比最近 3 场 vs 前 3 场（或历史平均）
- 每个维度显示: 当前值 + 变化箭头 (↑↓→)
- 示例:
  ```
  技术深度: 82 ↑ (+7)    沟通能力: 78 ↓ (-2)
  项目经验: 80 → (0)     应变能力: 75 ↑ (+5)
  岗位匹配: 78 ↑ (+3)
  ```

**3. 简洁洞察文字**
- 1-2 句话总结用户表现
- 基于数据自动生成
- 示例:
  - "技术深度提升明显，继续保持！"
  - "沟通能力有波动，建议多练习表达。"
  - "整体表现稳定，岗位匹配度良好。"

#### 空状态
当面试次数不足时（< 3 场）:
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              📊                                     │
│         数据积累中...                                │
│                                                     │
│   完成 3 场面试后，将展示你的成长趋势分析            │
│                                                     │
│         [去练习面试]                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 4. 数据结构

### 4.1 前端类型定义

```typescript
// 仪表盘数据接口
interface DashboardData {
  // 核心指标
  stats: {
    resumeCount: number;
    interviewCount: number;
    averageScore: number | null;
    streakDays: number;
  };
  
  // 最近简历
  recentResumes: ResumeBase[];
  
  // 面试数据
  interviewStats: {
    dimensionScores: DimensionScores | null;
    recentInterviews: RecentInterviewItem[];
    scoreTrend: ScoreTrendItem[];
    dimensionChanges: DimensionChangeItem[];
    insight: string | null;
  };
}

// 最近面试项
interface RecentInterviewItem {
  id: number;
  companyName: string;
  positionName: string;
  overallScore: number;
  startTime: string;
}

// 分数趋势项
interface ScoreTrendItem {
  sessionId: number;
  companyName: string;
  overallScore: number;
  startTime: string;
}

// 维度变化项
interface DimensionChangeItem {
  key: keyof DimensionScores;
  name: string;
  current: number;
  previous: number;
  change: number;
}
```

### 4.2 API 接口设计

**GET /api/v1/dashboard**

返回完整的仪表盘数据，聚合多个数据源。

**响应示例**:
```json
{
  "stats": {
    "resumeCount": 5,
    "interviewCount": 12,
    "averageScore": 78,
    "streakDays": 5
  },
  "recentResumes": [...],
  "interviewStats": {
    "dimensionScores": {
      "communication": 80,
      "technical_depth": 75,
      "project_experience": 82,
      "adaptability": 78,
      "job_match": 80
    },
    "recentInterviews": [...],
    "scoreTrend": [...],
    "dimensionChanges": [...],
    "insight": "技术深度提升明显，继续保持！"
  }
}
```

---

## 5. 交互设计

### 5.1 页面加载
1. 显示骨架屏占位
2. 并行请求仪表盘数据
3. 渐进式渲染各模块

### 5.2 数据刷新
- 页面聚焦时自动刷新（可选）
- 下拉刷新手势（移动端）
- 手动刷新按钮

### 5.3 错误处理
- 网络错误: 显示重试按钮
- 部分数据失败: 其他模块正常展示
- 空数据: 显示对应的空状态

---

## 6. 响应式设计

### 6.1 桌面端 (≥1024px)
- 左右两栏 50/50 布局
- 雷达图正常大小
- 4 个核心指标卡片横向排列

### 6.2 平板端 (768px - 1023px)
- 左右两栏保持，但卡片缩小
- 雷达图适当缩小
- 核心指标卡片 2x2 网格

### 6.3 移动端 (<768px)
- 垂直堆叠布局
- 简历管理在上，面试练习在下
- 雷达图全宽
- 核心指标卡片横向滚动或 2x2

---

## 7. 未来扩展预留

### 7.1 可扩展区域

| 区域 | 未来可添加内容 |
|-----|---------------|
| 核心指标 | 求职投递数、面试邀请数、Offer数量 |
| 简历管理 | 简历健康度评分、模板推荐 |
| 面试练习 | 面试日程、待办事项、技能图谱 |
| 成长趋势 | 行业对比、排名百分比、技能推荐 |

### 7.2 扩展方式
- 保持模块化设计，新功能以独立卡片形式添加
- 使用动态导入，按需加载图表组件
- 数据接口保持向后兼容

---

## 8. 验收标准

### 8.1 功能验收
- [ ] 仪表盘正常展示 4 个核心指标
- [ ] 简历管理区展示最近编辑的简历
- [ ] 面试练习区展示雷达图和最近面试
- [ ] 成长趋势区展示分数趋势和洞察
- [ ] 各模块空状态正常显示
- [ ] 响应式布局在各尺寸正常显示

### 8.2 性能验收
- [ ] 页面首屏加载 < 2s
- [ ] 数据接口响应 < 500ms
- [ ] 图表渲染流畅无卡顿

### 8.3 体验验收
- [ ] 数据展示准确无误
- [ ] 交互反馈清晰及时
- [ ] 空状态引导明确

---

## 9. 相关文档

- [../ai-interviewer/ALIGNMENT_ai-interviewer.md](../ai-interviewer/ALIGNMENT_ai-interviewer.md) - AI 面试官需求对齐
- [../ai-interviewer/CONSENSUS_ai-interviewer.md](../ai-interviewer/CONSENSUS_ai-interviewer.md) - AI 面试官需求共识
- [../ai-interviewer/DESIGN_ai-interviewer.md](../ai-interviewer/DESIGN_ai-interviewer.md) - AI 面试官系统设计
- [../ai-interviewer/TASK_ai-interviewer.md](../ai-interviewer/TASK_ai-interviewer.md) - AI 面试官任务拆分

---

*文档版本: v1.0*
*最后更新: 2026-02-13*
