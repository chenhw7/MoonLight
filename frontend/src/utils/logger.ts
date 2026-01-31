/**
 * 前端日志工具
 *
 * 提供统一的日志记录功能，支持不同级别和模块分类
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// 生产环境只记录 WARN 及以上
const CURRENT_LOG_LEVEL: LogLevel =
  import.meta.env.PROD ? 'WARN' : 'DEBUG';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LOG_LEVEL];
  }

  private formatMessage(
    level: LogLevel,
    module: string,
    message: string,
    data?: Record<string, unknown>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    };
  }

  private log(
    level: LogLevel,
    module: string,
    message: string,
    data?: Record<string, unknown>
  ) {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, module, message, data);

    const consoleMethod =
      level === 'ERROR'
        ? console.error
        : level === 'WARN'
        ? console.warn
        : level === 'INFO'
        ? console.info
        : console.log;

    const logPrefix = `[${entry.timestamp}] [${level}] [${module}]`;

    if (data) {
      consoleMethod(logPrefix, message, data);
    } else {
      consoleMethod(logPrefix, message);
    }

    // TODO: 发送到日志服务器
    // this.sendToServer(entry);
  }

  /**
   * 调试日志
   * 仅在开发环境输出
   */
  debug(module: string, message: string, data?: Record<string, unknown>) {
    this.log('DEBUG', module, message, data);
  }

  /**
   * 信息日志
   * 记录一般性信息
   */
  info(module: string, message: string, data?: Record<string, unknown>) {
    this.log('INFO', module, message, data);
  }

  /**
   * 警告日志
   * 记录潜在问题
   */
  warn(module: string, message: string, data?: Record<string, unknown>) {
    this.log('WARN', module, message, data);
  }

  /**
   * 错误日志
   * 记录错误信息
   */
  error(module: string, message: string, data?: Record<string, unknown>) {
    this.log('ERROR', module, message, data);
  }
}

// 单例实例
export const logger = new Logger();

/**
 * 创建模块专用的日志记录器
 *
 * @param module - 模块名称
 * @returns 模块日志记录器
 *
 * @example
 * ```typescript
 * const log = createLogger('AuthService');
 * log.info('用户登录成功', { userId: 123 });
 * ```
 */
export const createLogger = (module: string) => ({
  debug: (message: string, data?: Record<string, unknown>) =>
    logger.debug(module, message, data),
  info: (message: string, data?: Record<string, unknown>) =>
    logger.info(module, message, data),
  warn: (message: string, data?: Record<string, unknown>) =>
    logger.warn(module, message, data),
  error: (message: string, data?: Record<string, unknown>) =>
    logger.error(module, message, data),
});

export default logger;
