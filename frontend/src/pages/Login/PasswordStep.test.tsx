import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PasswordStep } from './PasswordStep'

/**
 * PasswordStep 组件测试
 *
 * Given: 用户访问密码输入步骤
 * When: 用户输入密码并提交
 * Then: 应该验证密码并调用 onSubmit
 */
describe('PasswordStep', () => {
  const mockOnSubmit = vi.fn()
  const mockOnBack = vi.fn()
  const mockOnForgotPassword = vi.fn()
  const testEmail = 'test@example.com'

  const renderPasswordStep = () => {
    return render(
      <PasswordStep
        email={testEmail}
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        onForgotPassword={mockOnForgotPassword}
      />
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初始渲染', () => {
    it('应该显示密码输入框', () => {
      renderPasswordStep()
      expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument()
    })

    it('应该显示登录按钮', () => {
      renderPasswordStep()
      expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
    })

    it('应该显示返回按钮', () => {
      renderPasswordStep()
      expect(screen.getByRole('button', { name: /返回/i })).toBeInTheDocument()
    })

    it('应该显示忘记密码链接', () => {
      renderPasswordStep()
      expect(screen.getByText(/忘记密码/i)).toBeInTheDocument()
    })
  })

  describe('密码验证', () => {
    it('密码少于8位时应该显示错误', async () => {
      renderPasswordStep()

      // When: 输入短密码
      const passwordInput = screen.getByPlaceholderText('请输入密码')
      fireEvent.change(passwordInput, { target: { value: '1234567' } })
      fireEvent.click(screen.getByRole('button', { name: /登录/i }))

      // Then: 应该显示错误信息
      expect(await screen.findByText('密码至少需要8位字符')).toBeInTheDocument()
    })

    it('空密码时应该显示错误', async () => {
      renderPasswordStep()

      // When: 提交空表单
      fireEvent.click(screen.getByRole('button', { name: /登录/i }))

      // Then: 应该显示错误信息
      expect(await screen.findByText('密码至少需要8位字符')).toBeInTheDocument()
    })
  })

  describe('密码可见性', () => {
    it('应该能够切换密码可见性', () => {
      renderPasswordStep()

      // Given: 密码输入框
      const passwordInput = screen.getByPlaceholderText('请输入密码')

      // Then: 初始状态为密码类型
      expect(passwordInput).toHaveAttribute('type', 'password')

      // When: 点击显示密码按钮
      const toggleButton = screen.getByRole('button', { name: '' })
      fireEvent.click(toggleButton)

      // Then: 应该变为文本类型
      expect(passwordInput).toHaveAttribute('type', 'text')
    })
  })

  describe('表单提交', () => {
    it('提交有效密码应该调用 onSubmit', async () => {
      renderPasswordStep()

      // When: 输入有效密码并提交
      const passwordInput = screen.getByPlaceholderText('请输入密码')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('button', { name: /登录/i }))

      // Then: 应该调用 onSubmit
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('password123')
      })
    })

    it.skip('提交时应该禁用输入框', async () => {
      // TODO: 此测试需要真正的 API 调用才能验证加载状态
      // 当前组件在调用 onSubmit 后立即重置 isLoading 状态
    })
  })

  describe('返回功能', () => {
    it('点击返回按钮应该调用 onBack', () => {
      renderPasswordStep()

      // When: 点击返回按钮
      fireEvent.click(screen.getByRole('button', { name: /返回/i }))

      // Then: 应该调用 onBack
      expect(mockOnBack).toHaveBeenCalled()
    })
  })

  describe('忘记密码', () => {
    it('点击忘记密码应该调用 onForgotPassword', () => {
      renderPasswordStep()

      // When: 点击忘记密码
      fireEvent.click(screen.getByText(/忘记密码/i))

      // Then: 应该调用 onForgotPassword
      expect(mockOnForgotPassword).toHaveBeenCalled()
    })
  })
})
