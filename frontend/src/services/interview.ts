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
 * 发送消息（非流式）
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
 * 使用 fetch API 支持 POST 请求的 SSE
 */
export const sendMessageStream = (
  sessionId: number,
  data: InterviewMessageCreate
): EventSource => {
  // 由于需要使用 POST 请求发送消息内容，我们创建一个自定义的 EventSource-like 对象
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const url = `${baseURL}/interviews/${sessionId}/messages/stream`;
  
  // 创建一个模拟的 EventSource 对象
  const mockEventSource = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((error: Event) => void) | null,
    onopen: null as ((event: Event) => void) | null,
    close: () => {},
    readyState: 0,
    url: url,
    withCredentials: true,
  } as EventSource;

  // 使用 fetch 发起 POST 请求并处理流式响应
  const controller = new AbortController();
  
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(data),
    credentials: 'include',
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // 触发 open 事件
    if (mockEventSource.onopen) {
      mockEventSource.onopen(new Event('open'));
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (mockEventSource.onmessage) {
            mockEventSource.onmessage(new MessageEvent('message', { data }));
          }
        }
      }
    }

    // 处理剩余的数据
    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6);
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(new MessageEvent('message', { data }));
      }
    }
  }).catch((error) => {
    if (mockEventSource.onerror) {
      mockEventSource.onerror(new ErrorEvent('error', { error }));
    }
  });

  // 重写 close 方法
  mockEventSource.close = () => {
    controller.abort();
  };

  return mockEventSource;
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
