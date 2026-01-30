/**
 * 前端日志工具
 *
 * 日志级别: DEBUG < INFO < WARN < ERROR
 * 生产环境只记录 WARN 及以上级别
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

  private log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>) {
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

    consoleMethod(
      `[${entry.timestamp}] [${level}] [${module}] ${message}`,
      data ? data : ''
    );

    // TODO: 发送到日志服务器
  }

  debug(module: string, message: string, data?: Record<string, unknown>) {
    this.log('DEBUG', module, message, data);
  }

  info(module: string, message: string, data?: Record<string, unknown>) {
    this.log('INFO', module, message, data);
  }

  warn(module: string, message: string, data?: Record<string, unknown>) {
    this.log('WARN', module, message, data);
  }

  error(module: string, message: string, data?: Record<string, unknown>) {
    this.log('ERROR', module, message, data);
  }
}

export const logger = new Logger();

// 便捷导出
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
