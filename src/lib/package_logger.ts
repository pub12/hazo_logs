/**
 * Package-specific logger implementation
 * Creates loggers that tag all entries with a package name
 */

import { HazoLogger } from './hazo_logger.js';
import type { Logger, LogData, LogLevel, PackageLoggerOptions } from './types.js';
import { getCallerInfo } from './utils/caller_info.js';
import { getLogContext } from './context/log-context.js';

/**
 * Logger implementation for a specific package
 * Tags all log entries with the package name and captures caller info
 */
export class PackageLogger implements Logger {
  private coreLogger: HazoLogger | null = null;
  private coreLoggerPromise: Promise<HazoLogger> | null = null;
  private packageName: string;

  constructor(options: PackageLoggerOptions, coreLogger?: HazoLogger) {
    this.packageName = options.packageName;
    if (coreLogger) {
      this.coreLogger = coreLogger;
    } else {
      // Start async loading of the core logger
      this.coreLoggerPromise = HazoLogger.getInstanceAsync().then((logger) => {
        this.coreLogger = logger;
        return logger;
      });
    }
  }

  /**
   * Get the core logger, waiting if necessary
   */
  private async getCoreLogger(): Promise<HazoLogger> {
    if (this.coreLogger) return this.coreLogger;
    if (this.coreLoggerPromise) {
      return this.coreLoggerPromise;
    }
    throw new Error('[hazo_logs] Core logger not initialized');
  }

  private log(level: LogLevel, message: string, data?: LogData): void {
    const { filename, line } = getCallerInfo();
    const context = getLogContext();

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      package: this.packageName,
      message,
      filename,
      line,
      executionId: '', // Will be set when core logger is available
      ...(context?.sessionId ? { sessionId: context.sessionId } : {}),
      ...(context?.reference ? { reference: context.reference } : {}),
      ...(context?.depth ? { depth: context.depth } : {}),
      ...(data ? { data } : {}),
    };

    if (this.coreLogger) {
      // Core logger is ready, log immediately
      logEntry.executionId = this.coreLogger.getExecutionId();
      this.coreLogger.log(logEntry);
    } else {
      // Core logger is still initializing, queue the log
      this.getCoreLogger().then((logger) => {
        logEntry.executionId = logger.getExecutionId();
        logger.log(logEntry);
      }).catch(() => {
        // Fallback to console if core logger fails to initialize
        console.error(`[${this.packageName}] ${message}`, data);
      });
    }
  }

  error(message: string, data?: LogData): void {
    this.log('error', message, data);
  }

  warn(message: string, data?: LogData): void {
    this.log('warn', message, data);
  }

  info(message: string, data?: LogData): void {
    this.log('info', message, data);
  }

  debug(message: string, data?: LogData): void {
    this.log('debug', message, data);
  }
}

/**
 * Factory function to create a package-specific logger
 * @param packageName - Name of the package (e.g., "hazo_auth", "hazo_notify")
 * @returns Logger instance for the specified package
 */
export function createLogger(packageName: string): Logger {
  return new PackageLogger({ packageName });
}
