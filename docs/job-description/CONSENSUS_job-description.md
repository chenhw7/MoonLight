# JD管理功能 - 共识文档

## 文档信息
- **任务名称**: 企业JD（职位描述）管理功能
- **创建日期**: 2026-02-25
- **文档类型**: CONSENSUS (共识阶段)
- **前置文档**: ALIGNMENT_job-description.md

---

## 1. 明确的需求描述

### 1.1 功能需求

**FR-001: JD录入功能**
- 支持文本粘贴方式录入：用户复制JD原文粘贴，系统保存原始文本
- 支持结构化表单录入：填写公司名、职位名、职位描述
- 支持两种录入方式的切换

**FR-002: JD管理功能**
- JD列表展示：卡片式布局，展示公司名、职位名、创建时间
- JD搜索：按公司名、职位名搜索
- JD筛选：按标签筛选
- JD编辑：修改已有JD信息
- JD删除：删除JD（需确认）

**FR-003: 简历关联功能**
- 在简历编辑页面可选择关联的JD
- 支持一份简历关联多个JD
- 支持取消关联

**FR-004: AI解析预留**
- 后端预留AI解析接口
- 支持将原始文本解析为结构化数据
- Phase 1仅实现接口框架

### 1.2 非功能需求

| 需求项 | 要求 |
|--------|------|
| 性能 | 列表页加载<1s，搜索响应<500ms |
| 可用性 | 支持断网草稿保存（前端状态管理） |
| 安全 | 用户只能访问自己的JD数据 |
| 扩展性 | 预留AI解析接口，便于后续扩展 |

---

## 2. 技术实现方案

### 2.1 技术栈确认

| 层级 | 技术 | 版本/说明 |
|------|------|----------|
| 前端 | React + TypeScript | 与现有项目一致 |
| 状态管理 | Zustand | 与简历模块一致 |
| 表单处理 | React Hook Form + Zod | 与现有项目一致 |
| UI组件 | shadcn/ui | 与现有项目一致 |
| 后端 | FastAPI + SQLAlchemy | 与现有项目一致 |
| 数据库 | PostgreSQL | 复用现有数据库 |
| 迁移工具 | Alembic | 与现有项目一致 |

### 2.2 数据库设计

```sql
-- JD表
CREATE TABLE job_descriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 核心字段（3项）
    company_name VARCHAR(100) NOT NULL,
    position_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    
    -- 扩展字段
    salary_range VARCHAR(50),
    location VARCHAR(100),
    
    -- 原始数据
    raw_text TEXT,
    source VARCHAR(50),
    url TEXT,
    
    -- 元数据
    tags TEXT[],
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 简历-JD关联表
CREATE TABLE resume_jds (
    id SERIAL PRIMARY KEY,
    resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    jd_id INTEGER NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(resume_id, jd_id)
);

-- 索引
CREATE INDEX idx_jds_user_id ON job_descriptions(user_id);
CREATE INDEX idx_jds_company ON job_descriptions(company_name);
CREATE INDEX idx_jds_position ON job_descriptions(position_name);
CREATE INDEX idx_jds_created ON job_descriptions(created_at DESC);
CREATE INDEX idx_resume_jds_resume ON resume_jds(resume_id);
CREATE INDEX idx_resume_jds_jd ON resume_jds(jd_id);
```

### 2.3 API设计

#### JD管理API

```yaml
# 创建JD
POST /api/v1/jds
Request:
  company_name: string (required)
  position_name: string (required)
  description: string (required)
  salary_range?: string
  location?: string
  raw_text?: string
  source?: string
  url?: string
  tags?: string[]
Response: JobDescriptionResponse

# 获取JD列表
GET /api/v1/jds?page=1&page_size=10&keyword=&tag=
Response: {
  items: JobDescriptionResponse[],
  total: number,
  page: number,
  page_size: number
}

# 获取JD详情
GET /api/v1/jds/{id}
Response: JobDescriptionResponse

# 更新JD
PUT /api/v1/jds/{id}
Request: (同创建，字段可选)
Response: JobDescriptionResponse

# 删除JD
DELETE /api/v1/jds/{id}
Response: { success: true }

# AI解析JD（预留）
POST /api/v1/jds/parse
Request:
  raw_text: string (required)
Response: {
  company_name?: string
  position_name?: string
  description?: string
  salary_range?: string
  location?: string
}
```

#### 简历关联API

```yaml
# 获取简历关联的JD列表
GET /api/v1/resumes/{resume_id}/jds
Response: JobDescriptionResponse[]

# 关联JD到简历
POST /api/v1/resumes/{resume_id}/jds
Request:
  jd_id: number (required)
  notes?: string
Response: ResumeJDLinkResponse

# 取消关联
DELETE /api/v1/resumes/{resume_id}/jds/{jd_id}
Response: { success: true }
```

---

## 3. 技术约束和集成方案

### 3.1 与现有系统集成

| 集成点 | 方案 |
|--------|------|
| 用户认证 | 复用现有JWT认证机制 |
| 数据库 | 复用现有PostgreSQL连接 |
| 日志系统 | 复用现有结构化日志 |
| 错误处理 | 复用现有异常处理机制 |
| 响应格式 | 复用现有ResponseModel |

### 3.2 代码组织

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── __init__.py
│   │   └── job_descriptions.py    # JD路由
│   ├── models/
│   │   └── job_description.py     # JD模型
│   ├── schemas/
│   │   └── job_description.py     # JD Schema
│   └── services/
│       └── job_description_service.py  # JD服务
└── alembic/versions/
    └── 2026_02_25_xxx_add_job_description_tables.py

frontend/
├── src/
│   ├── pages/
│   │   └── JobDescription/
│   │       ├── JDList.tsx         # JD列表页
│   │       ├── JDCreate.tsx       # 新建JD页
│   │       ├── JDEdit.tsx         # 编辑JD页
│   │       └── components/        # JD相关组件
│   ├── services/
│   │   └── jobDescription.ts      # JD API服务
│   ├── types/
│   │   └── jobDescription.ts      # JD类型定义
│   └── stores/
│       └── jdStore.ts             # JD状态管理
```

---

## 4. 任务边界限制

### 4.1 明确包含

- ✅ JD的CRUD完整功能
- ✅ 文本粘贴录入界面
- ✅ 结构化表单录入界面
- ✅ JD列表展示、搜索、筛选
- ✅ 简历与JD的关联功能
- ✅ 数据库表和迁移脚本
- ✅ 后端API完整实现
- ✅ 前端页面完整实现
- ✅ 单元测试覆盖

### 4.2 明确排除

- ❌ AI解析具体实现（仅预留接口）
- ❌ JD自动抓取功能
- ❌ 简历智能匹配算法
- ❌ 简历自动优化功能
- ❌ JD分享功能
- ❌ 多用户协作功能

---

## 5. 验收标准

### 5.1 功能验收

| 验收项 | 验收标准 |
|--------|---------|
| JD创建 | 可通过表单创建JD，数据正确保存 |
| 文本录入 | 支持大段文本粘贴，保留原始内容 |
| JD列表 | 列表展示正常，支持分页 |
| JD搜索 | 按关键词搜索返回正确结果 |
| JD编辑 | 可修改JD信息，更新成功 |
| JD删除 | 删除需确认，删除后不可见 |
| 简历关联 | 可在简历页关联/取消关联JD |
| 数据隔离 | 用户只能看到自己的JD |

### 5.2 技术验收

| 验收项 | 验收标准 |
|--------|---------|
| 代码规范 | 通过eslint/ruff检查 |
| 类型检查 | 通过TypeScript/mypy检查 |
| 测试覆盖 | 单元测试覆盖率>80% |
| API文档 | 自动生成Swagger文档 |
| 数据库 | 迁移脚本可正常执行 |

---

## 6. 确认清单

- [x] 明确的实现需求（无歧义）
- [x] 明确的子任务定义（见TASK文档）
- [x] 明确的边界和限制
- [x] 明确的验收标准
- [x] 代码、测试、文档质量标准

---

## 7. 风险与依赖

### 7.1 依赖项

| 依赖 | 状态 | 说明 |
|------|------|------|
| 用户认证系统 | ✅ 已存在 | 复用现有JWT认证 |
| 简历模块 | ✅ 已存在 | 需要在其上增加关联功能 |
| 数据库 | ✅ 已存在 | 复用现有PostgreSQL |

### 7.2 风险缓解

| 风险 | 缓解措施 |
|------|---------|
| AI解析复杂度 | Phase 1仅实现接口框架，不实现具体逻辑 |
| 前端状态管理 | 复用现有Zustand模式，降低学习成本 |

---

**文档状态**: 已完成  
**最后更新**: 2026-02-25  
**下一步**: 进入DESIGN阶段，完成详细设计
