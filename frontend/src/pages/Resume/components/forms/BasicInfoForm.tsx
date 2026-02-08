/**
 * 基本信息表单组件
 *
 * 简历的基本信息填写，包括姓名、联系方式、求职意向等
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
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { X, Plus } from 'lucide-react';
import type { ResumeFormData, ResumeType } from '@/types/resume';
import { JOB_STATUS_OPTIONS } from '@/types/resume';

interface BasicInfoFormProps {
  resumeMode: ResumeType;
}

/**
 * 基本信息表单
 */
const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ resumeMode }) => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<ResumeFormData>();

  const targetCities = watch('target_cities') || [];
  const targetPositions = watch('target_positions') || [];
  const [newCity, setNewCity] = React.useState('');
  const [newPosition, setNewPosition] = React.useState('');

  /**
   * 添加期望城市
   */
  const handleAddCity = () => {
    if (newCity.trim() && !targetCities.includes(newCity.trim())) {
      setValue('target_cities', [...targetCities, newCity.trim()], {
        shouldDirty: true,
      });
      setNewCity('');
    }
  };

  /**
   * 移除期望城市
   */
  const handleRemoveCity = (city: string) => {
    setValue(
      'target_cities',
      targetCities.filter((c) => c !== city),
      { shouldDirty: true }
    );
  };

  /**
   * 添加期望岗位
   */
  const handleAddPosition = () => {
    if (newPosition.trim() && !targetPositions.includes(newPosition.trim())) {
      setValue('target_positions', [...targetPositions, newPosition.trim()], {
        shouldDirty: true,
      });
      setNewPosition('');
    }
  };

  /**
   * 移除期望岗位
   */
  const handleRemovePosition = (position: string) => {
    setValue(
      'target_positions',
      targetPositions.filter((p) => p !== position),
      { shouldDirty: true }
    );
  };

  return (
    <div className="space-y-6">
      {/* 头像上传 */}
      <div className="flex justify-center pb-4 border-b">
        <Controller
          name="avatar"
          control={control}
          render={({ field }) => (
            <AvatarUpload
              value={field.value}
              ratio={watch('avatar_ratio')}
              onChange={(avatar, ratio) => {
                field.onChange(avatar);
                if (ratio) {
                  setValue('avatar_ratio', ratio, { shouldDirty: true });
                }
              }}
            />
          )}
        />
      </div>

      {/* 简历标题 */}
      <div className="space-y-2">
        <Label htmlFor="title">
          简历标题 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="如：校招-前端开发工程师"
          {...register('title')}
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      {/* 姓名和电话 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            姓名 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="请输入真实姓名"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            手机号 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="请输入手机号"
            {...register('phone')}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* 邮箱 */}
      <div className="space-y-2">
        <Label htmlFor="email">
          邮箱 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="请输入邮箱地址"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* 当前居住地 */}
      <div className="space-y-2">
        <Label htmlFor="location">
          当前居住地 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="location"
          placeholder="如：北京市海淀区"
          {...register('location')}
          className={errors.location ? 'border-red-500' : ''}
        />
        {errors.location && (
          <p className="text-sm text-red-500">{errors.location.message}</p>
        )}
      </div>

      {/* 社招特有字段 */}
      {resumeMode === 'social' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="years_of_experience">工作年限</Label>
            <Input
              id="years_of_experience"
              type="number"
              min={0}
              max={50}
              placeholder="如：3"
              {...register('years_of_experience', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_company">当前公司</Label>
            <Input
              id="current_company"
              placeholder="如：字节跳动"
              {...register('current_company')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_position">当前职位</Label>
            <Input
              id="current_position"
              placeholder="如：高级前端工程师"
              {...register('current_position')}
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="expected_salary">期望薪资</Label>
            <Input
              id="expected_salary"
              placeholder="如：20k-30k"
              {...register('expected_salary')}
            />
          </div>
        </div>
      )}

      {/* 期望城市 */}
      <div className="space-y-2">
        <Label>
          期望工作地点 <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="输入城市名称，按回车添加"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCity();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddCity}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {targetCities.map((city) => (
            <Badge key={city} variant="secondary" className="gap-1">
              {city}
              <button
                type="button"
                onClick={() => handleRemoveCity(city)}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        {errors.target_cities && (
          <p className="text-sm text-red-500">{errors.target_cities.message}</p>
        )}
      </div>

      {/* 求职状态 */}
      <div className="space-y-2">
        <Label>
          求职状态 <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="job_status"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={errors.job_status ? 'border-red-500' : ''}>
                <SelectValue placeholder="请选择求职状态" />
              </SelectTrigger>
              <SelectContent>
                {JOB_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.job_status && (
          <p className="text-sm text-red-500">{errors.job_status.message}</p>
        )}
      </div>

      {/* 期望岗位 */}
      <div className="space-y-2">
        <Label>
          期望岗位 <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="输入岗位名称，按回车添加"
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddPosition();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddPosition}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {targetPositions.map((position) => (
            <Badge key={position} variant="secondary" className="gap-1">
              {position}
              <button
                type="button"
                onClick={() => handleRemovePosition(position)}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        {errors.target_positions && (
          <p className="text-sm text-red-500">{errors.target_positions.message}</p>
        )}
      </div>

      {/* 自我评价 */}
      <div className="space-y-2">
        <Label htmlFor="self_evaluation">自我评价</Label>
        <Textarea
          id="self_evaluation"
          placeholder="简要描述您的优势和特点（500字以内）"
          rows={4}
          {...register('self_evaluation')}
          className={errors.self_evaluation ? 'border-red-500' : ''}
        />
        {errors.self_evaluation && (
          <p className="text-sm text-red-500">{errors.self_evaluation.message}</p>
        )}
      </div>
    </div>
  );
};

export default BasicInfoForm;
