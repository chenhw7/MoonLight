# 简历功能数据库设计文档

## 1. 概述

本文档定义简历生成功能的数据库表结构，支持校招和社招两种简历类型。

---

## 2. 实体关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                          users                                  │
│                      (已有用户表)                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 1:N
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        resumes                                  │
│                    (简历主表)                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 1:N
           ┌───────────────┼───────────────┬───────────────┐
           ▼               ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ educations │  │work_exp... │  │  projects  │  │   skills   │
    │ (教育经历)  │  │(工作/实习)  │  │ (项目经历)  │  │ (技能特长)  │
    └────────────┘  └────────────┘  └────────────┘  └────────────┘
           │               │               │               │
           │               │               │               │
           ▼               ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  awards    │  │ portfolios │  │social_links│  │ languages  │
    │ (获奖经历)  │  │ (作品展示)  │  │ (社交账号)  │  │ (语言能力)  │
    └────────────┘  └────────────┘  └────────────┘  └────────────┘
```

---

## 3. 表结构定义

### 3.1 简历主表 (resumes)

存储简历基本信息和招聘类型。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键ID |
| user_id | INTEGER | NOT NULL, FOREIGN KEY | 关联用户ID |
| resume_type | VARCHAR(20) | NOT NULL | 简历类型: 'campus'(校招) / 'social'(社招) |
| title | VARCHAR(100) | - | 简历标题，如"张三_前端开发" |
| status | VARCHAR(20) | DEFAULT 'draft' | 状态: 'draft'(草稿) / 'completed'(完成) |
| full_name | VARCHAR(50) | NOT NULL | 姓名 |
| phone | VARCHAR(20) | NOT NULL | 手机号 |
| email | VARCHAR(100) | NOT NULL | 邮箱 |
| current_city | VARCHAR(50) | - | 当前居住城市 |
| target_cities | VARCHAR(200) | - | 期望工作城市，逗号分隔 |
| job_status | VARCHAR(20) | - | 求职状态: 'employed'(在职) / 'unemployed'(离职) / 'student'(在校) |
| target_positions | VARCHAR(200) | - | 期望岗位，逗号分隔 |
| work_years | INTEGER | - | 工作年限（社招） |
| current_company | VARCHAR(100) | - | 当前公司（社招） |
| current_position | VARCHAR(100) | - | 当前职位（社招） |
| expected_salary | VARCHAR(50) | - | 期望薪资（社招） |
| self_evaluation | TEXT | - | 自我评价 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- `idx_resumes_user_id`: user_id
- `idx_resumes_type`: resume_type
- `idx_resumes_status`: status

---

### 3.2 教育经历表 (educations)

存储用户的教育背景信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键ID |
| resume_id | INTEGER | NOT NULL, FOREIGN KEY | 关联简历ID |
| school_name | VARCHAR(100) | NOT NULL | 学校名称 |
| degree | VARCHAR(20) | NOT NULL | 学历: '博士' / '硕士' / '本科' / '大专' / '高中' |
| major | VARCHAR(100) | NOT NULL | 专业名称 |
| start_date | DATE | NOT NULL | 开始日期 |
| end_date | DATE | - | 结束日期，NULL表示至今 |
| gpa | VARCHAR(20) | - | GPA成绩，如"3.8/4.0" |
| courses | TEXT | - | 主修课程 |
| honors | TEXT | - | 在校荣誉 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |

**外键约束**:
- `resume_id` → `resumes(id)` ON DELETE CASCADE

**索引**:
- `idx_educations_resume_id`: resume_id

---

### 3.3 工作/实习经历表 (work_experiences)

存储工作或实习经历，校招为实习，社招为工作。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键ID |
| resume_id | INTEGER | NOT NULL, FOREIGN KEY | 关联简历ID |
| exp_type | VARCHAR(20) | NOT NULL | 经历类型: 'work'(工作) / 'internship'(实习) |
| company_name | VARCHAR(100) | NOT NULL | 公司名称 |
| position | VARCHAR(100) | NOT NULL | 职位名称 |
| start_date | DATE | NOT NULL | 开始日期 |
| end_date | DATE | - | 结束日期，NULL表示至今 |
| description | TEXT | NOT NULL | 工作描述 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |

**外键约束**:
- `resume_id` → `resumes(id)` ON DELETE CASCADE

**索引**:
- `idx_work_exp_resume_id`: resume_id
- `idx_work_exp_type`: exp_type

---

### 3.4 项目经历表 (projects)

存储项目经验。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键ID |
| resume_id | INTEGER | NOT NULL, FOREIGN KEY | 关联简历ID |
| project_name | VARCHAR(100) | NOT NULL | 项目名称 |
| role | VARCHAR(100) | NOT NULL | 项目角色 |
| start_date | DATE | NOT NULL | 开始日期 |
| end_date | DATE | - | 结束日期，NULL表示至今 |
| project_link | VARCHAR(500) | - | 项目链接 |
| description | TEXT | NOT NULL | 项目描述 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |

**外键约束**:
- `resume_id` → `resumes(id)` ON DELETE CASCADE

**索引**:
- `idx_projects_resume_id`: resume_id

---

### 3.5 技能特长表 (skills)

存储技能信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键ID |
| resume_id | INTEGER | NOT NULL, FOREIGN KEY | 关联简历ID |
| skill_name | VARCHAR(50) | NOT NULL | 技能名称 |
| proficiency | VARCHAR(20) | NOT NULL | 熟练程度: '精通' / '熟练' / '掌握' / '了解' |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |

**外键约束**:
- `resume_id` → `resumes(id)` ON DELETE CASCADE

**索引**:
- `idx_skills_resume_id`: resume_id

---

### 3.6 语言能力表 (languages)

存储语言能力信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键ID |
| resume_id | INTEGER | NOT NULL, FOREIGN KEY | 关联简历ID |
| language | VARCHAR(20) | NOT NULL | 语言: '英语' / '日语' / '法语' / '德语' / '其他' |
| proficiency | VARCHAR(50) | NOT NULL | 熟练程度: 'CET-4' / 'CET-6' / '雅思' / '托福' / '专业八级' / '流利' / '一般' |

**外键约束**:
- `resume_id` → `resumes(id)` ON DELETE CASCADE

**索引**:
- `idx_languages_resume_id`: resume_id

---

### 3.7 获奖经历表 (awards)

存储获奖信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键ID |
| resume_id | INTEGER | NOT NULL, FOREIGN KEY | 关联简历ID |
| award_name | VARCHAR(200) | NOT NULL | 获奖名称 |
| award_date | DATE | - | 获奖时间 |
| description | TEXT | - | 描述说明 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |

**外键约束**:
- `resume_id` → `resumes(id)` ON DELETE CASCADE

**索引**:
- `idx_awards_resume_id`: resume_id

---

### 3.8 作品展示表 (portfolios)

存储作品信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键ID |
| resume_id | INTEGER | NOT NULL, FOREIGN KEY | 关联简历ID |
| work_name | VARCHAR(100) | NOT NULL | 作品名称 |
| work_link | VARCHAR(500) | - | 作品链接 |
| attachment_url | VARCHAR(500) | - | 附件URL |
| description | TEXT | - | 作品描述 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |

**外键约束**:
- `resume_id` → `resumes(id)` ON DELETE CASCADE

**索引**:
- `idx_portfolios_resume_id`: resume_id

---

### 3.9 社交账号表 (social_links)

存储社交账号信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键ID |
| resume_id | INTEGER | NOT NULL, FOREIGN KEY | 关联简历ID |
| platform | VARCHAR(50) | NOT NULL | 平台: 'GitHub' / 'LinkedIn' / '知乎' / '掘金' / 'CSDN' / '微博' / '其他' |
| url | VARCHAR(500) | NOT NULL | 链接或ID |

**外键约束**:
- `resume_id` → `resumes(id)` ON DELETE CASCADE

**索引**:
- `idx_social_links_resume_id`: resume_id

---

## 4. 完整SQL建表语句

```sql
-- 简历主表
CREATE TABLE resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resume_type VARCHAR(20) NOT NULL CHECK (resume_type IN ('campus', 'social')),
    title VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    full_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    current_city VARCHAR(50),
    target_cities VARCHAR(200),
    job_status VARCHAR(20) CHECK (job_status IN ('employed', 'unemployed', 'student')),
    target_positions VARCHAR(200),
    work_years INTEGER,
    current_company VARCHAR(100),
    current_position VARCHAR(100),
    expected_salary VARCHAR(50),
    self_evaluation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_type ON resumes(resume_type);
CREATE INDEX idx_resumes_status ON resumes(status);

-- 教育经历表
CREATE TABLE educations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    school_name VARCHAR(100) NOT NULL,
    degree VARCHAR(20) NOT NULL CHECK (degree IN ('博士', '硕士', '本科', '大专', '高中')),
    major VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    gpa VARCHAR(20),
    courses TEXT,
    honors TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE INDEX idx_educations_resume_id ON educations(resume_id);

-- 工作/实习经历表
CREATE TABLE work_experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    exp_type VARCHAR(20) NOT NULL CHECK (exp_type IN ('work', 'internship')),
    company_name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE INDEX idx_work_exp_resume_id ON work_experiences(resume_id);
CREATE INDEX idx_work_exp_type ON work_experiences(exp_type);

-- 项目经历表
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    project_name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    project_link VARCHAR(500),
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_resume_id ON projects(resume_id);

-- 技能特长表
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    skill_name VARCHAR(50) NOT NULL,
    proficiency VARCHAR(20) NOT NULL CHECK (proficiency IN ('精通', '熟练', '掌握', '了解')),
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE INDEX idx_skills_resume_id ON skills(resume_id);

-- 语言能力表
CREATE TABLE languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    language VARCHAR(20) NOT NULL,
    proficiency VARCHAR(50) NOT NULL,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE INDEX idx_languages_resume_id ON languages(resume_id);

-- 获奖经历表
CREATE TABLE awards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    award_name VARCHAR(200) NOT NULL,
    award_date DATE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE INDEX idx_awards_resume_id ON awards(resume_id);

-- 作品展示表
CREATE TABLE portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    work_name VARCHAR(100) NOT NULL,
    work_link VARCHAR(500),
    attachment_url VARCHAR(500),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE INDEX idx_portfolios_resume_id ON portfolios(resume_id);

-- 社交账号表
CREATE TABLE social_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE INDEX idx_social_links_resume_id ON social_links(resume_id);
```

---

## 5. 数据关系说明

### 5.1 一对多关系

- 一个用户(user)可以有多个简历(resume)
- 一个简历(resume)可以有多条教育经历(education)
- 一个简历(resume)可以有多条工作/实习经历(work_experience)
- 一个简历(resume)可以有多条项目经历(project)
- 一个简历(resume)可以有多条技能(skill)
- 一个简历(resume)可以有多条语言能力(language)
- 一个简历(resume)可以有多条获奖经历(award)
- 一个简历(resume)可以有多个作品(portfolio)
- 一个简历(resume)可以有多个社交账号(social_link)

### 5.2 级联删除

所有子表都设置了 `ON DELETE CASCADE`，删除简历时会自动删除关联的所有子记录。

---

## 6. 枚举值定义

### 6.1 resume_type (简历类型)
- `campus`: 校招简历
- `social`: 社招简历

### 6.2 status (简历状态)
- `draft`: 草稿
- `completed`: 已完成

### 6.3 job_status (求职状态)
- `employed`: 在职
- `unemployed`: 离职
- `student`: 在校

### 6.4 degree (学历)
- `博士`
- `硕士`
- `本科`
- `大专`
- `高中`

### 6.5 exp_type (经历类型)
- `work`: 工作经历
- `internship`: 实习经历

### 6.6 proficiency (熟练程度) - 技能
- `精通`
- `熟练`
- `掌握`
- `了解`

---

**文档版本**: v1.0  
**创建日期**: 2026-02-07  
**作者**: AI Assistant
