/**
 * 面试配置页面
 *
 * 用户配置面试参数：
 * - 选择简历
 * - 填写企业、岗位信息
 * - 选择招聘类型、面试模式、面试官风格
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Briefcase, Building2, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getResumeList } from '@/services/resume';
import { createInterviewSession } from '@/services/interview';
import { ResumeBase } from '@/types/resume';
import {
  InterviewSessionCreate,
  RECRUITMENT_TYPE_OPTIONS,
  INTERVIEW_MODE_OPTIONS,
  INTERVIEWER_STYLE_OPTIONS,
  RecruitmentType,
  InterviewMode,
  InterviewerStyle,
} from '@/types/interview';
import { createLogger } from '@/utils/logger';

const logger = createLogger('InterviewConfig');

export function InterviewConfig() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedResumeId = (location.state as { resumeId?: number })?.resumeId;

  // 状态
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resumes, setResumes] = useState<ResumeBase[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // 表单状态
  const [formData, setFormData] = useState<{
    company_name: string;
    position_name: string;
    job_description: string;
    recruitment_type: RecruitmentType;
    interview_mode: InterviewMode;
    interviewer_style: InterviewerStyle;
  }>({
    company_name: '',
    position_name: '',
    job_description: '',
    recruitment_type: 'campus',
    interview_mode: 'basic_knowledge',
    interviewer_style: 'strict',
  });

  // 加载简历列表
  useEffect(() => {
    const loadResumes = async () => {
      try {
        setLoading(true);
        const response = await getResumeList(1, 100);
        setResumes(response.items || []);

        // 优先使用传递过来的简历ID
        if (passedResumeId) {
          setSelectedResumeId(passedResumeId.toString());
        } else if (response.items && response.items.length > 0 && response.items[0].id) {
          setSelectedResumeId(response.items[0].id.toString());
        }
      } catch (error) {
        logger.error('Failed to load resumes', { error });
      } finally {
        setLoading(false);
      }
    };

    loadResumes();
  }, [passedResumeId]);

  // 处理招聘类型变更
  const handleRecruitmentTypeChange = (value: RecruitmentType) => {
    setFormData((prev) => ({
      ...prev,
      recruitment_type: value,
      // 切换招聘类型时，重置面试模式为第一个选项
      interview_mode: INTERVIEW_MODE_OPTIONS[value][0].value,
    }));
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证
    if (!selectedResumeId) {
      alert('请选择一份简历');
      return;
    }
    if (!formData.company_name.trim()) {
      alert('请填写企业名称');
      return;
    }
    if (!formData.position_name.trim()) {
      alert('请填写岗位名称');
      return;
    }
    if (!formData.job_description.trim()) {
      alert('请填写岗位描述');
      return;
    }

    try {
      setSubmitting(true);

      const data: InterviewSessionCreate = {
        resume_id: parseInt(selectedResumeId),
        company_name: formData.company_name.trim(),
        position_name: formData.position_name.trim(),
        job_description: formData.job_description.trim(),
        recruitment_type: formData.recruitment_type,
        interview_mode: formData.interview_mode,
        interviewer_style: formData.interviewer_style,
      };

      const session = await createInterviewSession(data);
      logger.info('Interview session created', { sessionId: session.id });

      // 跳转到面试页面
      navigate(`/interview/${session.id}`);
    } catch (error: any) {
      logger.error('Failed to create interview session', { error });
      alert(error.response?.data?.detail || '创建面试失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 如果没有简历，提示创建
  if (resumes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">开始模拟面试</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">
              您还没有创建简历，请先创建一份简历
            </p>
            <Button onClick={() => navigate('/resume/create')}>
              创建简历
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">配置模拟面试</h1>
        <p className="text-muted-foreground mt-1">
          填写面试信息，AI 面试官将根据您的简历进行针对性提问
        </p>
      </div>

      <div className="space-y-6">
        {/* 选择简历 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              选择简历
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedResumeId}
              onValueChange={setSelectedResumeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择一份简历" />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((resume) => (
                  <SelectItem key={resume.id ?? 0} value={resume.id?.toString() ?? ''}>
                    {resume.title || '未命名简历'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* 岗位信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              岗位信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 企业名称 */}
            <div className="space-y-2">
              <Label htmlFor="company_name">
                企业名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    company_name: e.target.value,
                  }))
                }
                placeholder="例如：字节跳动、阿里巴巴"
              />
            </div>

            {/* 岗位名称 */}
            <div className="space-y-2">
              <Label htmlFor="position_name">
                岗位名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="position_name"
                value={formData.position_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    position_name: e.target.value,
                  }))
                }
                placeholder="例如：前端工程师、Java 开发"
              />
            </div>

            {/* 岗位描述 */}
            <div className="space-y-2">
              <Label htmlFor="job_description">
                岗位描述 (JD) <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="job_description"
                value={formData.job_description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    job_description: e.target.value,
                  }))
                }
                placeholder="请粘贴岗位描述，包括岗位职责、任职要求等..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* 面试设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              面试设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 招聘类型 */}
            <div className="space-y-2">
              <Label>招聘类型</Label>
              <div className="flex gap-4">
                {RECRUITMENT_TYPE_OPTIONS.map((type) => (
                  <label
                    key={type.value}
                    className={`flex-1 flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.recruitment_type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recruitment_type"
                      value={type.value}
                      checked={formData.recruitment_type === type.value}
                      onChange={(e) =>
                        handleRecruitmentTypeChange(e.target.value as RecruitmentType)
                      }
                      className="sr-only"
                    />
                    <span className="font-medium">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 面试模式 */}
            <div className="space-y-2">
              <Label>面试模式</Label>
              <div className="space-y-2">
                {INTERVIEW_MODE_OPTIONS[formData.recruitment_type].map((mode) => (
                  <label
                    key={mode.value}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.interview_mode === mode.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interview_mode"
                      value={mode.value}
                      checked={formData.interview_mode === mode.value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          interview_mode: e.target.value as InterviewMode,
                        }))
                      }
                      className="sr-only"
                    />
                    <div>
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {mode.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 面试官风格 */}
            <div className="space-y-2">
              <Label>面试官风格</Label>
              <div className="space-y-2">
                {INTERVIEWER_STYLE_OPTIONS.map((style) => (
                  <label
                    key={style.value}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.interviewer_style === style.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interviewer_style"
                      value={style.value}
                      checked={formData.interviewer_style === style.value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          interviewer_style: e.target.value as InterviewerStyle,
                        }))
                      }
                      className="sr-only"
                    />
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {style.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          开始面试
        </Button>
      </div>
    </div>
  );
}
