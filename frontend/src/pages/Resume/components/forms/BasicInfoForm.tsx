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
import { AvatarUpload } from '@/components/ui/avatar-upload';
import type { ResumeFormData } from '@/types/resume';

/**
 * 基本信息表单
 */
const BasicInfoForm: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<ResumeFormData>();

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
          <Label htmlFor="full_name">
            姓名 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full_name"
            placeholder="请输入真实姓名"
            {...register('full_name')}
            className={errors.full_name ? 'border-red-500' : ''}
          />
          {errors.full_name && (
            <p className="text-sm text-red-500">{errors.full_name.message}</p>
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
        <Label htmlFor="current_city">
          当前居住地 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="current_city"
          placeholder="如：北京市海淀区"
          {...register('current_city')}
          className={errors.current_city ? 'border-red-500' : ''}
        />
        {errors.current_city && (
          <p className="text-sm text-red-500">{errors.current_city.message}</p>
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
