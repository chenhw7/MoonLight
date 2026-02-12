/**
 * 面试评价报告页面
 *
 * 展示面试评价结果：
 * - 综合评分和各维度评分
 * - 评价总结
 * - 改进建议
 * - 推荐练习题
 */

import { useEffect, useState } from 'react';
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

// 维度颜色映射（预留用于后续图表展示）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _DIMENSION_COLORS: Record<keyof DimensionScores, string> = {
  communication: 'bg-blue-500',
  technical_depth: 'bg-green-500',
  project_experience: 'bg-purple-500',
  adaptability: 'bg-orange-500',
  job_match: 'bg-red-500',
};

export function InterviewEvaluation() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // 状态
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [session, setSession] = useState<InterviewSessionDetail | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  const loadData = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const id = parseInt(sessionId);
      const [sessionData, evaluationData] = await Promise.all([
        getInterviewSession(id),
        getEvaluation(id).catch(() => null),
      ]);

      setSession(sessionData);

      if (evaluationData) {
        setEvaluation(evaluationData);
      } else if (sessionData.status === 'completed') {
        // 如果会话已完成但没有评价，自动生成
        await handleGenerateEvaluation();
      }
    } catch (err: any) {
      logger.error('Failed to load evaluation data', { error: err });
      setError('加载评价数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // 生成评价
  const handleGenerateEvaluation = async () => {
    if (!sessionId) return;

    try {
      setGenerating(true);
      setError(null);

      const id = parseInt(sessionId);
      const evaluationData = await generateEvaluation(id);
      setEvaluation(evaluationData);
    } catch (err: any) {
      logger.error('Failed to generate evaluation', { error: err });
      setError(err.response?.data?.detail || '生成评价失败');
    } finally {
      setGenerating(false);
    }
  };

  // 获取评分等级
  const getScoreLevel = (score: number) => {
    if (score >= 90) return { label: '优秀', color: 'text-green-500' };
    if (score >= 80) return { label: '良好', color: 'text-blue-500' };
    if (score >= 70) return { label: '合格', color: 'text-yellow-500' };
    if (score >= 60) return { label: '待提升', color: 'text-orange-500' };
    return { label: '需努力', color: 'text-red-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate('/interviews')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
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

  // 如果没有评价，显示生成按钮
  if (!evaluation) {
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
            <Button
              onClick={handleGenerateEvaluation}
              disabled={generating}
              size="lg"
            >
              {generating ? (
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* 头部 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/interviews')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">面试评价报告</h1>
            <p className="text-muted-foreground">
              {session.company_name} - {session.position_name}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleGenerateEvaluation}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            重新生成
          </Button>
        </div>
      </div>

      {/* 综合评分 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {evaluation.overall_score}
              </div>
              <div className={`text-xl font-medium ${scoreLevel.color}`}>
                {scoreLevel.label}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                综合评分
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 各维度评分 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2" />
            各维度评分
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(DIMENSION_NAMES) as Array<keyof DimensionScores>).map(
            (key) => {
              const score = evaluation.dimension_scores[key];
              const level = getScoreLevel(score);
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{DIMENSION_NAMES[key]}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${level.color}`}>{score}</span>
                      <span className="text-sm text-muted-foreground">
                        {level.label}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={score}
                    className="h-2"
                  />
                </div>
              );
            }
          )}
        </CardContent>
      </Card>

      {/* 评价总结 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            评价总结
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed">
            {evaluation.summary}
          </p>
        </CardContent>
      </Card>

      {/* 各维度详细评价 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            详细评价
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(evaluation.dimension_details).map(
            ([key, detail]) => (
              <div key={key} className="border-b last:border-0 pb-4 last:pb-0">
                <h4 className="font-medium mb-2">
                  {DIMENSION_NAMES[key as keyof DimensionScores] || key}
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {detail}
                </p>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* 改进建议 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            改进建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {evaluation.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary font-medium">{index + 1}.</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 推荐练习题 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            推荐练习题
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {evaluation.recommended_questions.map((question, index) => (
              <li key={index} className="flex items-start gap-2">
                <Badge variant="outline" className="flex-shrink-0">
                  {index + 1}
                </Badge>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 底部操作 */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => navigate('/interviews')}>
          返回列表
        </Button>
        <Button onClick={() => navigate('/interview/config')}>
          开始新面试
        </Button>
      </div>
    </div>
  );
}
