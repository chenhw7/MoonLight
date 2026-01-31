# MoonLight

MoonLight 是一个全栈项目，包含现代化的前端界面和强大的后端 API 服务。

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **路由**: React Router DOM
- **测试**: Vitest + React Testing Library + Playwright

### 后端
- **框架**: FastAPI (Python 3.11+)
- **数据库**: PostgreSQL 16
- **缓存**: Redis 7
- **ORM**: SQLAlchemy 2.0
- **迁移**: Alembic
- **认证**: JWT + bcrypt
- **邮件**: QQ邮箱 SMTP
- **测试**: pytest + pytest-asyncio

### 部署
- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx (前端)
- **应用服务器**: Uvicorn (后端)

## 项目结构

```
moonlight/
├── frontend/              # 前端项目
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── store/         # 状态管理
│   │   ├── lib/           # 工具函数
│   │   └── tests/         # 测试文件
│   ├── public/            # 静态资源
│   └── package.json
│
├── backend/               # 后端项目
│   ├── app/
│   │   ├── api/           # API 路由
│   │   ├── core/          # 核心配置
│   │   ├── models/        # 数据库模型
│   │   ├── schemas/       # Pydantic 模型
│   │   ├── services/      # 业务逻辑
│   │   └── utils/         # 工具函数
│   ├── tests/             # 测试文件
│   ├── alembic/           # 数据库迁移
│   └── requirements.txt
│
├── docker-compose.yml     # Docker 编排配置
└── README.md
```

## 快速开始

### 环境要求
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Git

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd moonlight
```

### 2. 启动基础设施

使用 Docker 启动 PostgreSQL 和 Redis：

```bash
docker-compose up -d postgres redis
```

### 3. 配置后端

#### 3.1 创建虚拟环境

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

#### 3.2 安装依赖

```bash
pip install -r requirements.txt
```

#### 3.3 配置环境变量

编辑 `.env` 文件：

```env
# 数据库配置
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/moonlight

# 邮件配置（QQ邮箱）
EMAIL_ENABLED=true
EMAIL_USERNAME=your-qq@qq.com
EMAIL_PASSWORD=your-auth-code
EMAIL_SENDER=your-qq@qq.com

# 其他配置保持默认...
```

#### 3.4 初始化数据库

```bash
python init_db.py
```

#### 3.5 启动后端服务

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

后端服务将运行在 http://localhost:8000

API 文档：http://localhost:8000/docs

### 4. 配置前端

#### 4.1 安装依赖

```bash
cd frontend
npm install
```

#### 4.2 启动开发服务器

```bash
npm run dev
```

前端服务将运行在 http://localhost:3000

## 开发指南

### 同时启动前后端

#### 方式一：使用多个终端

**终端 1 - 后端：**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**终端 2 - 前端：**
```bash
cd frontend
npm run dev
```

#### 方式二：使用 Docker Compose（推荐生产环境）

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 运行测试

#### 后端测试

```bash
cd backend
pytest tests/ -v
```

#### 前端测试

```bash
cd frontend
# 单元测试
npm run test

# E2E 测试
npm run test:e2e
```

### 数据库操作

#### 查看数据库

```bash
# 进入 PostgreSQL 容器
docker exec -it moonlight-postgres psql -U postgres -d moonlight

# 常用命令
\dt                    # 查看所有表
SELECT * FROM users;   # 查看用户表
SELECT * FROM verification_codes;  # 查看验证码表
\q                     # 退出
```

#### 数据库迁移（使用 Alembic）

```bash
cd backend

# 创建迁移
alembic revision --autogenerate -m "描述"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

## 功能特性

### 已实现
- ✅ 用户注册/登录
- ✅ JWT 认证
- ✅ 邮箱验证码（QQ邮箱 SMTP）
- ✅ 密码重置
- ✅ 请求频率限制
- ✅ 结构化日志
- ✅ 单元测试覆盖
- ✅ Docker 部署

### 待实现
- 📝 用户资料管理
- 📝 前端页面完善
- 📝 日志可视化界面
- 📝 生产环境部署

## API 端点

### 认证相关

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新令牌 |
| POST | `/api/v1/auth/verification-code` | 发送验证码 |
| POST | `/api/v1/auth/reset-password` | 重置密码 |

### 健康检查

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/health` | 服务健康状态 |
| GET | `/` | 欢迎信息 |

## 配置说明

### 后端环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `APP_ENV` | 应用环境 | development |
| `DATABASE_URL` | 数据库连接 | postgresql+asyncpg://... |
| `REDIS_URL` | Redis 连接 | redis://localhost:6379/0 |
| `SECRET_KEY` | JWT 密钥 | - |
| `EMAIL_ENABLED` | 启用邮件 | true |
| `EMAIL_USERNAME` | 邮箱地址 | - |
| `EMAIL_PASSWORD` | 邮箱授权码 | - |

### 前端环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | API 基础地址 | http://localhost:8000 |

## 常见问题

### 1. 邮件发送失败

**问题**：验证码邮件发送失败

**解决**：
1. 检查 QQ 邮箱 SMTP 服务是否开启
2. 确认使用的是授权码而非 QQ 密码
3. 查看后端日志获取详细错误信息

### 2. 数据库连接失败

**问题**：无法连接 PostgreSQL

**解决**：
```bash
# 检查容器状态
docker ps

# 重启数据库容器
docker-compose restart postgres

# 检查日志
docker logs moonlight-postgres
```

### 3. 前端无法连接后端

**问题**：前端请求 API 失败

**解决**：
1. 确认后端服务已启动
2. 检查 `.env` 中的 `VITE_API_BASE_URL`
3. 确认没有防火墙阻挡

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE)

## 联系方式

- 项目作者：[Your Name]
- 邮箱：331401425@qq.com
- 项目主页：[Your Project URL]

---

**MoonLight** - 月光照亮你的代码之路 🌙
