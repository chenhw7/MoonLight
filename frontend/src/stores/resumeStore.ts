/**
 * 简历状态管理 Store
 *
 * 使用 Zustand 管理简历编辑状态，包括自动保存和草稿恢复
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createLogger } from '@/utils/logger';
import type {
  ResumeFormData,
  ResumeType,
  TabType,
} from '@/types/resume';
import { DEFAULT_RESUME_DATA } from '@/types/resume';
import { createResume, updateResume } from '@/services/resume';

const logger = createLogger('ResumeStore');

/** 本地存储键名 */
const STORAGE_KEY = 'resume-draft';

/** 自动保存间隔（毫秒） */
const AUTO_SAVE_INTERVAL = 30000;

// ============================================================================
// Store 状态定义
// ============================================================================

interface ResumeState {
  // 表单数据
  formData: ResumeFormData;

  // UI 状态
  currentTab: TabType;
  resumeMode: ResumeType;
  isPreviewOpen: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  resumeId: number | null;

  // 操作函数
  setCurrentTab: (tab: TabType) => void;
  setResumeMode: (mode: ResumeType) => void;
  togglePreview: () => void;
  updateFormData: (data: Partial<ResumeFormData>) => void;
  updateField: <K extends keyof ResumeFormData>(
    field: K,
    value: ResumeFormData[K]
  ) => void;
  resetForm: () => void;
  saveResume: () => Promise<unknown>;
  loadResume: (resume: ResumeFormData & { id?: number }) => void;
  clearDraft: () => void;
}

// ============================================================================
// Store 实现
// ============================================================================

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      // 初始状态
      formData: DEFAULT_RESUME_DATA,
      currentTab: 'basic',
      resumeMode: 'campus',
      isPreviewOpen: false,
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
      resumeId: null,

      /**
       * 设置当前标签页
       */
      setCurrentTab: (tab: TabType) => {
        logger.debug('Setting current tab', { tab });
        set({ currentTab: tab });
      },

      /**
       * 设置简历模式（校招/社招）
       */
      setResumeMode: (mode: ResumeType) => {
        const currentMode = get().resumeMode;
        if (currentMode === mode) return;

        logger.info('Switching resume mode', { from: currentMode, to: mode });

        set((state) => ({
          resumeMode: mode,
          formData: {
            ...state.formData,
            resume_type: mode,
          },
          isDirty: true,
        }));
      },

      /**
       * 切换预览开关
       */
      togglePreview: () => {
        const newState = !get().isPreviewOpen;
        logger.debug('Toggling preview', { isOpen: newState });
        set({ isPreviewOpen: newState });
      },

      /**
       * 更新表单数据（批量）
       */
      updateFormData: (data: Partial<ResumeFormData>) => {
        logger.debug('Updating form data', { fields: Object.keys(data) });

        set((state) => ({
          formData: {
            ...state.formData,
            ...data,
          },
          isDirty: true,
        }));
      },

      /**
       * 更新单个字段
       */
      updateField: <K extends keyof ResumeFormData>(
        field: K,
        value: ResumeFormData[K]
      ) => {
        logger.debug('Updating field', { field, value });

        set((state) => ({
          formData: {
            ...state.formData,
            [field]: value,
          },
          isDirty: true,
        }));
      },

      /**
       * 重置表单
       */
      resetForm: () => {
        logger.info('Resetting form');

        set({
          formData: DEFAULT_RESUME_DATA,
          currentTab: 'basic',
          resumeMode: 'campus',
          isDirty: false,
          isSaving: false,
          lastSavedAt: null,
          resumeId: null,
        });
      },

      /**
       * 保存简历
       */
      saveResume: async () => {
        const state = get();
        const { formData, resumeId } = state;

        logger.info('Saving resume', { resumeId, title: formData.title });

        set({ isSaving: true });

        try {
          let savedResume;

          if (resumeId) {
            // 更新现有简历
            savedResume = await updateResume(resumeId, formData);
            logger.info('Resume updated successfully', { id: resumeId });
          } else {
            // 创建新简历
            savedResume = await createResume(formData);
            logger.info('Resume created successfully', { id: savedResume.id });

            // 保存新创建的简历 ID
            set({ resumeId: savedResume.id });
          }

          set({
            isDirty: false,
            lastSavedAt: new Date(),
          });

          return savedResume;
        } catch (error) {
          logger.error('Failed to save resume', { error });
          throw error;
        } finally {
          set({ isSaving: false });
        }
      },

      /**
       * 加载简历数据
       */
      loadResume: (resume: ResumeFormData & { id?: number }) => {
        logger.info('Loading resume', { id: resume.id, title: resume.title });

        set({
          formData: resume,
          resumeMode: resume.resume_type,
          resumeId: resume.id || null,
          isDirty: false,
          lastSavedAt: new Date(),
        });
      },

      /**
       * 清除草稿
       */
      clearDraft: () => {
        logger.info('Clearing draft');

        set({
          formData: DEFAULT_RESUME_DATA,
          currentTab: 'basic',
          resumeMode: 'campus',
          isDirty: false,
          isSaving: false,
          lastSavedAt: null,
          resumeId: null,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // 只持久化表单数据和关键状态
      partialize: (state) => ({
        formData: state.formData,
        resumeMode: state.resumeMode,
        resumeId: state.resumeId,
      }),
    }
  )
);

// ============================================================================
// 自动保存 Hook
// ============================================================================

import { useEffect, useRef } from 'react';

/**
 * 自动保存 Hook
 *
 * 每30秒自动保存草稿到服务器
 */
export function useAutoSave() {
  const { formData, isDirty, saveResume } = useResumeStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 启动自动保存定时器
    intervalRef.current = setInterval(() => {
      if (isDirty && formData.title) {
        logger.info('Auto-saving resume');
        saveResume().catch((error) => {
          logger.error('Auto-save failed', { error });
        });
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isDirty, formData.title, saveResume]);

  return { isAutoSaving: !!intervalRef.current };
}

// ============================================================================
// 页面离开提示 Hook
// ============================================================================

/**
 * 页面离开提示 Hook
 *
 * 在页面关闭或刷新前提示用户保存未保存的更改
 */
export function useBeforeUnloadWarning() {
  const { isDirty } = useResumeStore();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '您有未保存的更改，确定要离开吗？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
}

// ============================================================================
// 草稿恢复 Hook
// ============================================================================

/**
 * 草稿恢复 Hook
 *
 * 页面加载时检查是否有本地草稿，提示用户恢复
 */
export function useDraftRecovery() {
  const { formData, resumeId, loadResume } = useResumeStore();

  useEffect(() => {
    // 检查是否有本地草稿（非默认数据且未保存到服务器）
    const hasDraft =
      !resumeId &&
      formData.title &&
      (formData.educations.length > 0 ||
        formData.work_experiences.length > 0 ||
        formData.projects.length > 0);

    if (hasDraft) {
      logger.info('Draft detected', { title: formData.title });
      // 这里可以触发一个提示框，询问用户是否恢复草稿
      // 实际实现需要在 UI 层处理
    }
  }, [formData, resumeId, loadResume]);

  return { hasDraft: !!formData.title && !resumeId };
}
