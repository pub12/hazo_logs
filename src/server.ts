/**
 * hazo_logs/server - Server-only logging module
 *
 * ⚠️ SERVER-ONLY: This module uses Node.js APIs (fs, async_hooks) and CANNOT be
 * imported in client components. Import will fail in browser bundles.
 *
 * Usage:
 *   import { createLogger, runWithLogContext } from 'hazo_logs/server';
 *
 *   const logger = createLogger('my_package');
 *   logger.info('Hello world', { key: 'value' });
 *
 * For client-side logging, use:
 *   import { createClientLogger } from 'hazo_logs/ui';
 */

import 'server-only';

// Core logging
export { HazoLogger } from './lib/hazo_logger.js';
export { PackageLogger, createLogger } from './lib/package_logger.js';
export { loadConfig } from './lib/config_loader.js';

// Log context (uses AsyncLocalStorage)
export {
  generateSessionId,
  startSession,
  startSessionAsync,
  runWithLogContext,
  runWithLogContextAsync,
  getLogContext,
  withSession,
  withContext,
} from './lib/context/log-context.js';

// Log reader (uses fs, readline)
export {
  readLogs,
  getAvailableLogDates,
  getUniquePackages,
  getUniqueExecutionIds,
  getUniqueSessionIds,
  getUniqueReferences,
} from './lib/log-reader.js';

// Types (re-export for convenience)
export type {
  Logger,
  LogLevel,
  LogData,
  LogEntry,
  LogContext,
  HazoLogConfig,
  PackageLoggerOptions,
} from './lib/types.js';

export type { ReadLogsOptions, LogQueryResult } from './lib/log-reader.js';
