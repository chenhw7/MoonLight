/**
 * AI 配置服务
 *
 * 提供 AI 配置的 CRUD 操作和连接测试
 */

import api from './api';
import type {
  AIConfigCreate,
  AIConfigResponse,
  AIConfigTestRequest,
  AIConfigTestResponse,
  AIConfigUpdate,
  AIConfigListResponse,
  ModelListResponse,
} from '@/types/ai-config';

/**
 * 获取所有 AI 配置
 */
export const getAIConfigs = async (): Promise<AIConfigListResponse> => {
  const response = await api.get<AIConfigListResponse>('/ai-config');
  return response;
};

/**
 * 获取当前激活的 AI 配置
 */
export const getActiveAIConfig = async (): Promise<AIConfigResponse> => {
  const response = await api.get<AIConfigResponse>('/ai-config/active');
  return response;
};

/**
 * 创建 AI 配置
 */
export const createAIConfig = async (
  config: AIConfigCreate
): Promise<AIConfigResponse> => {
  const response = await api.post<AIConfigResponse>('/ai-config', config);
  return response;
};

/**
 * 更新 AI 配置
 */
export const updateAIConfig = async (
  configId: number,
  config: AIConfigUpdate
): Promise<AIConfigResponse> => {
  const response = await api.put<AIConfigResponse>(`/ai-config/${configId}`, config);
  return response;
};

/**
 * 删除 AI 配置
 */
export const deleteAIConfig = async (configId: number): Promise<void> => {
  await api.delete(`/ai-config/${configId}`);
};

/**
 * 激活 AI 配置（设为当前使用）
 */
export const activateAIConfig = async (configId: number): Promise<AIConfigResponse> => {
  const response = await api.post<AIConfigResponse>(`/ai-config/${configId}/activate`);
  return response;
};

/**
 * 测试 AI 连接
 */
export const testAIConnection = async (
  data: AIConfigTestRequest
): Promise<AIConfigTestResponse> => {
  const response = await api.post<AIConfigTestResponse>('/ai-config/test', data);
  return response;
};

/**
 * 获取可用模型列表
 */
export const getAvailableModels = async (): Promise<ModelListResponse> => {
  const response = await api.get<ModelListResponse>('/ai-config/models');
  return response;
};
