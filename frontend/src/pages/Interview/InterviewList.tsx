/**
 * 面试历史列表页面
 *
 * 展示用户的所有面试记录：
 * - 面试列表
 * - 状态筛选
 * - 快速操作
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  Plus,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Filter,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getInterviewSessions,
  deleteEvaluation,
} from '@/services/interview';
import {
  InterviewSessionListItem,
  InterviewStatus,
  RecruitmentType,
  InterviewMode,
  ROUND_DISPLAY_NAMES,
} from '@/types/interview';
import { createLogger } from '@/utils/logger';

const logger = createLogger('InterviewList');

// 状态显示配置
const STATUS_CONFIG: Record<
  InterviewStatus,
  { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  ongoing: {
    label: '进行中',
    icon: <Clock className="w-4 h-4" />,
    variant: 'default',
  },
  completed: {
    label: '已完成',
    icon: <CheckCircle className="w-4 h-4" />,
    variant: 'secondary',
  },
  aborted: {
    label: '已放弃',
    icon: <XCircle className="w-4 h-4" />,
    variant: 'destructive',
  },
};

// 招聘类型显示
const RECRUITMENT_TYPE_LABEL: Record<RecruitmentType, string> = {
  campus: '校招',
  social: '社招',
};

// 面试模式显示
const INTERVIEW_MODE_LABEL: Record<InterviewMode, string> = {
  basic_knowledge: '基础知识问答',
  project_deep_dive: '项目/实习深挖',
  coding: '编程题',
  technical_deep_dive: '技术深挖',
  technical_qa: '技术问答',
  scenario_design: '场景设计',
};

export function InterviewList() {
  const navigate = useNavigate();

  // 状态
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<InterviewSessionListItem[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<InterviewSessionListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | 'all'>('all');

  // 加载数据
  const loadInterviews = async () => {
    try {
      setLoading(true);
      const response = await getInterviewSessions(0, 100);
      setInterviews(response.items || []);
      setFilteredInterviews(response.items || []);
    } catch (error) {
      logger.error('Failed to load interviews', { error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  // 筛选
  useEffect(() => {
    let filtered = interviews;

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.company_name.toLowerCase().includes(query) ||
          item.position_name.toLowerCase().includes(query)
      );
    }

    setFilteredInterviews(filtered);
  }, [interviews, statusFilter, searchQuery]);

  // 删除评价
  const handleDeleteEvaluation = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除评价吗？')) return;

    try {
      await deleteEvaluation(sessionId);
      await loadInterviews();
    } catch (error) {
      logger.error('Failed to delete evaluation', { error });
      alert('删除失败');
    }
  };

  // 进入面试/查看评价
  const handleInterviewClick = (interview: InterviewSessionListItem) => {
    if (interview.status === 'ongoing') {
      navigate(`/interview/${interview.id}`);
    } else if (interview.status === 'completed') {
      navigate(`/interview/${interview.id}/evaluation`);
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">面试历史</h1>
          <p className="text-muted-foreground mt-1">
            共 {interviews.length} 场面试
          </p>
        </div>
        <Button onClick={() => navigate('/interview/config')}>
          <Plus className="w-4 h-4 mr-2" />
          开始新面试
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索企业或岗位..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as InterviewStatus | 'all')}
              >
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="ongoing">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="aborted">已放弃</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 面试列表 */}
      {filteredInterviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {interviews.length === 0
                ? '还没有面试记录，开始你的第一场模拟面试吧！'
                : '没有找到匹配的面试记录'}
            </p>
            {interviews.length === 0 && (
              <Button onClick={() => navigate('/interview/config')}>
                <Plus className="w-4 h-4 mr-2" />
                开始面试
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => {
            const statusConfig = STATUS_CONFIG[interview.status];
            return (
              <Card
                key={interview.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleInterviewClick(interview)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 头部信息 */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {interview.company_name} - {interview.position_name}
                        </h3>
                        <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </div>

                      {/* 详细信息 */}
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-3">
                        <Badge variant="outline">
                          {RECRUITMENT_TYPE_LABEL[interview.recruitment_type]}
                        </Badge>
                        <Badge variant="outline">
                          {INTERVIEW_MODE_LABEL[interview.interview_mode]}
                        </Badge>
                        <span>·</span>
                        <span>{ROUND_DISPLAY_NAMES[interview.current_round]}</span>
                        <span>·</span>
                        <span>
                          {new Date(interview.start_time).toLocaleDateString()}
                        </span>
                      </div>

                      {/* 底部信息 */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          面试官风格：
                          {interview.interviewer_style === 'strict'
                            ? '严格专业型'
                            : interview.interviewer_style === 'gentle'
                            ? '温和引导型'
                            : '压力测试型'}
                        </span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 ml-4">
                      {interview.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteEvaluation(interview.id ?? 0, e)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
