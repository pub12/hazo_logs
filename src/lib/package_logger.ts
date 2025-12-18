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
  private coreLogger: HazoLogger;
  private packageName: string;

  constructor(options: PackageLoggerOptions, coreLogger?: HazoLogger) {
    this.packageName = options.packageName;
    this.coreLogger = coreLogger || HazoLogger.getInstance();
  }

  private log(level: LogLevel, message: string, data?: LogData): void {
    const { filename, line } = getCallerInfo();
    const context = getLogContext();

    this.coreLogger.log({
      timestamp: new Date().toISOString(),
      level,
      package: this.packageName,
      message,
      filename,
      line,
      executionId: this.coreLogger.getExecutionId(),
      ...(context?.sessionId ? { sessionId: context.sessionId } : {}),
      ...(context?.reference ? { reference: context.reference } : {}),
      ...(context?.depth ? { depth: context.depth } : {}),
      ...(data ? { data } : {}),
    });
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
