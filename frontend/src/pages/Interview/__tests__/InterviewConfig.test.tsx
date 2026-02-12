/**
 * 面试配置页面集成测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { InterviewConfig } from '../InterviewConfig';
import * as resumeService from '@/services/resume';
import * as interviewService from '@/services/interview';

// Mock 服务
vi.mock('@/services/resume');
vi.mock('@/services/interview');
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

describe('InterviewConfig Integration', () => {
  const mockResumes = [
    {
      id: 1,
      title: '简历1',
      full_name: '用户1',
      resume_type: 'campus',
      current_city: '北京',
    },
    {
      id: 2,
      title: '简历2',
      full_name: '用户2',
      resume_type: 'social',
      current_city: '上海',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (resumeService.getResumeList as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: mockResumes,
      total: 2,
    });
  });

  it('should render form with resume selection', async () => {
    render(
      <BrowserRouter>
        <InterviewConfig />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('AI 面试官配置')).toBeInTheDocument();
    });

    expect(screen.getByText('选择简历')).toBeInTheDocument();
    expect(screen.getByText('目标企业')).toBeInTheDocument();
    expect(screen.getByText('目标岗位')).toBeInTheDocument();
  });

  it('should submit form successfully', async () => {
    const mockSession = {
      id: 1,
      status: 'ongoing',
      current_round: 'opening',
    };

    (interviewService.createInterviewSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession
    );

    render(
      <BrowserRouter>
        <InterviewConfig />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('AI 面试官配置')).toBeInTheDocument();
    });

    // 填写表单
    const companyInput = screen.getByLabelText('目标企业');
    fireEvent.change(companyInput, { target: { value: '字节跳动' } });

    const positionInput = screen.getByLabelText('目标岗位');
    fireEvent.change(positionInput, { target: { value: '后端开发' } });

    const jdInput = screen.getByLabelText(/岗位描述/);
    fireEvent.change(jdInput, { target: { value: '负责后端开发' } });

    // 提交表单
    const submitButton = screen.getByText('开始面试');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(interviewService.createInterviewSession).toHaveBeenCalledWith(
        expect.objectContaining({
          company_name: '字节跳动',
          position_name: '后端开发',
          job_description: '负责后端开发',
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/interview/1');
  });

  it('should show validation error for empty fields', async () => {
    render(
      <BrowserRouter>
        <InterviewConfig />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('AI 面试官配置')).toBeInTheDocument();
    });

    // 直接提交空表单
    const submitButton = screen.getByText('开始面试');
    fireEvent.click(submitButton);

    // 验证表单没有提交
    await waitFor(() => {
      expect(interviewService.createInterviewSession).not.toHaveBeenCalled();
    });
  });

  it('should handle API error gracefully', async () => {
    (interviewService.createInterviewSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('创建失败')
    );

    render(
      <BrowserRouter>
        <InterviewConfig />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('AI 面试官配置')).toBeInTheDocument();
    });

    // 填写表单
    const companyInput = screen.getByLabelText('目标企业');
    fireEvent.change(companyInput, { target: { value: '字节跳动' } });

    const positionInput = screen.getByLabelText('目标岗位');
    fireEvent.change(positionInput, { target: { value: '后端开发' } });

    const jdInput = screen.getByLabelText(/岗位描述/);
    fireEvent.change(jdInput, { target: { value: '负责后端开发' } });

    // 提交表单
    const submitButton = screen.getByText('开始面试');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('创建面试失败')).toBeInTheDocument();
    });
  });
});
