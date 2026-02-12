/**
 * 工作/实习经历表单组件
 *
 * 支持添加多条工作/实习经历记录
 */

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import DynamicFormList from '../DynamicFormList';
import type { ResumeFormData, ResumeType, WorkExperience } from '@/types/resume';

interface WorkExperienceFormProps {
  resumeMode: ResumeType;
}

/**
 * 工作/实习经历表单
 */
const WorkExperienceForm: React.FC<WorkExperienceFormProps> = ({
  resumeMode,
}) => {
  const { control, watch, setValue } = useFormContext<ResumeFormData>();
  const workExperiences = watch('work_experiences') || [];

  /**
   * 添加工作/实习经历
   */
  const handleAddWorkExperience = () => {
    const newExperience: WorkExperience = {
      company_name: '',
      position: '',
      start_date: '',
      end_date: null,
      description: '',
      is_current: false,
      is_internship: resumeMode === 'campus',
    };
    setValue('work_experiences', [...workExperiences, newExperience], {
      shouldDirty: true,
    });
  };

  /**
   * 更新工作/实习经历
   */
  const handleUpdateWorkExperience = (
    index: number,
    data: Partial<WorkExperience>
  ) => {
    const newExperiences = [...workExperiences];
    newExperiences[index] = { ...newExperiences[index], ...data };
    setValue('work_experiences', newExperiences, { shouldDirty: true });
  };

  /**
   * 渲染工作/实习经历表单项
   */
  const renderWorkExperienceItem = (
    experience: WorkExperience,
    index: number
  ) => {
    return (
      <div className="space-y-4">
        {/* 公司名称 */}
        <div className="space-y-2">
          <Label>公司名称</Label>
          <Input
            placeholder="请输入公司全称"
            value={experience.company_name}
            onChange={(e) =>
              handleUpdateWorkExperience(index, {
                company_name: e.target.value,
              })
            }
          />
        </div>

        {/* 职位名称和部门 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>职位名称</Label>
            <Input
              placeholder="请输入担任职位"
              value={experience.position}
              onChange={(e) =>
                handleUpdateWorkExperience(index, { position: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>所属部门</Label>
            <Input
              placeholder="如：研发部、平台组"
              value={experience.department || ''}
              onChange={(e) =>
                handleUpdateWorkExperience(index, { department: e.target.value })
              }
            />
          </div>
        </div>

        {/* 起止时间 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>入职时间</Label>
            <Input
              type="month"
              value={experience.start_date}
              onChange={(e) =>
                handleUpdateWorkExperience(index, {
                  start_date: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>离职时间</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`work-current-${index}`}
                  checked={experience.is_current}
                  onCheckedChange={(checked) =>
                    handleUpdateWorkExperience(index, {
                      is_current: checked as boolean,
                      end_date: checked ? null : experience.end_date,
                    })
                  }
                />
                <label
                  htmlFor={`work-current-${index}`}
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  在职
                </label>
              </div>
            </div>
            {!experience.is_current && (
              <Input
                type="month"
                value={experience.end_date || ''}
                onChange={(e) =>
                  handleUpdateWorkExperience(index, {
                    end_date: e.target.value,
                  })
                }
              />
            )}
          </div>
        </div>

        {/* 工作描述 */}
        <div className="space-y-2">
          <Label>技术栈</Label>
          <Input
            placeholder="如：React, TypeScript, Node.js"
            value={experience.tech_stack || ''}
            onChange={(e) =>
              handleUpdateWorkExperience(index, { tech_stack: e.target.value })
            }
          />
        </div>

        {/* 主要成就 */}
        <div className="space-y-2">
          <Label>主要成就</Label>
          <Textarea
            placeholder="列举核心业绩，可量化结果"
            rows={3}
            value={experience.achievements || ''}
            onChange={(e) =>
              handleUpdateWorkExperience(index, { achievements: e.target.value })
            }
          />
        </div>

        {/* 工作描述 */}
        <div className="space-y-2">
          <Label>工作描述</Label>
          <Textarea
            placeholder="描述您的工作内容、职责和成果（建议20字以上）"
            rows={5}
            value={experience.description}
            onChange={(e) =>
              handleUpdateWorkExperience(index, {
                description: e.target.value,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            提示：使用 STAR 法则描述（情境-任务-行动-结果）
          </p>
        </div>
      </div>
    );
  };

  const title = resumeMode === 'campus' ? '实习经历' : '工作经历';

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        {resumeMode === 'campus'
          ? '请填写您的实习经历，没有可跳过'
          : '请按时间倒序填写工作经历，从最近一份工作开始'}
      </div>

      <Controller
        name="work_experiences"
        control={control}
        render={({ field }) => (
          <DynamicFormList
            items={field.value || []}
            onChange={(items) => field.onChange(items)}
            renderItem={renderWorkExperienceItem}
            getItemId={(_, index) => `work-${index}`}
            getItemTitle={(item, index) =>
              item.company_name || `${title} ${index + 1}`
            }
            addButtonText={`+ 添加${title}`}
            emptyText={`暂无${title}，点击添加`}
            onAdd={handleAddWorkExperience}
            minItems={0}
          />
        )}
      />
    </div>
  );
};

export default WorkExperienceForm;
