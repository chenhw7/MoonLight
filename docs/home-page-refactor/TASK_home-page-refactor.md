# TASK: 主页重构与简历管理任务分解

## 任务依赖图

```mermaid
graph TD
    T1[T1: 创建 ResumeCard 组件] --> T2[T2: 创建 ResumeList 页面基础]
    T2 --> T3[T3: 实现列表页操作逻辑(复制/删除)]
    T1 --> T4[T4: 重构 Dashboard 数据对接]
    T4 --> T7[T7: 整体验证]
    T3 --> T7
    T5[T5: 重构 Header 导航] --> T7
    T2 --> T6[T6: 注册路由]
    T6 --> T7
```

## 任务清单

### T1: 创建 ResumeCard 组件
- **目标**: 创建可复用的简历展示卡片。
- **输入**: `src/types/resume.ts`
- **输出**: `src/components/resume/ResumeCard.tsx`
- **规范**: 使用 Shadcn Card 组件，包含标题、简介、时间、操作按钮插槽。

### T2: 创建 ResumeList 页面基础
- **目标**: 创建简历列表页骨架，实现数据加载。
- **输入**: `src/services/resume.ts`
- **输出**: `src/pages/Resume/ResumeList.tsx`
- **逻辑**: 调用 `getResumeList`，处理 Loading 和 Error 状态，使用 Grid 布局展示 `ResumeCard`。

### T3: 实现列表页操作逻辑 (复制/删除)
- **目标**: 完善列表页交互。
- **输入**: `ResumeList.tsx`
- **输出**: 更新后的 `ResumeList.tsx`
- **逻辑**:
  - 实现 `handleCopy`: Get Detail -> Clean -> Create -> Refresh.
  - 实现 `handleDelete`: Confirm -> Delete -> Refresh.
  - 增加 "新建简历" 按钮跳转。

### T4: 重构 Dashboard 数据对接
- **目标**: 将 Dashboard 的静态数据替换为 API 数据。
- **输入**: `src/pages/Home/Dashboard.tsx`
- **输出**: 更新后的 `Dashboard.tsx`
- **逻辑**:
  - 移除 `STATS_DATA` 等静态常量。
  - 获取 `getResumeList(1, 5)`。
  - 展示 "最近简历" 区域。

### T5: 重构 Header 导航
- **目标**: 增加简历管理下拉菜单。
- **输入**: `src/components/layout/Header.tsx`
- **输出**: 更新后的 `Header.tsx`
- **逻辑**: 使用 Shadcn DropdownMenu 或自定义 Hover 实现。包含 "新建简历" 和 "我的简历"。

### T6: 注册路由
- **目标**: 使新页面可访问。
- **输入**: `src/App.tsx`, `src/pages/Resume/index.tsx`
- **输出**: 更新后的路由配置。
- **操作**: 增加 `/resumes` 路由指向 `ResumeList`。

### T7: 整体验证
- **目标**: 确保所有功能正常工作。
- **输出**: 验证报告。
- **检查点**:
  - 导航正常跳转。
  - 列表页加载正常。
  - 复制功能成功创建副本。
  - 仪表盘显示最新的 5 条。
