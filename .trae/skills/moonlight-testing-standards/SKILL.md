---
name: moonlight-testing-standards
description: MoonLight 项目测试规范。包含单元测试、集成测试、E2E测试规范。要求所有功能必须有测试覆盖，覆盖率>80%。在编写测试、添加功能、修改代码时触发。
---

# MoonLight 测试规范

## 测试原则

- **所有功能必须有测试**
- **测试覆盖率 > 80%**
- **测试即文档** - 测试用例应该清晰说明功能行为
- **Given-When-Then** - 使用 BDD 风格描述测试

## 测试金字塔

```
       /\
      /  \     E2E 测试 (少量)
     /____\    
    /      \   集成测试 (中等)
   /________\ 
  /          \ 单元测试 (大量)
 /____________\
```

## 前端测试

### 技术栈

- Vitest (单元测试)
- React Testing Library (组件测试)
- Playwright (E2E 测试)
- @testing-library/jest-dom (DOM 断言)

### 项目结构

```
frontend/
├── src/
│   └── ...
├── tests/
│   ├── unit/           # 单元测试
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── integration/    # 集成测试
│   │   └── api/
│   └── e2e/            # E2E 测试
│       └── auth.spec.ts
├── vitest.config.ts
└── playwright.config.ts
```

### 组件测试规范

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '@/components/LoginForm';

/**
 * LoginForm 组件测试
 *
 * Given: 用户访问登录页面
 * When: 用户输入邮箱并提交
 * Then: 应该根据邮箱是否存在显示不同界面
 */
describe('LoginForm', () => {
  // Given: 渲染登录表单
  const renderLoginForm = (props = {}) => {
    return render(<LoginForm onSuccess={vi.fn()} {...props} />);
  };

  describe('初始状态', () => {
    it('应该显示邮箱输入框', () => {
      // When: 渲染组件
      renderLoginForm();
      
      // Then: 应该看到邮箱输入框
      expect(screen.getByPlaceholderText('请输入邮箱')).toBeInTheDocument();
    });

    it('应该显示继续按钮', () => {
      renderLoginForm();
      expect(screen.getByRole('button', { name: '继续' })).toBeInTheDocument();
    });
  });

  describe('邮箱验证', () => {
    it('输入无效邮箱时应该显示错误', async () => {
      renderLoginForm();
      
      // When: 输入无效邮箱
      const emailInput = screen.getByPlaceholderText('请输入邮箱');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByRole('button', { name: '继续' }));
      
      // Then: 应该显示错误信息
      expect(await screen.findByText('请输入有效的邮箱地址')).toBeInTheDocument();
    });
  });
});
```

### Hook 测试规范

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  it('初始状态应该未登录', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('登录成功后应该更新状态', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).not.toBeNull();
  });
});
```

### API 测试规范

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { authApi } from '@/services/auth';

describe('Auth API', () => {
  describe('POST /auth/login', () => {
    it('应该成功登录并返回用户信息', async () => {
      // Given: Mock 成功响应
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json({
            code: 200,
            data: {
              user: { id: 1, email: 'test@example.com' },
              token: 'fake-token',
            },
          });
        })
      );

      // When: 调用登录 API
      const result = await authApi.login('test@example.com', 'password');

      // Then: 应该返回用户信息
      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('fake-token');
    });

    it('登录失败时应该抛出错误', async () => {
      // Given: Mock 失败响应
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json(
            { code: 401, message: '密码错误' },
            { status: 401 }
          );
        })
      );

      // When/Then: 应该抛出错误
      await expect(
        authApi.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('密码错误');
    });
  });
});
```

### E2E 测试规范

```tsx
import { test, expect } from '@playwright/test';

test.describe('登录流程', () => {
  test('用户应该能够成功登录', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto('/login');

    // When: 输入邮箱并继续
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.click('[data-testid="continue-button"]');

    // 输入密码
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Then: 应该跳转到首页
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('欢迎');
  });
});
```

## 后端测试

### 技术栈

- pytest (测试框架)
- pytest-asyncio (异步测试)
- pytest-cov (覆盖率)
- httpx (HTTP 客户端)

### 项目结构

```
backend/
├── app/
│   └── ...
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # fixtures
│   ├── unit/                # 单元测试
│   │   ├── test_services/
│   │   └── test_utils/
│   ├── integration/         # 集成测试
│   │   └── test_api/
│   └── e2e/                 # E2E 测试
└── pytest.ini
```

### 单元测试规范

```python
import pytest
from unittest.mock import Mock, patch

from app.services.auth_service import AuthService
from app.models.user import User


class TestAuthService:
    """AuthService 单元测试"""
    
    @pytest.fixture
    def auth_service(self):
        return AuthService()
    
    @pytest.fixture
    def mock_user(self):
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        user.is_active = True
        return user
    
    @pytest.mark.asyncio
    async def test_login_with_valid_credentials(self, auth_service, mock_user):
        """
        Given: 有效的邮箱和密码
        When: 调用登录方法
        Then: 应该返回用户对象
        """
        # Given
        with patch.object(auth_service, '_get_user_by_email', return_value=mock_user):
            with patch.object(auth_service, '_verify_password', return_value=True):
                # When
                result = await auth_service.login("test@example.com", "password")
                
                # Then
                assert result.id == 1
                assert result.email == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_login_with_invalid_password(self, auth_service, mock_user):
        """
        Given: 正确的邮箱但错误的密码
        When: 调用登录方法
        Then: 应该抛出 AuthenticationError
        """
        # Given
        with patch.object(auth_service, '_get_user_by_email', return_value=mock_user):
            with patch.object(auth_service, '_verify_password', return_value=False):
                # When/Then
                with pytest.raises(AuthenticationError, match="密码错误"):
                    await auth_service.login("test@example.com", "wrong-password")
```

### API 集成测试规范

```python
import pytest
from httpx import AsyncClient

from app.main import app


@pytest.fixture
async def client():
    """创建测试客户端"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


class TestAuthAPI:
    """认证 API 集成测试"""
    
    @pytest.mark.asyncio
    async def test_check_email_exists(self, client):
        """
        Given: 已存在的邮箱
        When: 调用检查邮箱接口
        Then: 应该返回 exists=true
        """
        # Given: 先创建用户
        # ...
        
        # When
        response = await client.post("/api/v1/auth/check-email", json={
            "email": "existing@example.com"
        })
        
        # Then
        assert response.status_code == 200
        assert response.json()["data"]["exists"] is True
    
    @pytest.mark.asyncio
    async def test_login_success(self, client):
        """
        Given: 已注册的用户
        When: 使用正确的密码登录
        Then: 应该返回访问令牌
        """
        # When
        response = await client.post("/api/v1/auth/login", json={
            "email": "user@example.com",
            "password": "correct-password"
        })
        
        # Then
        assert response.status_code == 200
        data = response.json()["data"]
        assert "access_token" in data
        assert "user" in data
```

### Fixtures 规范

```python
# tests/conftest.py

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

# 测试数据库
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test_db"


@pytest_asyncio.fixture(scope="session")
async def engine():
    """创建测试数据库引擎"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    """创建数据库会话"""
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
def override_get_db(db_session):
    """覆盖数据库依赖"""
    async def _get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = _get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def mock_redis():
    """Mock Redis 客户端"""
    class MockRedis:
        def __init__(self):
            self._data = {}
        
        async def get(self, key):
            return self._data.get(key)
        
        async def setex(self, key, seconds, value):
            self._data[key] = value
        
        async def delete(self, key):
            self._data.pop(key, None)
    
    return MockRedis()
```

## 测试命令

### 前端

```bash
# 运行单元测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e

# 运行特定测试文件
npm run test -- LoginForm.test.tsx
```

### 后端

```bash
# 运行所有测试
pytest

# 运行单元测试
pytest tests/unit

# 运行集成测试
pytest tests/integration

# 生成覆盖率报告
pytest --cov=app --cov-report=html --cov-report=term-missing

# 运行特定测试
pytest tests/unit/test_auth.py::TestAuthService::test_login

# 并行运行测试
pytest -n auto
```

## 覆盖率要求

| 类型 | 目标覆盖率 | 最低覆盖率 |
|------|-----------|-----------|
| 单元测试 | 90% | 80% |
| 集成测试 | 80% | 70% |
| E2E 测试 | 60% | 50% |
| 总体 | 85% | 80% |

## 测试命名规范

- 测试文件: `test_*.py` 或 `*.test.tsx`
- 测试类: `Test*` (Python) 或 `describe('', () => {})` (TS)
- 测试方法: `test_*` (Python) 或 `it('', () => {})` (TS)
- 测试描述: 使用 Given-When-Then 或 应该...的格式

## 测试编写后验证流程（重要！）

编写测试代码后，**必须**执行以下验证步骤：

### 1. 类型检查
```bash
# TypeScript 类型检查
npx tsc --noEmit
```

### 2. 代码规范检查
```bash
# ESLint 检查
npm run lint
```

### 3. 测试运行验证
```bash
# 运行测试
npm run test

# 检查覆盖率
npm run test:coverage
```

### 4. 常见错误检查清单

#### Vitest 测试文件
- [ ] 是否导入了 `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`
- [ ] `vi.spyOn` 类型是否正确（避免使用复杂的 ReturnType 推断）
- [ ] 是否清理了 mock (`vi.clearAllMocks()`)
- [ ] 是否恢复了 spy (`vi.restoreAllMocks()`)

#### 组件测试
- [ ] 是否正确渲染组件
- [ ] 是否等待异步操作 (`waitFor`, `findBy*`)
- [ ] 是否清理 DOM

#### 类型安全
- [ ] 避免使用 `any` 类型
- [ ] 确保所有变量都有正确类型
- [ ] 确保导入完整

## 经验教训

### ❌ 常见错误

1. **忘记导入 Vitest 函数**
   ```typescript
   // ❌ 错误 - 缺少导入
   beforeEach(() => { ... })
   
   // ✅ 正确
   import { beforeEach } from 'vitest';
   beforeEach(() => { ... })
   ```

2. **vi.spyOn 类型问题**
   ```typescript
   // ❌ 错误 - 复杂类型推断
   let spy: ReturnType<typeof vi.spyOn>;
   
   // ✅ 正确 - 使用具体类型
   let consoleLogSpy: ReturnType<typeof vi.spyOn<typeof console, 'log'>>;
   // 或直接使用
   const spy = vi.spyOn(console, 'log');
   ```

3. **没有验证就提交**
   ```bash
   # ❌ 错误 - 直接提交
   git add . && git commit -m "add tests"
   
   # ✅ 正确 - 先验证
   npx tsc --noEmit && npm run lint && npm run test
   git add . && git commit -m "add tests"
   ```

### ✅ 最佳实践

1. **编写测试 → 立即验证 → 修复问题 → 提交**
2. **使用 VS Code 的 TypeScript 插件实时检查类型**
3. **配置 pre-commit hook 自动运行检查**
4. **CI/CD 中强制执行类型检查和测试**

## Assets 使用

使用 `assets/` 目录下的配置文件：

- `vitest.config.ts` - Vitest 配置
- `playwright.config.ts` - Playwright 配置
- `pytest.ini` - pytest 配置
- `conftest.py` - pytest fixtures 模板
- `test-utils.tsx` - 前端测试工具
