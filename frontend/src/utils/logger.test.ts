import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, createLogger } from './logger'

/**
 * Logger 单元测试
 *
 * Given: 不同日志级别和环境
 * When: 调用日志方法
 * Then: 应该根据级别和环境正确输出
 */
describe('Logger', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleLogSpy: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleInfoSpy: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('日志级别', () => {
    it('debug 方法应该使用 console.log', () => {
      // Given: 开发环境
      // When: 调用 debug
      logger.debug('TestModule', 'Debug message')

      // Then: 应该使用 console.log
      expect(consoleLogSpy).toHaveBeenCalled()
    })

    it('info 方法应该使用 console.info', () => {
      // When: 调用 info
      logger.info('TestModule', 'Info message')

      // Then: 应该使用 console.info
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('warn 方法应该使用 console.warn', () => {
      // When: 调用 warn
      logger.warn('TestModule', 'Warning message')

      // Then: 应该使用 console.warn
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('error 方法应该使用 console.error', () => {
      // When: 调用 error
      logger.error('TestModule', 'Error message')

      // Then: 应该使用 console.error
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('日志格式', () => {
    it('应该包含时间戳、级别和模块名', () => {
      // When: 记录日志
      logger.info('AuthModule', 'Test message')

      // Then: 应该包含正确的格式
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArg: string = consoleInfoSpy.mock.calls[0][0] as string
      expect(callArg).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      expect(callArg).toContain('[INFO]')
      expect(callArg).toContain('[AuthModule]')
    })

    it('应该包含消息内容', () => {
      // When: 记录日志
      logger.info('TestModule', 'Hello World')

      // Then: 应该包含消息
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.any(String),
        'Hello World'
      )
    })

    it('应该包含额外数据', () => {
      // Given: 额外数据
      const data = { userId: 123, action: 'login' }

      // When: 记录带数据的日志
      logger.info('TestModule', 'User action', data)

      // Then: 应该包含数据
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.any(String),
        'User action',
        data
      )
    })
  })

  describe('createLogger', () => {
    it('应该创建模块专用的日志记录器', () => {
      // Given: 创建模块日志记录器
      const authLogger = createLogger('AuthService')

      // When: 使用模块记录器
      authLogger.info('Login successful')

      // Then: 应该包含模块名
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArg: string = consoleInfoSpy.mock.calls[0][0] as string
      expect(callArg).toContain('[AuthService]')
    })

    it('应该支持所有日志级别', () => {
      // Given: 创建模块日志记录器
      const testLogger = createLogger('TestModule')

      // When: 使用各级别方法
      testLogger.debug('Debug')
      testLogger.info('Info')
      testLogger.warn('Warn')
      testLogger.error('Error')

      // Then: 应该调用对应方法
      expect(consoleLogSpy).toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
