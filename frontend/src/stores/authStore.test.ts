import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import type { User } from '@/types/auth'

/**
 * AuthStore 单元测试
 *
 * Given: 不同的认证状态
 * When: 调用 store 方法
 * Then: 应该正确更新状态
 */
describe('AuthStore', () => {
  // 重置 store 状态
  beforeEach(() => {
    const store = useAuthStore.getState()
    store.clearAuth()
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('初始状态应该是未认证', () => {
      // Given: 获取 store 状态
      const state = useAuthStore.getState()

      // Then: 应该未认证
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
    })
  })

  describe('setAuth', () => {
    it('应该设置认证信息和用户', () => {
      // Given: 模拟用户数据
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        createdAt: '2024-01-01T00:00:00Z',
      }
      const accessToken = 'fake-access-token'
      const refreshToken = 'fake-refresh-token'

      // When: 设置认证
      useAuthStore.getState().setAuth(mockUser, accessToken, refreshToken)

      // Then: 状态应该更新
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(mockUser)
      expect(state.accessToken).toBe(accessToken)
      expect(state.refreshToken).toBe(refreshToken)
    })

    it('应该保存 token 到 localStorage', () => {
      // Given: 用户数据
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        createdAt: '2024-01-01T00:00:00Z',
      }

      // When: 设置认证
      useAuthStore.getState().setAuth(mockUser, 'token1', 'token2')

      // Then: 应该保存到 localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'token1')
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'token2')
    })
  })

  describe('clearAuth', () => {
    it('应该清除所有认证信息', () => {
      // Given: 先设置认证
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        createdAt: '2024-01-01T00:00:00Z',
      }
      useAuthStore.getState().setAuth(mockUser, 'token1', 'token2')

      // When: 清除认证
      useAuthStore.getState().clearAuth()

      // Then: 状态应该重置
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
    })

    it('应该从 localStorage 移除 token', () => {
      // Given: 先设置认证
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        createdAt: '2024-01-01T00:00:00Z',
      }
      useAuthStore.getState().setAuth(mockUser, 'token1', 'token2')

      // When: 清除认证
      useAuthStore.getState().clearAuth()

      // Then: 应该从 localStorage 移除
      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token')
    })
  })

  describe('updateUser', () => {
    it('应该更新用户信息', () => {
      // Given: 先设置认证
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'oldname',
        createdAt: '2024-01-01T00:00:00Z',
      }
      useAuthStore.getState().setAuth(mockUser, 'token1', 'token2')

      // When: 更新用户名
      useAuthStore.getState().updateUser({ username: 'newname' })

      // Then: 用户名应该更新
      const state = useAuthStore.getState()
      expect(state.user?.username).toBe('newname')
      expect(state.user?.email).toBe('test@example.com') // 其他字段不变
    })

    it('未登录时不应该更新', () => {
      // Given: 未登录状态
      const prevState = useAuthStore.getState()

      // When: 尝试更新
      useAuthStore.getState().updateUser({ username: 'newname' })

      // Then: 状态应该不变
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state).toEqual(prevState)
    })
  })

  describe('setAccessToken', () => {
    it('应该更新访问令牌', () => {
      // Given: 先设置认证
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        createdAt: '2024-01-01T00:00:00Z',
      }
      useAuthStore.getState().setAuth(mockUser, 'old-token', 'refresh-token')

      // When: 更新 access token
      useAuthStore.getState().setAccessToken('new-token')

      // Then: token 应该更新
      const state = useAuthStore.getState()
      expect(state.accessToken).toBe('new-token')
      expect(state.refreshToken).toBe('refresh-token') // refresh token 不变
    })

    it('应该保存新 token 到 localStorage', () => {
      // When: 设置 access token
      useAuthStore.getState().setAccessToken('new-token')

      // Then: 应该保存到 localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'new-token')
    })
  })
})
