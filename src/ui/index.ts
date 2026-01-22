/**
 * UI exports for hazo_logs
 *
 * Client-side components only. For server-side API handlers, use 'hazo_logs/ui/server'
 */

// Components (client-side only)
export { LogViewerPage } from './components/LogViewerPage.js';
export { LogTable } from './components/LogTable.js';
export { LogTimeline } from './components/LogTimeline.js';
export { LogPagination } from './components/LogPagination.js';
export { LogLevelBadge } from './components/LogLevelBadge.js';

// Client Logger
export { createClientLogger } from './client-logger.js';
export type { ClientLogger, ClientLoggerConfig, ClientLogLevel } from './client-logger.js';

// Client Configuration (global defaults)
export {
  configureClientLogger,
  getClientLoggerConfig,
  isClientLoggerConfigured,
  resetClientLoggerConfig,
} from './client-config.js';
export type { ClientLoggerGlobalConfig } from './client-config.js';

// Types
export type {
  LogViewerPageProps,
  LogTableProps,
  LogTimelineProps,
  LogPaginationProps,
  LogLevelBadgeProps,
  LogApiConfig,
  LogApiHandler,
  AuthCheckFn,
  LogEntryDisplay,
  LogQueryResponse,
  LogDatesResponse,
  LogPackagesResponse,
  LogSource,
} from './types.js';
