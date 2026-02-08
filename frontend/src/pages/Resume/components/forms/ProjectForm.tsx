/**
 * 项目经历表单组件
 *
 * 支持添加多条项目经历记录
 */

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import DynamicFormList from '../DynamicFormList';
import type { ResumeFormData, Project } from '@/types/resume';

/**
 * 项目经历表单
 */
const ProjectForm: React.FC = () => {
  const { control, watch, setValue } = useFormContext<ResumeFormData>();
  const projects = watch('projects') || [];

  /**
   * 添加项目经历
   */
  const handleAddProject = () => {
    const newProject: Project = {
      name: '',
      role: '',
      start_date: '',
      end_date: null,
      description: '',
      is_current: false,
    };
    setValue('projects', [...projects, newProject], { shouldDirty: true });
  };

  /**
   * 更新项目经历
   */
  const handleUpdateProject = (index: number, data: Partial<Project>) => {
    const newProjects = [...projects];
    newProjects[index] = { ...newProjects[index], ...data };
    setValue('projects', newProjects, { shouldDirty: true });
  };

  /**
   * 渲染项目经历表单项
   */
  const renderProjectItem = (project: Project, index: number) => {
    return (
      <div className="space-y-4">
        {/* 项目名称 */}
        <div className="space-y-2">
          <Label>项目名称</Label>
          <Input
            placeholder="请输入项目名称"
            value={project.name}
            onChange={(e) =>
              handleUpdateProject(index, { name: e.target.value })
            }
          />
        </div>

        {/* 项目角色 */}
        <div className="space-y-2">
          <Label>项目角色</Label>
          <Input
            placeholder="如：前端负责人、核心开发"
            value={project.role}
            onChange={(e) =>
              handleUpdateProject(index, { role: e.target.value })
            }
          />
        </div>

        {/* 项目链接 */}
        <div className="space-y-2">
          <Label>项目链接（可选）</Label>
          <Input
            placeholder="GitHub、演示地址等"
            value={project.link || ''}
            onChange={(e) =>
              handleUpdateProject(index, { link: e.target.value })
            }
          />
        </div>

        {/* 起止时间 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>开始时间</Label>
            <Input
              type="month"
              value={project.start_date}
              onChange={(e) =>
                handleUpdateProject(index, { start_date: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>结束时间</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`project-current-${index}`}
                  checked={project.is_current}
                  onCheckedChange={(checked) =>
                    handleUpdateProject(index, {
                      is_current: checked as boolean,
                      end_date: checked ? null : project.end_date,
                    })
                  }
                />
                <label
                  htmlFor={`project-current-${index}`}
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  进行中
                </label>
              </div>
            </div>
            {!project.is_current && (
              <Input
                type="month"
                value={project.end_date || ''}
                onChange={(e) =>
                  handleUpdateProject(index, { end_date: e.target.value })
                }
              />
            )}
          </div>
        </div>

        {/* 项目描述 */}
        <div className="space-y-2">
          <Label>项目描述</Label>
          <Textarea
            placeholder="描述项目背景、您的职责、技术栈和项目成果（建议20字以上）"
            rows={5}
            value={project.description}
            onChange={(e) =>
              handleUpdateProject(index, { description: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            提示：突出您的贡献和技术亮点，使用数据说明成果
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        请填写您参与过的重要项目，突出您的技术能力和贡献
      </div>

      <Controller
        name="projects"
        control={control}
        render={({ field }) => (
          <DynamicFormList
            items={field.value || []}
            onChange={(items) => field.onChange(items)}
            renderItem={renderProjectItem}
            getItemId={(_, index) => `project-${index}`}
            getItemTitle={(item, index) =>
              item.name || `项目经历 ${index + 1}`
            }
            addButtonText="+ 添加项目经历"
            emptyText="暂无项目经历，点击添加"
            onAdd={handleAddProject}
            minItems={0}
          />
        )}
      />
    </div>
  );
};

export default ProjectForm;
