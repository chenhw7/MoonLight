/**
 * 简历创建/编辑页面
 *
 * 提供完整的简历表单填写功能，支持校招/社招模式切换、标签页导航、实时预览
 */

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useResumeStore, useAutoSave, useBeforeUnloadWarning } from '@/stores/resumeStore';
import { createLogger } from '@/utils/logger';
import { getResumeDetail } from '@/services/resume';
import type { ResumeFormData, TabType } from '@/types/resume';
import { resumeSchema, TABS_CONFIG, DEFAULT_RESUME_DATA } from '@/types/resume';

// 导入表单组件
import BasicInfoForm from './components/forms/BasicInfoForm';
import EducationForm from './components/forms/EducationForm';
import WorkExperienceForm from './components/forms/WorkExperienceForm';
import ProjectForm from './components/forms/ProjectForm';
import SkillsForm from './components/forms/SkillsForm';
import ResumePreview from './components/ResumePreview';
import RightSidebarPreview from './components/RightSidebarPreview';

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
        return !!(formData.full_name && formData.phone);
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
  const { id } = useParams<{ id: string }>();
  const {
    formData,
    isDirty,
    isSaving,
    isPreviewOpen,
    resumeId,
    saveResume,
    loadResume,
    resetForm,
    togglePreview,
    updateFormData,
  } = useResumeStore();

  // 初始化表单
  const methods = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: formData,
    mode: 'onChange',
  });

  const isInitializing = React.useRef(false);
  const prevDataRef = React.useRef<ResumeFormData | null>(null);

  // 加载简历数据
  React.useEffect(() => {
    const init = async () => {
      if (id) {
        // 编辑模式：加载现有简历
        try {
          isInitializing.current = true;
          const data = await getResumeDetail(Number(id));
          loadResume(data);
          // 记录初始数据，用于后续比对
          prevDataRef.current = data;
          methods.reset(data);
          // 重置初始化标志，稍微延迟以确保 watch 不会误触发 dirty 状态
          setTimeout(() => {
            isInitializing.current = false;
          }, 300);
        } catch (error) {
          logger.error('Failed to load resume', { error, id });
          alert('加载简历失败，请重试');
          navigate('/resumes');
        }
      } else {
        // 创建模式
        // 如果之前是在编辑已保存的简历（resumeId 存在），则重置为新简历
        // 如果是草稿（resumeId 为 null），则保留草稿
        const currentStoreId = useResumeStore.getState().resumeId;
        if (currentStoreId) {
          resetForm();
          methods.reset(DEFAULT_RESUME_DATA);
          prevDataRef.current = DEFAULT_RESUME_DATA;
        } else {
          // 如果是草稿，初始化基准数据为当前表单值
          prevDataRef.current = methods.getValues();
        }
      }
    };

    init();
  }, [id, navigate, loadResume, resetForm, methods]);

  // 监听表单变化，同步到 store
  React.useEffect(() => {
    const subscription = methods.watch((value) => {
      if (isInitializing.current) return;

      // 简单的深度比较，避免无意义的更新导致 isDirty 变 true
      const currentStr = JSON.stringify(value);
      const prevStr = JSON.stringify(prevDataRef.current);

      if (currentStr === prevStr) {
        return;
      }

      prevDataRef.current = value as ResumeFormData;
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
    } catch (error: unknown) {
      logger.error('Failed to save resume', { error });
      // 显示详细错误信息
      const err = error as { displayMessage?: string; message?: string };
      const message = err?.displayMessage || err?.message || '未知错误';
      alert(`保存失败: ${message}`);
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
    } catch (error: unknown) {
      logger.error('Failed to submit resume', { error });
      const err = error as { displayMessage?: string; message?: string };
      const message = err?.displayMessage || err?.message || '未知错误';
      alert(`提交失败: ${message}`);
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
                  <RightSidebarPreview data={formData} />
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



export default ResumeCreate;
