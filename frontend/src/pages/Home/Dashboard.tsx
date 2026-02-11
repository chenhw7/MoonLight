/**
 * 仪表盘页面
 *
 * 主页的主要内容区域，包含问候语和最近的简历
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ArrowRight } from 'lucide-react';
import { getResumeList } from '@/services/resume';
import { ResumeBase } from '@/types/resume';
import { ResumeCard } from '@/components/resume/ResumeCard';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Dashboard');

export function Dashboard() {
  const navigate = useNavigate();
  const [recentResumes, setRecentResumes] = useState<ResumeBase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentResumes = async () => {
      try {
        setLoading(true);
        // 获取第一页，5条数据
        const response = await getResumeList(1, 5);
        setRecentResumes(response.items || []);
      } catch (error) {
        logger.error('Failed to fetch recent resumes', { error });
      } finally {
        setLoading(false);
      }
    };

    fetchRecentResumes();
  }, []);

  return (
    <div className="space-y-8">
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">最近编辑</h2>
          {recentResumes.length > 0 && (
            <Button variant="link" onClick={() => navigate('/resumes')} className="text-sm">
              查看全部 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : recentResumes.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card">
            <h3 className="text-lg font-medium">还没有简历</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              您还没有创建过简历，立即开始吧！
            </p>
            <Button onClick={() => navigate('/resume/create')}>
              创建第一份简历
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recentResumes.map((resume) => (
              <div key={resume.id} className="h-full">
                {/* 在仪表盘只显示编辑按钮，不显示复制和删除，保持简洁 */}
                <ResumeCard 
                  resume={resume} 
                  showActions={true}
                  onCopy={undefined} 
                  onDelete={undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
