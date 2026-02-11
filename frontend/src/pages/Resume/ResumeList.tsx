
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleDialog } from '@/components/ui/simple-dialog';
import { ResumeCard } from '@/components/resume/ResumeCard';
import {
  getResumeList,
  deleteResume,
  createResume,
  getResumeDetail,
} from '@/services/resume';
import { ResumeBase, ResumeFormData } from '@/types/resume';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ResumeList');

export function ResumeList() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Copy Dialog State
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copyTargetId, setCopyTargetId] = useState<number | null>(null);
  const [copyTitle, setCopyTitle] = useState('');

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await getResumeList(1, 100); // Fetch up to 100 for now, pagination can be added later
      setResumes(response.items || []);
    } catch (error) {
      logger.error('Failed to fetch resumes', { error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleCopyClick = (id: number) => {
    const resume = resumes.find((r) => r.id === id);
    if (!resume) return;

    const defaultTitle = `${resume.title || '未命名简历'}-${format(new Date(), 'yyyyMMdd')}`;
    setCopyTargetId(id);
    setCopyTitle(defaultTitle);
    setIsCopyDialogOpen(true);
  };

  const confirmCopy = async () => {
    if (!copyTargetId || actionLoading) return;
    
    try {
      setActionLoading(true);
      // 1. Get full detail
      const detail = await getResumeDetail(copyTargetId);
      
      // 2. Prepare new data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, created_at, updated_at, ...rest } = detail;
      const newData: ResumeFormData = {
        ...rest,
        title: copyTitle,
      };

      // 3. Create new resume
      await createResume(newData);
      
      // 4. Refresh list
      await fetchResumes();
      setIsCopyDialogOpen(false);
    } catch (error) {
      logger.error('Failed to copy resume', { error });
      alert('复制简历失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这份简历吗？此操作不可恢复。')) return;
    
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await deleteResume(id);
      await fetchResumes();
    } catch (error) {
      logger.error('Failed to delete resume', { error });
      alert('删除失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">我的简历</h1>
          <p className="text-muted-foreground mt-2">
            管理您的所有简历，支持创建、编辑和复制
          </p>
        </div>
        <Button onClick={() => navigate('/resume/create')}>
          <Plus className="w-4 h-4 mr-2" />
          新建简历
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
          <h3 className="text-lg font-medium">还没有简历</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            创建您的第一份简历，开始求职之旅
          </p>
          <Button onClick={() => navigate('/resume/create')}>
            创建简历
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resumes.map((resume) => (
            <div key={resume.id} className="h-full">
              <ResumeCard
                resume={resume}
                onCopy={handleCopyClick}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Copy Dialog */}
      <SimpleDialog
        open={isCopyDialogOpen}
        onOpenChange={setIsCopyDialogOpen}
        title="复制简历"
        description="请为新简历输入名称"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCopyDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmCopy} disabled={actionLoading || !copyTitle.trim()}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              确认复制
            </Button>
          </>
        }
      >
        <div className="py-2">
          <Input
            value={copyTitle}
            onChange={(e) => setCopyTitle(e.target.value)}
            placeholder="请输入简历名称"
            autoFocus
          />
        </div>
      </SimpleDialog>
    </div>
  );
}
