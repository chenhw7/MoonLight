/**
 * 简历辅助函数 Hook
 * 
 * 提供格式化日期、获取标签等通用辅助函数
 */

import { useMemo } from 'react';
import {
  EDUCATION_LEVELS,
  PROFICIENCY_LEVELS,
  LANGUAGE_OPTIONS,
  LANGUAGE_PROFICIENCY_OPTIONS,
  SOCIAL_PLATFORM_OPTIONS,
} from '@/types/resume';

/**
 * 简历辅助函数 Hook
 */
export const useResumeHelpers = () => {
  return useMemo(() => {
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

    return {
      getEducationLabel,
      getProficiencyLabel,
      getLanguageLabel,
      getLanguageProficiencyLabel,
      getSocialPlatformLabel,
      formatDate,
    };
  }, []); // 空依赖数组，因为这些函数都是纯函数
};
