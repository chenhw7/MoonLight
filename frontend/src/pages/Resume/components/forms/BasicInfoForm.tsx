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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

      {/* 求职意向 */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium">求职意向</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="target_position">期望职位</Label>
            <Input
              id="target_position"
              placeholder="如：高级前端工程师"
              {...register('target_position')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_city">期望城市</Label>
            <Input
              id="target_city"
              placeholder="如：北京、上海"
              {...register('target_city')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_work_date">最快到岗时间</Label>
            <Input
              id="start_work_date"
              placeholder="如：随时、2周内"
              {...register('start_work_date')}
            />
          </div>
        </div>
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

      {/* 内部管理 (仅自己可见) */}
      <div className="space-y-4 border-t pt-4 mt-8 bg-gray-50 p-4 rounded-lg border-dashed border-gray-300">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-700">内部管理信息 (不展示在简历中)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-2">
            <Label htmlFor="salary_expectation">期望薪资</Label>
            <Input
              id="salary_expectation"
              placeholder="如：25k-35k * 14"
              {...register('salary_expectation')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="application_status">申请状态</Label>
            <Controller
              name="application_status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择当前状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preparing">准备中</SelectItem>
                    <SelectItem value="submitted">已投递</SelectItem>
                    <SelectItem value="interviewing">面试中</SelectItem>
                    <SelectItem value="offer">已拿Offer</SelectItem>
                    <SelectItem value="rejected">已结束</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_companies">目标公司</Label>
          <Input
            id="target_companies"
            placeholder="如：字节跳动, 腾讯, 阿里 (逗号分隔)"
            {...register('target_companies')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="private_notes">私人备注</Label>
          <Textarea
            id="private_notes"
            placeholder="记录投递策略、面试重点等..."
            rows={3}
            {...register('private_notes')}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoForm;
