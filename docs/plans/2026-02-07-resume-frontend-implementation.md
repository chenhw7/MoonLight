# 简历生成前端实施计划

## 项目信息

- **任务名称**: 简历生成前端开发
- **创建日期**: 2026-02-07
- **技术栈**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **目标**: 实现完整的简历生成页面，支持校招/社招模式、标签页切换、实时预览

---

## 依赖安装

```bash
cd frontend

# 表单管理
npm install react-hook-form @hookform/resolvers zod

# 拖拽排序
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# PDF导出
npm install html2canvas jspdf

# 日期处理
npm install date-fns
```

---

## 任务分解

### Task 1: 创建简历类型定义
**文件**: `frontend/src/types/resume.ts`

**内容**:
- 简历基础类型 (Resume, ResumeFormData)
- 教育经历类型 (Education)
- 工作/实习经历类型 (WorkExperience)
- 项目经历类型 (Project)
- 技能类型 (Skill)
- 语言能力类型 (Language)
- 获奖经历类型 (Award)
- 作品类型 (Portfolio)
- 社交链接类型 (SocialLink)
- 表单验证 Schema (Zod)

**验收标准**:
- [ ] 所有类型与后端 API 保持一致
- [ ] Zod Schema 包含完整的验证规则
- [ ] 导出所有必要类型

---

### Task 2: 创建简历API服务
**文件**: `frontend/src/services/resume.ts`

**内容**:
- 获取简历列表
- 获取简历详情
- 创建简历
- 更新简历
- 删除简历
- 子模块 API (教育、工作、项目等)

**验收标准**:
- [ ] 所有 API 函数有完整的 JSDoc 注释
- [ ] 错误处理完善
- [ ] 类型定义准确

---

### Task 3: 创建简历状态管理Store
**文件**: `frontend/src/stores/resumeStore.ts`

**内容**:
- 简历数据状态
- 当前标签页状态
- 校招/社招模式状态
- 预览开关状态
- 自动保存逻辑
- 草稿恢复逻辑

**验收标准**:
- [ ] 使用 Zustand 实现
- [ ] 包含完整的操作函数
- [ ] 实现自动保存到 localStorage
- [ ] 实现草稿恢复机制

---

### Task 4: 创建简历表单组件
**目录**: `frontend/src/pages/Resume/components/forms/`

**文件列表**:
1. `BasicInfoForm.tsx` - 基本信息表单
2. `EducationForm.tsx` - 教育经历表单（可添加多条）
3. `WorkExperienceForm.tsx` - 工作/实习经历表单
4. `ProjectForm.tsx` - 项目经历表单
5. `SkillsForm.tsx` - 技能与其他表单

**通用组件**:
- `DynamicFormList.tsx` - 动态表单列表（添加/删除/排序）
- `DateRangePicker.tsx` - 日期范围选择器
- `RichTextEditor.tsx` - 富文本编辑器（简化版）

**验收标准**:
- [ ] 每个表单组件有完整的 Props 类型定义
- [ ] 表单验证实时反馈
- [ ] 支持动态添加/删除记录
- [ ] 桌面端支持拖拽排序

---

### Task 5: 创建简历预览组件
**文件**:
- `frontend/src/pages/Resume/components/ResumePreview.tsx`
- `frontend/src/pages/Resume/components/ResumeTemplate.tsx`

**内容**:
- 简历预览容器
- A4纸样式模板
- 实时数据渲染
- 缩放控制
- 下载PDF功能

**验收标准**:
- [ ] A4纸比例正确
- [ ] 样式美观专业
- [ ] 支持缩放查看
- [ ] PDF导出功能正常

---

### Task 6: 创建简历生成主页面
**目录**: `frontend/src/pages/Resume/`

**文件列表**:
1. `index.tsx` - 页面入口
2. `ResumeCreate.tsx` - 主组件
3. `components/ResumeHeader.tsx` - 头部组件
4. `components/ModeSwitch.tsx` - 模式切换
5. `components/TabNavigation.tsx` - 标签导航
6. `components/ResumeForm.tsx` - 表单容器
7. `components/ResumeFooter.tsx` - 底部导航
8. `hooks/useResumeForm.ts` - 表单逻辑Hook

**验收标准**:
- [ ] 页面布局响应式
- [ ] 标签页切换流畅
- [ ] 模式切换保留数据
- [ ] 自动保存功能正常
- [ ] 实时预览同步更新

---

### Task 7: 添加路由配置
**文件**: `frontend/src/App.tsx`

**内容**:
- 添加 `/resume/create` 路由
- 配置路由守卫（需要登录）
- 添加到导航菜单

**验收标准**:
- [ ] 路由可正常访问
- [ ] 未登录用户重定向到登录页
- [ ] 导航菜单有入口

---

### Task 8: 运行测试验证
**内容**:
- 运行 TypeScript 类型检查
- 运行 ESLint 检查
- 运行单元测试
- 手动功能测试

**验收标准**:
- [ ] `npm run lint` 无错误
- [ ] `npm run build` 成功
- [ ] 所有功能正常运行

---

## 文件清单

### 新增文件

```
frontend/src/
├── types/
│   └── resume.ts                     # 简历类型定义
├── services/
│   └── resume.ts                     # 简历API服务
├── stores/
│   └── resumeStore.ts                # 简历状态管理
├── pages/
│   └── Resume/
│       ├── index.tsx                 # 页面入口
│       ├── ResumeCreate.tsx          # 主组件
│       ├── components/
│       │   ├── ResumeHeader.tsx      # 头部组件
│       │   ├── ModeSwitch.tsx        # 模式切换
│       │   ├── TabNavigation.tsx     # 标签导航
│       │   ├── ResumeForm.tsx        # 表单容器
│       │   ├── ResumePreview.tsx     # 预览组件
│       │   ├── ResumeFooter.tsx      # 底部导航
│       │   ├── ResumeTemplate.tsx    # 简历模板
│       │   ├── DynamicFormList.tsx   # 动态表单列表
│       │   ├── DateRangePicker.tsx   # 日期选择器
│       │   └── forms/
│       │       ├── BasicInfoForm.tsx # 基本信息
│       │       ├── EducationForm.tsx # 教育经历
│       │       ├── WorkExperienceForm.tsx # 工作经历
│       │       ├── ProjectForm.tsx   # 项目经历
│       │       └── SkillsForm.tsx    # 技能与其他
│       └── hooks/
│           └── useResumeForm.ts      # 表单逻辑Hook
└── utils/
    └── resumeTemplate.ts             # 简历模板工具
```

### 修改文件

```
frontend/src/
├── App.tsx                           # 添加路由
└── pages/Home/Dashboard.tsx          # 添加入口按钮
```

---

## 开发顺序

1. **Task 1** → **Task 2** → **Task 3** (基础层)
2. **Task 4** (表单组件，按依赖顺序开发)
3. **Task 5** (预览组件)
4. **Task 6** (页面组装)
5. **Task 7** (路由配置)
6. **Task 8** (测试验证)

---

## 注意事项

1. **类型安全**: 所有数据必须定义 TypeScript 类型
2. **代码规范**: 遵循项目 ESLint 和 Prettier 配置
3. **日志记录**: 关键操作必须记录日志
4. **错误处理**: API 调用必须有错误处理
5. **性能优化**: 大表单使用 React.memo 优化
6. **响应式**: 必须测试移动端显示效果
