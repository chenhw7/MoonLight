# ALIGNMENT: 主页重构与简历管理功能增强

## 1. 项目上下文分析

### 1.1 现有架构
- **前端技术栈**: React 18, Vite 5, TypeScript 5, Tailwind CSS, Shadcn UI, Zustand (AuthStore), React Router DOM.
- **后端服务**: FastAPI (已有 `/api/v1/resumes` CRUD 接口，但无复制接口).
- **现有页面**:
  - `HomePage` (`/home`): 包含 `Dashboard`，目前显示静态示例数据。
  - `Header`: 包含静态导航项 (Dashboard, Projects, Team, Settings) 和用户下拉菜单。
  - `ResumeCreate` (`/resume/create`): 创建简历页面。
  - 缺失: 简历列表页 (`/resumes` 或 `/resume/list`)。

### 1.2 现有数据模型
- `Resume` 类型已定义 (`frontend/src/types/resume.ts`)。
- `ResumeService` 已实现 `getResumeList`, `createResume`, `updateResume`, `deleteResume`。

## 2. 需求理解确认

### 2.1 原始需求
1.  **简历管理入口**: 顶部导航栏增加入口，鼠标悬停显示下拉（新建、查看）。
2.  **多简历管理**: 支持创建多份，支持复制现有简历修改，支持完全新建。
3.  **仪表盘更新**: 显示过去创建的 5 份简历。

### 2.2 需求细化与边界确认

#### A. 顶部导航栏 (Header) 重构
- **变更**: 将原有导航项调整，增加 "简历管理" (Resume Management)。
- **交互**: 悬停或点击 "简历管理" 显示下拉菜单：
  - "新建简历" (New Resume) -> 跳转 `/resume/create`
  - "我的简历" (My Resumes) -> 跳转 `/resumes` (新增页面)
- **位置**: 建议放在 "仪表盘" 之后。

#### B. 简历列表页 (Resume List Page) - 新增
- **路由**: `/resumes`
- **功能**:
  - 展示所有简历列表 (分页)。
  - 操作按钮: 编辑 (Edit), 复制 (Copy), 删除 (Delete), 预览 (Preview).
  - "新建简历" 按钮。
- **复制功能实现**:
  - 由于后端无 Copy 接口，将在前端实现：
    1. 获取目标简历详情 (`getResumeDetail`)。
    2. 清除 ID 和 创建/更新时间。
    3. 修改标题 (e.g., "副本 - 原标题")。
    4. 调用 `createResume` 接口。

#### C. 仪表盘 (Dashboard) 重构
- **变更**: 移除/替换静态的 "Stats" 和 "Activities"。
- **新内容**:
  - "最近的简历" (Recent Resumes) 卡片列表 (Top 5)。
  - 每个卡片显示: 简历标题、最后修改时间、完整度(如有)、操作按钮(编辑)。
  - 顶部保留 "欢迎回来" 和 "快速新建" 按钮。

## 3. 智能决策策略与疑问

### 3.1 决策点
- **Q1: 复制功能的实现方式？**
  - **策略**: 优先采用前端实现 (Frontend-orchestrated Copy)，无需修改后端，快速交付。
  - **理由**: 后端目前未提供 Copy 接口，且前端实现逻辑简单（Get -> Clean -> Post）。

- **Q2: 简历列表页的布局？**
  - **策略**: 使用卡片网格 (Grid of Cards) 布局，与 Dashboard 风格保持一致。
  - **理由**: 简历通常包含预览图或关键信息，卡片比表格更直观。

- **Q3: 仪表盘原有静态数据处理？**
  - **策略**: 暂时移除 "待处理/已完成" 等静态统计，保留 "最近活动" (如果能对接真实日志则对接，否则先隐藏或改为 "最近编辑的简历")。
  - **建议**: 将 Dashboard 核心区域改为 "最近简历" + "快速开始" 区域。

## 4. 待确认事项 (User Confirmation)

请确认以下设计方案：

1.  **导航栏**: 确认增加 "简历管理" 下拉菜单。
2.  **复制功能**: 接受前端实现的复制逻辑（会在列表中生成一个新的 "副本 - XXX" 简历）。
3.  **列表页**: 确认需要一个单独的 `/resumes` 页面来管理所有简历。
