# MoonLight 前端项目

MoonLight 项目的前端部分，使用 React + TypeScript + Vite 构建。

## 技术栈

- **React 18** - UI 框架
- **TypeScript 5** - 类型安全
- **Vite 5** - 构建工具
- **Tailwind CSS** - 原子化 CSS
- **shadcn/ui** - 组件库
- **Zustand** - 状态管理
- **TanStack Query** - 数据获取
- **React Router** - 路由管理

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── components/          # 组件
│   ├── ui/             # shadcn/ui 组件
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── lib/                # 工具库
│   └── utils.ts
├── pages/              # 页面组件
├── services/           # API 服务
├── stores/             # 状态管理
├── utils/              # 工具函数
├── App.tsx             # 根组件
├── globals.css         # 全局样式
└── main.tsx            # 入口文件
```

## 脚本命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run test` | 运行单元测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |
| `npm run test:e2e` | 运行 E2E 测试 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run format` | 格式化代码 |

## 主题切换

项目支持深色/浅色主题切换：
- 点击右上角的主题切换按钮
- 支持跟随系统偏好
- 主题设置会保存在 localStorage

## 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 组件使用函数式 + Hooks
- 使用 `cn()` 工具函数合并 Tailwind 类名

## 开发注意事项

1. 所有组件放在 `src/components/` 目录
2. 页面组件放在 `src/pages/` 目录
3. API 相关代码放在 `src/services/` 目录
4. 状态管理使用 Zustand，放在 `src/stores/` 目录
5. 工具函数放在 `src/utils/` 目录

## 环境变量

创建 `.env` 文件：

```env
VITE_API_URL=http://localhost:8000/api/v1
```
