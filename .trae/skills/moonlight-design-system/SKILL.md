---
name: moonlight-design-system
description: MoonLight 项目设计系统规范。包含色彩方案、字体规范、间距系统、组件使用规范、主题切换实现。在设计 UI、调整样式、使用组件时触发。
---

# MoonLight 设计系统

## 设计原则

- **简约现代**：大量留白，清晰层次
- **流畅动画**：渐变背景、微交互动效
- **主题切换**：深色/浅色模式无缝切换
- **一致性**：全站使用统一的设计语言

## 技术栈

- Tailwind CSS 3.x
- shadcn/ui 组件库
- Framer Motion (动画)
- CSS Variables (主题变量)

## 色彩系统

### 浅色模式

```css
:root {
  /* 背景 */
  --background: 0 0% 100%;
  --background-gradient-start: #667eea;
  --background-gradient-end: #764ba2;
  
  /* 前景 */
  --foreground: 222 47% 11%;
  --foreground-muted: 215 16% 47%;
  
  /* 卡片 */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  
  /* 主色 */
  --primary: 258 90% 66%;
  --primary-foreground: 0 0% 100%;
  
  /* 次要 */
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  
  /* 边框 */
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  
  /* 圆角 */
  --radius: 0.75rem;
}
```

### 深色模式

```css
.dark {
  /* 背景 */
  --background: 222 47% 11%;
  --background-gradient-start: #1a1a2e;
  --background-gradient-end: #16213e;
  
  /* 前景 */
  --foreground: 210 40% 98%;
  --foreground-muted: 215 20% 65%;
  
  /* 卡片 */
  --card: 222 47% 15%;
  --card-foreground: 210 40% 98%;
  
  /* 主色 */
  --primary: 263 70% 66%;
  --primary-foreground: 0 0% 100%;
  
  /* 次要 */
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;
  
  /* 边框 */
  --border: 217 33% 17%;
  --input: 217 33% 17%;
}
```

## 字体系统

### 字体族

```css
/* 主字体 */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;

/* 备用字体 */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 字体大小

| 名称 | 大小 | 行高 | 用途 |
|------|------|------|------|
| text-xs | 0.75rem | 1rem | 标签、辅助文字 |
| text-sm | 0.875rem | 1.25rem | 次要文字 |
| text-base | 1rem | 1.5rem | 正文 |
| text-lg | 1.125rem | 1.75rem | 小标题 |
| text-xl | 1.25rem | 1.75rem | 标题 |
| text-2xl | 1.5rem | 2rem | 大标题 |
| text-3xl | 1.875rem | 2.25rem | 页面标题 |
| text-4xl | 2.25rem | 2.5rem | 品牌标题 |

## 间距系统

使用 Tailwind 默认间距：

| 名称 | 值 | 用途 |
|------|-----|------|
| space-1 | 0.25rem | 极小间距 |
| space-2 | 0.5rem | 小间距 |
| space-4 | 1rem | 默认间距 |
| space-6 | 1.5rem | 中等间距 |
| space-8 | 2rem | 大间距 |
| space-12 | 3rem | 超大间距 |

## 圆角系统

| 名称 | 值 | 用途 |
|------|-----|------|
| rounded-sm | 0.125rem | 小标签 |
| rounded | 0.25rem | 按钮 |
| rounded-md | 0.375rem | 输入框 |
| rounded-lg | 0.5rem | 卡片 |
| rounded-xl | 0.75rem | 大卡片 |
| rounded-2xl | 1rem | 模态框 |
| rounded-full | 9999px | 圆形元素 |

## 阴影系统

### 浅色模式

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

### 深色模式

```css
.dark {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5);
}
```

## 动画规范

### 过渡时间

| 名称 | 值 | 用途 |
|------|-----|------|
| duration-150 | 150ms | 微交互 |
| duration-200 | 200ms | 按钮、输入框 |
| duration-300 | 300ms | 卡片、模态框 |
| duration-500 | 500ms | 页面切换 |

### 缓动函数

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 常用动画

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 滑入 */
@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 缩放 */
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

## 组件使用规范

### Button

```tsx
// 主要按钮
<Button variant="default" size="default">
  确认
</Button>

// 次要按钮
<Button variant="secondary" size="default">
  取消
</Button>

// 幽灵按钮
<Button variant="ghost" size="sm">
  返回
</Button>
```

### Input

```tsx
// 默认输入框
<Input placeholder="请输入邮箱" />

// 带图标的输入框
<div className="relative">
  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
  <Input className="pl-10" placeholder="请输入邮箱" />
</div>
```

### Card

```tsx
<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle>登录</CardTitle>
    <CardDescription>请输入您的账号信息</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 表单内容 */}
  </CardContent>
  <CardFooter>
    <Button className="w-full">登录</Button>
  </CardFooter>
</Card>
```

## 主题切换实现

### Theme Provider

```tsx
// components/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 主题切换按钮

```tsx
// components/theme-toggle.tsx
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">切换主题</span>
    </Button>
  );
}
```

## Assets 使用

使用 `assets/` 目录下的配置文件：

- `tailwind.config.ts` - Tailwind 完整配置
- `globals.css` - 全局样式和 CSS 变量
- `theme-provider.tsx` - 主题 Provider 组件
- `theme-toggle.tsx` - 主题切换按钮组件
