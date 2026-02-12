/**
 * AI 配置相关类型定义
 */

/**
 * AI 配置基础类型
 */
export interface AIConfigBase {
  provider: string;
  base_url: string;
  chat_model: string;
  reasoning_model?: string;
  vision_model?: string;
  voice_model?: string;
  temperature: number;
  max_tokens: number;
}

/**
 * AI 配置创建/更新请求
 */
export interface AIConfigCreate extends AIConfigBase {
  api_key: string;
}

/**
 * AI 配置更新请求（部分字段）
 */
export interface AIConfigUpdate extends Partial<AIConfigBase> {
  api_key?: string;
}

/**
 * AI 配置响应（不包含 api_key）
 */
export interface AIConfigResponse extends AIConfigBase {
  id: number;
  user_id: number;
  api_key_masked: string;
  created_at: string;
  updated_at: string;
}

/**
 * AI 配置测试请求
 */
export interface AIConfigTestRequest {
  base_url: string;
  api_key: string;
}

/**
 * AI 配置测试响应
 */
export interface AIConfigTestResponse {
  success: boolean;
  message: string;
  models: string[];
}

/**
 * 模型列表响应
 */
export interface ModelListResponse {
  models: string[];
}

/**
 * AI 提供商选项
 */
export interface AIProviderOption {
  value: string;
  label: string;
  defaultBaseUrl: string;
  description?: string;
}

/**
 * 预定义的 AI 提供商配置
 */
export const AI_PROVIDERS: AIProviderOption[] = [
  {
    value: 'openai-compatible',
    label: 'OpenAI 兼容接口',
    defaultBaseUrl: 'https://api.openai.com/v1',
    description: '支持任何 OpenAI 兼容的 API',
  },
  {
    value: 'dashscope',
    label: '阿里云 DashScope',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    description: '阿里云大模型服务平台',
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    description: 'DeepSeek AI',
  },
  {
    value: 'siliconflow',
    label: 'SiliconFlow',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    description: '硅基流动',
  },
  {
    value: 'custom',
    label: '自定义',
    defaultBaseUrl: '',
    description: '自定义 API 地址',
  },
];

/**
 * 默认 AI 配置
 */
export const DEFAULT_AI_CONFIG: Partial<AIConfigCreate> = {
  provider: 'openai-compatible',
  chat_model: 'gpt-4',
  temperature: 0.7,
  max_tokens: 4096,
};
