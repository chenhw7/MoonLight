# AI 面试官功能 - 需求共识文档

## 文档信息
- **创建日期**: 2026-02-12
- **功能名称**: AI 面试官 (AI Interviewer)
- **文档类型**: CONSENSUS - 需求共识与技术方案

---

## 1. 需求共识

### 1.1 产品定位
AI 面试官是 MoonLight 简历生成器的增值功能，帮助用户在真实面试前进行针对性模拟演练。系统基于用户的真实简历和目标岗位的 JD，由 AI 扮演专业面试官进行多轮问答，最终生成评价报告和改进建议。

### 1.2 核心价值
1. **针对性训练** - 基于真实简历和 JD，问题高度相关
2. **安全练习环境** - 犯错无成本，可反复练习
3. **即时反馈** - 面试后立即获得评价和改进建议
4. **进度追踪** - 保存历史记录，见证成长轨迹

### 1.3 目标用户
- 校招生：准备秋招/春招的应届毕业生
- 社招人员：准备跳槽的在职工程师
- 转行者：准备转入技术领域的求职者

---

## 2. 功能规格

### 2.1 功能清单

#### 2.1.1 核心功能

| 功能模块 | 功能点 | 优先级 | 说明 |
|---------|-------|-------|------|
| 面试配置 | 选择简历 | P0 | 从用户已有简历中选择 |
| | 填写企业信息 | P0 | 企业名称、岗位名称 |
| | 粘贴 JD | P0 | 岗位描述文本 |
| | 选择招聘类型 | P0 | 校招/社招 |
| | 选择面试模式 | P0 | 根据类型动态变化 |
| | 选择面试官风格 | P0 | 严格/温和/压力 |
| | 配置/切换 AI 模型 | P1 | 支持自定义模型 |
| 面试进行 | 开场白 | P0 | AI 自我介绍和流程说明 |
| | 自我介绍环节 | P0 | 用户介绍，AI 追问 |
| | 核心问答环节 | P0 | 多轮技术问答 |
| | 反问环节 | P0 | 模拟真实面试结尾 |
| | 中途保存/恢复 | P1 | 支持断点续面 |
| 评价报告 | 综合评分 | P0 | 0-100 分 |
| | 多维度评分 | P0 | 雷达图展示 |
| | 详细评价 | P0 | 各维度文字评价 |
| | 改进建议 | P0 | 可执行的建议列表 |
| | 推荐题目 | P1 | 薄弱环节练习题 |
| 历史记录 | 面试列表 | P0 | 查看所有面试记录 |
| | 对话回顾 | P0 | 查看完整对话 |
| | 报告查看 | P0 | 查看评价报告 |
| | 删除记录 | P1 | 删除单条记录 |

#### 2.1.2 配置功能

| 功能模块 | 功能点 | 优先级 | 说明 |
|---------|-------|-------|------|
| AI 模型配置 | 基础配置 | P0 | Base URL、API Key |
| | 自动发现模型 | P1 | 调用 /models 接口 |
| | 默认模型设置 | P0 | 对话/思考/视觉模型 |
| | 模型切换 | P1 | 面试中临时切换 |

### 2.2 面试模式详细规格

#### 2.2.1 校招模式

**模式 A: 基础知识问答**
- 算法与数据结构
- 计算机网络
- 操作系统
- 数据库基础
- 编程语言特性

**模式 B: 项目/实习深挖**
- 项目背景和目标
- 技术选型理由
- 个人职责和贡献
- 遇到的问题和解决方案
- 项目成果和反思

**模式 C: 编程题**
- 算法实现
- 代码优化
- 边界条件处理
- 时间和空间复杂度分析

#### 2.2.2 社招模式

**模式 A: 技术深挖**
- 项目架构设计
- 技术选型决策
- 性能优化经验
- 故障排查案例
- 团队协作经验

**模式 B: 技术问答**
- 框架原理
- 设计模式
- 分布式系统
- 微服务架构
- 云原生技术

**模式 C: 场景设计**
- 系统设计题
- 功能设计题
- 架构设计题
- 技术方案选型

### 2.3 面试官风格规格

#### 2.3.1 严格专业型
- **问候语**: "你好，我是今天的面试官，我们直接进入正题。"
- **提问风格**: 简洁直接，不拖泥带水
- **追问策略**: 回答不充分时立即追问细节
- **反馈风格**: 客观直接，指出问题不粉饰
- **结束语**: "面试到此结束，感谢你的时间。"

#### 2.3.2 温和引导型
- **问候语**: "你好，很高兴见到你，请放松，我们随便聊聊。"
- **提问风格**: 循序渐进，由浅入深
- **追问策略**: 给予提示和引导，帮助用户思考
- **反馈风格**: 鼓励为主，建设性反馈
- **结束语**: "聊得很愉快，希望对你有帮助。"

#### 2.3.3 压力测试型
- **问候语**: "你好，我时间有限，希望你回答得简洁有力。"
- **提问风格**: 快速连续，不给思考时间
- **追问策略**: 质疑回答，挑战观点
- **反馈风格**: 挑剔严格，指出所有不足
- **结束语**: "就这样吧。"

---

## 3. 技术方案

### 3.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          前端 (React)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ 面试配置页   │  │ 面试进行页   │  │ 评价报告页   │  │ 历史记录 │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     后端 (FastAPI)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ Interview   │  │ AI Service  │  │ Resume      │  │ Config  │ │
│  │ Router      │  │ Router      │  │ Router      │  │ Router  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Interview   │  │ AIService   │  │ Config      │              │
│  │ Service     │  │             │  │ Service     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/SSE
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     外部服务                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ OpenAI API      │  │ Claude API      │  │ 其他兼容 API     │  │
│  │ (GPT-4/o1)      │  │ (Claude 3)      │  │ (通义/文心等)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 技术选型

#### 3.2.1 前端
| 技术 | 用途 | 说明 |
|-----|------|------|
| React 18 | UI 框架 | 已有技术栈 |
| TypeScript | 类型安全 | 已有技术栈 |
| Zustand | 状态管理 | 已有技术栈 |
| Axios | HTTP 请求 | 已有技术栈 |
| shadcn/ui | UI 组件 | 已有技术栈 |
| react-markdown | Markdown 渲染 | AI 回复可能包含代码 |
| recharts | 图表 | 评价雷达图 |

#### 3.2.2 后端
| 技术 | 用途 | 说明 |
|-----|------|------|
| FastAPI | Web 框架 | 已有技术栈 |
| SQLAlchemy | ORM | 已有技术栈 |
| Alembic | 数据库迁移 | 已有技术栈 |
| HTTPX | 异步 HTTP | 调用 AI API |
| SSE | 流式响应 | 实时返回 AI 回复 |
| Pydantic | 数据验证 | 已有技术栈 |

#### 3.2.3 AI 接口
- 使用 OpenAI 兼容接口格式
- 支持流式响应 (SSE)
- 支持自定义 Base URL 和 API Key

### 3.3 数据模型

#### 3.3.1 面试会话表 (interview_sessions)

```python
class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"))
    
    # 企业信息
    company_name: Mapped[str] = mapped_column(String(100))
    position_name: Mapped[str] = mapped_column(String(100))
    job_description: Mapped[str] = mapped_column(Text)
    
    # 面试配置
    recruitment_type: Mapped[str] = mapped_column(String(20))  # campus, social
    interview_mode: Mapped[str] = mapped_column(String(50))    # 具体模式
    interviewer_style: Mapped[str] = mapped_column(String(20)) # strict, gentle, pressure
    
    # AI 模型配置（快照）
    model_config: Mapped[dict] = mapped_column(JSON)
    
    # 状态
    status: Mapped[str] = mapped_column(String(20), default="ongoing")  # ongoing, completed, aborted
    current_round: Mapped[str] = mapped_column(String(30), default="opening")  # 当前轮次
    
    # 时间戳
    start_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联
    user: Mapped["User"] = relationship(back_populates="interview_sessions")
    resume: Mapped["Resume"] = relationship()
    messages: Mapped[list["InterviewMessage"]] = relationship(back_populates="session", order_by="InterviewMessage.id")
    evaluation: Mapped[Optional["InterviewEvaluation"]] = relationship(back_populates="session")
```

#### 3.3.2 面试消息表 (interview_messages)

```python
class InterviewMessage(Base):
    __tablename__ = "interview_messages"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("interview_sessions.id"))
    
    role: Mapped[str] = mapped_column(String(20))  # ai, user
    content: Mapped[str] = mapped_column(Text)
    round: Mapped[str] = mapped_column(String(30))  # opening, self_intro, qa, reverse_qa
    
    # 元数据（如 AI 思考过程等）
    metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # 关联
    session: Mapped["InterviewSession"] = relationship(back_populates="messages")
```

#### 3.3.3 面试评价表 (interview_evaluations)

```python
class InterviewEvaluation(Base):
    __tablename__ = "interview_evaluations"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("interview_sessions.id"), unique=True)
    
    # 综合评分
    overall_score: Mapped[int] = mapped_column(Integer)  # 0-100
    
    # 各维度评分
    dimension_scores: Mapped[dict] = mapped_column(JSON)  # {communication: 85, technical_depth: 78, ...}
    
    # 评价内容
    summary: Mapped[str] = mapped_column(Text)  # 总体评价
    dimension_details: Mapped[dict] = mapped_column(JSON)  # 各维度详细评价
    
    # 建议
    suggestions: Mapped[list] = mapped_column(JSON)  # 改进建议列表
    recommended_questions: Mapped[list] = mapped_column(JSON)  # 推荐练习题
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # 关联
    session: Mapped["InterviewSession"] = relationship(back_populates="evaluation")
```

#### 3.3.4 AI 配置表 (ai_configs)

```python
class AIConfig(Base):
    __tablename__ = "ai_configs"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    
    # 基础配置
    provider: Mapped[str] = mapped_column(String(50), default="openai-compatible")
    base_url: Mapped[str] = mapped_column(String(500))
    api_key: Mapped[str] = mapped_column(String(500))  # 加密存储
    
    # 模型配置
    chat_model: Mapped[str] = mapped_column(String(100), default="gpt-4")
    reasoning_model: Mapped[str] = mapped_column(String(100), nullable=True)
    vision_model: Mapped[str] = mapped_column(String(100), nullable=True)
    voice_model: Mapped[str] = mapped_column(String(100), nullable=True)
    
    # 其他参数
    temperature: Mapped[float] = mapped_column(Float, default=0.7)
    max_tokens: Mapped[int] = mapped_column(Integer, default=4096)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联
    user: Mapped["User"] = relationship()
```

### 3.4 API 接口设计

#### 3.4.1 面试会话接口

```yaml
# 创建面试会话
POST /api/v1/interviews
Request:
  resume_id: int
  company_name: str
  position_name: str
  job_description: str
  recruitment_type: "campus" | "social"
  interview_mode: str
  interviewer_style: "strict" | "gentle" | "pressure"
  model_config: object (optional)

Response:
  id: int
  status: "ongoing"
  # ... 其他字段

# 获取面试会话列表
GET /api/v1/interviews?page=1&size=20
Response:
  items: [...]
  total: int

# 获取单个面试会话
GET /api/v1/interviews/{id}
Response:
  # 完整会话信息，包含消息列表

# 结束面试会话
POST /api/v1/interviews/{id}/complete
Response:
  # 触发评价生成

# 放弃面试会话
POST /api/v1/interviews/{id}/abort
```

#### 3.4.2 面试消息接口

```yaml
# 发送消息（流式响应）
POST /api/v1/interviews/{id}/messages
Request:
  content: str

Response: SSE Stream
  event: message
  data: {content: str, role: "ai"}
  
  event: complete
  data: {message_id: int}

# 获取消息列表
GET /api/v1/interviews/{id}/messages
Response:
  items: [...]
```

#### 3.4.3 评价接口

```yaml
# 获取评价报告
GET /api/v1/interviews/{id}/evaluation
Response:
  overall_score: int
  dimension_scores: object
  summary: str
  dimension_details: object
  suggestions: array
  recommended_questions: array

# 重新生成评价（如需）
POST /api/v1/interviews/{id}/evaluation/regenerate
```

#### 3.4.4 AI 配置接口

```yaml
# 获取 AI 配置
GET /api/v1/ai-config
Response:
  provider: str
  base_url: str
  # api_key 不返回完整内容
  chat_model: str
  reasoning_model: str
  vision_model: str
  temperature: float

# 更新 AI 配置
PUT /api/v1/ai-config
Request:
  provider: str
  base_url: str
  api_key: str
  chat_model: str
  # ...

# 测试连接
POST /api/v1/ai-config/test
Request:
  base_url: str
  api_key: str
Response:
  success: bool
  models: array  # 可用模型列表
```

### 3.5 Prompt 设计

#### 3.5.1 系统 Prompt 模板

```jinja2
你是一位经验丰富的{{ company_name }}技术面试官，正在面试{{ position_name }}岗位。

## 面试信息
- 招聘类型: {{ recruitment_type }}
- 面试模式: {{ interview_mode }}
- 面试官风格: {{ interviewer_style }}

## 岗位描述
{{ job_description }}

## 候选人简历
{{ resume_content }}

## 你的角色设定
{{ style_prompt }}

## 面试流程
当前轮次: {{ current_round }}
1. opening: 开场白，自我介绍和流程说明
2. self_intro: 请候选人自我介绍，针对性追问
3. qa: 核心问答环节，根据面试模式提问
4. reverse_qa: 反问环节，让候选人提问
5. closing: 结束面试

## 要求
- 每次只问一个问题
- 根据候选人回答进行追问
- 保持面试官角色，不要跳出角色
- 回答要简洁，不要长篇大论
```

#### 3.5.2 风格 Prompt

```yaml
strict: |
  你是一位严格专业的面试官，来自大厂技术团队。
  - 提问直接犀利，不拖泥带水
  - 对模糊回答会深入追问
  - 保持专业距离感，不闲聊
  - 回答不充分时直接指出问题

gentle: |
  你是一位温和友善的面试官，像导师一样引导候选人。
  - 提问循序渐进，由浅入深
  - 给予候选人思考和组织语言的时间
  - 回答不完善时会给出提示
  - 以鼓励为主，帮助候选人建立信心

pressure: |
  你是一位压力面试官，目的是测试候选人的抗压能力。
  - 提问快速连续，节奏紧凑
  - 会质疑候选人的回答和观点
  - 制造一定的紧张氛围
  - 挑剔严格，找出所有不足之处
```

#### 3.5.3 评价 Prompt

```jinja2
请对以下面试进行评价：

## 面试信息
- 岗位: {{ position_name }}
- 招聘类型: {{ recruitment_type }}
- 面试模式: {{ interview_mode }}

## 完整对话记录
{{ conversation_history }}

## 评价要求
请从以下维度进行评价（每项 0-100 分）：
1. 沟通能力 - 表达清晰度、逻辑性
2. 技术深度 - 知识掌握程度、原理理解
3. 项目经验 - 项目描述、技术亮点
4. 应变能力 - 追问回答、思维灵活性
5. 岗位匹配度 - 与目标岗位的匹配程度

请按以下 JSON 格式输出：
{
  "overall_score": 85,
  "dimension_scores": {
    "communication": 85,
    "technical_depth": 78,
    "project_experience": 82,
    "adaptability": 80,
    "job_match": 88
  },
  "summary": "总体评价...",
  "dimension_details": {
    "communication": "详细评价...",
    ...
  },
  "suggestions": ["建议1", "建议2", ...],
  "recommended_questions": ["推荐练习1", ...]
}
```

---

## 4. 验收标准

### 4.1 功能验收

| 验收项 | 验收标准 | 优先级 |
|-------|---------|-------|
| 面试配置 | 可以完整配置面试参数并开始 | P0 |
| 多轮对话 | AI 能根据轮次正确提问 | P0 |
| 简历关联 | AI 问题与简历内容相关 | P0 |
| JD 关联 | AI 问题与 JD 要求相关 | P0 |
| 模式区分 | 不同模式问题类型正确 | P0 |
| 风格区分 | 不同风格语气符合设定 | P0 |
| 流式响应 | AI 回复实时显示 | P0 |
| 评价报告 | 报告包含所有维度 | P0 |
| 历史记录 | 可以查看历史面试 | P0 |
| 模型配置 | 可以配置和切换模型 | P1 |

### 4.2 性能验收

| 验收项 | 验收标准 |
|-------|---------|
| AI 首字响应 | < 3 秒 |
| AI 完整响应 | < 10 秒（普通问题）|
| 页面加载 | < 2 秒 |
| 评价生成 | < 30 秒 |

### 4.3 体验验收

| 验收项 | 验收标准 |
|-------|---------|
| 配置流程 | < 2 分钟完成配置 |
| 面试流程 | 无中断、无报错 |
| 移动端 | 基本可用（自适应）|

---

## 5. 相关文档

- [ALIGNMENT_ai-interviewer.md](./ALIGNMENT_ai-interviewer.md) - 需求对齐文档
- [DESIGN_ai-interviewer.md](./DESIGN_ai-interviewer.md) - 系统设计文档
- [TASK_ai-interviewer.md](./TASK_ai-interviewer.md) - 任务拆分文档

---

## 6. 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|-----|------|---------|------|
| 2026-02-12 | v1.0 | 初始版本 | AI Assistant |
