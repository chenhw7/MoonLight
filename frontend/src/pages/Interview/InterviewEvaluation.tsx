/**
 * 面试评价报告页面
 *
 * 展示面试评价结果：
 * - 综合评分和各维度评分
 * - 评价总结
 * - 改进建议
 * - 推荐练习题
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  Star,
  Lightbulb,
  BookOpen,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getInterviewSession,
  getEvaluation,
  generateEvaluation,
} from '@/services/interview';
import {
  InterviewSessionDetail,
  InterviewEvaluationResponse,
  DimensionScores,
} from '@/types/interview';
import { createLogger } from '@/utils/logger';

const logger = createLogger('InterviewEvaluation');

// 维度名称映射
const DIMENSION_NAMES: Record<keyof DimensionScores, string> = {
  communication: '沟通能力',
  technical_depth: '技术深度',
  project_experience: '项目经验',
  adaptability: '应变能力',
  job_match: '岗位匹配度',
};

// 维度颜色映射
const DIMENSION_COLORS: Record<keyof DimensionScores, string> = {
  communication: 'bg-blue-500',
  technical_depth: 'bg-green-500',
  project_experience: 'bg-purple-500',
  adaptability: 'bg-orange-500',
  job_match: 'bg-red-500',
};

// 生成状态类型
type GenerationStatus = 'idle' | 'generating' | 'polling' | 'completed' | 'error';

export function InterviewEvaluation() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const pollingRef = useRef<boolean>(false);

  // 状态
  const [loading, setLoading] = useState(true);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [session, setSession] = useState<InterviewSessionDetail | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progressMessage, setProgressMessage] = useState('准备生成评价...');

  // 加载数据
  const loadData = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const id = parseInt(sessionId);
      const sessionData = await getInterviewSession(id);
      setSession(sessionData);

      // 尝试获取评价
      try {
        const evaluationData = await getEvaluation(id);
        setEvaluation(evaluationData);
        setGenerationStatus('completed');
      } catch {
        // 评价不存在
        if (sessionData.status === 'completed') {
          // 如果会话已完成但没有评价，标记为需要生成
          setGenerationStatus('idle');
        } else {
          setGenerationStatus('idle');
        }
      }
    } catch (err: any) {
      logger.error('Failed to load evaluation data', { error: err });
      setError('加载评价数据失败');
      setGenerationStatus('error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generationStatus === 'generating' || generationStatus === 'polling') {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [generationStatus]);

  // 轮询检查评价是否生成完成
  const pollEvaluation = useCallback(async (id: number, maxAttempts = 30) => {
    if (pollingRef.current) return; // 防止重复轮询
    pollingRef.current = true;
    
    setGenerationStatus('polling');
    setProgressMessage('正在生成评价报告，请稍候...');

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const evaluationData = await getEvaluation(id);
        setEvaluation(evaluationData);
        setGenerationStatus('completed');
        setProgressMessage('评价生成完成！');
        pollingRef.current = false;
        return;
      } catch {
        // 评价还未生成，继续等待
        setProgressMessage(`正在生成评价报告... (${attempt + 1}/${maxAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 每2秒检查一次
      }
    }

    // 超时
    setError('评价生成超时，请稍后刷新页面查看');
    setGenerationStatus('error');
    pollingRef.current = false;
  }, []);

  // 开始生成评价
  const startGeneration = useCallback(async () => {
    if (!sessionId || pollingRef.current) return;

    try {
      setGenerationStatus('generating');
      setError(null);
      setElapsedTime(0);
      setProgressMessage('正在调用 AI 生成评价...');

      const id = parseInt(sessionId);
      
      // 发起生成请求（可能超时，但后端会继续处理）
      try {
        await generateEvaluation(id);
      } catch (err: any) {
        // 如果是超时错误，开始轮询
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          logger.info('Generation request timeout, starting polling');
          setProgressMessage('评价生成中，请稍候...');
        } else {
          throw err;
        }
      }

      // 开始轮询检查结果
      await pollEvaluation(id);
    } catch (err: any) {
      logger.error('Failed to generate evaluation', { error: err });
      setError(err.response?.data?.detail || '生成评价失败');
      setGenerationStatus('error');
      pollingRef.current = false;
    }
  }, [sessionId, pollEvaluation]);

  // 自动触发评价生成（当会话已完成且没有评价时）
  useEffect(() => {
    if (session?.status === 'completed' && !evaluation && generationStatus === 'idle' && !loading) {
      startGeneration();
    }
  }, [session, evaluation, generationStatus, loading, startGeneration]);

  // 获取评分等级
  const getScoreLevel = (score: number) => {
    if (score >= 90) return { label: '优秀', color: 'text-green-500', bgColor: 'bg-green-500' };
    if (score >= 80) return { label: '良好', color: 'text-blue-500', bgColor: 'bg-blue-500' };
    if (score >= 70) return { label: '合格', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
    if (score >= 60) return { label: '待提升', color: 'text-orange-500', bgColor: 'bg-orange-500' };
    return { label: '需努力', color: 'text-red-500', bgColor: 'bg-red-500' };
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !evaluation) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center gap-4">
          <Button onClick={() => navigate('/interviews')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">面试会话不存在</p>
      </div>
    );
  }

  // 生成中状态
  if (generationStatus === 'generating' || generationStatus === 'polling') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>正在生成面试评价</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary/50" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium">{progressMessage}</p>
              <p className="text-sm text-muted-foreground">
                AI 正在分析面试对话，这可能需要 30-60 秒
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>已用时: {formatTime(elapsedTime)}</span>
            </div>

            <Progress value={Math.min((elapsedTime / 60) * 100, 90)} className="w-full" />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 分析面试对话内容</p>
              <p>• 评估各维度能力</p>
              <p>• 生成改进建议</p>
              <p>• 推荐练习题</p>
            </div>

            <Button variant="outline" onClick={loadData} disabled={generationStatus === 'generating'}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新状态
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 如果没有评价且不在生成中，显示生成按钮
  if (!evaluation) {
    // 如果正在生成中，前面已经返回了生成中界面
    // 这里只处理未生成的情况
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _status = generationStatus as GenerationStatus;
    const isGenerating = _status === 'generating' || _status === 'polling';
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>生成面试评价</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              面试已完成，点击下方按钮生成 AI 评价报告
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>评价生成大约需要 30-60 秒</p>
              <p>请耐心等待，不要关闭页面</p>
            </div>
            <Button
              onClick={startGeneration}
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              生成评价
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreLevel = getScoreLevel(evaluation.overall_score);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">面试评价报告</h1>
          <p className="text-muted-foreground">
            {session.company_name} - {session.position_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/interviews')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </div>
      </div>

      {/* 综合评分 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(evaluation.overall_score / 100) * 351.86} 351.86`}
                  className={scoreLevel.color}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${scoreLevel.color}`}>
                  {evaluation.overall_score}
                </span>
                <span className="text-xs text-muted-foreground">总分</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={scoreLevel.bgColor}>{scoreLevel.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  生成时间: {new Date(evaluation.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-muted-foreground">{evaluation.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 各维度评分 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            维度评分
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(Object.entries(evaluation.dimension_scores) as [keyof DimensionScores, number][]).map(
              ([key, score]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{DIMENSION_NAMES[key]}</span>
                    <span className={`font-bold ${getScoreLevel(score).color}`}>{score}分</span>
                  </div>
                  <Progress value={score} className="h-2">
                    <div
                      className={`h-full ${DIMENSION_COLORS[key]}`}
                      style={{ width: `${score}%` }}
                    />
                  </Progress>
                  <p className="text-sm text-muted-foreground">
                    {evaluation.dimension_details[key]}
                  </p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* 改进建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            改进建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {evaluation.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 推荐练习题 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            推荐练习题
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {evaluation.recommended_questions.map((question, index) => (
              <li key={index} className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
