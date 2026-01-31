import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterStep } from './RegisterStep';

/**
 * RegisterStep 组件测试
 *
 * Given: 用户访问注册步骤
 * When: 用户输入用户名和密码
 * Then: 应该验证输入并调用 onSubmit
 */
describe('RegisterStep', () => {
  const mockOnSubmit = vi.fn();
  const testEmail = 'test@example.com';

  const renderRegisterStep = () => {
    return render(<RegisterStep email={testEmail} onSubmit={mockOnSubmit} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始渲染', () => {
    it('应该显示用户名输入框', () => {
      renderRegisterStep();
      expect(screen.getByPlaceholderText('设置用户名')).toBeInTheDocument();
    });

    it('应该显示密码输入框', () => {
      renderRegisterStep();
      expect(screen.getByPlaceholderText('设置密码')).toBeInTheDocument();
    });

    it('应该显示确认密码输入框', () => {
      renderRegisterStep();
      expect(screen.getByPlaceholderText('再次输入密码')).toBeInTheDocument();
    });

    it('应该显示创建账户按钮', () => {
      renderRegisterStep();
      expect(
        screen.getByRole('button', { name: /创建账户/i })
      ).toBeInTheDocument();
    });
  });

  describe('用户名验证', () => {
    it('用户名以数字开头时应该显示错误', async () => {
      renderRegisterStep();

      // When: 输入以数字开头的用户名
      fireEvent.change(screen.getByPlaceholderText('设置用户名'), {
        target: { value: '123user' },
      });
      fireEvent.click(screen.getByRole('button', { name: /创建账户/i }));

      // Then: 应该显示错误
      expect(
        await screen.findByText(/用户名必须以字母开头/i)
      ).toBeInTheDocument();
    });

    it('用户名包含特殊字符时应该显示错误', async () => {
      renderRegisterStep();

      // When: 输入包含特殊字符的用户名
      fireEvent.change(screen.getByPlaceholderText('设置用户名'), {
        target: { value: 'user@name' },
      });
      fireEvent.click(screen.getByRole('button', { name: /创建账户/i }));

      // Then: 应该显示错误
      expect(
        await screen.findByText(/只能包含字母、数字和下划线/i)
      ).toBeInTheDocument();
    });

    it('用户名过短时应该显示错误', async () => {
      renderRegisterStep();

      // When: 输入过短的用户名
      fireEvent.change(screen.getByPlaceholderText('设置用户名'), {
        target: { value: 'ab' },
      });
      fireEvent.click(screen.getByRole('button', { name: /创建账户/i }));

      // Then: 应该显示错误
      expect(await screen.findByText(/长度3-20位/i)).toBeInTheDocument();
    });

    it('有效用户名不应该显示错误', async () => {
      renderRegisterStep();

      // When: 输入有效用户名
      fireEvent.change(screen.getByPlaceholderText('设置用户名'), {
        target: { value: 'validUser' },
      });

      // Then: 不应该有错误
      await waitFor(() => {
        expect(
          screen.queryByText(/用户名必须以字母开头/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('密码验证', () => {
    it('密码少于8位时应该显示错误', async () => {
      renderRegisterStep();

      // Given: 输入用户名
      fireEvent.change(screen.getByPlaceholderText('设置用户名'), {
        target: { value: 'testuser' },
      });

      // When: 输入短密码
      fireEvent.change(screen.getByPlaceholderText('设置密码'), {
        target: { value: '1234567' },
      });
      fireEvent.click(screen.getByRole('button', { name: /创建账户/i }));

      // Then: 应该显示错误
      expect(
        await screen.findByText('密码长度必须为8-32位')
      ).toBeInTheDocument();
    });

    it('应该显示密码强度指示器', () => {
      renderRegisterStep();

      // When: 输入密码
      fireEvent.change(screen.getByPlaceholderText('设置密码'), {
        target: { value: 'password123' },
      });

      // Then: 应该显示密码强度
      expect(screen.getByText(/密码强度/i)).toBeInTheDocument();
    });
  });

  describe('确认密码', () => {
    it('密码不匹配时应该显示错误', async () => {
      renderRegisterStep();

      // Given: 输入用户名和不同密码
      fireEvent.change(screen.getByPlaceholderText('设置用户名'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByPlaceholderText('设置密码'), {
        target: { value: 'password123' },
      });

      // When: 输入不匹配的确认密码
      fireEvent.change(screen.getByPlaceholderText('再次输入密码'), {
        target: { value: 'password456' },
      });
      fireEvent.click(screen.getByRole('button', { name: /创建账户/i }));

      // Then: 应该显示错误
      expect(
        await screen.findByText('两次输入的密码不一致')
      ).toBeInTheDocument();
    });

    it('密码匹配时应该显示成功提示', () => {
      renderRegisterStep();

      // When: 输入匹配的密码
      fireEvent.change(screen.getByPlaceholderText('设置密码'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText('再次输入密码'), {
        target: { value: 'password123' },
      });

      // Then: 应该显示匹配提示
      expect(screen.getByText('密码匹配')).toBeInTheDocument();
    });
  });

  describe('密码可见性', () => {
    it('应该能够切换密码可见性', () => {
      renderRegisterStep();

      // Given: 密码输入框
      const passwordInput = screen.getByPlaceholderText('设置密码');

      // Then: 初始状态为密码类型
      expect(passwordInput).toHaveAttribute('type', 'password');

      // When: 点击显示密码按钮
      const toggleButtons = screen.getAllByRole('button', { name: '' });
      fireEvent.click(toggleButtons[0]);

      // Then: 应该变为文本类型
      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('表单提交', () => {
    it('提交有效信息应该调用 onSubmit', async () => {
      renderRegisterStep();

      // When: 输入有效信息并提交
      fireEvent.change(screen.getByPlaceholderText('设置用户名'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByPlaceholderText('设置密码'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText('再次输入密码'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /创建账户/i }));

      // Then: 应该调用 onSubmit
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('testuser', 'password123');
      });
    });

    it.skip('提交时应该禁用输入框', async () => {
      // TODO: 此测试需要真正的 API 调用才能验证加载状态
      // 当前组件在调用 onSubmit 后立即重置 isLoading 状态
    });
  });
});
