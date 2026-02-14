/**
 * 教育经历表单组件
 *
 * 支持添加多条教育经历记录
 */

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DynamicFormList from '../DynamicFormList';
import type { ResumeFormData, ResumeType, Education } from '@/types/resume';
import { EDUCATION_LEVELS } from '@/types/resume';

interface EducationFormProps {
  resumeMode: ResumeType;
}

/**
 * 教育经历表单
 */
const EducationForm: React.FC<EducationFormProps> = ({ resumeMode }) => {
  const { control, watch, setValue } = useFormContext<ResumeFormData>();
  const educations = watch('educations') || [];

  /**
   * 添加教育经历
   */
  const handleAddEducation = () => {
    const newEducation: Education = {
      school_name: '',
      major: '',
      degree: 'bachelor',
      start_date: '',
      end_date: null,
      is_current: false,
    };
    setValue('educations', [...educations, newEducation], { shouldDirty: true });
  };

  /**
   * 更新教育经历
   */
  const handleUpdateEducation = (index: number, data: Partial<Education>) => {
    const newEducations = [...educations];
    newEducations[index] = { ...newEducations[index], ...data };
    setValue('educations', newEducations, { shouldDirty: true });
  };

  /**
   * 渲染教育经历表单项
   */
  const renderEducationItem = (education: Education, index: number) => {
    return (
      <div className="space-y-4">
        {/* 学校名称 */}
        <div className="space-y-2">
          <Label>学校名称</Label>
          <Input
            placeholder="请输入学校全称"
            value={education.school_name}
            onChange={(e) =>
              handleUpdateEducation(index, { school_name: e.target.value })
            }
          />
        </div>

        {/* 学历和专业 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>学历</Label>
            <Select
              value={education.degree}
              onValueChange={(value) =>
                handleUpdateEducation(index, {
                  degree: value as Education['degree'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择学历" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>专业</Label>
            <Input
              placeholder="请输入专业名称"
              value={education.major}
              onChange={(e) =>
                handleUpdateEducation(index, { major: e.target.value })
              }
            />
          </div>
        </div>

        {/* 起止时间 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>入学时间</Label>
            <Input
              type="month"
              value={education.start_date}
              onChange={(e) =>
                handleUpdateEducation(index, { start_date: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>毕业时间</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`edu-current-${index}`}
                  checked={education.is_current}
                  onCheckedChange={(checked) =>
                    handleUpdateEducation(index, {
                      is_current: checked as boolean,
                      end_date: checked ? null : education.end_date,
                    })
                  }
                />
                <label
                  htmlFor={`edu-current-${index}`}
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  在读
                </label>
              </div>
            </div>
            {!education.is_current && (
              <Input
                type="month"
                value={education.end_date || ''}
                onChange={(e) =>
                  handleUpdateEducation(index, { end_date: e.target.value })
                }
              />
            )}
          </div>
        </div>

        {/* GPA - 校招默认显示，社招可选 */}
        {(resumeMode === 'campus' || education.gpa) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>GPA</Label>
              <Input
                placeholder="如：3.8/4.0"
                value={education.gpa || ''}
                onChange={(e) =>
                  handleUpdateEducation(index, { gpa: e.target.value })
                }
              />
            </div>
            {resumeMode === 'campus' && (
              <div className="space-y-2">
                <Label>专业排名</Label>
                <Input
                  placeholder="如：前10%、1/120"
                  value={education.ranking || ''}
                  onChange={(e) =>
                    handleUpdateEducation(index, { ranking: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* 主修课程 - 仅校招显示 */}
        {resumeMode === 'campus' && (
          <div className="space-y-2">
            <Label>主修课程</Label>
            <Textarea
              placeholder="列举主要课程，如：数据结构、算法、操作系统..."
              rows={3}
              value={education.courses || ''}
              onChange={(e) =>
                handleUpdateEducation(index, { courses: e.target.value })
              }
            />
          </div>
        )}

        {/* 在校荣誉 */}
        <div className="space-y-2">
          <Label>在校荣誉</Label>
          <Textarea
            placeholder="奖学金、荣誉称号等"
            rows={2}
            value={education.honors || ''}
            onChange={(e) =>
              handleUpdateEducation(index, { honors: e.target.value })
            }
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        请按时间倒序填写教育经历，从最高学历开始
      </div>

      <Controller
        name="educations"
        control={control}
        render={({ field }) => (
          <DynamicFormList
            items={field.value || []}
            onChange={(items) => field.onChange(items)}
            renderItem={renderEducationItem}
            getItemId={(_, index) => `edu-${index}`}
            getItemTitle={(item, index) =>
              item.school_name || `教育经历 ${index + 1}`
            }
            addButtonText="+ 添加教育经历"
            emptyText="暂无教育经历，点击添加"
            onAdd={handleAddEducation}
            minItems={1}
          />
        )}
      />
    </div>
  );
};

export default EducationForm;
