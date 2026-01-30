# MoonLight 登录系统设计文档

> 项目代号：MoonLight（月光）
> 创建日期：2026-01-30
> 文档版本：v1.0

---

## 1. 项目概述

### 1.1 项目背景
MoonLight 是一个全栈项目，采用现代化的技术栈和严格的代码规范，确保项目从一开始就具备高可维护性和可扩展性。

### 1.2 设计目标
- 简洁优雅的用户体验
- 完善的深色/浅色主题支持
- 严格的代码规范和日志体系
- 容器化部署支持

---

## 2. 功能设计

### 2.1 登录/注册流程

```
┌─────────────────────────────────────────┐
│              访问 /login                │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  输入邮箱 → 检测是否存在                 │
└─────────────────────────────────────────┘
           ↓                 ↓
    ┌──────┴──────┐   ┌──────┴──────┐
    │   已存在     │   │   未存在     │
    │  (登录流程)  │   │  (注册流程)  │
    └──────┬──────┘   └──────┬──────┘
           ↓                 ↓
    ┌──────────────┐  ┌──────────────┐
    │ 输入密码      │  │ 输入验证码    │
    │ [忘记密码?]   │  │ (验证邮箱)    │
    └──────────────┘  └──────┬───────┘
           ↓                 ↓
    ┌──────────────┐  ┌──────────────┐
    │ 登录成功 ✓   │  │ 设置用户名    │
    │ 进入系统     │  │ 设置密码      │
    └──────────────┘  └──────┬───────┘
                             ↓
                      ┌──────────────┐
                      │ 注册成功 ✓   │
                      │ 进入系统     │
                      └──────────────┘
```

### 2.2 页面状态设计

| 状态 | 显示内容 | 说明 |
|------|----------|------|
| **初始** | 邮箱输入框 + 继续按钮 | 用户输入邮箱地址 |
| **登录模式** | 密码输入框 + 登录按钮 + 忘记密码链接 | 邮箱已存在 |
| **注册-验证** | 验证码输入框 + 倒计时重发 | 发送6位数字验证码 |
| **注册-信息** | 用户名输入 + 密码输入 + 确认密码 | 完善用户信息 |

### 2.3 忘记密码流程

```
输入邮箱 → 发送验证码 → 验证通过 → 设置新密码 → 重置成功
```

---

## 3. 安全策略

### 3.1 验证码策略

| 项目 | 设置值 | 说明 |
|------|--------|------|
| 验证码长度 | 6位数字 | 易输入，安全性足够 |
| 有效期 | 10分钟 | 给用户足够时间 |
| 重发冷却 | 60秒 | 防止刷接口 |
| 每日上限 | 10次/邮箱 | 防滥用 |
| 错误次数 | 5次后锁定15分钟 | 防暴力破解 |

### 3.2 密码策略

| 项目 | 要求 |
|------|------|
| 最小长度 | 8位 |
| 复杂度 | 必须包含大小写字母和数字 |
| 存储方式 | bcrypt 哈希 |

### 3.3 用户名规则

| 项目 | 规则 |
|------|------|
| 字符限制 | 仅允许英文字母、数字、下划线 |
| 长度限制 | 2-20字符 |
| 唯一性 | 全局唯一，不可重复 |

---

## 4. 技术架构

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端 (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   React 18  │  │   Zustand   │  │  TanStack Query │  │
│  │  TypeScript │  │  状态管理   │  │   数据获取      │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┴───────────────────────────────┐
│                      后端 (FastAPI)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   FastAPI   │  │  SQLAlchemy │  │   Pydantic      │  │
│  │   Python    │  │    ORM      │  │   数据验证      │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │    Redis      │  │  SMTP/邮件    │
│   主数据库     │  │  缓存/会话    │  │  验证码发送   │
└───────────────┘  └───────────────┘  └───────────────┘
```

### 4.2 技术栈详情

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | React | 18.x | UI 渲染 |
| 前端语言 | TypeScript | 5.x | 类型安全 |
| 构建工具 | Vite | 5.x | 快速构建 |
| 状态管理 | Zustand | 4.x | 全局状态 |
| UI 组件 | shadcn/ui | latest | 组件库 |
| 样式 | Tailwind CSS | 3.x | 原子化CSS |
| HTTP客户端 | TanStack Query + axios | latest | 数据获取 |
| 后端框架 | FastAPI | 0.104+ | API服务 |
| ORM | SQLAlchemy | 2.x | 数据库操作 |
| 数据库 | PostgreSQL | 16 | 数据存储 |
| 缓存 | Redis | 7 | 会话/验证码缓存 |
| 迁移工具 | Alembic | latest | 数据库迁移 |
| 部署 | Docker + Docker Compose | latest | 容器化部署 |

---

## 5. 数据库设计

### 5.1 用户表 (users)

```sql
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(20) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 5.2 验证码表 (verification_codes)

```sql
CREATE TABLE verification_codes (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    code            VARCHAR(6) NOT NULL,
    type            VARCHAR(20) NOT NULL,  -- 'register', 'reset_password'
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    used            BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);
```

### 5.3 会话表 (sessions) - 可选，如使用 JWT 可省略

```sql
CREATE TABLE sessions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(255) UNIQUE NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

---

## 6. API 设计

### 6.1 接口列表

| 操作 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 检查邮箱 | POST | /api/v1/auth/check-email | 返回邮箱是否存在 |
| 发送验证码 | POST | /api/v1/auth/send-code | 发送邮箱验证码 |
| 注册 | POST | /api/v1/auth/register | 验证码+用户名+密码 |
| 登录 | POST | /api/v1/auth/login | 邮箱+密码 |
| 重置密码 | POST | /api/v1/auth/reset-password | 验证码+新密码 |
| 刷新Token | POST | /api/v1/auth/refresh | 刷新访问令牌 |

### 6.2 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { }
}
```

### 6.3 错误响应格式

```json
{
  "code": 400,
  "message": "验证码已过期",
  "error": "VERIFICATION_EXPIRED"
}
```

---

## 7. 代码规范

### 7.1 Python 后端规范

#### 项目结构
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── core/                # 核心配置
│   │   ├── config.py        # 配置管理
│   │   ├── logging.py       # 日志配置
│   │   └── security.py      # 安全工具
│   ├── api/                 # API 路由
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── auth.py      # 认证相关接口
│   ├── models/              # 数据库模型
│   │   ├── __init__.py
│   │   └── user.py
│   ├── schemas/             # Pydantic 模型
│   │   ├── __init__.py
│   │   └── auth.py
│   ├── services/            # 业务逻辑
│   │   ├── __init__.py
│   │   └── auth_service.py
│   └── utils/               # 工具函数
│       ├── __init__.py
│       └── email.py
├── tests/                   # 测试
├── alembic/                 # 数据库迁移
├── Dockerfile
├── requirements.txt
└── .env.example
```

#### 代码风格
- 遵循 PEP 8
- 使用 Black 格式化（行宽 88 字符）
- 使用 isort 排序导入
- 类型注解必须完整

#### 注释规范
```python
async def send_verification_code(email: str, code_type: str) -> bool:
    """
    发送邮箱验证码
    
    根据指定的类型发送验证码到用户邮箱，用于注册或密码重置。
    验证码有效期为10分钟，同一邮箱60秒内只能发送一次。
    
    Args:
        email: 用户邮箱地址
        code_type: 验证码类型 ('register' 或 'reset_password')
        
    Returns:
        bool: 发送成功返回 True，否则返回 False
        
    Raises:
        EmailSendError: 邮件服务异常时抛出
        RateLimitError: 触发频率限制时抛出
        
    Example:
        >>> success = await send_verification_code("user@example.com", "register")
        >>> print(success)
        True
    """
```

### 7.2 React 前端规范

#### 项目结构
```
frontend/
├── src/
│   ├── components/          # 通用组件
│   │   ├── ui/             # shadcn/ui 组件
│   │   └── common/         # 自定义通用组件
│   ├── pages/              # 页面组件
│   │   └── Login/
│   ├── hooks/              # 自定义 Hooks
│   ├── services/           # API 请求
│   │   └── api.ts
│   ├── stores/             # 状态管理
│   │   └── authStore.ts
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型
│   ├── lib/                # 工具库
│   └── App.tsx
├── public/
├── tests/
├── Dockerfile
├── package.json
└── tailwind.config.ts
```

#### 代码风格
- TypeScript 严格模式
- ESLint + Prettier
- 组件使用函数式 + Hooks
- 禁止使用 any

#### 注释规范
```typescript
/**
 * 登录表单组件
 * 
 * 支持邮箱检测、验证码登录/注册、密码登录等功能。
 * 自动根据邮箱是否存在切换登录/注册模式。
 * 
 * @param onSuccess - 登录成功回调函数
 * @param redirectUrl - 登录成功后跳转地址，默认为 '/dashboard'
 * 
 * @example
 * ```tsx
 * <LoginForm 
 *   onSuccess={(user) => console.log('欢迎', user.username)}
 *   redirectUrl="/home"
 * />
 * ```
 */
const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectUrl = '/dashboard' }) => {
  // ...
}
```

### 7.3 Git 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型说明：**

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复bug |
| docs | 文档更新 |
| style | 代码格式（不影响功能）|
| refactor | 重构 |
| test | 测试相关 |
| chore | 构建/工具/依赖更新 |

**示例：**
```
feat(auth): 添加邮箱验证码登录功能

- 实现验证码生成和发送逻辑
- 添加 Redis 缓存支持
- 集成 SMTP 邮件服务

Closes #123
```

---

## 8. 日志规范

### 8.1 日志级别（生产环境）

| 级别 | 使用场景 | 是否记录 |
|------|----------|----------|
| DEBUG | 开发调试 | 否 |
| INFO | 业务流程 | 是 |
| WARNING | 警告信息 | 是 |
| ERROR | 错误异常 | 是 |
| CRITICAL | 严重错误 | 是 |

### 8.2 日志格式（参考 Google/阿里规范）

```
2024-01-30 14:32:15.234 | INFO     | user_service:login | user@example.com | Login successful | latency=45ms | ip=192.168.1.1
```

**字段说明：**
- 时间戳（精确到毫秒）
- 日志级别
- 模块:函数名
- 用户标识
- 消息
- 关键指标（延迟、状态码等）

### 8.3 日志分类

| 类型 | 存储 | 保留期 | 内容 |
|------|------|--------|------|
| 访问日志 | 文件 | 15天 | 请求IP、路径、状态码、耗时 |
| 业务日志 | 文件+数据库 | 15天 | 登录、注册等业务操作 |
| 错误日志 | 文件 | 15天 | 异常堆栈、错误详情 |
| 审计日志 | 数据库 | 90天 | 敏感操作（改密码等）|

### 8.4 TODO：日志可视化界面

- 管理后台查看日志
- 支持按时间、级别、模块筛选
- 实时日志流

---

## 9. 部署设计

### 9.1 Docker 架构

```yaml
# docker-compose.yml 概览
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

### 9.2 环境变量管理

使用 `.env` 文件管理配置，禁止提交敏感信息到代码库。

---

## 10. 视觉设计

### 10.1 设计原则

- **简约现代**：大量留白，清晰层次
- **流畅动画**：渐变背景、微交互动效
- **主题切换**：深色/浅色模式无缝切换

### 10.2 色彩方案

#### 浅色模式
- 背景：渐变（#667eea → #764ba2）
- 卡片：白色（rgba(255,255,255,0.95)）
- 文字：深灰（#1f2937）
- 主色：紫色（#667eea）

#### 深色模式
- 背景：深渐变（#1a1a2e → #16213e）
- 卡片：深灰（rgba(30,30,46,0.95)）
- 文字：浅灰（#e5e7eb）
- 主色：亮紫（#8b5cf6）

### 10.3 页面布局

```
┌─────────────────────────────────────────┐
│                                         │
│    [动态渐变背景 - 深色/浅色自适应]         │
│                                         │
│         ┌─────────────────┐             │
│         │                 │             │
│         │   🌙 MoonLight  │             │
│         │                 │             │
│         │   ┌───────────┐ │             │
│         │   │ 邮箱输入   │ │             │
│         │   └───────────┘ │             │
│         │                 │             │
│         │   [  继续  ]    │             │
│         │                 │             │
│         │   ─── 或 ───    │             │
│         │                 │             │
│         │  [第三方登录]   │             │
│         │   (后续支持)    │             │
│         │                 │             │
│         └─────────────────┘             │
│                                         │
│         [ 🔆 / 🌙 主题切换 ]             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 11. 后续规划

### 11.1 第一阶段（当前）
- [ ] 登录/注册页面实现
- [ ] 后端 API 实现
- [ ] Docker 部署配置

### 11.2 第二阶段
- [ ] 用户管理后台
- [ ] 日志可视化界面
- [ ] 第三方登录集成

### 11.3 第三阶段
- [ ] 沙盒环境支持
- [ ] 多租户支持
- [ ] 性能优化

---

## 12. 附录

### 12.1 参考资料
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [React 官方文档](https://react.dev/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### 12.2 变更记录

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2026-01-30 | 初始版本 |

---

*文档结束*
