/**
 * 简历预览组件
 *
 * 实时预览简历效果，支持 A4 纸样式展示，支持多模板切换
 */

import React from 'react';
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
    alert('PDF 导出功能开发中...');
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
   * 渲染模板
   *
   * @returns 模板组件
   */
  const renderTemplate = () => {
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
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">简历预览</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-1" />
            导出PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 预览内容 - 强制白底黑字，不受深色模式影响 */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-100 dark:bg-gray-900">
        <div
          ref={previewRef}
          className="bg-white text-gray-900 shadow-lg origin-top transition-transform"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '18mm',
            transform: `scale(${scale})`,
          }}
        >
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
