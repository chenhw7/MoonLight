/**
 * 仪表盘相关类型定义
 */

/**
 * 核心统计数据
 */
export interface DashboardStats {
  resume_count: number;
  interview_count: number;
  average_score: number | null;
  streak_days: number;
}

/**
 * 最近编辑的简历项
 */
export interface RecentResumeItem {
  id: number;
  resume_name: string;
  location: string | null;
  updated_at: string;
}

/**
 * 简历基础信息（用于仪表盘展示）
 */
export interface ResumeBase {
  id: number;
  title: string;
  target_city?: string;
  updated_at: string;
}

/**
 * 能力维度评分
 */
export interface DimensionScores {
  communication: number;
  technical_depth: number;
  project_experience: number;
  adaptability: number;
  job_match: number;
}

/**
 * 最近面试项
 */
export interface RecentInterviewItem {
  id: number;
  company_name: string;
  position_name: string;
  overall_score: number;
  start_time: string;
}

/**
 * 分数趋势项
 */
export interface ScoreTrendItem {
  session_id: number;
  company_name: string;
  overall_score: number;
  start_time: string;
}

/**
 * 维度变化项
 */
export interface DimensionChangeItem {
  key: keyof DimensionScores;
  name: string;
  current: number;
  previous: number;
  change: number;
}

/**
 * 面试统计数据
 */
export interface InterviewStats {
  dimension_scores: DimensionScores | null;
  recent_interviews: RecentInterviewItem[];
  score_trend: ScoreTrendItem[];
  dimension_changes: DimensionChangeItem[];
  insight: string | null;
}

/**
 * 仪表盘完整数据
 */
export interface DashboardData {
  stats: DashboardStats;
  recent_resumes: RecentResumeItem[];
  interview_stats: InterviewStats;
}

/**
 * 维度名称映射
 */
export const DIMENSION_NAMES: Record<keyof DimensionScores, string> = {
  communication: '沟通能力',
  technical_depth: '技术深度',
  project_experience: '项目经验',
  adaptability: '应变能力',
  job_match: '岗位匹配度',
};

/**
 * 维度颜色映射
 */
export const DIMENSION_COLORS: Record<keyof DimensionScores, string> = {
  communication: '#3b82f6', // blue-500
  technical_depth: '#22c55e', // green-500
  project_experience: '#a855f7', // purple-500
  adaptability: '#f97316', // orange-500
  job_match: '#ef4444', // red-500
};
