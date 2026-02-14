/**
 * AI 配置服务
 *
 * 提供 AI 配置的 CRUD 操作和连接测试
 */

import api from './api';
import {
  AIConfigCreate,
  AIConfigResponse,
  AIConfigTestRequest,
  AIConfigTestResponse,
  AIConfigUpdate,
  ModelListResponse,
} from '@/types/ai-config';

/**
 * 获取 AI 配置
 */
export const getAIConfig = async (): Promise<AIConfigResponse> => {
  const response = await api.get<AIConfigResponse>('/ai-config');
  return response;
};

/**
 * 更新 AI 配置
 */
export const updateAIConfig = async (
  config: AIConfigCreate
): Promise<AIConfigResponse> => {
  const response = await api.put<AIConfigResponse>('/ai-config', config);
  return response;
};

/**
 * 部分更新 AI 配置
 */
export const patchAIConfig = async (
  config: AIConfigUpdate
): Promise<AIConfigResponse> => {
  const response = await api.patch<AIConfigResponse>('/ai-config', config);
  return response;
};

/**
 * 删除 AI 配置
 */
export const deleteAIConfig = async (): Promise<void> => {
  await api.delete('/ai-config');
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
