import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from '@/components/theme-provider';

/**
 * 创建测试用的 QueryClient
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

interface AllProvidersProps {
  children: React.ReactNode;
}

/**
 * 所有 Provider 包装器
 */
function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * 自定义 render 函数
 * 
 * 自动包装所有必要的 Provider
 * 
 * @example
 * ```tsx
 * const { getByText } = render(<MyComponent />);
 * ```
 */
export function render(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

/**
 * 等待指定时间
 * 
 * @param ms - 等待毫秒数
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 模拟 API 响应
 * 
 * @param data - 响应数据
 * @param delay - 延迟时间（毫秒）
 */
export function mockApiResponse<T>(
  data: T,
  delay: number = 100
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * 模拟 API 错误
 * 
 * @param message - 错误信息
 * @param delay - 延迟时间（毫秒）
 */
export function mockApiError(
  message: string = 'API Error',
  delay: number = 100
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
}

/**
 * 创建 mock 用户
 */
export function createMockUser(overrides = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * 创建 mock 登录响应
 */
export function createMockLoginResponse(overrides = {}) {
  return {
    user: createMockUser(),
    accessToken: 'fake-access-token',
    refreshToken: 'fake-refresh-token',
    ...overrides,
  };
}

// 重新导出 testing-library 的所有内容
export * from '@testing-library/react';
export { rtlRender };
