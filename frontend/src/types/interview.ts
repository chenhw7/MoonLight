/**
 * 面试相关类型定义
 */

/**
 * 招聘类型
 */
export type RecruitmentType = 'campus' | 'social';

/**
 * 面试官风格
 */
export type InterviewerStyle = 'strict' | 'gentle' | 'pressure';

/**
 * 面试模式
 */
export type InterviewMode =
  | 'basic_knowledge'
  | 'project_deep_dive'
  | 'coding'
  | 'technical_deep_dive'
  | 'technical_qa'
  | 'scenario_design';

/**
 * 面试轮次
 */
export type InterviewRound =
  | 'opening'
  | 'self_intro'
  | 'qa'
  | 'reverse_qa'
  | 'closing';

/**
 * 面试会话状态
 */
export type InterviewStatus = 'ongoing' | 'completed' | 'aborted';

/**
 * 面试会话基础类型
 */
export interface InterviewSessionBase {
  company_name: string;
  position_name: string;
  job_description: string;
  recruitment_type: RecruitmentType;
  interview_mode: InterviewMode;
  interviewer_style: InterviewerStyle;
}

/**
 * 创建面试会话请求
 */
export interface InterviewSessionCreate extends InterviewSessionBase {
  resume_id: number;
  model_config?: Record<string, unknown>;
}

/**
 * 更新面试会话请求
 */
export interface InterviewSessionUpdate {
  status?: InterviewStatus;
  current_round?: InterviewRound;
  end_time?: string;
}

/**
 * 面试会话响应
 */
export interface InterviewSessionResponse extends InterviewSessionBase {
  id: number;
  user_id: number;
  resume_id: number;
  status: InterviewStatus;
  current_round: InterviewRound;
  model_config: Record<string, unknown>;
  start_time: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 面试会话列表项
 */
export interface InterviewSessionListItem {
  id: number;
  company_name: string;
  position_name: string;
  recruitment_type: RecruitmentType;
  interview_mode: InterviewMode;
  interviewer_style: InterviewerStyle;
  status: InterviewStatus;
  current_round: InterviewRound;
  start_time: string;
  created_at: string;
}

/**
 * 面试会话详情（包含消息）
 */
export interface InterviewSessionDetail extends InterviewSessionResponse {
  messages: InterviewMessageResponse[];
}

/**
 * 面试消息
 */
export interface InterviewMessageResponse {
  id: number;
  session_id: number;
  role: 'ai' | 'user';
  content: string;
  round: InterviewRound;
  meta_info?: Record<string, unknown>;
  created_at: string;
}

/**
 * 创建面试消息请求
 */
export interface InterviewMessageCreate {
  role: 'ai' | 'user';
  content: string;
  round: InterviewRound;
}

/**
 * 各维度评分
 */
export interface DimensionScores {
  communication: number;
  technical_depth: number;
  project_experience: number;
  adaptability: number;
  job_match: number;
}

/**
 * 面试评价响应
 */
export interface InterviewEvaluationResponse {
  id: number;
  session_id: number;
  overall_score: number;
  dimension_scores: DimensionScores;
  summary: string;
  dimension_details: Record<string, string>;
  suggestions: string[];
  recommended_questions: string[];
  created_at: string;
}

/**
 * 面试配置选项
 */
export interface InterviewConfigOptions {
  recruitment_types: Record<RecruitmentType, string>;
  interview_modes: Record<RecruitmentType, Record<InterviewMode, string>>;
  interviewer_styles: Record<InterviewerStyle, string>;
  rounds: InterviewRound[];
  round_display_names: Record<InterviewRound, string>;
}

/**
 * 面试进度信息
 */
export interface InterviewProgress {
  current_round: InterviewRound;
  current_round_display: string;
  round_index: number;
  total_rounds: number;
  user_messages: number;
  ai_messages: number;
  min_messages: number;
  max_messages: number;
  progress: number;
  can_transition: boolean;
}

/**
 * 招聘类型选项
 */
export const RECRUITMENT_TYPE_OPTIONS: { value: RecruitmentType; label: string }[] = [
  { value: 'campus', label: '校招' },
  { value: 'social', label: '社招' },
];

/**
 * 面试模式选项
 */
export const INTERVIEW_MODE_OPTIONS: Record<RecruitmentType, { value: InterviewMode; label: string; description: string }[]> = {
  campus: [
    { value: 'basic_knowledge', label: '基础知识问答', description: '重点考察算法、数据结构、计算机网络等基础知识' },
    { value: 'project_deep_dive', label: '项目/实习深挖', description: '深入挖掘项目经历和实习经历' },
    { value: 'coding', label: '编程题', description: '考察编程能力和算法实现' },
  ],
  social: [
    { value: 'technical_deep_dive', label: '技术深挖', description: '深入考察技术深度和架构能力' },
    { value: 'technical_qa', label: '技术问答', description: '框架原理、设计模式等技术问答' },
    { value: 'scenario_design', label: '场景设计', description: '系统设计、功能设计等场景题' },
  ],
};

/**
 * 面试官风格选项
 */
export const INTERVIEWER_STYLE_OPTIONS: { value: InterviewerStyle; label: string; description: string }[] = [
  { value: 'strict', label: '严格专业型', description: '提问直接犀利，对模糊回答会深入追问' },
  { value: 'gentle', label: '温和引导型', description: '循序渐进，给予提示和鼓励' },
  { value: 'pressure', label: '压力测试型', description: '快速连续提问，测试抗压能力' },
];

/**
 * 轮次显示名称
 */
export const ROUND_DISPLAY_NAMES: Record<InterviewRound, string> = {
  opening: '开场白',
  self_intro: '自我介绍',
  qa: '核心问答',
  reverse_qa: '反问环节',
  closing: '结束',
};
