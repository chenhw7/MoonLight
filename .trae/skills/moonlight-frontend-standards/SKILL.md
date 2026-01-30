---
name: moonlight-frontend-standards
description: MoonLight 项目前端开发规范。使用 React + TypeScript + Vite 技术栈。包含代码风格、项目结构、组件规范、日志规范。在编写前端代码、创建组件、添加功能时触发。
---

# MoonLight 前端开发规范

## 技术栈

- React 18
- TypeScript 5 (严格模式)
- Vite 5
- Zustand (状态管理)
- TanStack Query + axios (数据获取)
- shadcn/ui + Tailwind CSS (UI)
- Framer Motion (动画)

## 项目结构

```
frontend/
├── src/
│   ├── components/          # 通用组件
│   │   ├── ui/             # shadcn/ui 组件
│   │   └── common/         # 自定义通用组件
│   ├── pages/              # 页面组件
│   ├── hooks/              # 自定义 Hooks
│   ├── services/           # API 请求
│   ├── stores/             # 状态管理 (Zustand)
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型
│   ├── lib/                # 工具库
│   └── App.tsx
├── tests/                  # 测试文件
├── public/
└── package.json
```

## 代码规范

### TypeScript 严格模式

必须开启以下配置：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**禁止**使用 `any` 类型。

### 组件规范

1. 使用函数式组件 + Hooks
2. 必须定义 Props 类型
3. 必须写 JSDoc 注释
4. 组件名使用 PascalCase

```typescript
/**
 * 登录表单组件
 * 
 * @param onSuccess - 登录成功回调
 * @param redirectUrl - 登录成功后跳转地址
 */
interface LoginFormProps {
  onSuccess: (user: User) => void;
  redirectUrl?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectUrl = '/dashboard' }) => {
  // ...
};
```

### 日志规范

每个组件/函数必须记录日志：

```typescript
import { logger } from '@/utils/logger';

const handleLogin = async (email: string, password: string) => {
  logger.info('Login attempt', { email, timestamp: Date.now() });
  
  try {
    const result = await loginApi(email, password);
    logger.info('Login successful', { email, userId: result.id });
    return result;
  } catch (error) {
    logger.error('Login failed', { email, error: error.message });
    throw error;
  }
};
```

### API 调用规范

使用 TanStack Query + axios：

```typescript
// services/api.ts
import axios from 'axios';
import { logger } from '@/utils/logger';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// 请求拦截器 - 记录日志
api.interceptors.request.use((config) => {
  logger.debug('API Request', { 
    method: config.method, 
    url: config.url,
    params: config.params 
  });
  return config;
});

// 响应拦截器 - 记录日志
api.interceptors.response.use(
  (response) => {
    logger.debug('API Response', { 
      status: response.status,
      url: response.config.url 
    });
    return response;
  },
  (error) => {
    logger.error('API Error', { 
      url: error.config?.url,
      status: error.response?.status,
      message: error.message 
    });
    return Promise.reject(error);
  }
);
```

### 状态管理规范

使用 Zustand：

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { logger } from '@/utils/logger';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (email, password) => {
    logger.info('Auth store: login called', { email });
    // ...
  },
  
  logout: () => {
    logger.info('Auth store: logout called');
    set({ user: null, isAuthenticated: false });
  },
}));
```

## Assets 使用

使用 `assets/` 目录下的配置文件：

- `tsconfig.json` - TypeScript 配置
- `vite.config.ts` - Vite 配置
- `eslint.config.js` - ESLint 配置
- `prettier.config.js` - Prettier 配置
- `templates/component.tsx` - 组件模板
- `utils/logger.ts` - 日志工具

## Git 提交规范

遵循 Conventional Commits：

```
feat(auth): 添加登录表单组件
fix(api): 修复登录接口错误处理
docs(readme): 更新项目说明
```
