/**
 * 简历查看/预览页面
 *
 * 独立的简历预览页面，用于直接查看简历效果
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Download, Loader2 } from 'lucide-react';
import { getResumeDetail } from '@/services/resume';
import { exportToPrintablePDF } from '@/utils/pdf';
import ModernTemplate from './components/templates/ModernTemplate';
import SmartPagination from './components/SmartPagination';
import { useResumeHelpers } from '@/hooks/useResumeHelpers';
import { createLogger } from '@/utils/logger';
import type { ResumeFormData } from '@/types/resume';
import './resume-print.css';

const logger = createLogger('ResumeView');

/**
 * 简历查看页面
 */
const ResumeView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const helpers = useResumeHelpers();

  const [resume, setResume] = React.useState<ResumeFormData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [scale, setScale] = React.useState(1);

  // 加载简历数据
  React.useEffect(() => {
    const loadResume = async () => {
      if (!id) {
        setError('简历ID不存在');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getResumeDetail(Number(id));
        setResume(data);
      } catch (err) {
        logger.error('Failed to load resume', { error: err, id });
        setError('加载简历失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    loadResume();
  }, [id]);

  /**
   * 处理返回
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * 处理编辑
   */
  const handleEdit = () => {
    if (id) {
      navigate(`/resume/edit/${id}`);
    }
  };

  /**
   * 处理缩放
   */
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  /**
   * 导出 PDF
   */
  const handleExportPDF = async () => {
    if (!resume) return;

    setIsExporting(true);
    try {
      await exportToPrintablePDF(`${resume.full_name || '简历'}_简历`);
    } catch (error) {
      logger.error('PDF export failed', { error });
      alert('PDF 导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">{error || '简历不存在'}</p>
        <Button onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">{resume.resume_name || '简历预览'}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* 缩放控制 */}
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            -
          </Button>
          <span className="text-sm text-gray-500 w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            +
          </Button>

          {/* 编辑按钮 */}
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-1" />
            编辑
          </Button>

          {/* 导出按钮 */}
          <Button
            variant="default"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-1" />
            {isExporting ? '导出中...' : '导出PDF'}
          </Button>
        </div>
      </header>

      {/* 预览内容区 */}
      <main className="flex-1 overflow-auto p-8">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            minHeight: '100%',
            width: 'fit-content',
            margin: '0 auto',
          }}
        >
          <SmartPagination>
            <ModernTemplate data={resume} {...helpers} />
          </SmartPagination>
        </div>
      </main>
    </div>
  );
};

export default ResumeView;
