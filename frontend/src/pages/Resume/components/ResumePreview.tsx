/**
 * 简历预览组件
 *
 * 实时预览简历效果，支持 A4 纸样式展示
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import type { ResumeFormData } from '@/types/resume';
import {
  EDUCATION_LEVELS,
  JOB_STATUS_OPTIONS,
  PROFICIENCY_LEVELS,
  LANGUAGE_OPTIONS,
  LANGUAGE_PROFICIENCY_OPTIONS,
  SOCIAL_PLATFORM_OPTIONS,
} from '@/types/resume';

interface ResumePreviewProps {
  data: ResumeFormData;
  onClose: () => void;
}

/**
 * 简历预览组件
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
    // PDF 导出功能待实现
    alert('PDF 导出功能开发中...');
  };

  /**
   * 获取学历标签
   */
  const getEducationLabel = (value: string) => {
    return EDUCATION_LEVELS.find((item) => item.value === value)?.label || value;
  };

  /**
   * 获取求职状态标签
   */
  const getJobStatusLabel = (value: string) => {
    return JOB_STATUS_OPTIONS.find((item) => item.value === value)?.label || value;
  };

  /**
   * 获取熟练程度标签
   */
  const getProficiencyLabel = (value: string) => {
    return PROFICIENCY_LEVELS.find((item) => item.value === value)?.label || value;
  };

  /**
   * 获取语言标签
   */
  const getLanguageLabel = (value: string) => {
    return LANGUAGE_OPTIONS.find((item) => item.value === value)?.label || value;
  };

  /**
   * 获取语言熟练度标签
   */
  const getLanguageProficiencyLabel = (value: string) => {
    return (
      LANGUAGE_PROFICIENCY_OPTIONS.find((item) => item.value === value)?.label ||
      value
    );
  };

  /**
   * 获取社交平台标签
   */
  const getSocialPlatformLabel = (value: string) => {
    return (
      SOCIAL_PLATFORM_OPTIONS.find((item) => item.value === value)?.label || value
    );
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    return `${year}.${month}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">简历预览</h2>
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
            padding: '20mm',
            transform: `scale(${scale})`,
          }}
        >
          <ResumeTemplate
            data={data}
            getEducationLabel={getEducationLabel}
            getJobStatusLabel={getJobStatusLabel}
            getProficiencyLabel={getProficiencyLabel}
            getLanguageLabel={getLanguageLabel}
            getLanguageProficiencyLabel={getLanguageProficiencyLabel}
            getSocialPlatformLabel={getSocialPlatformLabel}
            formatDate={formatDate}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 简历模板组件
 */
interface ResumeTemplateProps {
  data: ResumeFormData;
  getEducationLabel: (value: string) => string;
  getJobStatusLabel: (_value: string) => string;
  getProficiencyLabel: (value: string) => string;
  getLanguageLabel: (value: string) => string;
  getLanguageProficiencyLabel: (value: string) => string;
  getSocialPlatformLabel: (value: string) => string;
  formatDate: (dateStr: string | null | undefined) => string;
}

const ResumeTemplate: React.FC<ResumeTemplateProps> = ({
  data,
  getEducationLabel,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getJobStatusLabel: _getJobStatusLabel,
  getProficiencyLabel,
  getLanguageLabel,
  getLanguageProficiencyLabel,
  getSocialPlatformLabel,
  formatDate,
}) => {
  return (
    <div className="text-sm leading-relaxed text-gray-900">
      {/* 头部信息 */}
      <header className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2 text-gray-900">{data.name || '姓名'}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
              {data.phone && <span>{data.phone}</span>}
              {data.email && <span>{data.email}</span>}
              {data.location && <span>{data.location}</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-700">
              {data.target_positions.length > 0 && (
                <span>
                  <strong>期望岗位：</strong>
                  {data.target_positions.join('、')}
                </span>
              )}
              {data.target_cities.length > 0 && (
                <span>
                  <strong>期望城市：</strong>
                  {data.target_cities.join('、')}
                </span>
              )}
              {data.years_of_experience !== undefined && (
                <span>
                  <strong>工作年限：</strong>
                  {data.years_of_experience}年
                </span>
              )}
            </div>
          </div>

          {/* 头像显示 - 根据比例显示不同尺寸 */}
          {data.avatar && (
            <div className="ml-4 flex-shrink-0">
              <img
                src={data.avatar}
                alt="头像"
                className={`
                  object-cover rounded border border-gray-300
                  ${data.avatar_ratio === '1' ? 'w-24 h-24' : 'w-24 h-32'}
                `}
              />
            </div>
          )}
        </div>
      </header>

      {/* 教育经历 */}
      {data.educations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            教育经历
          </h2>
          {data.educations.map((edu, index) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between items-start">
                <div className="text-gray-800">
                  <span className="font-semibold">{edu.school_name}</span>
                  <span className="mx-2 text-gray-500">·</span>
                  <span>{edu.major}</span>
                  <span className="mx-2 text-gray-500">·</span>
                  <span>{getEducationLabel(edu.degree)}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {formatDate(edu.start_date)} -{' '}
                  {edu.is_current ? '至今' : formatDate(edu.end_date)}
                </span>
              </div>
              {(edu.gpa || edu.honors) && (
                <div className="text-xs text-gray-500 mt-1">
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                  {edu.gpa && edu.honors && <span className="mx-2">|</span>}
                  {edu.honors && <span>{edu.honors}</span>}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 工作/实习经历 */}
      {data.work_experiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            {data.resume_type === 'campus' ? '实习经历' : '工作经历'}
          </h2>
          {data.work_experiences.map((work, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start">
                <div className="text-gray-800">
                  <span className="font-semibold">{work.company_name}</span>
                  <span className="mx-2 text-gray-500">·</span>
                  <span>{work.position}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {formatDate(work.start_date)} -{' '}
                  {work.is_current ? '至今' : formatDate(work.end_date)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-gray-700">{work.description}</p>
            </div>
          ))}
        </section>
      )}

      {/* 项目经历 */}
      {data.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            项目经历
          </h2>
          {data.projects.map((project, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start">
                <div className="text-gray-800">
                  <span className="font-semibold">{project.name}</span>
                  <span className="mx-2 text-gray-500">·</span>
                  <span>{project.role}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {formatDate(project.start_date)} -{' '}
                  {project.is_current ? '至今' : formatDate(project.end_date)}
                </span>
              </div>
              {project.link && (
                <div className="text-xs text-blue-700 mt-1">{project.link}</div>
              )}
              <p className="mt-2 whitespace-pre-wrap text-gray-700">{project.description}</p>
            </div>
          ))}
        </section>
      )}

      {/* 技能特长 */}
      {data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            技能特长
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-800"
              >
                {skill.name}
                <span className="text-gray-500 ml-1">
                  ({getProficiencyLabel(skill.proficiency)})
                </span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 语言能力 */}
      {data.languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            语言能力
          </h2>
          <div className="flex flex-wrap gap-4 text-gray-800">
            {data.languages.map((lang, index) => (
              <span key={index}>
                {getLanguageLabel(lang.language)}:{' '}
                {getLanguageProficiencyLabel(lang.proficiency)}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 获奖经历 */}
      {data.awards.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            获奖经历
          </h2>
          <ul className="list-disc list-inside text-gray-800">
            {data.awards.map((award, index) => (
              <li key={index} className="mb-1">
                {award.name}
                {award.date && (
                  <span className="text-gray-500 ml-2 text-xs">
                    ({formatDate(award.date)})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 作品展示 */}
      {data.portfolios.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            作品展示
          </h2>
          <ul className="list-disc list-inside text-gray-800">
            {data.portfolios.map((portfolio, index) => (
              <li key={index} className="mb-1">
                {portfolio.name}
                {portfolio.link && (
                  <span className="text-blue-700 ml-2 text-xs">
                    {portfolio.link}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 社交账号 */}
      {data.social_links.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            社交账号
          </h2>
          <div className="flex flex-wrap gap-4 text-gray-800">
            {data.social_links.map((link, index) => (
              <span key={index}>
                {getSocialPlatformLabel(link.platform)}: {link.url}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 自我评价 */}
      {data.self_evaluation && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            自我评价
          </h2>
          <p className="whitespace-pre-wrap text-gray-700">{data.self_evaluation}</p>
        </section>
      )}
    </div>
  );
};

export default ResumePreview;
