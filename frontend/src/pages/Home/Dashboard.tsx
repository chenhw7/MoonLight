/**
 * 仪表盘页面
 *
 * 主页的主要内容区域，包含：
 * - 核心统计数据概览
 * - 简历管理区
 * - 面试练习区
 * - 成长趋势区
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, ArrowRight, FileText, MessageSquare, Star, Flame } from 'lucide-react';
import { getDashboardData } from '@/services/dashboard';
import type { DashboardData } from '@/types/dashboard';
import { createLogger } from '@/utils/logger';
import {
  StatCard,
  RadarChartComponent,
  ScoreTrend,
  DimensionChange,
  InterviewList,
} from '@/components/dashboard';

const logger = createLogger('Dashboard');

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (err) {
        logger.error('Failed to fetch dashboard data', { error: err });
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInterviewClick = (id: number) => {
    navigate(`/interview/${id}/evaluation`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          重新加载
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stats = data?.stats ?? { resume_count: 0, interview_count: 0, average_score: null, streak_days: 0 };
  const recent_resumes = data?.recent_resumes ?? [];
  
  // 确保 interview_stats 有完整默认值（处理 undefined 和 null 情况）
  const safeInterviewStats = data?.interview_stats ? {
    dimension_scores: data.interview_stats.dimension_scores ?? null,
    recent_interviews: data.interview_stats.recent_interviews ?? [],
    score_trend: data.interview_stats.score_trend ?? [],
    dimension_changes: data.interview_stats.dimension_changes ?? [],
    insight: data.interview_stats.insight ?? null,
  } : {
    dimension_scores: null,
    recent_interviews: [],
    score_trend: [],
    dimension_changes: [],
    insight: null,
  };

  return (
    <div className="space-y-6">
      {/* 欢迎头部 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">👋 欢迎回来！</h1>
          <p className="text-muted-foreground mt-2">
            这里是您的工作台，继续完善您的简历吧。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/resumes')}>
            我的简历
          </Button>
          <Button onClick={() => navigate('/resume/create')}>
            <Plus className="w-4 h-4 mr-2" />
            创建简历
          </Button>
        </div>
      </div>

      {/* 核心数据概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="简历数量"
          value={stats.resume_count}
          href="/resumes"
        />
        <StatCard
          icon={MessageSquare}
          label="面试次数"
          value={stats.interview_count}
          href="/interviews"
        />
        <StatCard
          icon={Star}
          label="平均分数"
          value={stats.average_score ? `${stats.average_score}分` : '-'}
          href="/interviews"
        />
        <StatCard
          icon={Flame}
          label="连续练习"
          value={`${stats.streak_days}天`}
        />
      </div>

      {/* 主要内容区：简历管理 + 面试练习 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 简历管理区 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">📄 简历管理</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/resumes')}
              className="text-muted-foreground"
            >
              查看全部 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recent_resumes.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">还没有简历</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  创建第一份简历，开启求职之旅
                </p>
                <Button onClick={() => navigate('/resume/create')}>
                  创建简历
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recent_resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{resume.resume_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {resume.location || '未设置地点'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/resume/edit/${resume.id}`)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/resume/view/${resume.id}`)}
                        >
                          预览
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/resume/create')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新建简历
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 面试练习区 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">🤖 面试练习</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/interviews')}
              className="text-muted-foreground"
            >
              查看全部 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {safeInterviewStats.recent_interviews.length > 0 ? (
              <div className="space-y-4">
                {/* 雷达图 */}
                {safeInterviewStats.dimension_scores && (
                  <RadarChartComponent data={safeInterviewStats.dimension_scores} height={200} />
                )}

                {/* 最近面试列表 */}
                <InterviewList
                  data={safeInterviewStats.recent_interviews}
                  onItemClick={handleInterviewClick}
                />

                {/* 开始新面试按钮 */}
                <Button
                  className="w-full"
                  onClick={() => navigate('/interview/config')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  开始新面试
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">还没有面试练习</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  AI 面试官可以帮你模拟真实面试场景
                </p>
                <Button onClick={() => navigate('/interview/config')}>
                  开始第一场面试
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 成长趋势区 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📈 成长趋势</CardTitle>
        </CardHeader>
        <CardContent>
          {safeInterviewStats.score_trend.length >= 3 ? (
            <div className="space-y-6">
              {/* 分数趋势图 */}
              <ScoreTrend data={safeInterviewStats.score_trend} height={180} />

              {/* 维度变化 */}
              <DimensionChange data={safeInterviewStats.dimension_changes} />

              {/* 洞察文字 */}
              {safeInterviewStats.insight && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary">💡 {safeInterviewStats.insight}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-medium">数据积累中...</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                完成 3 场面试后，将展示你的成长趋势分析
              </p>
              <Button onClick={() => navigate('/interview/config')}>
                去练习面试
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
