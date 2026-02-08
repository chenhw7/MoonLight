# 简历功能 API 接口设计文档

## 1. 概述

本文档定义简历生成功能的 RESTful API 接口规范，遵循项目现有的 API 设计模式。

### 1.1 基础信息

- **Base URL**: `/api/v1/resumes`
- **认证方式**: JWT Token (Bearer)
- **响应格式**: 统一使用 `ResponseModel<T>` 包装

### 1.2 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 1.3 错误响应格式

```json
{
  "code": 400,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": {}
}
```

---

## 2. 接口列表

### 2.1 简历管理接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/resumes` | 获取简历列表 | 是 |
| POST | `/resumes` | 创建简历 | 是 |
| GET | `/resumes/{id}` | 获取简历详情 | 是 |
| PUT | `/resumes/{id}` | 更新简历 | 是 |
| DELETE | `/resumes/{id}` | 删除简历 | 是 |
| POST | `/resumes/{id}/clone` | 复制简历 | 是 |

### 2.2 子模块接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/resumes/{id}/educations` | 添加教育经历 | 是 |
| PUT | `/resumes/{id}/educations/{edu_id}` | 更新教育经历 | 是 |
| DELETE | `/resumes/{id}/educations/{edu_id}` | 删除教育经历 | 是 |
| POST | `/resumes/{id}/work-experiences` | 添加工作/实习经历 | 是 |
| PUT | `/resumes/{id}/work-experiences/{exp_id}` | 更新工作/实习经历 | 是 |
| DELETE | `/resumes/{id}/work-experiences/{exp_id}` | 删除工作/实习经历 | 是 |
| POST | `/resumes/{id}/projects` | 添加项目经历 | 是 |
| PUT | `/resumes/{id}/projects/{proj_id}` | 更新项目经历 | 是 |
| DELETE | `/resumes/{id}/projects/{proj_id}` | 删除项目经历 | 是 |
| POST | `/resumes/{id}/skills` | 添加技能 | 是 |
| PUT | `/resumes/{id}/skills/{skill_id}` | 更新技能 | 是 |
| DELETE | `/resumes/{id}/skills/{skill_id}` | 删除技能 | 是 |
| POST | `/resumes/{id}/languages` | 添加语言能力 | 是 |
| PUT | `/resumes/{id}/languages/{lang_id}` | 更新语言能力 | 是 |
| DELETE | `/resumes/{id}/languages/{lang_id}` | 删除语言能力 | 是 |
| POST | `/resumes/{id}/awards` | 添加获奖经历 | 是 |
| PUT | `/resumes/{id}/awards/{award_id}` | 更新获奖经历 | 是 |
| DELETE | `/resumes/{id}/awards/{award_id}` | 删除获奖经历 | 是 |
| POST | `/resumes/{id}/portfolios` | 添加作品 | 是 |
| PUT | `/resumes/{id}/portfolios/{portfolio_id}` | 更新作品 | 是 |
| DELETE | `/resumes/{id}/portfolios/{portfolio_id}` | 删除作品 | 是 |
| POST | `/resumes/{id}/social-links` | 添加社交账号 | 是 |
| PUT | `/resumes/{id}/social-links/{link_id}` | 更新社交账号 | 是 |
| DELETE | `/resumes/{id}/social-links/{link_id}` | 删除社交账号 | 是 |

### 2.3 预览与导出接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/resumes/{id}/preview` | 获取简历预览数据 | 是 |
| POST | `/resumes/{id}/export/pdf` | 导出PDF | 是 |

---

## 3. 接口详细定义

### 3.1 简历管理接口

#### 3.1.1 获取简历列表

```http
GET /api/v1/resumes?page=1&page_size=10
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| resume_type | string | 否 | 筛选类型: campus/social |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "张三_前端开发",
        "resume_type": "campus",
        "status": "draft",
        "full_name": "张三",
        "target_positions": "前端开发,React开发",
        "updated_at": "2026-02-07T10:30:00"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
}
```

#### 3.1.2 创建简历

```http
POST /api/v1/resumes
```

**请求体**:

```json
{
  "resume_type": "campus",
  "title": "张三_前端开发",
  "full_name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "current_city": "北京",
  "target_cities": "北京,上海,杭州",
  "job_status": "student",
  "target_positions": "前端开发,React开发"
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resume_type | string | 是 | campus(校招) / social(社招) |
| title | string | 否 | 简历标题 |
| full_name | string | 是 | 姓名 |
| phone | string | 是 | 手机号 |
| email | string | 是 | 邮箱 |
| current_city | string | 否 | 当前城市 |
| target_cities | string | 否 | 期望城市，逗号分隔 |
| job_status | string | 否 | employed/unemployed/student |
| target_positions | string | 否 | 期望岗位，逗号分隔 |
| work_years | integer | 否 | 工作年限（社招） |
| current_company | string | 否 | 当前公司（社招） |
| current_position | string | 否 | 当前职位（社招） |
| expected_salary | string | 否 | 期望薪资（社招） |
| self_evaluation | string | 否 | 自我评价 |

**响应示例**:

```json
{
  "code": 201,
  "message": "success",
  "data": {
    "id": 1,
    "resume_type": "campus",
    "title": "张三_前端开发",
    "status": "draft",
    "full_name": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "current_city": "北京",
    "target_cities": "北京,上海,杭州",
    "job_status": "student",
    "target_positions": "前端开发,React开发",
    "created_at": "2026-02-07T10:30:00",
    "updated_at": "2026-02-07T10:30:00"
  }
}
```

#### 3.1.3 获取简历详情

```http
GET /api/v1/resumes/{id}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "resume_type": "campus",
    "title": "张三_前端开发",
    "status": "draft",
    "full_name": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "current_city": "北京",
    "target_cities": "北京,上海,杭州",
    "job_status": "student",
    "target_positions": "前端开发,React开发",
    "self_evaluation": "热爱前端开发，熟悉React...",
    "created_at": "2026-02-07T10:30:00",
    "updated_at": "2026-02-07T10:30:00",
    "educations": [
      {
        "id": 1,
        "school_name": "北京大学",
        "degree": "本科",
        "major": "计算机科学与技术",
        "start_date": "2022-09-01",
        "end_date": "2026-06-30",
        "gpa": "3.8/4.0",
        "courses": "数据结构,算法,操作系统",
        "honors": "国家奖学金",
        "sort_order": 0
      }
    ],
    "work_experiences": [],
    "projects": [
      {
        "id": 1,
        "project_name": "校园二手交易平台",
        "role": "前端负责人",
        "start_date": "2024-03-01",
        "end_date": "2024-06-30",
        "project_link": "https://github.com/xxx/project",
        "description": "使用React开发的校园二手交易平台...",
        "sort_order": 0
      }
    ],
    "skills": [
      {
        "id": 1,
        "skill_name": "JavaScript",
        "proficiency": "熟练",
        "sort_order": 0
      }
    ],
    "languages": [
      {
        "id": 1,
        "language": "英语",
        "proficiency": "CET-6"
      }
    ],
    "awards": [],
    "portfolios": [],
    "social_links": []
  }
}
```

#### 3.1.4 更新简历

```http
PUT /api/v1/resumes/{id}
```

**请求体**: 同创建简历，支持部分更新

**响应示例**: 同获取简历详情

#### 3.1.5 删除简历

```http
DELETE /api/v1/resumes/{id}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

#### 3.1.6 复制简历

```http
POST /api/v1/resumes/{id}/clone
```

**响应示例**:

```json
{
  "code": 201,
  "message": "success",
  "data": {
    "id": 2,
    "title": "张三_前端开发_副本",
    "resume_type": "campus",
    "status": "draft",
    ...
  }
}
```

---

### 3.2 教育经历接口

#### 3.2.1 添加教育经历

```http
POST /api/v1/resumes/{id}/educations
```

**请求体**:

```json
{
  "school_name": "北京大学",
  "degree": "本科",
  "major": "计算机科学与技术",
  "start_date": "2022-09-01",
  "end_date": "2026-06-30",
  "gpa": "3.8/4.0",
  "courses": "数据结构,算法,操作系统",
  "honors": "国家奖学金",
  "sort_order": 0
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| school_name | string | 是 | 学校名称 |
| degree | string | 是 | 博士/硕士/本科/大专/高中 |
| major | string | 是 | 专业 |
| start_date | string | 是 | 开始日期，格式YYYY-MM-DD |
| end_date | string | 否 | 结束日期，null表示至今 |
| gpa | string | 否 | GPA成绩 |
| courses | string | 否 | 主修课程 |
| honors | string | 否 | 在校荣誉 |
| sort_order | integer | 否 | 排序顺序 |

#### 3.2.2 更新教育经历

```http
PUT /api/v1/resumes/{id}/educations/{edu_id}
```

**请求体**: 同添加，支持部分更新

#### 3.2.3 删除教育经历

```http
DELETE /api/v1/resumes/{id}/educations/{edu_id}
```

---

### 3.3 工作/实习经历接口

#### 3.3.1 添加工作/实习经历

```http
POST /api/v1/resumes/{id}/work-experiences
```

**请求体**:

```json
{
  "exp_type": "internship",
  "company_name": "字节跳动",
  "position": "前端开发实习生",
  "start_date": "2024-07-01",
  "end_date": "2024-09-30",
  "description": "负责抖音电商前端开发...",
  "sort_order": 0
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| exp_type | string | 是 | work(工作) / internship(实习) |
| company_name | string | 是 | 公司名称 |
| position | string | 是 | 职位名称 |
| start_date | string | 是 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| description | string | 是 | 工作描述 |
| sort_order | integer | 否 | 排序顺序 |

#### 3.3.2 更新工作/实习经历

```http
PUT /api/v1/resumes/{id}/work-experiences/{exp_id}
```

#### 3.3.3 删除工作/实习经历

```http
DELETE /api/v1/resumes/{id}/work-experiences/{exp_id}
```

---

### 3.4 项目经历接口

#### 3.4.1 添加项目经历

```http
POST /api/v1/resumes/{id}/projects
```

**请求体**:

```json
{
  "project_name": "校园二手交易平台",
  "role": "前端负责人",
  "start_date": "2024-03-01",
  "end_date": "2024-06-30",
  "project_link": "https://github.com/xxx/project",
  "description": "使用React开发的校园二手交易平台...",
  "sort_order": 0
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_name | string | 是 | 项目名称 |
| role | string | 是 | 项目角色 |
| start_date | string | 是 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| project_link | string | 否 | 项目链接 |
| description | string | 是 | 项目描述 |
| sort_order | integer | 否 | 排序顺序 |

#### 3.4.2 更新项目经历

```http
PUT /api/v1/resumes/{id}/projects/{proj_id}
```

#### 3.4.3 删除项目经历

```http
DELETE /api/v1/resumes/{id}/projects/{proj_id}
```

---

### 3.5 技能特长接口

#### 3.5.1 添加技能

```http
POST /api/v1/resumes/{id}/skills
```

**请求体**:

```json
{
  "skill_name": "JavaScript",
  "proficiency": "熟练",
  "sort_order": 0
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skill_name | string | 是 | 技能名称 |
| proficiency | string | 是 | 精通/熟练/掌握/了解 |
| sort_order | integer | 否 | 排序顺序 |

#### 3.5.2 更新技能

```http
PUT /api/v1/resumes/{id}/skills/{skill_id}
```

#### 3.5.3 删除技能

```http
DELETE /api/v1/resumes/{id}/skills/{skill_id}
```

---

### 3.6 语言能力接口

#### 3.6.1 添加语言能力

```http
POST /api/v1/resumes/{id}/languages
```

**请求体**:

```json
{
  "language": "英语",
  "proficiency": "CET-6"
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| language | string | 是 | 语言名称 |
| proficiency | string | 是 | 熟练程度 |

#### 3.6.2 更新语言能力

```http
PUT /api/v1/resumes/{id}/languages/{lang_id}
```

#### 3.6.3 删除语言能力

```http
DELETE /api/v1/resumes/{id}/languages/{lang_id}
```

---

### 3.7 获奖经历接口

#### 3.7.1 添加获奖经历

```http
POST /api/v1/resumes/{id}/awards
```

**请求体**:

```json
{
  "award_name": "国家奖学金",
  "award_date": "2024-09-01",
  "description": "年级前5%",
  "sort_order": 0
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| award_name | string | 是 | 获奖名称 |
| award_date | string | 否 | 获奖日期 |
| description | string | 否 | 描述 |
| sort_order | integer | 否 | 排序顺序 |

#### 3.7.2 更新获奖经历

```http
PUT /api/v1/resumes/{id}/awards/{award_id}
```

#### 3.7.3 删除获奖经历

```http
DELETE /api/v1/resumes/{id}/awards/{award_id}
```

---

### 3.8 作品展示接口

#### 3.8.1 添加作品

```http
POST /api/v1/resumes/{id}/portfolios
```

**请求体**:

```json
{
  "work_name": "个人博客",
  "work_link": "https://myblog.com",
  "attachment_url": "https://cdn.example.com/file.pdf",
  "description": "使用Next.js开发的个人博客",
  "sort_order": 0
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| work_name | string | 是 | 作品名称 |
| work_link | string | 否 | 作品链接 |
| attachment_url | string | 否 | 附件URL |
| description | string | 否 | 描述 |
| sort_order | integer | 否 | 排序顺序 |

#### 3.8.2 更新作品

```http
PUT /api/v1/resumes/{id}/portfolios/{portfolio_id}
```

#### 3.8.3 删除作品

```http
DELETE /api/v1/resumes/{id}/portfolios/{portfolio_id}
```

---

### 3.9 社交账号接口

#### 3.9.1 添加社交账号

```http
POST /api/v1/resumes/{id}/social-links
```

**请求体**:

```json
{
  "platform": "GitHub",
  "url": "https://github.com/zhangsan"
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| platform | string | 是 | 平台名称 |
| url | string | 是 | 链接或ID |

#### 3.9.2 更新社交账号

```http
PUT /api/v1/resumes/{id}/social-links/{link_id}
```

#### 3.9.3 删除社交账号

```http
DELETE /api/v1/resumes/{id}/social-links/{link_id}
```

---

### 3.10 预览与导出接口

#### 3.10.1 获取简历预览数据

```http
GET /api/v1/resumes/{id}/preview
```

**响应示例**: 同获取简历详情，数据格式已优化用于展示

#### 3.10.2 导出PDF

```http
POST /api/v1/resumes/{id}/export/pdf
```

**响应**: 返回PDF文件流

---

## 4. 枚举值定义

### 4.1 resume_type (简历类型)

```typescript
type ResumeType = 'campus' | 'social';
```

### 4.2 status (简历状态)

```typescript
type ResumeStatus = 'draft' | 'completed';
```

### 4.3 job_status (求职状态)

```typescript
type JobStatus = 'employed' | 'unemployed' | 'student';
```

### 4.4 degree (学历)

```typescript
type Degree = '博士' | '硕士' | '本科' | '大专' | '高中';
```

### 4.5 exp_type (经历类型)

```typescript
type ExperienceType = 'work' | 'internship';
```

### 4.6 proficiency - 技能 (熟练程度)

```typescript
type SkillProficiency = '精通' | '熟练' | '掌握' | '了解';
```

### 4.7 platform (社交平台)

```typescript
type SocialPlatform = 'GitHub' | 'LinkedIn' | '知乎' | '掘金' | 'CSDN' | '微博' | '其他';
```

---

## 5. 错误码定义

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| RESUME_NOT_FOUND | 404 | 简历不存在 |
| RESUME_ACCESS_DENIED | 403 | 无权访问该简历 |
| RESUME_VALIDATION_ERROR | 400 | 简历数据校验失败 |
| RESUME_TYPE_INVALID | 400 | 简历类型无效 |
| EDUCATION_NOT_FOUND | 404 | 教育经历不存在 |
| EXPERIENCE_NOT_FOUND | 404 | 工作经历不存在 |
| PROJECT_NOT_FOUND | 404 | 项目经历不存在 |
| SKILL_NOT_FOUND | 404 | 技能不存在 |
| LANGUAGE_NOT_FOUND | 404 | 语言能力不存在 |
| AWARD_NOT_FOUND | 404 | 获奖经历不存在 |
| PORTFOLIO_NOT_FOUND | 404 | 作品不存在 |
| SOCIAL_LINK_NOT_FOUND | 404 | 社交账号不存在 |

---

## 6. 接口调用流程示例

### 6.1 创建完整简历流程

```
1. POST /resumes                    # 创建简历基础信息
2. POST /resumes/{id}/educations    # 添加教育经历（可多次）
3. POST /resumes/{id}/work-experiences  # 添加实习/工作经历（可多次）
4. POST /resumes/{id}/projects      # 添加项目经历（可多次）
5. POST /resumes/{id}/skills        # 添加技能（可多次）
6. POST /resumes/{id}/languages     # 添加语言能力（可多次）
7. POST /resumes/{id}/awards        # 添加获奖经历（可多次）
8. GET  /resumes/{id}/preview       # 预览简历
9. POST /resumes/{id}/export/pdf    # 导出PDF
```

### 6.2 更新简历流程

```
1. GET  /resumes/{id}               # 获取简历详情
2. PUT  /resumes/{id}               # 更新基础信息
3. PUT  /resumes/{id}/educations/{edu_id}  # 更新某条教育经历
4. DELETE /resumes/{id}/skills/{skill_id}  # 删除某条技能
```

---

**文档版本**: v1.0  
**创建日期**: 2026-02-07  
**作者**: AI Assistant
