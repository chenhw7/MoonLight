/**
 * 面试服务单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createInterviewSession,
  getInterviewSession,
  getInterviewSessions,
  completeInterviewSession,
  abortInterviewSession,
  sendMessage,
  getInterviewMessages,
  getEvaluation,
  deleteEvaluation,
} from '../interview';
import api from '../api';

// Mock API
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Interview Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInterviewSession', () => {
    it('should create interview session successfully', async () => {
      const mockResponse = {
        id: 1,
        user_id: 1,
        resume_id: 1,
        company_name: '测试公司',
        position_name: '测试岗位',
        status: 'ongoing',
        current_round: 'opening',
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await createInterviewSession({
        resume_id: 1,
        company_name: '测试公司',
        position_name: '测试岗位',
        job_description: '测试描述',
        recruitment_type: 'campus',
        interview_mode: 'basic_knowledge',
        interviewer_style: 'strict',
      });

      expect(api.post).toHaveBeenCalledWith('/interviews', expect.any(Object));
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when creation fails', async () => {
      (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Creation failed'));

      await expect(
        createInterviewSession({
          resume_id: 1,
          company_name: '测试公司',
          position_name: '测试岗位',
          job_description: '测试描述',
          recruitment_type: 'campus',
          interview_mode: 'basic_knowledge',
          interviewer_style: 'strict',
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('getInterviewSession', () => {
    it('should get interview session by id', async () => {
      const mockResponse = {
        id: 1,
        user_id: 1,
        resume_id: 1,
        company_name: '测试公司',
        position_name: '测试岗位',
        status: 'ongoing',
        current_round: 'opening',
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await getInterviewSession(1);

      expect(api.get).toHaveBeenCalledWith('/interviews/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getInterviewSessions', () => {
    it('should get list of interview sessions', async () => {
      const mockResponse = {
        items: [
          { id: 1, company_name: '公司1', status: 'ongoing' },
          { id: 2, company_name: '公司2', status: 'completed' },
        ],
        total: 2,
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await getInterviewSessions(0, 10);

      expect(api.get).toHaveBeenCalledWith('/interviews', {
        params: { skip: 0, limit: 10 },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('completeInterviewSession', () => {
    it('should complete interview session', async () => {
      const mockResponse = {
        id: 1,
        status: 'completed',
        end_time: '2024-01-01T00:00:00Z',
      };

      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await completeInterviewSession(1);

      expect(api.put).toHaveBeenCalledWith('/interviews/1/complete');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('abortInterviewSession', () => {
    it('should abort interview session', async () => {
      const mockResponse = {
        id: 1,
        status: 'aborted',
        end_time: '2024-01-01T00:00:00Z',
      };

      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await abortInterviewSession(1);

      expect(api.put).toHaveBeenCalledWith('/interviews/1/abort');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        id: 1,
        session_id: 1,
        role: 'user',
        content: '测试消息',
        round: 'qa',
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await sendMessage(1, {
        role: 'user',
        content: '测试消息',
        round: 'qa',
      });

      expect(api.post).toHaveBeenCalledWith('/interviews/1/messages', {
        role: 'user',
        content: '测试消息',
        round: 'qa',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getInterviewMessages', () => {
    it('should get messages for session', async () => {
      const mockResponse = [
        { id: 1, role: 'assistant', content: '你好' },
        { id: 2, role: 'user', content: '你好' },
      ];

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await getInterviewMessages(1);

      expect(api.get).toHaveBeenCalledWith('/interviews/1/messages');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getEvaluation', () => {
    it('should get evaluation for session', async () => {
      const mockResponse = {
        id: 1,
        session_id: 1,
        overall_score: 85,
        dimension_scores: {
          communication: 85,
          technical_depth: 80,
        },
        summary: '测试总结',
        suggestions: ['建议1'],
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await getEvaluation(1);

      expect(api.get).toHaveBeenCalledWith('/interviews/1/evaluation');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteEvaluation', () => {
    it('should delete evaluation', async () => {
      (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await deleteEvaluation(1);

      expect(api.delete).toHaveBeenCalledWith('/interviews/1/evaluation');
    });
  });
});
