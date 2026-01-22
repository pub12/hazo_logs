'use client';

/**
 * Client-side logger for hazo_logs
 *
 * Sends logs from the browser to the server API to be stored
 * alongside server-side logs. All entries are marked with source: 'client'.
 */

import {
  getClientLoggerConfig,
  isClientLoggerConfigured,
  _markWarningShown,
  _wasWarningShown,
} from './client-config.js';

export type ClientLogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface ClientLoggerConfig {
  /** API endpoint to post logs to (default: '/api/logs') */
  apiBasePath?: string;
  /** Package name to tag logs with */
  packageName?: string;
  /** Session ID for tracking user sessions */
  sessionId?: string;
  /** Reference ID for tracking specific flows */
  reference?: string;
  /** Minimum log level to send (default: 'debug') */
  minLevel?: ClientLogLevel;
  /** Whether to also log to browser console (default: true) */
  consoleOutput?: boolean;
  /** Batch logs and send periodically (default: false) */
  batchMode?: boolean;
  /** Batch interval in ms (default: 5000) */
  batchInterval?: number;
}

interface ClientLogEntry {
  level: ClientLogLevel;
  message: string;
  package: string;
  timestamp: string;
  source: 'client';
  sessionId?: string;
  reference?: string;
  data?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
}

const LOG_LEVEL_PRIORITY: Record<ClientLogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Create a client-side logger instance
 *
 * @example
 * ```tsx
 * 'use client';
 * import { createClientLogger } from 'hazo_logs/ui';
 *
 * const logger = createClientLogger({
 *   packageName: 'my-app',
 *   apiBasePath: '/api/hazo_logs/logs',
 * });
 *
 * logger.info('User clicked button', { buttonId: 'submit' });
 * logger.error('Failed to load data', { error: err.message });
 * ```
 */
export function createClientLogger(config: ClientLoggerConfig = {}) {
  const globalConfig = getClientLoggerConfig();

  const {
    apiBasePath = globalConfig?.apiBasePath ?? '/api/logs',
    packageName = 'client',
    sessionId,
    reference,
    minLevel = globalConfig?.minLevel ?? 'debug',
    consoleOutput = globalConfig?.consoleOutput ?? true,
    batchMode = globalConfig?.batchMode ?? false,
    batchInterval = globalConfig?.batchInterval ?? 5000,
  } = config;

  // Warn once in development if using default without global config
  if (
    !config.apiBasePath &&
    !isClientLoggerConfigured() &&
    !_wasWarningShown() &&
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development'
  ) {
    _markWarningShown();
    console.warn(
      '[HazoLog] Client logger using default /api/logs. ' +
        'Call configureClientLogger({ apiBasePath: "..." }) at app init to set a custom endpoint.'
    );
  }

  let logBatch: ClientLogEntry[] = [];
  let batchTimer: ReturnType<typeof setTimeout> | null = null;

  const shouldLog = (level: ClientLogLevel): boolean => {
    return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[minLevel];
  };

  const sendLogs = async (entries: ClientLogEntry[]): Promise<void> => {
    if (entries.length === 0) return;

    try {
      await fetch(apiBasePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (err) {
      // Silently fail - don't want logging errors to break the app
      if (consoleOutput) {
        console.error('[HazoLog Client] Failed to send logs:', err);
      }
    }
  };

  const flushBatch = async (): Promise<void> => {
    if (logBatch.length > 0) {
      const toSend = [...logBatch];
      logBatch = [];
      await sendLogs(toSend);
    }
  };

  const startBatchTimer = (): void => {
    if (batchMode && !batchTimer) {
      batchTimer = setTimeout(async () => {
        await flushBatch();
        batchTimer = null;
        if (logBatch.length > 0) {
          startBatchTimer();
        }
      }, batchInterval);
    }
  };

  const log = async (
    level: ClientLogLevel,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void> => {
    if (!shouldLog(level)) return;

    // Console output
    if (consoleOutput) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${packageName}] ${message}`, data || '');
    }

    const entry: ClientLogEntry = {
      level,
      message,
      package: packageName,
      timestamp: new Date().toISOString(),
      source: 'client',
      sessionId,
      reference,
      data,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    if (batchMode) {
      logBatch.push(entry);
      startBatchTimer();
    } else {
      await sendLogs([entry]);
    }
  };

  // Setup flush on page unload for batched logs
  if (typeof window !== 'undefined' && batchMode) {
    window.addEventListener('beforeunload', () => {
      if (logBatch.length > 0) {
        // Use sendBeacon for reliable delivery on page unload
        const data = JSON.stringify({ logs: logBatch });
        navigator.sendBeacon(apiBasePath, data);
      }
    });
  }

  return {
    error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
    warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
    info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
    debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),

    /** Manually flush batched logs */
    flush: flushBatch,

    /** Create a child logger with additional context */
    child: (childConfig: Partial<ClientLoggerConfig>) =>
      createClientLogger({
        apiBasePath,
        packageName,
        sessionId,
        reference,
        minLevel,
        consoleOutput,
        batchMode,
        batchInterval,
        ...childConfig,
      }),
  };
}

export type ClientLogger = ReturnType<typeof createClientLogger>;
