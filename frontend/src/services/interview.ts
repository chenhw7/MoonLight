/**
 * 面试服务
 *
 * 提供面试相关的 API 调用
 */

import api from './api';
import {
  InterviewConfigOptions,
  InterviewEvaluationResponse,
  InterviewMessageCreate,
  InterviewMessageResponse,
  InterviewProgress,
  InterviewSessionCreate,
  InterviewSessionDetail,
  InterviewSessionListItem,
  InterviewSessionResponse,
  InterviewSessionUpdate,
} from '@/types/interview';
import { PaginatedResponse } from '@/types/resume';

/**
 * 获取面试配置选项
 */
export const getInterviewConfig = async (): Promise<InterviewConfigOptions> => {
  const response = await api.get<InterviewConfigOptions>('/interviews/config');
  return response;
};

/**
 * 创建面试会话
 */
export const createInterviewSession = async (
  data: InterviewSessionCreate
): Promise<InterviewSessionResponse> => {
  const response = await api.post<InterviewSessionResponse>('/interviews', data);
  return response;
};

/**
 * 获取面试会话列表
 */
export const getInterviewSessions = async (
  skip = 0,
  limit = 20
): Promise<PaginatedResponse<InterviewSessionListItem>> => {
  const response = await api.get<PaginatedResponse<InterviewSessionListItem>>(
    '/interviews',
    { params: { skip, limit } }
  );
  return response;
};

/**
 * 获取面试会话详情
 */
export const getInterviewSession = async (
  sessionId: number
): Promise<InterviewSessionDetail> => {
  const response = await api.get<InterviewSessionDetail>(`/interviews/${sessionId}`);
  return response;
};

/**
 * 更新面试会话
 */
export const updateInterviewSession = async (
  sessionId: number,
  data: InterviewSessionUpdate
): Promise<InterviewSessionResponse> => {
  const response = await api.patch<InterviewSessionResponse>(
    `/interviews/${sessionId}`,
    data
  );
  return response;
};

/**
 * 完成面试
 */
export const completeInterviewSession = async (
  sessionId: number
): Promise<InterviewSessionResponse> => {
  const response = await api.post<InterviewSessionResponse>(
    `/interviews/${sessionId}/complete`
  );
  return response;
};

/**
 * 放弃面试
 */
export const abortInterviewSession = async (
  sessionId: number
): Promise<InterviewSessionResponse> => {
  const response = await api.post<InterviewSessionResponse>(
    `/interviews/${sessionId}/abort`
  );
  return response;
};

/**
 * 获取面试消息列表
 */
export const getInterviewMessages = async (
  sessionId: number
): Promise<InterviewMessageResponse[]> => {
  const response = await api.get<InterviewMessageResponse[]>(
    `/interviews/${sessionId}/messages`
  );
  return response;
};

/**
 * 发送消息
 */
export const sendMessage = async (
  sessionId: number,
  data: InterviewMessageCreate
): Promise<InterviewMessageResponse> => {
  const response = await api.post<InterviewMessageResponse>(
    `/interviews/${sessionId}/messages`,
    data
  );
  return response;
};

/**
 * 发送消息（流式）
 */
export const sendMessageStream = (
  sessionId: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: InterviewMessageCreate
): EventSource => {
  // const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const url = new URL(`${baseURL}/interviews/${sessionId}/messages/stream`);
  
  // 由于 SSE 不支持设置自定义 headers，我们需要通过 URL 参数传递 token
  // 或者使用 POST 请求，这里使用 EventSource
  const eventSource = new EventSource(url.toString(), {
    withCredentials: true,
  });

  // 注意：实际使用时可能需要通过其他方式传递认证信息
  return eventSource;
};

/**
 * 获取面试进度
 */
export const getInterviewProgress = async (
  sessionId: number
): Promise<InterviewProgress> => {
  const response = await api.get<InterviewProgress>(
    `/interviews/${sessionId}/messages/progress`
  );
  return response;
};

/**
 * 切换到下一轮
 */
export const nextRound = async (
  sessionId: number
): Promise<{ current_round: string; current_round_display: string; round_index: number; total_rounds: number }> => {
  const response = await api.post<{
    current_round: string;
    current_round_display: string;
    round_index: number;
    total_rounds: number;
  }>(`/interviews/${sessionId}/messages/next-round`);
  return response;
};

/**
 * 生成面试评价
 */
export const generateEvaluation = async (
  sessionId: number
): Promise<InterviewEvaluationResponse> => {
  const response = await api.post<InterviewEvaluationResponse>(
    `/interviews/${sessionId}/evaluation`
  );
  return response;
};

/**
 * 获取面试评价
 */
export const getEvaluation = async (
  sessionId: number
): Promise<InterviewEvaluationResponse> => {
  const response = await api.get<InterviewEvaluationResponse>(
    `/interviews/${sessionId}/evaluation`
  );
  return response;
};

/**
 * 删除面试评价
 */
export const deleteEvaluation = async (sessionId: number): Promise<void> => {
  await api.delete(`/interviews/${sessionId}/evaluation`);
};
