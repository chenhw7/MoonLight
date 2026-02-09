/**
 * 简历预览组件
 *
 * 实时预览简历效果，支持 A4 纸样式展示，支持多模板切换
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import type { ResumeFormData } from '@/types/resume';
import {
  EDUCATION_LEVELS,
  PROFICIENCY_LEVELS,
  LANGUAGE_OPTIONS,
  LANGUAGE_PROFICIENCY_OPTIONS,
  SOCIAL_PLATFORM_OPTIONS,
} from '@/types/resume';
import ModernTemplate from './templates/ModernTemplate';
import SmartPagination from './SmartPagination';
import { exportToPrintablePDF } from '@/utils/pdf';
import '../resume-print.css';

interface ResumePreviewProps {
  data: ResumeFormData;
  onClose: () => void;
}

/**
 * 简历预览组件
 *
 * @param data - 简历表单数据
 * @param onClose - 关闭预览的回调函数
 * @returns 简历预览组件
 */
const ResumePreview: React.FC<ResumePreviewProps> = ({ data, onClose }) => {
  const [scale, setScale] = React.useState(1);
  const [isExporting, setIsExporting] = React.useState(false);
  const previewRef = React.useRef<HTMLDivElement>(null);

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
    setIsExporting(true);

    try {
      await exportToPrintablePDF(`${data.name || '简历'}_简历`);
    } catch (error) {
      console.error('PDF 导出失败:', error);
      alert('PDF 导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * 获取学历标签
   *
   * @param value - 学历值
   * @returns 学历标签
   */
  const getEducationLabel = (value: string) => {
    return EDUCATION_LEVELS.find((item) => item.value === value)?.label || value;
  };

  /**
   * 获取熟练程度标签
   *
   * @param value - 熟练程度值
   * @returns 熟练程度标签
   */
  const getProficiencyLabel = (value: string) => {
    return PROFICIENCY_LEVELS.find((item) => item.value === value)?.label || value;
  };

  /**
   * 获取语言标签
   *
   * @param value - 语言值
   * @returns 语言标签
   */
  const getLanguageLabel = (value: string) => {
    return LANGUAGE_OPTIONS.find((item) => item.value === value)?.label || value;
  };

  /**
   * 获取语言熟练度标签
   *
   * @param value - 语言熟练度值
   * @returns 语言熟练度标签
   */
  const getLanguageProficiencyLabel = (value: string) => {
    return (
      LANGUAGE_PROFICIENCY_OPTIONS.find((item) => item.value === value)?.label ||
      value
    );
  };

  /**
   * 获取社交平台标签
   *
   * @param value - 社交平台值
   * @returns 社交平台标签
   */
  const getSocialPlatformLabel = (value: string) => {
    return (
      SOCIAL_PLATFORM_OPTIONS.find((item) => item.value === value)?.label || value
    );
  };

  /**
   * 格式化日期
   *
   * @param dateStr - 日期字符串
   * @returns 格式化后的日期
   */
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    return `${year}.${month}`;
  };

  /**
   * 渲染模板（memoize 以避免 SmartPagination 不必要的重新测量）
   */
  const renderedTemplate = React.useMemo(() => {
    const templateProps = {
      data,
      getEducationLabel,
      getProficiencyLabel,
      getLanguageLabel,
      getLanguageProficiencyLabel,
      getSocialPlatformLabel,
      formatDate,
    };

    return <ModernTemplate {...templateProps} />;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // 使用 createPortal 将预览渲染到 body 下，脱离 #root
  // 这样打印时隐藏 #root 不会影响预览内容
  return createPortal(
    <div id="resume-preview-container" className="fixed inset-0 z-[9999] flex flex-col" style={{ background: 'rgba(0,0,0,0.5)' }}>
      {/* 顶部工具栏 */}
      <div id="resume-toolbar" className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">简历预览</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500 w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting}>
            <Download className="w-4 h-4 mr-1" />
            {isExporting ? '导出中...' : '导出PDF'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 预览内容区 */}
      <div id="resume-preview-content" className="flex-1 overflow-auto" style={{ padding: '32px', background: '#f3f4f6' }}>
        <div
          ref={previewRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* 智能分页：自动测量并将内容分配到多个 A4 页面 */}
          <SmartPagination>
            {renderedTemplate}
          </SmartPagination>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ResumePreview;
