/**
 * 技能与其他表单组件
 *
 * 包括技能特长、语言能力、获奖经历、作品展示、社交账号
 */

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DynamicFormList from '../DynamicFormList';
import type {
  ResumeFormData,
  ResumeType,
  Skill,
  Language,
  Award,
  Portfolio,
  SocialLink,
} from '@/types/resume';
import {
  PROFICIENCY_LEVELS,
  LANGUAGE_OPTIONS,
  LANGUAGE_PROFICIENCY_OPTIONS,
  SOCIAL_PLATFORM_OPTIONS,
} from '@/types/resume';

interface SkillsFormProps {
  resumeMode: ResumeType;
}

/**
 * 技能与其他表单
 */
const SkillsForm: React.FC<SkillsFormProps> = ({ resumeMode }) => {
  const { control, watch, setValue } = useFormContext<ResumeFormData>();
  const skills = watch('skills') || [];
  const languages = watch('languages') || [];
  const awards = watch('awards') || [];
  const portfolios = watch('portfolios') || [];
  const socialLinks = watch('social_links') || [];

  // ===== 技能 =====
  const handleAddSkill = () => {
    const newSkill: Skill = {
      skill_name: '',
      proficiency: 'competent',
    };
    setValue('skills', [...skills, newSkill], { shouldDirty: true });
  };

  const handleUpdateSkill = (index: number, data: Partial<Skill>) => {
    const newSkills = [...skills];
    newSkills[index] = { ...newSkills[index], ...data };
    setValue('skills', newSkills, { shouldDirty: true });
  };

  const renderSkillItem = (skill: Skill, index: number) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>技能名称</Label>
        <Input
          placeholder="如：JavaScript"
          value={skill.skill_name}
          onChange={(e) => handleUpdateSkill(index, { skill_name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>熟练程度</Label>
        <Select
          value={skill.proficiency}
          onValueChange={(value) =>
            handleUpdateSkill(index, { proficiency: value as Skill['proficiency'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROFICIENCY_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // ===== 语言能力 =====
  const handleAddLanguage = () => {
    const newLanguage: Language = {
      language: 'english',
      proficiency: 'cet6',
    };
    setValue('languages', [...languages, newLanguage], { shouldDirty: true });
  };

  const handleUpdateLanguage = (index: number, data: Partial<Language>) => {
    const newLanguages = [...languages];
    newLanguages[index] = { ...newLanguages[index], ...data };
    setValue('languages', newLanguages, { shouldDirty: true });
  };

  const renderLanguageItem = (language: Language, index: number) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>语言</Label>
        <Select
          value={language.language}
          onValueChange={(value) =>
            handleUpdateLanguage(index, { language: value as Language['language'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>熟练程度</Label>
        <Select
          value={language.proficiency}
          onValueChange={(value) =>
            handleUpdateLanguage(index, {
              proficiency: value as Language['proficiency'],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_PROFICIENCY_OPTIONS.map((prof) => (
              <SelectItem key={prof.value} value={prof.value}>
                {prof.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // ===== 获奖经历 =====
  const handleAddAward = () => {
    const newAward: Award = {
      award_name: '',
    };
    setValue('awards', [...awards, newAward], { shouldDirty: true });
  };

  const handleUpdateAward = (index: number, data: Partial<Award>) => {
    const newAwards = [...awards];
    newAwards[index] = { ...newAwards[index], ...data };
    setValue('awards', newAwards, { shouldDirty: true });
  };

  const renderAwardItem = (award: Award, index: number) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>获奖名称</Label>
        <Input
          placeholder="如：国家奖学金"
          value={award.award_name}
          onChange={(e) => handleUpdateAward(index, { award_name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>获奖时间（可选）</Label>
          <Input
            type="month"
            value={award.award_date || ''}
            onChange={(e) => handleUpdateAward(index, { award_date: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>描述（可选）</Label>
        <Textarea
          placeholder="补充说明"
          rows={2}
          value={award.description || ''}
          onChange={(e) =>
            handleUpdateAward(index, { description: e.target.value })
          }
        />
      </div>
    </div>
  );

  // ===== 作品展示 =====
  const handleAddPortfolio = () => {
    const newPortfolio: Portfolio = {
      work_name: '',
    };
    setValue('portfolios', [...portfolios, newPortfolio], { shouldDirty: true });
  };

  const handleUpdatePortfolio = (index: number, data: Partial<Portfolio>) => {
    const newPortfolios = [...portfolios];
    newPortfolios[index] = { ...newPortfolios[index], ...data };
    setValue('portfolios', newPortfolios, { shouldDirty: true });
  };

  const renderPortfolioItem = (portfolio: Portfolio, index: number) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>作品名称</Label>
        <Input
          placeholder="如：个人博客"
          value={portfolio.work_name}
          onChange={(e) =>
            handleUpdatePortfolio(index, { work_name: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>作品链接（可选）</Label>
        <Input
          placeholder="https://..."
          value={portfolio.work_link || ''}
          onChange={(e) =>
            handleUpdatePortfolio(index, { work_link: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>描述（可选）</Label>
        <Textarea
          placeholder="作品说明"
          rows={2}
          value={portfolio.description || ''}}
          onChange={(e) =>
            handleUpdatePortfolio(index, { description: e.target.value })
          }
        />
      </div>
    </div>
  );

  // ===== 社交账号 =====
  const handleAddSocialLink = () => {
    const newLink: SocialLink = {
      platform: 'github',
      url: '',
    };
    setValue('social_links', [...socialLinks, newLink], { shouldDirty: true });
  };

  const handleUpdateSocialLink = (index: number, data: Partial<SocialLink>) => {
    const newLinks = [...socialLinks];
    newLinks[index] = { ...newLinks[index], ...data };
    setValue('social_links', newLinks, { shouldDirty: true });
  };

  const renderSocialLinkItem = (link: SocialLink, index: number) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>平台</Label>
        <Select
          value={link.platform}
          onValueChange={(value) =>
            handleUpdateSocialLink(index, {
              platform: value as SocialLink['platform'],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOCIAL_PLATFORM_OPTIONS.map((platform) => (
              <SelectItem key={platform.value} value={platform.value}>
                {platform.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>链接</Label>
        <Input
          placeholder="URL 或 ID"
          value={link.url}
          onChange={(e) =>
            handleUpdateSocialLink(index, { url: e.target.value })
          }
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 技能特长 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">技能特长</h3>
        <Controller
          name="skills"
          control={control}
          render={({ field }) => (
            <DynamicFormList
              items={field.value || []}
              onChange={(items) => field.onChange(items)}
              renderItem={renderSkillItem}
              getItemId={(_, index) => `skill-${index}`}
              getItemTitle={(item, index) =>
                item.skill_name || `技能 ${index + 1}`
              }
              addButtonText="+ 添加技能"
              emptyText="暂无技能，点击添加"
              onAdd={handleAddSkill}
              minItems={0}
            />
          )}
        />
      </section>

      {/* 语言能力 - 校招默认显示 */}
      {(resumeMode === 'campus' || languages.length > 0) && (
        <section>
          <h3 className="text-lg font-semibold mb-4">语言能力</h3>
          <Controller
            name="languages"
            control={control}
            render={({ field }) => (
              <DynamicFormList
                items={field.value || []}
                onChange={(items) => field.onChange(items)}
                renderItem={renderLanguageItem}
                getItemId={(_, index) => `lang-${index}`}
                getItemTitle={(item, index) =>
                  LANGUAGE_OPTIONS.find((l) => l.value === item.language)
                    ?.label || `语言 ${index + 1}`
                }
                addButtonText="+ 添加语言"
                emptyText="暂无语言能力，点击添加"
                onAdd={handleAddLanguage}
                minItems={0}
              />
            )}
          />
        </section>
      )}

      {/* 获奖经历 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">获奖经历</h3>
        <Controller
          name="awards"
          control={control}
          render={({ field }) => (
            <DynamicFormList
              items={field.value || []}
              onChange={(items) => field.onChange(items)}
              renderItem={renderAwardItem}
              getItemId={(_, index) => `award-${index}`}
              getItemTitle={(item, index) =>
                item.award_name || `获奖 ${index + 1}`
              }
              addButtonText="+ 添加获奖"
              emptyText="暂无获奖经历，点击添加"
              onAdd={handleAddAward}
              minItems={0}
            />
          )}
        />
      </section>

      {/* 作品展示 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">作品展示</h3>
        <Controller
          name="portfolios"
          control={control}
          render={({ field }) => (
            <DynamicFormList
              items={field.value || []}
              onChange={(items) => field.onChange(items)}
              renderItem={renderPortfolioItem}
              getItemId={(_, index) => `portfolio-${index}`}
              getItemTitle={(item, index) =>
                item.work_name || `作品 ${index + 1}`
              }
              addButtonText="+ 添加作品"
              emptyText="暂无作品，点击添加"
              onAdd={handleAddPortfolio}
              minItems={0}
            />
          )}
        />
      </section>

      {/* 社交账号 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">社交账号</h3>
        <Controller
          name="social_links"
          control={control}
          render={({ field }) => (
            <DynamicFormList
              items={field.value || []}
              onChange={(items) => field.onChange(items)}
              renderItem={renderSocialLinkItem}
              getItemId={(_, index) => `social-${index}`}
              getItemTitle={(item, index) =>
                SOCIAL_PLATFORM_OPTIONS.find((p) => p.value === item.platform)
                  ?.label || `社交账号 ${index + 1}`
              }
              addButtonText="+ 添加社交账号"
              emptyText="暂无社交账号，点击添加"
              onAdd={handleAddSocialLink}
              minItems={0}
            />
          )}
        />
      </section>
    </div>
  );
};

export default SkillsForm;
