/**
 * Universal Logger - Works on both server and client
 *
 * On server: Uses the full PackageLogger with file transports
 * On client: Uses console-based logging (logs are not persisted)
 *
 * For full server logging capabilities, import from 'hazo_logs/server'
 * For client logging that posts to server API, use 'hazo_logs/ui' createClientLogger
 */

import type { Logger, LogData, LogLevel } from './types.js';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Check if we're running on the server
 */
function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Console-based logger for client-side use
 * Provides basic logging that outputs to browser console
 */
class ConsoleLogger implements Logger {
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
 * Deferred logger that upgrades from ConsoleLogger to real server logger
 * when the server module is loaded asynchronously
 */
class DeferredServerLogger implements Logger {
  private packageName: string;
  private innerLogger: Logger;
  private upgraded = false;

  constructor(packageName: string) {
    this.packageName = packageName;
    this.innerLogger = new ConsoleLogger(packageName);

    // Attempt async upgrade to real server logger
    this.upgrade();
  }

  private async upgrade(): Promise<void> {
    if (this.upgraded) return;
    try {
      const { createLogger } = await import('./package_logger.js');
      this.innerLogger = createLogger(this.packageName);
      this.upgraded = true;
    } catch {
      // Keep using ConsoleLogger
    }
  }

  error(message: string, data?: LogData): void {
    this.innerLogger.error(message, data);
  }

  warn(message: string, data?: LogData): void {
    this.innerLogger.warn(message, data);
  }

  info(message: string, data?: LogData): void {
    this.innerLogger.info(message, data);
  }

  debug(message: string, data?: LogData): void {
    this.innerLogger.debug(message, data);
  }
}

// Cache for pre-loaded server loggers
const serverLoggerCache = new Map<string, Logger>();
let serverModuleLoaded = false;
let serverModulePromise: Promise<{ createLogger: (name: string) => Logger }> | null = null;

/**
 * Pre-load the server logger module (call this early in server startup)
 * This allows createLogger to return a real server logger synchronously
 */
export async function preloadServerLogger(): Promise<void> {
  if (!isServer() || serverModuleLoaded) return;

  try {
    if (!serverModulePromise) {
      serverModulePromise = import('./package_logger.js');
    }
    await serverModulePromise;
    serverModuleLoaded = true;
  } catch {
    // Silently fail
  }
}

/**
 * Create a universal logger that works on both server and client
 *
 * On server: Returns PackageLogger (may start as ConsoleLogger and upgrade)
 * On client: Returns ConsoleLogger that outputs to browser console
 *
 * @param packageName - Name of the package (e.g., "hazo_auth", "my_app")
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * import { createLogger } from 'hazo_logs';
 *
 * const logger = createLogger('my_app');
 * logger.info('Application started');
 * ```
 *
 * Note: For full server capabilities (context, sessions), use:
 * ```typescript
 * import { createLogger } from 'hazo_logs/server';
 * ```
 *
 * For client logging that persists to server, use:
 * ```typescript
 * import { createClientLogger } from 'hazo_logs/ui';
 * ```
 */
export function createLogger(packageName: string): Logger {
  if (!isServer()) {
    // Client-side: return console logger
    return new ConsoleLogger(packageName);
  }

  // Check cache first
  const cached = serverLoggerCache.get(packageName);
  if (cached) {
    return cached;
  }

  // Server-side: create deferred logger that upgrades asynchronously
  const logger = new DeferredServerLogger(packageName);
  serverLoggerCache.set(packageName, logger);
  return logger;
}

/**
 * Async version of createLogger - returns real server logger immediately
 *
 * @param packageName - Name of the package
 * @returns Promise<Logger>
 */
export async function createLoggerAsync(packageName: string): Promise<Logger> {
  if (!isServer()) {
    return new ConsoleLogger(packageName);
  }

  try {
    if (!serverModulePromise) {
      serverModulePromise = import('./package_logger.js');
    }
    const { createLogger } = await serverModulePromise;
    serverModuleLoaded = true;

    const logger = createLogger(packageName);
    serverLoggerCache.set(packageName, logger);
    return logger;
  } catch {
    console.warn(
      `[hazo_logs] Failed to load server logger, falling back to console logger for ${packageName}`
    );
    return new ConsoleLogger(packageName);
  }
}

// Export ConsoleLogger for direct use if needed
export { ConsoleLogger };
