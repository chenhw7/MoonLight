/**
 * AI 配置页面
 *
 * 用户可以配置 AI 模型参数，包括：
 * - 选择 AI 提供商
 * - 配置 API 地址和密钥
 * - 选择模型
 * - 调整温度、最大 Token 等参数
 */

import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  Save,
  TestTube,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  getAIConfig,
  updateAIConfig,
  deleteAIConfig,
  testAIConnection,
} from '@/services/ai-config';
import {
  AIConfigCreate,
  // AIConfigResponse,
  AI_PROVIDERS,
  DEFAULT_AI_CONFIG,
} from '@/types/ai-config';
import { createLogger } from '@/utils/logger';

const logger = createLogger('AIConfigForm');

export function AIConfigForm() {
  // const navigate = useNavigate();

  // 状态
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // 表单状态
  const [formData, setFormData] = useState<AIConfigCreate>({
    provider: DEFAULT_AI_CONFIG.provider!,
    base_url: '',
    api_key: '',
    chat_model: DEFAULT_AI_CONFIG.chat_model!,
    reasoning_model: '',
    vision_model: '',
    voice_model: '',
    temperature: DEFAULT_AI_CONFIG.temperature!,
    max_tokens: DEFAULT_AI_CONFIG.max_tokens!,
  });

  // 测试状态
  const [testResult, setTestResult] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    models?: string[];
  }>({ type: null, message: '' });

  // 加载现有配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const config = await getAIConfig();
        setHasExistingConfig(true);
        setFormData({
          provider: config.provider,
          base_url: config.base_url,
          api_key: '', // API Key 不返回，需要重新输入
          chat_model: config.chat_model,
          reasoning_model: config.reasoning_model || '',
          vision_model: config.vision_model || '',
          voice_model: config.voice_model || '',
          temperature: config.temperature,
          max_tokens: config.max_tokens,
        });
      } catch (error: any) {
        // 404 表示配置不存在，这是正常的
        if (error.response?.status === 404) {
          setHasExistingConfig(false);
          // 使用默认提供商的 base_url
          const defaultProvider = AI_PROVIDERS[0];
          setFormData((prev) => ({
            ...prev,
            base_url: defaultProvider.defaultBaseUrl,
          }));
        } else {
          logger.error('Failed to load AI config', { error });
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // 处理提供商变更
  const handleProviderChange = (provider: string) => {
    const selectedProvider = AI_PROVIDERS.find((p) => p.value === provider);
    setFormData((prev) => ({
      ...prev,
      provider,
      base_url:
        provider === 'custom'
          ? prev.base_url
          : selectedProvider?.defaultBaseUrl || '',
    }));
  };

  // 测试连接
  const handleTestConnection = async () => {
    if (!formData.base_url || !formData.api_key) {
      setTestResult({
        type: 'error',
        message: '请填写 API 地址和 API Key',
      });
      return;
    }

    try {
      setTesting(true);
      setTestResult({ type: null, message: '' });

      const result = await testAIConnection({
        base_url: formData.base_url,
        api_key: formData.api_key,
      });

      if (result.success) {
        setTestResult({
          type: 'success',
          message: result.message,
          models: result.models,
        });
        setAvailableModels(result.models);
      } else {
        setTestResult({
          type: 'error',
          message: result.message,
        });
      }
    } catch (error: any) {
      logger.error('Test connection failed', { error });
      setTestResult({
        type: 'error',
        message: error.response?.data?.detail || '连接测试失败',
      });
    } finally {
      setTesting(false);
    }
  };

  // 保存配置
  const handleSave = async () => {
    if (!formData.base_url || !formData.api_key) {
      alert('请填写 API 地址和 API Key');
      return;
    }

    try {
      setSaving(true);
      await updateAIConfig(formData);
      alert('配置保存成功！');
      setHasExistingConfig(true);
    } catch (error: any) {
      logger.error('Failed to save AI config', { error });
      alert(error.response?.data?.detail || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 删除配置
  const handleDelete = async () => {
    if (!confirm('确定要删除 AI 配置吗？')) return;

    try {
      await deleteAIConfig();
      alert('配置已删除');
      setHasExistingConfig(false);
      setFormData({
        provider: DEFAULT_AI_CONFIG.provider!,
        base_url: AI_PROVIDERS[0].defaultBaseUrl,
        api_key: '',
        chat_model: DEFAULT_AI_CONFIG.chat_model!,
        reasoning_model: '',
        vision_model: '',
        voice_model: '',
        temperature: DEFAULT_AI_CONFIG.temperature!,
        max_tokens: DEFAULT_AI_CONFIG.max_tokens!,
      });
    } catch (error: any) {
      logger.error('Failed to delete AI config', { error });
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">AI 模型配置</h1>
        <p className="text-muted-foreground mt-1">
          配置 AI 模型参数，用于模拟面试功能
        </p>
      </div>

      <div className="space-y-6">
        {/* 提供商选择 */}
        <div className="space-y-2">
          <Label htmlFor="provider">AI 提供商</Label>
          <Select
            value={formData.provider}
            onValueChange={handleProviderChange}
          >
            <SelectTrigger id="provider">
              <SelectValue placeholder="选择提供商" />
            </SelectTrigger>
            <SelectContent>
              {AI_PROVIDERS.map((provider) => (
                <SelectItem key={provider.value} value={provider.value}>
                  <div className="flex flex-col items-start">
                    <span>{provider.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {provider.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API 地址 */}
        <div className="space-y-2">
          <Label htmlFor="base_url">API 地址</Label>
          <Input
            id="base_url"
            value={formData.base_url}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, base_url: e.target.value }))
            }
            placeholder="https://api.example.com/v1"
          />
          <p className="text-xs text-muted-foreground">
            OpenAI 兼容接口的基础 URL
          </p>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="api_key">
            API Key
            {hasExistingConfig && (
              <span className="text-muted-foreground ml-2">
                (已配置，如需修改请重新输入)
              </span>
            )}
          </Label>
          <Input
            id="api_key"
            type="password"
            value={formData.api_key}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, api_key: e.target.value }))
            }
            placeholder="sk-..."
          />
        </div>

        {/* 测试连接按钮 */}
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="w-4 h-4 mr-2" />
          )}
          测试连接
        </Button>

        {/* 测试结果 */}
        {testResult.type && (
          <Alert
            variant={testResult.type === 'success' ? 'default' : 'destructive'}
          >
            {testResult.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.message}
              {testResult.models && testResult.models.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">可用模型：</p>
                  <p className="text-sm mt-1">
                    {testResult.models.slice(0, 10).join(', ')}
                    {testResult.models.length > 10 && '...'}
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 模型选择 */}
        <div className="space-y-2">
          <Label htmlFor="chat_model">对话模型</Label>
          <div className="flex gap-2">
            <Input
              id="chat_model"
              value={formData.chat_model}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, chat_model: e.target.value }))
              }
              placeholder="gpt-4"
              className="flex-1"
            />
            {availableModels.length > 0 && (
              <Select
                value={formData.chat_model}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, chat_model: value }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* 高级设置 */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>高级设置</span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {/* 推理模型 */}
            <div className="space-y-2">
              <Label htmlFor="reasoning_model">推理模型（可选）</Label>
              <Input
                id="reasoning_model"
                value={formData.reasoning_model}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reasoning_model: e.target.value,
                  }))
                }
                placeholder="用于复杂推理的模型"
              />
            </div>

            {/* 视觉模型 */}
            <div className="space-y-2">
              <Label htmlFor="vision_model">视觉模型（可选）</Label>
              <Input
                id="vision_model"
                value={formData.vision_model}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vision_model: e.target.value,
                  }))
                }
                placeholder="用于图像理解的模型"
              />
            </div>

            {/* 语音模型 */}
            <div className="space-y-2">
              <Label htmlFor="voice_model">语音模型（可选）</Label>
              <Input
                id="voice_model"
                value={formData.voice_model}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    voice_model: e.target.value,
                  }))
                }
                placeholder="用于语音对话的模型"
              />
            </div>

            {/* 温度 */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label htmlFor="temperature">温度 (Temperature)</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.temperature}
                </span>
              </div>
              <Slider
                id="temperature"
                value={[formData.temperature]}
                onValueChange={(values: number[]) =>
                  setFormData((prev) => ({ ...prev, temperature: values[0] }))
                }
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                较低的值使输出更确定，较高的值使输出更随机
              </p>
            </div>

            {/* 最大 Token */}
            <div className="space-y-2">
              <Label htmlFor="max_tokens">最大 Token 数</Label>
              <Input
                id="max_tokens"
                type="number"
                value={formData.max_tokens}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    max_tokens: parseInt(e.target.value) || 4096,
                  }))
                }
                min={1}
                max={8192}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 操作按钮 */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            保存配置
          </Button>

          {hasExistingConfig && (
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </Button>
          )}
        </div>

        {/* 提示信息 */}
        <Alert variant="default" className="mt-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            API Key 将安全存储在服务器上。建议为 MoonLight 创建专用的 API Key，并定期更换。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
