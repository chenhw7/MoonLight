# MoonLight 前端登录功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现完整的登录/注册前端功能，包括 UI、状态管理、API 集成和测试

**Architecture:** 
- 使用 React + TypeScript + Vite 构建
- 采用 Zustand 进行状态管理
- 使用 TanStack Query 处理服务端状态
- shadcn/ui + Tailwind CSS 构建 UI
- 深色/浅色主题支持

**Tech Stack:** React 18, TypeScript 5, Vite 5, Zustand, TanStack Query, shadcn/ui, Tailwind CSS, Vitest, Playwright

---

## 前置依赖

在开始之前，请确保：
1. Node.js 18+ 已安装
2. 设计文档已阅读：`docs/design/01-login-system-design.md`
3. Skill 文件已就绪：`.trae/skills/moonlight-frontend-standards/`
4. Skill 文件已就绪：`.trae/skills/moonlight-design-system/`
5. Skill 文件已就绪：`.trae/skills/moonlight-testing-standards/`

---

## Task 1: 初始化前端项目

**Files:**
- Create: `frontend/` 目录及所有初始化文件

**Step 1: 创建 Vite 项目**

```bash
cd d:\cv_study\my_github_project
npm create vite@latest frontend -- --template react-ts
```

Expected: 项目创建成功，显示 `Scaffolding project in ...`

**Step 2: 进入项目目录并安装基础依赖**

```bash
cd frontend
npm install
```

Expected: 依赖安装完成，无错误

**Step 3: 安装核心依赖**

```bash
npm install zustand @tanstack/react-query axios react-router-dom lucide-react framer-motion clsx tailwind-merge
```

**Step 4: 安装开发依赖**

```bash
npm install -D tailwindcss postcss autoprefixer @types/node vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 5: 初始化 Tailwind CSS**

```bash
npx tailwindcss init -p
```

Expected: 创建 `tailwind.config.js` 和 `postcss.config.js`

**Step 6: Commit**

```bash
git add .
git commit -m "chore: initialize frontend project with Vite + React + TypeScript"
```

---

## Task 2: 配置开发环境

**Files:**
- Copy: `.trae/skills/moonlight-frontend-standards/assets/tsconfig.json` → `frontend/tsconfig.json`
- Copy: `.trae/skills/moonlight-frontend-standards/assets/vite.config.ts` → `frontend/vite.config.ts`
- Copy: `.trae/skills/moonlight-frontend-standards/assets/eslint.config.js` → `frontend/eslint.config.js`
- Copy: `.trae/skills/moonlight-frontend-standards/assets/prettier.config.js` → `frontend/prettier.config.js`
- Copy: `.trae/skills/moonlight-design-system/assets/tailwind.config.ts` → `frontend/tailwind.config.ts`
- Copy: `.trae/skills/moonlight-design-system/assets/globals.css` → `frontend/src/globals.css`
- Modify: `frontend/src/main.tsx` - 引入全局样式

**Step 1: 复制配置文件**

从 Skill assets 复制所有配置文件到项目目录

**Step 2: 更新入口文件**

```typescript
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Step 3: 验证配置**

```bash
npm run dev
```

Expected: 开发服务器启动成功，访问 http://localhost:3000 正常显示

**Step 4: Commit**

```bash
git add .
git commit -m "chore: configure development environment with ESLint, Prettier, Tailwind"
```

---

## Task 3: 安装 shadcn/ui 组件库

**Files:**
- Create: `frontend/components.json`
- Create: `frontend/src/components/ui/` 目录及组件
- Create: `frontend/src/lib/utils.ts`

**Step 1: 初始化 shadcn/ui**

```bash
npx shadcn-ui@latest init
```

选择配置：
- Style: Default
- Base color: Slate
- CSS variables: Yes

**Step 2: 安装必要组件**

```bash
npx shadcn-ui@latest add button input card label form
```

**Step 3: 验证组件**

修改 `frontend/src/App.tsx` 测试组件：

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>MoonLight</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>测试按钮</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
```

**Step 4: Commit**

```bash
git add .
git commit -m "chore: setup shadcn/ui component library"
```

---

## Task 4: 实现主题切换功能

**Files:**
- Copy: `.trae/skills/moonlight-design-system/assets/theme-provider.tsx` → `frontend/src/components/theme-provider.tsx`
- Copy: `.trae/skills/moonlight-design-system/assets/theme-toggle.tsx` → `frontend/src/components/theme-toggle.tsx`
- Modify: `frontend/src/main.tsx` - 添加 ThemeProvider

**Step 1: 复制主题相关组件**

**Step 2: 更新入口文件**

```typescript
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from '@/components/theme-provider';
import App from './App';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Step 3: 添加主题切换按钮到 App**

```tsx
// frontend/src/App.tsx
import { ThemeToggle } from '@/components/theme-toggle';

function App() {
  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      {/* 其他内容 */}
    </div>
  );
}
```

**Step 4: 测试主题切换**

点击主题切换按钮，验证深色/浅色模式切换正常

**Step 5: Commit**

```bash
git add .
git commit -m "feat: implement theme switching (dark/light mode)"
```

---

## Task 5: 创建日志工具

**Files:**
- Copy: `.trae/skills/moonlight-frontend-standards/assets/utils/logger.ts` → `frontend/src/utils/logger.ts`

**Step 1: 创建 utils 目录并复制日志工具**

**Step 2: 测试日志功能**

在 App.tsx 中添加测试：

```tsx
import { createLogger } from '@/utils/logger';

const logger = createLogger('App');

function App() {
  logger.info('App component mounted');
  // ...
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add frontend logging utility"
```

---

## Task 6: 实现 API 服务层

**Files:**
- Create: `frontend/src/services/api.ts` - axios 实例配置
- Create: `frontend/src/services/auth.ts` - 认证相关 API
- Create: `frontend/src/types/auth.ts` - 认证相关类型

**Step 1: 创建 API 基础配置**

```typescript
// frontend/src/services/api.ts
import axios from 'axios';
import { createLogger } from '@/utils/logger';

const logger = createLogger('API');

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    logger.debug(`${config.method?.toUpperCase()} ${config.url}`, config.params);
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    logger.error('Request error', { error: error.message });
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    logger.debug(`Response ${response.status}`, { url: response.config.url });
    return response.data;
  },
  (error) => {
    logger.error('Response error', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);
```

**Step 2: 创建认证类型定义**

```typescript
// frontend/src/types/auth.ts

export interface User {
  id: number;
  email: string;
  username: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  code: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface CheckEmailResponse {
  exists: boolean;
}

export interface SendCodeRequest {
  email: string;
  type: 'register' | 'reset_password';
}
```

**Step 3: 创建认证 API**

```typescript
// frontend/src/services/auth.ts
import { api } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CheckEmailResponse,
  SendCodeRequest,
} from '@/types/auth';

export const authApi = {
  checkEmail: (email: string) =>
    api.post<CheckEmailResponse>('/auth/check-email', { email }),

  sendCode: (data: SendCodeRequest) =>
    api.post('/auth/send-code', data),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, code, newPassword }),

  refreshToken: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),
};
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: implement API service layer with axios interceptors"
```

---

## Task 7: 实现状态管理 (Zustand)

**Files:**
- Create: `frontend/src/stores/authStore.ts` - 认证状态管理

**Step 1: 创建认证 Store**

```typescript
// frontend/src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createLogger } from '@/utils/logger';
import type { User } from '@/types/auth';

const logger = createLogger('AuthStore');

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        logger.info('Auth set', { userId: user.id });
        set({
          user,
          isAuthenticated: true,
          accessToken,
          refreshToken,
        });
      },

      clearAuth: () => {
        logger.info('Auth cleared');
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: implement auth state management with Zustand"
```

---

## Task 8: 实现登录页面 UI

**Files:**
- Create: `frontend/src/pages/Login/index.tsx` - 登录页面主组件
- Create: `frontend/src/pages/Login/EmailStep.tsx` - 邮箱输入步骤
- Create: `frontend/src/pages/Login/PasswordStep.tsx` - 密码输入步骤
- Create: `frontend/src/pages/Login/RegisterStep.tsx` - 注册步骤
- Create: `frontend/src/pages/Login/CodeStep.tsx` - 验证码步骤
- Modify: `frontend/src/App.tsx` - 添加路由

**Step 1: 创建登录页面目录结构**

**Step 2: 实现邮箱输入步骤**

```tsx
// frontend/src/pages/Login/EmailStep.tsx
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLogger } from '@/utils/logger';

const logger = createLogger('EmailStep');

interface EmailStepProps {
  onSubmit: (email: string, exists: boolean) => void;
}

export function EmailStep({ onSubmit }: EmailStepProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('Email submitted', { email });

    if (!email || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: 调用 API 检查邮箱是否存在
      const exists = false; // 临时值
      onSubmit(email, exists);
    } catch (err) {
      logger.error('Check email failed', { error: (err as Error).message });
      setError('检查邮箱失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">邮箱地址</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="请输入邮箱"
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? '检查中...' : '继续'}
      </Button>
    </form>
  );
}
```

**Step 3: 实现登录页面主组件**

```tsx
// frontend/src/pages/Login/index.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createLogger } from '@/utils/logger';
import { EmailStep } from './EmailStep';

const logger = createLogger('LoginPage');

type LoginStep = 'email' | 'password' | 'code' | 'register';

export function LoginPage() {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');

  logger.debug('LoginPage rendered', { step, email });

  const handleEmailSubmit = (submittedEmail: string, exists: boolean) => {
    setEmail(submittedEmail);
    setStep(exists ? 'password' : 'code');
    logger.info('Email checked', { email: submittedEmail, exists });
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🌙 MoonLight</CardTitle>
          <CardDescription>
            {step === 'email' && '请输入您的邮箱地址'}
            {step === 'password' && '请输入密码'}
            {step === 'code' && '请输入验证码'}
            {step === 'register' && '完善您的信息'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && <EmailStep onSubmit={handleEmailSubmit} />}
          {/* TODO: 其他步骤 */}
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
```

**Step 4: 更新 App.tsx 添加路由**

```tsx
// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme-toggle';
import LoginPage from '@/pages/Login';

function App() {
  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home Page (TODO)</div>} />
      </Routes>
    </div>
  );
}

export default App;
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: implement login page UI with email step"
```

---

## Task 9: 配置测试环境

**Files:**
- Copy: `.trae/skills/moonlight-testing-standards/assets/vitest.config.ts` → `frontend/vitest.config.ts`
- Copy: `.trae/skills/moonlight-testing-standards/assets/test-utils.tsx` → `frontend/tests/test-utils.tsx`
- Create: `frontend/tests/setup.ts` - 测试初始化
- Modify: `frontend/package.json` - 添加测试脚本

**Step 1: 复制测试配置文件**

**Step 2: 创建测试初始化文件**

```typescript
// frontend/tests/setup.ts
import '@testing-library/jest-dom';

// Mock window.matchMedia for theme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
```

**Step 3: 更新 package.json 脚本**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "chore: configure testing environment with Vitest"
```

---

## Task 10: 编写单元测试

**Files:**
- Create: `frontend/tests/unit/components/EmailStep.test.tsx`
- Create: `frontend/tests/unit/stores/authStore.test.ts`

**Step 1: 编写 EmailStep 组件测试**

```tsx
// frontend/tests/unit/components/EmailStep.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/tests/test-utils';
import { EmailStep } from '@/pages/Login/EmailStep';

describe('EmailStep', () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it('应该渲染邮箱输入框', () => {
    render(<EmailStep onSubmit={mockSubmit} />);
    
    expect(screen.getByPlaceholderText('请输入邮箱')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '继续' })).toBeInTheDocument();
  });

  it('输入无效邮箱时应该显示错误', async () => {
    render(<EmailStep onSubmit={mockSubmit} />);
    
    const emailInput = screen.getByPlaceholderText('请输入邮箱');
    const submitButton = screen.getByRole('button', { name: '继续' });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
    });
  });

  it('提交有效邮箱时应该调用 onSubmit', async () => {
    render(<EmailStep onSubmit={mockSubmit} />);
    
    const emailInput = screen.getByPlaceholderText('请输入邮箱');
    const submitButton = screen.getByRole('button', { name: '继续' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('test@example.com', false);
    });
  });
});
```

**Step 2: 编写 Auth Store 测试**

```typescript
// frontend/tests/unit/stores/authStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
    });
  });

  it('初始状态应该未登录', () => {
    const state = useAuthStore.getState();
    
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setAuth 应该更新认证状态', () => {
    const { setAuth } = useAuthStore.getState();
    
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      createdAt: '2024-01-01T00:00:00Z',
    };

    setAuth(mockUser, 'access-token', 'refresh-token');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('access-token');
  });

  it('clearAuth 应该清除认证状态', () => {
    const { setAuth, clearAuth } = useAuthStore.getState();
    
    setAuth(
      { id: 1, email: 'test@example.com', username: 'testuser', createdAt: '' },
      'token',
      'refresh'
    );
    
    clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
```

**Step 3: 运行测试**

```bash
npm run test
```

Expected: 所有测试通过

**Step 4: Commit**

```bash
git add .
git commit -m "test: add unit tests for EmailStep and AuthStore"
```

---

## Task 11: 配置 E2E 测试

**Files:**
- Copy: `.trae/skills/moonlight-testing-standards/assets/playwright.config.ts` → `frontend/playwright.config.ts`
- Create: `frontend/tests/e2e/login.spec.ts`

**Step 1: 安装 Playwright**

```bash
npm install -D @playwright/test
npx playwright install
```

**Step 2: 复制 Playwright 配置**

**Step 3: 编写 E2E 测试**

```typescript
// frontend/tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('登录页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('应该显示登录页面', async ({ page }) => {
    await expect(page.locator('text=MoonLight')).toBeVisible();
    await expect(page.locator('text=请输入您的邮箱地址')).toBeVisible();
  });

  test('应该能输入邮箱', async ({ page }) => {
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill('test@example.com');
    
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('主题切换应该工作', async ({ page }) => {
    const themeToggle = page.locator('[aria-label="切换主题"]');
    
    // 点击切换主题
    await themeToggle.click();
    
    // 验证深色模式类存在
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
```

**Step 4: 运行 E2E 测试**

```bash
npm run test:e2e
```

Expected: 测试通过

**Step 5: Commit**

```bash
git add .
git commit -m "test: setup Playwright and add E2E tests for login page"
```

---

## 完成检查清单

- [ ] 项目初始化完成
- [ ] 开发环境配置完成
- [ ] shadcn/ui 安装完成
- [ ] 主题切换功能实现
- [ ] 日志工具创建
- [ ] API 服务层实现
- [ ] 状态管理实现
- [ ] 登录页面 UI 实现
- [ ] 测试环境配置
- [ ] 单元测试编写
- [ ] E2E 测试编写

---

## 下一步

前端基础架构完成后，可以：
1. 完善登录流程的其他步骤（密码、验证码、注册）
2. 实现后端 API
3. 前后端联调
4. 实现主页/Dashboard
