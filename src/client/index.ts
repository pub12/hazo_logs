/**
 * hazo_logs/client - Client-safe logging module
 *
 * This module contains ONLY client-safe code with NO imports that could
 * lead to Node.js modules (winston, fs, path, etc.).
 *
 * Used automatically when bundlers resolve 'hazo_logs' for browser targets.
 */

import type { Logger, LogData, LogLevel } from '../lib/types.js';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Console-based logger for client-side use
 * Provides basic logging that outputs to browser console
 */
export class ConsoleLogger implements Logger {
  private packageName: string;
  private minLevel: LogLevel;

  constructor(packageName: string, minLevel: LogLevel = 'debug') {
    this.packageName = packageName;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.packageName}] ${message}`;
  }

  error(message: string, data?: LogData): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), data ?? '');
    }
  }

  warn(message: string, data?: LogData): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), data ?? '');
    }
  }

  info(message: string, data?: LogData): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), data ?? '');
    }
  }

  debug(message: string, data?: LogData): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), data ?? '');
    }
  }
}

/**
 * Create a client-side logger that outputs to browser console
 *
 * @param packageName - Name of the package (e.g., "hazo_auth", "my_app")
 * @returns Logger instance that logs to console
 *
 * @example
 * ```typescript
 * import { createLogger } from 'hazo_logs';
 *
 * const logger = createLogger('my_app');
 * logger.info('Application started');
 * ```
 *
 * Note: For full server capabilities (file logging, context), use:
 * ```typescript
 * import { createLogger } from 'hazo_logs/server';
 * ```
 */
export function createLogger(packageName: string): Logger {
  return new ConsoleLogger(packageName);
}

/**
 * Async version - same as createLogger on client
 * Provided for API compatibility with server version
 */
export async function createLoggerAsync(packageName: string): Promise<Logger> {
  return new ConsoleLogger(packageName);
}

/**
 * No-op on client - server preloading not applicable
 */
export async function preloadServerLogger(): Promise<void> {
  // No-op on client
}

// Re-export types (these are stripped at build time, so always safe)
export type {
  Logger,
  LogLevel,
  LogData,
  LogEntry,
  LogContext,
  HazoLogConfig,
  PackageLoggerOptions,
  LogSource,
} from '../lib/types.js';
