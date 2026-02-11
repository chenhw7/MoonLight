/**
 * 简历 API 服务
 *
 * 提供简历相关的所有 API 调用功能
 */

import axios from 'axios';
import { createLogger } from '@/utils/logger';
import type {
  Resume,
  ResumeBase,
  ResumeFormData,
  PaginatedResponse,
  Education,
  WorkExperience,
  Project,
  Skill,
  Language,
  Award,
  Portfolio,
  SocialLink,
} from '@/types/resume';

const logger = createLogger('ResumeService');

// API 基础 URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * 从 localStorage 或 sessionStorage 获取 token
 */
function getAccessToken(): string | null {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

// 创建 axios 实例
const resumeApi = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30秒超时，适应包含 base64 头像的大请求体
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
resumeApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (!token) {
      logger.error('No access token found');
      console.error('❌ 未找到 access_token，请先登录');
      return Promise.reject(new Error('未登录，请先登录'));
    }

    config.headers.Authorization = `Bearer ${token}`;
    logger.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`, {
      hasToken: true,
    });
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
resumeApi.interceptors.response.use(
  (response) => {
    // 如果返回的是 { code: 200, message: 'success', data: {...} } 格式，提取 data
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;

    // 详细记录错误信息
    console.error('❗ 简历 API 错误:', {
      status,
      url: error.config?.url,
      method: error.config?.method,
      responseData,
      message: error.message,
    });

    // 构建可读的错误信息
    let errorMessage = '服务器错误';
    if (responseData) {
      if (responseData.message) {
        errorMessage = responseData.message;
      }
      if (responseData.details && Array.isArray(responseData.details)) {
        const fieldErrors = responseData.details
          .map((d: { field?: string; message?: string }) => `${d.field}: ${d.message}`)
          .join('; ');
        errorMessage += ` (${fieldErrors})`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时，请检查后端服务是否正常运行';
    } else if (!error.response) {
      errorMessage = '无法连接到服务器，请检查网络';
    }

    // 将错误信息附加到 error 对象上
    error.displayMessage = errorMessage;

    // 处理 403 错误
    if (status === 403) {
      console.error('403 Forbidden - 权限不足或 token 无效');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// 简历基础操作
// ============================================================================

/**
 * 获取简历列表
 *
 * @param page - 页码，默认 1
 * @param pageSize - 每页数量，默认 10
 * @param resumeType - 简历类型筛选（可选）
 * @returns 分页简历列表
 */
export async function getResumeList(
  page: number = 1,
  pageSize: number = 10,
  resumeType?: 'campus' | 'social'
): Promise<PaginatedResponse<ResumeBase>> {
  logger.info('Fetching resume list', { page, pageSize, resumeType });

  const params: Record<string, unknown> = { page, page_size: pageSize };
  if (resumeType) {
    params.resume_type = resumeType;
  }

  const data = await resumeApi.get('/resumes', { params });
  return data as unknown as PaginatedResponse<ResumeBase>;
}

/**
 * 获取简历详情
 *
 * @param id - 简历 ID
 * @returns 完整简历详情
 */
export async function getResumeDetail(id: number): Promise<Resume> {
  logger.info('Fetching resume detail', { id });

  const data = await resumeApi.get(`/resumes/${id}`);
  return data as unknown as Resume;
}

/**
 * 创建简历
 *
 * @param data - 简历表单数据
 * @returns 创建的简历
 */
export async function createResume(data: ResumeFormData): Promise<Resume> {
  logger.info('Creating resume', { title: data.title, type: data.resume_type });

  const response = await resumeApi.post('/resumes', data);
  const result = response as unknown as Resume;
  logger.info('Resume created successfully', { id: result.id });
  return result;
}

/**
 * 更新简历
 *
 * @param id - 简历 ID
 * @param data - 更新的数据
 * @returns 更新后的简历
 */
export async function updateResume(
  id: number,
  data: Partial<ResumeFormData>
): Promise<Resume> {
  logger.info('Updating resume', { id });

  const response = await resumeApi.put(`/resumes/${id}`, data);
  logger.info('Resume updated successfully', { id });
  return response as unknown as Resume;
}

/**
 * 删除简历
 *
 * @param id - 简历 ID
 */
export async function deleteResume(id: number): Promise<void> {
  logger.info('Deleting resume', { id });

  await resumeApi.delete(`/resumes/${id}`);
  logger.info('Resume deleted successfully', { id });
}

/**
 * 设置默认简历
 *
 * @param id - 简历 ID
 * @returns 更新后的简历
 */
export async function setDefaultResume(id: number): Promise<Resume> {
  logger.info('Setting default resume', { id });

  const response = await resumeApi.patch(`/resumes/${id}/default`);
  logger.info('Default resume set successfully', { id });
  return response as unknown as Resume;
}

// ============================================================================
// 教育经历
// ============================================================================

/**
 * 添加教育经历
 *
 * @param resumeId - 简历 ID
 * @param data - 教育经历数据
 * @returns 添加的教育经历
 */
export async function addEducation(
  resumeId: number,
  data: Omit<Education, 'id'>
): Promise<Education> {
  logger.info('Adding education', { resumeId, school: data.school_name });

  const response = await resumeApi.post(
    `/resumes/${resumeId}/educations`,
    data
  );
  return response as unknown as Education;
}

/**
 * 更新教育经历
 *
 * @param resumeId - 简历 ID
 * @param educationId - 教育经历 ID
 * @param data - 更新的数据
 * @returns 更新后的教育经历
 */
export async function updateEducation(
  resumeId: number,
  educationId: number,
  data: Partial<Education>
): Promise<Education> {
  logger.info('Updating education', { resumeId, educationId });

  const response = await resumeApi.put(
    `/resumes/${resumeId}/educations/${educationId}`,
    data
  );
  return response as unknown as Education;
}

/**
 * 删除教育经历
 *
 * @param resumeId - 简历 ID
 * @param educationId - 教育经历 ID
 */
export async function deleteEducation(
  resumeId: number,
  educationId: number
): Promise<void> {
  logger.info('Deleting education', { resumeId, educationId });

  await resumeApi.delete(
    `/resumes/${resumeId}/educations/${educationId}`
  );
}

// ============================================================================
// 工作/实习经历
// ============================================================================

/**
 * 添加工作/实习经历
 *
 * @param resumeId - 简历 ID
 * @param data - 工作/实习经历数据
 * @returns 添加的工作/实习经历
 */
export async function addWorkExperience(
  resumeId: number,
  data: Omit<WorkExperience, 'id'>
): Promise<WorkExperience> {
  logger.info('Adding work experience', { resumeId, company: data.company_name });

  const response = await resumeApi.post(
    `/resumes/${resumeId}/work-experiences`,
    data
  );
  return response as unknown as WorkExperience;
}

/**
 * 更新工作/实习经历
 *
 * @param resumeId - 简历 ID
 * @param workId - 工作/实习经历 ID
 * @param data - 更新的数据
 * @returns 更新后的工作/实习经历
 */
export async function updateWorkExperience(
  resumeId: number,
  workId: number,
  data: Partial<WorkExperience>
): Promise<WorkExperience> {
  logger.info('Updating work experience', { resumeId, workId });

  const response = await resumeApi.put(
    `/resumes/${resumeId}/work-experiences/${workId}`,
    data
  );
  return response as unknown as WorkExperience;
}

/**
 * 删除工作/实习经历
 *
 * @param resumeId - 简历 ID
 * @param workId - 工作/实习经历 ID
 */
export async function deleteWorkExperience(
  resumeId: number,
  workId: number
): Promise<void> {
  logger.info('Deleting work experience', { resumeId, workId });

  await resumeApi.delete(
    `/resumes/${resumeId}/work-experiences/${workId}`
  );
}

// ============================================================================
// 项目经历
// ============================================================================

/**
 * 添加项目经历
 *
 * @param resumeId - 简历 ID
 * @param data - 项目经历数据
 * @returns 添加的项目经历
 */
export async function addProject(
  resumeId: number,
  data: Omit<Project, 'id'>
): Promise<Project> {
  logger.info('Adding project', { resumeId, project: data.name });

  const response = await resumeApi.post(
    `/resumes/${resumeId}/projects`,
    data
  );
  return response as unknown as Project;
}

/**
 * 更新项目经历
 *
 * @param resumeId - 简历 ID
 * @param projectId - 项目经历 ID
 * @param data - 更新的数据
 * @returns 更新后的项目经历
 */
export async function updateProject(
  resumeId: number,
  projectId: number,
  data: Partial<Project>
): Promise<Project> {
  logger.info('Updating project', { resumeId, projectId });

  const response = await resumeApi.put(
    `/resumes/${resumeId}/projects/${projectId}`,
    data
  );
  return response as unknown as Project;
}

/**
 * 删除项目经历
 *
 * @param resumeId - 简历 ID
 * @param projectId - 项目经历 ID
 */
export async function deleteProject(
  resumeId: number,
  projectId: number
): Promise<void> {
  logger.info('Deleting project', { resumeId, projectId });

  await resumeApi.delete(`/resumes/${resumeId}/projects/${projectId}`);
}

// ============================================================================
// 技能
// ============================================================================

/**
 * 添加技能
 *
 * @param resumeId - 简历 ID
 * @param data - 技能数据
 * @returns 添加的技能
 */
export async function addSkill(
  resumeId: number,
  data: Omit<Skill, 'id'>
): Promise<Skill> {
  logger.info('Adding skill', { resumeId, skill: data.name });

  const response = await resumeApi.post(
    `/resumes/${resumeId}/skills`,
    data
  );
  return response as unknown as Skill;
}

/**
 * 更新技能
 *
 * @param resumeId - 简历 ID
 * @param skillId - 技能 ID
 * @param data - 更新的数据
 * @returns 更新后的技能
 */
export async function updateSkill(
  resumeId: number,
  skillId: number,
  data: Partial<Skill>
): Promise<Skill> {
  logger.info('Updating skill', { resumeId, skillId });

  const response = await resumeApi.put(
    `/resumes/${resumeId}/skills/${skillId}`,
    data
  );
  return response as unknown as Skill;
}

/**
 * 删除技能
 *
 * @param resumeId - 简历 ID
 * @param skillId - 技能 ID
 */
export async function deleteSkill(resumeId: number, skillId: number): Promise<void> {
  logger.info('Deleting skill', { resumeId, skillId });

  await resumeApi.delete(`/resumes/${resumeId}/skills/${skillId}`);
}

// ============================================================================
// 语言能力
// ============================================================================

/**
 * 添加语言能力
 *
 * @param resumeId - 简历 ID
 * @param data - 语言能力数据
 * @returns 添加的语言能力
 */
export async function addLanguage(
  resumeId: number,
  data: Omit<Language, 'id'>
): Promise<Language> {
  logger.info('Adding language', { resumeId, language: data.language });

  const response = await resumeApi.post(
    `/resumes/${resumeId}/languages`,
    data
  );
  return response as unknown as Language;
}

/**
 * 更新语言能力
 *
 * @param resumeId - 简历 ID
 * @param languageId - 语言能力 ID
 * @param data - 更新的数据
 * @returns 更新后的语言能力
 */
export async function updateLanguage(
  resumeId: number,
  languageId: number,
  data: Partial<Language>
): Promise<Language> {
  logger.info('Updating language', { resumeId, languageId });

  const response = await resumeApi.put(
    `/resumes/${resumeId}/languages/${languageId}`,
    data
  );
  return response as unknown as Language;
}

/**
 * 删除语言能力
 *
 * @param resumeId - 简历 ID
 * @param languageId - 语言能力 ID
 */
export async function deleteLanguage(
  resumeId: number,
  languageId: number
): Promise<void> {
  logger.info('Deleting language', { resumeId, languageId });

  await resumeApi.delete(
    `/resumes/${resumeId}/languages/${languageId}`
  );
}

// ============================================================================
// 获奖经历
// ============================================================================

/**
 * 添加获奖经历
 *
 * @param resumeId - 简历 ID
 * @param data - 获奖经历数据
 * @returns 添加的获奖经历
 */
export async function addAward(
  resumeId: number,
  data: Omit<Award, 'id'>
): Promise<Award> {
  logger.info('Adding award', { resumeId, award: data.name });

  const response = await resumeApi.post(
    `/resumes/${resumeId}/awards`,
    data
  );
  return response as unknown as Award;
}

/**
 * 更新获奖经历
 *
 * @param resumeId - 简历 ID
 * @param awardId - 获奖经历 ID
 * @param data - 更新的数据
 * @returns 更新后的获奖经历
 */
export async function updateAward(
  resumeId: number,
  awardId: number,
  data: Partial<Award>
): Promise<Award> {
  logger.info('Updating award', { resumeId, awardId });

  const response = await resumeApi.put(
    `/resumes/${resumeId}/awards/${awardId}`,
    data
  );
  return response as unknown as Award;
}

/**
 * 删除获奖经历
 *
 * @param resumeId - 简历 ID
 * @param awardId - 获奖经历 ID
 */
export async function deleteAward(resumeId: number, awardId: number): Promise<void> {
  logger.info('Deleting award', { resumeId, awardId });

  await resumeApi.delete(`/resumes/${resumeId}/awards/${awardId}`);
}

// ============================================================================
// 作品
// ============================================================================

/**
 * 添加作品
 *
 * @param resumeId - 简历 ID
 * @param data - 作品数据
 * @returns 添加的作品
 */
export async function addPortfolio(
  resumeId: number,
  data: Omit<Portfolio, 'id'>
): Promise<Portfolio> {
  logger.info('Adding portfolio', { resumeId, portfolio: data.name });

  const response = await resumeApi.post(
    `/resumes/${resumeId}/portfolios`,
    data
  );
  return response as unknown as Portfolio;
}

/**
 * 更新作品
 *
 * @param resumeId - 简历 ID
 * @param portfolioId - 作品 ID
 * @param data - 更新的数据
 * @returns 更新后的作品
 */
export async function updatePortfolio(
  resumeId: number,
  portfolioId: number,
  data: Partial<Portfolio>
): Promise<Portfolio> {
  logger.info('Updating portfolio', { resumeId, portfolioId });

  const response = await resumeApi.put(
    `/resumes/${resumeId}/portfolios/${portfolioId}`,
    data
  );
  return response as unknown as Portfolio;
}

/**
 * 删除作品
 *
 * @param resumeId - 简历 ID
 * @param portfolioId - 作品 ID
 */
export async function deletePortfolio(
  resumeId: number,
  portfolioId: number
): Promise<void> {
  logger.info('Deleting portfolio', { resumeId, portfolioId });

  await resumeApi.delete(
    `/resumes/${resumeId}/portfolios/${portfolioId}`
  );
}

// ============================================================================
// 社交链接
// ============================================================================

/**
 * 添加社交链接
 *
 * @param resumeId - 简历 ID
 * @param data - 社交链接数据
 * @returns 添加的社交链接
 */
export async function addSocialLink(
  resumeId: number,
  data: Omit<SocialLink, 'id'>
): Promise<SocialLink> {
  logger.info('Adding social link', { resumeId, platform: data.platform });

  const response = await resumeApi.post(
    `/resumes/${resumeId}/social-links`,
    data
  );
  return response as unknown as SocialLink;
}

/**
 * 更新社交链接
 *
 * @param resumeId - 简历 ID
 * @param linkId - 社交链接 ID
 * @param data - 更新的数据
 * @returns 更新后的社交链接
 */
export async function updateSocialLink(
  resumeId: number,
  linkId: number,
  data: Partial<SocialLink>
): Promise<SocialLink> {
  logger.info('Updating social link', { resumeId, linkId });

  const response = await resumeApi.put(
    `/resumes/${resumeId}/social-links/${linkId}`,
    data
  );
  return response as unknown as SocialLink;
}

/**
 * 删除社交链接
 *
 * @param resumeId - 简历 ID
 * @param linkId - 社交链接 ID
 */
export async function deleteSocialLink(
  resumeId: number,
  linkId: number
): Promise<void> {
  logger.info('Deleting social link', { resumeId, linkId });

  await resumeApi.delete(
    `/resumes/${resumeId}/social-links/${linkId}`
  );
}
