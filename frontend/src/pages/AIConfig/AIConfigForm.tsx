/**
 * AI 配置页面
 *
 * 支持多提供商配置管理（方案二：显式设为当前按钮）
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2,
  Save,
  TestTube,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  Settings,
  MessageSquare,
  ChevronRight,
  Bot,
  Power,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getAIConfigs,
  createAIConfig,
  updateAIConfig,
  deleteAIConfig,
  activateAIConfig,
  testAIConnection,
} from '@/services/ai-config';
import { AI_PROVIDERS, AIConfigResponse } from '@/types/ai-config';
import { createLogger } from '@/utils/logger';

const logger = createLogger('AIConfigForm');

/**
 * 获取提供商图标
 */
const getProviderIcon = (providerValue: string) => {
  const icons: Record<string, string> = {
    'openai-compatible': '🤖',
    dashscope: '🇦',
    deepseek: '🌙',
    siliconflow: '⚡',
    custom: '⚙️',
  };
  return icons[providerValue] || '🤖';
};

export function AIConfigForm() {
  // 加载状态
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activating, setActivating] = useState<number | null>(null);

  // 配置列表
  const [configs, setConfigs] = useState<AIConfigResponse[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<number | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);

  // 当前编辑的配置（本地编辑状态）
  const [editingConfig, setEditingConfig] = useState<{
    id: number | null;
    name: string;
    provider: string;
    base_url: string;
    api_key: string;
    chat_model: string;
    temperature: number;
    max_tokens: number;
    has_api_key: boolean;
  } | null>(null);

  // 可用模型列表
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // 测试状态
  const [testResult, setTestResult] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // 加载配置列表
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        setLoading(true);
        const response = await getAIConfigs();
        setConfigs(response.configs);
        setActiveConfigId(response.active_config_id);
        
        // 默认选中第一个配置
        if (response.configs.length > 0) {
          const firstConfig = response.configs[0];
          setSelectedConfigId(firstConfig.id);
          setEditingConfig({
            id: firstConfig.id,
            name: firstConfig.name,
            provider: firstConfig.provider,
            base_url: firstConfig.base_url,
            api_key: '',
            chat_model: firstConfig.chat_model,
            temperature: firstConfig.temperature,
            max_tokens: firstConfig.max_tokens,
            has_api_key: firstConfig.api_key_masked !== '',
          });
        }
      } catch (error: any) {
        logger.error('Failed to load AI configs', { error });
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, []);

  // 选择配置进行编辑
  const handleSelectConfig = useCallback(
    (configId: number) => {
      setSelectedConfigId(configId);
      const config = configs.find((c) => c.id === configId);
      if (config) {
        setEditingConfig({
          id: config.id,
          name: config.name,
          provider: config.provider,
          base_url: config.base_url,
          api_key: '',
          chat_model: config.chat_model,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          has_api_key: config.api_key_masked !== '',
        });
        setAvailableModels([]);
        setTestResult({ type: null, message: '' });
      }
    },
    [configs]
  );

  // 添加新配置
  const handleAddConfig = async () => {
    try {
      const newConfig = await createAIConfig({
        name: '新配置',
        provider: 'openai-compatible',
        base_url: AI_PROVIDERS[0].defaultBaseUrl,
        api_key: '',
        chat_model: '', // 空字符串，让用户自己填写或从列表选择
        temperature: 0.7,
        max_tokens: 4096,
      });
      
      setConfigs((prev) => [...prev, newConfig]);
      setSelectedConfigId(newConfig.id);
      setActiveConfigId(newConfig.is_active ? newConfig.id : activeConfigId);
      setEditingConfig({
        id: newConfig.id,
        name: newConfig.name,
        provider: newConfig.provider,
        base_url: newConfig.base_url,
        api_key: '',
        chat_model: newConfig.chat_model,
        temperature: newConfig.temperature,
        max_tokens: newConfig.max_tokens,
        has_api_key: false,
      });
      setAvailableModels([]);
      setTestResult({ type: null, message: '' });
    } catch (error: any) {
      logger.error('Failed to create AI config', { error });
      alert(error.response?.data?.detail || '创建配置失败');
    }
  };

  // 删除配置
  const handleDeleteConfig = async (configId: number) => {
    if (!confirm('确定要删除此配置吗？')) return;

    try {
      await deleteAIConfig(configId);
      
      setConfigs((prev) => {
        const filtered = prev.filter((c) => c.id !== configId);
        // 如果删除的是当前选中的，切换到第一个
        if (selectedConfigId === configId) {
          if (filtered.length > 0) {
            const first = filtered[0];
            setSelectedConfigId(first.id);
            setEditingConfig({
              id: first.id,
              name: first.name,
              provider: first.provider,
              base_url: first.base_url,
              api_key: '',
              chat_model: first.chat_model,
              temperature: first.temperature,
              max_tokens: first.max_tokens,
              has_api_key: first.api_key_masked !== '',
            });
          } else {
            setSelectedConfigId(null);
            setEditingConfig(null);
          }
        }
        return filtered;
      });
      
      // 更新激活状态
      if (activeConfigId === configId) {
        const remaining = configs.filter((c) => c.id !== configId);
        setActiveConfigId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (error: any) {
      logger.error('Failed to delete AI config', { error });
      alert(error.response?.data?.detail || '删除失败');
    }
  };

  // 设为当前配置（方案二核心功能）
  const handleSetActive = async (configId: number) => {
    try {
      setActivating(configId);
      await activateAIConfig(configId);
      
      // 更新本地状态
      setConfigs((prev) =>
        prev.map((c) => ({
          ...c,
          is_active: c.id === configId,
        }))
      );
      setActiveConfigId(configId);
      
      // 如果当前正在编辑这个配置，更新编辑状态
      if (editingConfig?.id === configId) {
        setEditingConfig((prev) => prev ? { ...prev, has_api_key: true } : null);
      }
    } catch (error: any) {
      logger.error('Failed to activate AI config', { error });
      alert(error.response?.data?.detail || '切换配置失败');
    } finally {
      setActivating(null);
    }
  };

  // 更新编辑中的配置
  const handleUpdateEditing = (
    field: 'name' | 'provider' | 'base_url' | 'api_key' | 'chat_model' | 'temperature' | 'max_tokens',
    value: string | number
  ) => {
    setEditingConfig((prev) => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };

      // 如果修改了提供商，自动更新 base_url
      if (field === 'provider') {
        const provider = AI_PROVIDERS.find((p) => p.value === value);
        if (provider && provider.defaultBaseUrl) {
          updated.base_url = provider.defaultBaseUrl;
        }
      }

      return updated;
    });
  };

  // 测试连接
  const handleTestConnection = async () => {
    if (!editingConfig?.base_url) {
      setTestResult({
        type: 'error',
        message: '请填写 API 地址',
      });
      return;
    }

    // 确定使用的 API Key
    let apiKey = editingConfig.api_key;
    // 如果输入框为空但已配置过 Key，使用特殊标记让后端使用已保存的 Key
    if (!apiKey && editingConfig.has_api_key) {
      apiKey = '__USE_SAVED_KEY__';
    }
    
    if (!apiKey) {
      setTestResult({
        type: 'error',
        message: '请填写 API Key',
      });
      return;
    }

    try {
      setTesting(true);
      setTestResult({ type: null, message: '' });

      const result = await testAIConnection({
        base_url: editingConfig.base_url,
        api_key: apiKey,
      });

      if (result.success) {
        setTestResult({
          type: 'success',
          message: `连接成功！发现 ${result.models.length} 个可用模型`,
        });
        setAvailableModels(result.models);
      } else {
        setTestResult({
          type: 'error',
          message: result.message,
        });
        setAvailableModels([]);
      }
    } catch (error: any) {
      logger.error('Test connection failed', { error });
      setTestResult({
        type: 'error',
        message: error.response?.data?.detail || '连接测试失败',
      });
      setAvailableModels([]);
    } finally {
      setTesting(false);
    }
  };

  // 保存配置
  const handleSave = async () => {
    if (!editingConfig?.id) return;
    if (!editingConfig?.base_url) {
      alert('请填写 API 地址');
      return;
    }

    // 确定使用的 API Key
    let apiKey = editingConfig.api_key;
    // 如果输入框为空但已配置过 Key，使用特殊标记让后端使用已保存的 Key
    if (!apiKey && editingConfig.has_api_key) {
      apiKey = '__USE_SAVED_KEY__';
    }
    
    if (!apiKey) {
      alert('请填写 API Key');
      return;
    }

    try {
      setSaving(true);

      const updated = await updateAIConfig(editingConfig.id, {
        name: editingConfig.name,
        provider: editingConfig.provider,
        base_url: editingConfig.base_url,
        api_key: apiKey,
        chat_model: editingConfig.chat_model,
        temperature: editingConfig.temperature,
        max_tokens: editingConfig.max_tokens,
      });

      // 更新本地状态
      setConfigs((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      
      // 清空输入框，保持安全
      setEditingConfig((prev) => prev ? { ...prev, api_key: '' } : null);

      alert('配置保存成功！');
    } catch (error: any) {
      logger.error('Failed to save AI config', { error });
      alert(error.response?.data?.detail || '保存失败，请重试');
    } finally {
      setSaving(false);
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
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">AI 模型配置</h1>
        <p className="text-muted-foreground mt-1">
          管理多个 AI 提供商配置，点击"设为当前"切换使用
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：配置列表 */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">我的配置</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleAddConfig}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[450px] -mx-2">
              <div className="space-y-2 px-2">
                {configs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    暂无配置，点击 + 添加
                  </div>
                ) : (
                  configs.map((config) => (
                    <div
                      key={config.id}
                      className={`rounded-lg border transition-all ${
                        selectedConfigId === config.id
                          ? 'bg-primary/5 border-primary/30'
                          : 'bg-card border-border hover:border-primary/20'
                      }`}
                    >
                      {/* 配置信息（可点击选中编辑） */}
                      <button
                        onClick={() => handleSelectConfig(config.id)}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left"
                      >
                        <span className="text-xl">{getProviderIcon(config.provider)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {config.name}
                            </span>
                            {config.is_active && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 text-green-700 shrink-0"
                              >
                                当前使用中
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {config.chat_model}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                      
                      {/* 操作按钮区 */}
                      <div className="px-3 pb-3 flex gap-2">
                        {/* 设为当前按钮（方案二核心） */}
                        {!config.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleSetActive(config.id)}
                            disabled={activating === config.id}
                          >
                            {activating === config.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Power className="w-3 h-3 mr-1" />
                            )}
                            设为当前
                          </Button>
                        )}
                        
                        {/* 删除按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteConfig(config.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 右侧：配置详情 */}
        <Card className="lg:col-span-2">
          {editingConfig ? (
            <>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  编辑配置
                  {editingConfig.id === activeConfigId && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      当前使用中
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 配置名称 */}
                <div className="space-y-2">
                  <Label>配置名称</Label>
                  <Input
                    value={editingConfig.name}
                    onChange={(e) =>
                      handleUpdateEditing('name', e.target.value)
                    }
                    placeholder="给这个配置起个名字"
                  />
                </div>

                {/* 提供商选择 */}
                <div className="space-y-2">
                  <Label>AI 提供商</Label>
                  <Select
                    value={editingConfig.provider}
                    onValueChange={(v) =>
                      handleUpdateEditing('provider', v)
                    }
                  >
                    <SelectTrigger>
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
                  <Label>API 地址</Label>
                  <Input
                    value={editingConfig.base_url}
                    onChange={(e) =>
                      handleUpdateEditing('base_url', e.target.value)
                    }
                    placeholder="https://api.example.com/v1"
                  />
                  <p className="text-xs text-muted-foreground">
                    OpenAI 兼容接口的基础 URL
                  </p>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label>
                    API Key
                    {editingConfig.has_api_key && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        已配置
                      </Badge>
                    )}
                  </Label>
                  <Input
                    type="password"
                    value={editingConfig.api_key}
                    onChange={(e) =>
                      handleUpdateEditing('api_key', e.target.value)
                    }
                    placeholder={
                      editingConfig.has_api_key
                        ? '如需修改请重新输入，留空则使用已保存的 Key'
                        : 'sk-...'
                    }
                  />
                  {editingConfig.has_api_key && (
                    <p className="text-xs text-muted-foreground">
                      已保存 API Key，如需修改请输入新的 Key，留空则保持原 Key 不变
                    </p>
                  )}
                </div>

                {/* 测试连接 */}
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
                    variant={
                      testResult.type === 'success' ? 'default' : 'destructive'
                    }
                  >
                    {testResult.type === 'success' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                )}

                {/* 模型选择 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <Label className="font-medium">主模型</Label>
                    {availableModels.length > 0 && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {availableModels.length} 个可用
                      </Badge>
                    )}
                  </div>
                  
                  {availableModels.length > 0 ? (
                    <Select
                      value={editingConfig.chat_model}
                      onValueChange={(v) =>
                        handleUpdateEditing('chat_model', v)
                      }
                    >
                      <SelectTrigger className="w-full h-auto min-h-[40px] py-2">
                        <SelectValue placeholder="选择模型">
                          <span className="break-all text-left">
                            {editingConfig.chat_model}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[350px] w-[--radix-select-trigger-width]">
                        {availableModels.map((model) => (
                          <SelectItem 
                            key={model} 
                            value={model}
                            className="py-2.5 cursor-pointer"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span 
                                className="break-all whitespace-normal leading-relaxed"
                                title={model}
                              >
                                {model}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={editingConfig.chat_model}
                      onChange={(e) =>
                        handleUpdateEditing('chat_model', e.target.value)
                      }
                      placeholder="例如: gpt-4, deepseek-chat"
                      className="w-full"
                    />
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    用于面试对话的主模型，测试连接后可从列表中选择
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-4">
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
                    保存修改
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>请选择或添加一个配置</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* 提示信息 */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          API Key 将安全存储在服务器上。建议为 MoonLight 创建专用的 API Key，并定期更换。
          点击配置列表中的"设为当前"即可切换使用的配置，无需重新保存。
        </AlertDescription>
      </Alert>
    </div>
  );
}
