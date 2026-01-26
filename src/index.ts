/**
 * hazo_logs - Universal logging library for hazo packages
 *
 * This root export is SAFE for both server and client environments.
 *
 * ## Quick Start
 *
 * ```typescript
 * import { createLogger } from 'hazo_logs';
 *
 * const logger = createLogger('my_app');
 * logger.info('Application started');
 * ```
 *
 * ## Environment-Specific Imports
 *
 * ### Server-Only (full capabilities)
 * For file logging, AsyncLocalStorage context, log reading:
 * ```typescript
 * import { createLogger, runWithLogContext, readLogs } from 'hazo_logs/server';
 * ```
 *
 * ### Client Components (sends logs to server API)
 * For logging that persists to server:
 * ```typescript
 * import { createClientLogger } from 'hazo_logs/ui';
 * ```
 *
 * ### UI Components (log viewer)
 * ```typescript
 * import { LogViewerPage } from 'hazo_logs/ui';
 * import { createLogApiHandler } from 'hazo_logs/ui/server';
 * ```
 */

// Universal logger - works on both server and client
export {
  createLogger,
  createLoggerAsync,
  preloadServerLogger,
  ConsoleLogger,
} from './lib/universal-logger.js';

// Types - always safe to export (stripped at build time)
export type {
  Logger,
  LogLevel,
  LogData,
  LogEntry,
  LogContext,
  HazoLogConfig,
  PackageLoggerOptions,
  LogSource,
} from './lib/types.js';
