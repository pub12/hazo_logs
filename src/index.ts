/**
 * hazo_logs - Winston logger wrapper with singleton pattern
 *
 * Usage:
 *   import { createLogger, runWithLogContext } from 'hazo_logs';
 *
 *   const logger = createLogger('my_package');
 *
 *   // Basic logging
 *   logger.info('Hello world', { key: 'value' });
 *
 *   // With context (session/user tracking)
 *   runWithLogContext({ sessionId: 'sess_123', reference: 'user_42' }, () => {
 *     logger.info('User action'); // automatically includes sessionId and reference
 *   });
 *
 * For UI components (requires Next.js, React, and hazo_ui):
 *   import { LogViewerPage, createLogApiHandler } from 'hazo_logs/ui';
 */

// Core logging
export { HazoLogger } from './lib/hazo_logger.js';
export { PackageLogger, createLogger } from './lib/package_logger.js';
export { loadConfig } from './lib/config_loader.js';

// Log context
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

// Log reader
export {
  readLogs,
  getAvailableLogDates,
  getUniquePackages,
  getUniqueExecutionIds,
  getUniqueSessionIds,
  getUniqueReferences,
} from './lib/log-reader.js';

// Types
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
