
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Edit, Copy, Trash2, FileText, User, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResumeBase } from '@/types/resume';

interface ResumeCardProps {
  resume: ResumeBase;
  onCopy?: (id: number) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export function ResumeCard({ resume, onCopy, onDelete, showActions = true }: ResumeCardProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/resume/edit/${resume.id}`);
  };

  const handleInterview = () => {
    // 跳转到面试配置页面，并传递简历ID
    navigate('/interview/config', { state: { resumeId: resume.id } });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未更新';
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold line-clamp-1" title={resume.title || '未命名简历'}>
                {resume.title || '未命名简历'}
              </CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                {resume.full_name} · {resume.resume_type === 'campus' ? '校园招聘' : '社会招聘'}
              </div>
            </div>
          </div>
          {resume.is_default && (
            <Badge variant="secondary" className="text-xs">
              默认
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-3">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>{resume.current_city || '城市未填'}</span>
          </div>
          <div className="text-xs pt-2 border-t mt-2">
            最后更新: {formatDate(resume.updated_at)}
          </div>
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="pt-0 flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={handleInterview} title="模拟面试">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleEdit} title="编辑">
            <Edit className="h-4 w-4" />
          </Button>
          {onCopy && (
            <Button variant="ghost" size="icon" onClick={() => resume.id && onCopy(resume.id)} title="复制">
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => resume.id && onDelete(resume.id)} title="删除">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
