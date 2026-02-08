/**
 * 简历创建/编辑页面
 *
 * 提供完整的简历表单填写功能，支持校招/社招模式切换、标签页导航、实时预览
 */

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useResumeStore, useAutoSave, useBeforeUnloadWarning } from '@/stores/resumeStore';
import { createLogger } from '@/utils/logger';
import type { ResumeFormData, TabType } from '@/types/resume';
import { resumeSchema, TABS_CONFIG } from '@/types/resume';

// 导入表单组件
import BasicInfoForm from './components/forms/BasicInfoForm';
import EducationForm from './components/forms/EducationForm';
import WorkExperienceForm from './components/forms/WorkExperienceForm';
import ProjectForm from './components/forms/ProjectForm';
import SkillsForm from './components/forms/SkillsForm';
import ResumePreview from './components/ResumePreview';

const logger = createLogger('ResumeCreate');

/**
 * 模式切换组件
 */
const ModeSwitch: React.FC = () => {
  const { resumeMode, setResumeMode } = useResumeStore();

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">简历类型：</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setResumeMode('campus')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            resumeMode === 'campus'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          校招模式
        </button>
        <button
          type="button"
          onClick={() => setResumeMode('social')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            resumeMode === 'social'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          社招模式
        </button>
      </div>
      <span className="text-xs text-muted-foreground ml-2">
        {resumeMode === 'campus'
          ? '适合应届毕业生，强调教育背景和实习经历'
          : '适合有工作经验者，强调工作经历和项目成果'}
      </span>
    </div>
  );
};

/**
 * 标签页导航组件
 */
const TabNavigation: React.FC = () => {
  const { currentTab, setCurrentTab, formData } = useResumeStore();

  /**
   * 检查标签页是否有数据
   */
  const hasData = (tab: TabType): boolean => {
    switch (tab) {
      case 'basic':
        return !!(formData.name && formData.phone);
      case 'education':
        return formData.educations.length > 0;
      case 'work':
        return formData.work_experiences.length > 0;
      case 'project':
        return formData.projects.length > 0;
      case 'skills':
        return (
          formData.skills.length > 0 ||
          formData.languages.length > 0 ||
          formData.awards.length > 0
        );
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-wrap gap-1 border-b">
      {TABS_CONFIG.map((tab) => {
        const isActive = currentTab === tab.value;
        const hasTabData = hasData(tab.value);

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCurrentTab(tab.value)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            {hasTabData && !isActive && (
              <span className="w-2 h-2 bg-green-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * 标签页内容组件
 */
const TabContent: React.FC = () => {
  const { currentTab, resumeMode } = useResumeStore();

  const renderContent = () => {
    switch (currentTab) {
      case 'basic':
        return <BasicInfoForm />;
      case 'education':
        return <EducationForm resumeMode={resumeMode} />;
      case 'work':
        return <WorkExperienceForm resumeMode={resumeMode} />;
      case 'project':
        return <ProjectForm />;
      case 'skills':
        return <SkillsForm resumeMode={resumeMode} />;
      default:
        return null;
    }
  };

  return (
    <div className="py-6">
      {renderContent()}
    </div>
  );
};

/**
 * 底部导航组件
 */
const FooterNavigation: React.FC = () => {
  const { currentTab, setCurrentTab, togglePreview } = useResumeStore();
  const tabValues = TABS_CONFIG.map((t) => t.value);
  const currentIndex = tabValues.indexOf(currentTab);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentTab(tabValues[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < tabValues.length - 1) {
      setCurrentTab(tabValues[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={handlePrev}
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        上一步
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={togglePreview}
      >
        <Eye className="w-4 h-4 mr-1" />
        预览简历
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleNext}
        disabled={currentIndex === tabValues.length - 1}
      >
        下一步
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
};

/**
 * 简历创建页面
 */
const ResumeCreate: React.FC = () => {
  const navigate = useNavigate();
  const {
    formData,
    isDirty,
    isSaving,
    isPreviewOpen,
    saveResume,
    togglePreview,
    updateFormData,
  } = useResumeStore();

  // 初始化表单
  const methods = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: formData,
    mode: 'onChange',
  });

  // 监听表单变化，同步到 store
  React.useEffect(() => {
    const subscription = methods.watch((value) => {
      updateFormData(value as Partial<ResumeFormData>);
    });
    return () => subscription.unsubscribe();
  }, [methods, updateFormData]);

  // 自动保存
  useAutoSave();

  // 页面离开提示
  useBeforeUnloadWarning();

  /**
   * 处理保存
   */
  const handleSave = async () => {
    try {
      await saveResume();
      alert('简历保存成功！');
    } catch (error) {
      logger.error('Failed to save resume', { error });
      alert('保存失败，请重试');
    }
  };

  /**
   * 处理表单提交
   */
  const onSubmit = async () => {
    logger.info('Submitting resume form');
    try {
      await saveResume();
      navigate('/home');
    } catch (error) {
      logger.error('Failed to submit resume', { error });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 头部 */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold">简历生成</h1>
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-sm text-muted-foreground">
                  有未保存的更改
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={togglePreview}
              >
                <Eye className="w-4 h-4 mr-1" />
                预览
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 左侧表单区 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 模式切换 */}
                <ModeSwitch />

                {/* 表单卡片 */}
                <Card>
                  <CardContent className="p-6">
                    {/* 标签页导航 */}
                    <TabNavigation />

                    {/* 标签页内容 */}
                    <TabContent />

                    {/* 底部导航 */}
                    <FooterNavigation />
                  </CardContent>
                </Card>
              </div>

              {/* 右侧预览区 - 桌面端显示 */}
              <div className="hidden lg:block">
                <div className="sticky top-24">
                  <Card className="overflow-hidden">
                    <div className="p-4 border-b bg-muted/50">
                      <h3 className="font-medium">实时预览</h3>
                    </div>
                    <div
                      className="bg-gray-50 overflow-auto"
                      style={{ maxHeight: 'calc(100vh - 200px)' }}
                    >
                      <div
                        className="p-6 origin-top bg-white"
                        style={{
                          width: '210mm',
                          minHeight: '297mm',
                          transform: 'scale(0.4)',
                          transformOrigin: 'top left',
                        }}
                      >
                        {/* 简化的预览内容 */}
                        <ResumePreviewContent data={formData} />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </FormProvider>
      </main>

      {/* 全屏预览 */}
      {isPreviewOpen && (
        <ResumePreview data={formData} onClose={togglePreview} />
      )}
    </div>
  );
};

/**
 * 简化的预览内容组件
 */
const ResumePreviewContent: React.FC<{ data: ResumeFormData }> = ({ data }) => {
  return (
    <div className="text-sm text-gray-900">
      <header className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">{data.name || '姓名'}</h1>
            <div className="text-gray-600">
              {data.phone && <span className="mr-4">{data.phone}</span>}
              {data.email && <span className="mr-4">{data.email}</span>}
              {data.location && <span>{data.location}</span>}
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
                  ${data.avatar_ratio === '1' ? 'w-20 h-20' : 'w-20 h-28'}
                `}
              />
            </div>
          )}
        </div>
      </header>

      {data.educations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            教育经历
          </h2>
          {data.educations.slice(0, 1).map((edu, index) => (
            <div key={index}>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800">{edu.school_name}</span>
                <span className="text-gray-500 text-xs">
                  {edu.start_date} - {edu.end_date || '至今'}
                </span>
              </div>
              <div className="text-gray-600">
                {edu.major} · {edu.degree}
              </div>
            </div>
          ))}
          {data.educations.length > 1 && (
            <div className="text-gray-500 text-xs mt-1">
              还有 {data.educations.length - 1} 条教育经历...
            </div>
          )}
        </section>
      )}

      {data.work_experiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            {data.resume_type === 'campus' ? '实习经历' : '工作经历'}
          </h2>
          {data.work_experiences.slice(0, 1).map((work, index) => (
            <div key={index}>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800">{work.company_name}</span>
                <span className="text-gray-500 text-xs">
                  {work.start_date} - {work.end_date || '至今'}
                </span>
              </div>
              <div className="text-gray-600">{work.position}</div>
            </div>
          ))}
          {data.work_experiences.length > 1 && (
            <div className="text-gray-500 text-xs mt-1">
              还有 {data.work_experiences.length - 1} 条工作经历...
            </div>
          )}
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            项目经历
          </h2>
          {data.projects.slice(0, 1).map((project, index) => (
            <div key={index}>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800">{project.name}</span>
                <span className="text-gray-500 text-xs">
                  {project.start_date} - {project.end_date || '至今'}
                </span>
              </div>
              <div className="text-gray-600">{project.role}</div>
            </div>
          ))}
          {data.projects.length > 1 && (
            <div className="text-gray-500 text-xs mt-1">
              还有 {data.projects.length - 1} 条项目经历...
            </div>
          )}
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3 text-gray-900">
            技能特长
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.slice(0, 5).map((skill, index) => (
              <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-800">
                {skill.name}
              </span>
            ))}
            {data.skills.length > 5 && (
              <span className="text-gray-500 text-xs">
                +{data.skills.length - 5}
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default ResumeCreate;
