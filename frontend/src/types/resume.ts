/**
 * 简历类型定义
 *
 * 定义简历相关的所有 TypeScript 类型和 Zod 验证 Schema
 */

import { z } from 'zod';

// ============================================================================
// 枚举类型
// ============================================================================

/** 简历类型 */
export type ResumeType = 'campus' | 'social';

/** 学历 */
export type EducationLevel = 'doctor' | 'master' | 'bachelor' | 'associate' | 'other';

/** 求职状态 */
export type JobStatus = 'active' | 'passive' | 'inactive' | 'unknown';

/** 熟练程度 */
export type ProficiencyLevel = 'expert' | 'proficient' | 'competent' | 'beginner';

/** 语言类型 */
export type LanguageType = 'english' | 'japanese' | 'french' | 'german' | 'spanish' | 'korean' | 'other';

/** 语言熟练程度 */
export type LanguageProficiency = 'cet4' | 'cet6' | 'tem4' | 'tem8' | 'ielts' | 'toefl' | 'proficiency' | 'native';

/** 社交平台类型 */
export type SocialPlatform = 'github' | 'linkedin' | 'zhihu' | 'juejin' | 'blog' | 'website' | 'other';

// ============================================================================
// 基础类型
// ============================================================================

/** 教育经历 */
export interface Education {
  id?: number;
  school_name: string;
  major: string;
  degree: EducationLevel;
  start_date: string;
  end_date?: string | null;
  gpa?: string;
  courses?: string;
  honors?: string;
  is_current?: boolean;
}

/** 工作/实习经历 */
export interface WorkExperience {
  id?: number;
  company_name: string;
  position: string;
  start_date: string;
  end_date?: string | null;
  description: string;
  is_current?: boolean;
  is_internship?: boolean;
}

/** 项目经历 */
export interface Project {
  id?: number;
  project_name: string;
  role: string;
  start_date: string;
  end_date?: string | null;
  project_link?: string;
  description: string;
  is_current?: boolean;
}

/** 技能 */
export interface Skill {
  id?: number;
  skill_name: string;
  proficiency: ProficiencyLevel;
}

/** 语言能力 */
export interface Language {
  id?: number;
  language: LanguageType;
  proficiency: LanguageProficiency;
}

/** 获奖经历 */
export interface Award {
  id?: number;
  award_name: string;
  award_date?: string;
  description?: string;
}

/** 作品 */
export interface Portfolio {
  id?: number;
  work_name: string;
  work_link?: string;
  attachment_url?: string;
  description?: string;
}

/** 社交链接 */
export interface SocialLink {
  id?: number;
  platform: SocialPlatform;
  url: string;
}

/** 头像比例类型 */
export type AvatarRatio = '1.4' | '1';

/** 简历基础信息 */
export interface ResumeBase {
  id?: number;
  title: string;
  resume_type: ResumeType;
  full_name: string;
  phone: string;
  email: string;
  avatar?: string;  // Base64 编码的头像
  avatar_ratio?: AvatarRatio;  // 头像比例：'1.4' 为证件照(1:1.4)，'1' 为正方形(1:1)
  current_city?: string;
  self_evaluation?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** 完整简历 */
export interface Resume extends ResumeBase {
  educations: Education[];
  work_experiences: WorkExperience[];
  projects: Project[];
  skills: Skill[];
  languages: Language[];
  awards: Award[];
  portfolios: Portfolio[];
  social_links: SocialLink[];
}

/** 简历表单数据 */
export interface ResumeFormData extends ResumeBase {
  educations: Education[];
  work_experiences: WorkExperience[];
  projects: Project[];
  skills: Skill[];
  languages: Language[];
  awards: Award[];
  portfolios: Portfolio[];
  social_links: SocialLink[];
}

// ============================================================================
// API 响应类型
// ============================================================================

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** API 响应 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 简历列表响应 */
export type ResumeListResponse = ApiResponse<PaginatedResponse<ResumeBase>>;

/** 简历详情响应 */
export type ResumeDetailResponse = ApiResponse<Resume>;

// ============================================================================
// Zod 验证 Schema
// ============================================================================

/** 教育经历验证 Schema */
export const educationSchema = z.object({
  id: z.number().optional(),
  school_name: z.string().min(1, '请输入学校名称').max(100, '学校名称过长'),
  major: z.string().min(1, '请输入专业').max(100, '专业名称过长'),
  degree: z.enum(['doctor', 'master', 'bachelor', 'associate', 'other']),
  start_date: z.string().regex(/^\d{4}-\d{2}$/, '日期格式错误'),
  end_date: z.union([z.string().regex(/^\d{4}-\d{2}$/), z.null()]).optional(),
  gpa: z.string().max(20, 'GPA格式错误').optional(),
  courses: z.string().max(500, '内容过长').optional(),
  honors: z.string().max(500, '内容过长').optional(),
  is_current: z.boolean().optional(),
});

/** 工作/实习经历验证 Schema */
export const workExperienceSchema = z.object({
  id: z.number().optional(),
  company_name: z.string().min(1, '请输入公司名称').max(100, '公司名称过长'),
  position: z.string().min(1, '请输入职位名称').max(100, '职位名称过长'),
  start_date: z.string().regex(/^\d{4}-\d{2}$/, '日期格式错误'),
  end_date: z.union([z.string().regex(/^\d{4}-\d{2}$/), z.null()]).optional(),
  description: z.string().min(20, '工作描述至少20字').max(2000, '工作描述过长'),
  is_current: z.boolean().optional(),
  is_internship: z.boolean().optional(),
});

/** 项目经历验证 Schema */
export const projectSchema = z.object({
  id: z.number().optional(),
  project_name: z.string().min(1, '请输入项目名称').max(100, '项目名称过长'),
  role: z.string().min(1, '请输入项目角色').max(100, '角色名称过长'),
  start_date: z.string().regex(/^\d{4}-\d{2}$/, '日期格式错误'),
  end_date: z.union([z.string().regex(/^\d{4}-\d{2}$/), z.null()]).optional(),
  project_link: z.string().url('请输入正确的URL').max(500, '链接过长').optional().or(z.literal('')),
  description: z.string().min(20, '项目描述至少20字').max(2000, '项目描述过长'),
  is_current: z.boolean().optional(),
});

/** 技能验证 Schema */
export const skillSchema = z.object({
  id: z.number().optional(),
  skill_name: z.string().min(1, '请输入技能名称').max(50, '技能名称过长'),
  proficiency: z.enum(['expert', 'proficient', 'competent', 'beginner']),
});

/** 语言能力验证 Schema */
export const languageSchema = z.object({
  id: z.number().optional(),
  language: z.enum(['english', 'japanese', 'french', 'german', 'spanish', 'korean', 'other']),
  proficiency: z.enum(['cet4', 'cet6', 'tem4', 'tem8', 'ielts', 'toefl', 'proficiency', 'native']),
});

/** 获奖经历验证 Schema */
export const awardSchema = z.object({
  id: z.number().optional(),
  award_name: z.string().min(1, '请输入获奖名称').max(100, '获奖名称过长'),
  award_date: z.string().regex(/^\d{4}-\d{2}$/, '日期格式错误').optional().or(z.literal('')),
  description: z.string().max(500, '描述过长').optional(),
});

/** 作品验证 Schema */
export const portfolioSchema = z.object({
  id: z.number().optional(),
  work_name: z.string().min(1, '请输入作品名称').max(100, '作品名称过长'),
  work_link: z.string().url('请输入正确的URL').max(500, '链接过长').optional().or(z.literal('')),
  attachment_url: z.string().max(500, '附件路径过长').optional(),
  description: z.string().max(1000, '描述过长').optional(),
});

/** 社交链接验证 Schema */
export const socialLinkSchema = z.object({
  id: z.number().optional(),
  platform: z.enum(['github', 'linkedin', 'zhihu', 'juejin', 'blog', 'website', 'other']),
  url: z.string().min(1, '请输入链接').max(500, '链接过长'),
});

/** 简历基础信息验证 Schema */
export const resumeBaseSchema = z.object({
  title: z.string().min(1, '请输入简历标题').max(100, '标题过长'),
  resume_type: z.enum(['campus', 'social']),
  full_name: z.string().min(2, '姓名至少2个字').max(20, '姓名过长'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  email: z.string().email('请输入正确的邮箱'),
  avatar: z.string().optional(),  // 头像为可选
  avatar_ratio: z.enum(['1.4', '1']).optional(),  // 头像比例
  current_city: z.string().min(1, '请选择当前居住地').max(100, '地址过长').optional(),
  self_evaluation: z.string().max(1000, '自我评价过长').optional(),
});

/** 完整简历验证 Schema */
export const resumeSchema = resumeBaseSchema.extend({
  educations: z.array(educationSchema).min(1, '请至少添加一条教育经历'),
  work_experiences: z.array(workExperienceSchema),
  projects: z.array(projectSchema),
  skills: z.array(skillSchema),
  languages: z.array(languageSchema),
  awards: z.array(awardSchema),
  portfolios: z.array(portfolioSchema),
  social_links: z.array(socialLinkSchema),
});

/** 简历创建请求 Schema */
export const resumeCreateSchema = resumeSchema;

/** 简历更新请求 Schema */
export const resumeUpdateSchema = resumeSchema.partial();

// ============================================================================
// 类型推导
// ============================================================================

export type EducationInput = z.infer<typeof educationSchema>;
export type WorkExperienceInput = z.infer<typeof workExperienceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type LanguageInput = z.infer<typeof languageSchema>;
export type AwardInput = z.infer<typeof awardSchema>;
export type PortfolioInput = z.infer<typeof portfolioSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
export type ResumeBaseInput = z.infer<typeof resumeBaseSchema>;
export type ResumeInput = z.infer<typeof resumeSchema>;

// ============================================================================
// 常量定义
// ============================================================================

/** 学历选项 */
export const EDUCATION_LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'doctor', label: '博士' },
  { value: 'master', label: '硕士' },
  { value: 'bachelor', label: '本科' },
  { value: 'associate', label: '大专' },
  { value: 'other', label: '其他' },
];

/** 求职状态选项 */
export const JOB_STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'active', label: ' actively looking - 正在找工作' },
  { value: 'passive', label: 'passively looking - 看看机会' },
  { value: 'inactive', label: 'not looking - 暂时不看' },
  { value: 'unknown', label: 'unknown - 未知' },
];

/** 熟练程度选项 */
export const PROFICIENCY_LEVELS: { value: ProficiencyLevel; label: string }[] = [
  { value: 'expert', label: '精通' },
  { value: 'proficient', label: '熟练' },
  { value: 'competent', label: '掌握' },
  { value: 'beginner', label: '了解' },
];

/** 语言选项 */
export const LANGUAGE_OPTIONS: { value: LanguageType; label: string }[] = [
  { value: 'english', label: '英语' },
  { value: 'japanese', label: '日语' },
  { value: 'french', label: '法语' },
  { value: 'german', label: '德语' },
  { value: 'spanish', label: '西班牙语' },
  { value: 'korean', label: '韩语' },
  { value: 'other', label: '其他' },
];

/** 语言熟练程度选项 */
export const LANGUAGE_PROFICIENCY_OPTIONS: { value: LanguageProficiency; label: string }[] = [
  { value: 'cet4', label: 'CET-4' },
  { value: 'cet6', label: 'CET-6' },
  { value: 'tem4', label: 'TEM-4' },
  { value: 'tem8', label: 'TEM-8' },
  { value: 'ielts', label: '雅思' },
  { value: 'toefl', label: '托福' },
  { value: 'proficiency', label: '熟练' },
  { value: 'native', label: '母语' },
];

/** 社交平台选项 */
export const SOCIAL_PLATFORM_OPTIONS: { value: SocialPlatform; label: string; icon?: string }[] = [
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'zhihu', label: '知乎' },
  { value: 'juejin', label: '掘金' },
  { value: 'blog', label: '博客' },
  { value: 'website', label: '个人网站' },
  { value: 'other', label: '其他' },
];

/** 标签页类型 */
export type TabType = 'basic' | 'education' | 'work' | 'project' | 'skills';

/** 标签页配置 */
export const TABS_CONFIG: { value: TabType; label: string; icon: string }[] = [
  { value: 'basic', label: '基本信息', icon: 'User' },
  { value: 'education', label: '教育经历', icon: 'GraduationCap' },
  { value: 'work', label: '工作/实习', icon: 'Briefcase' },
  { value: 'project', label: '项目经历', icon: 'FolderGit' },
  { value: 'skills', label: '技能与其他', icon: 'Sparkles' },
];

/** 默认空简历数据 */
export const DEFAULT_RESUME_DATA: ResumeFormData = {
  title: '',
  resume_type: 'campus',
  full_name: '',
  phone: '',
  email: '',
  avatar: '',
  avatar_ratio: '1.4',
  current_city: '',
  self_evaluation: '',
  educations: [],
  work_experiences: [],
  projects: [],
  skills: [],
  languages: [],
  awards: [],
  portfolios: [],
  social_links: [],
};
