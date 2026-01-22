'use client';

/**
 * Global configuration for client-side loggers
 *
 * Allows consuming applications to set default configuration once,
 * which is then inherited by all client loggers (including those
 * created by dependency packages).
 *
 * @example
 * ```tsx
 * // app/providers.tsx or lib/hazo-init.ts
 * 'use client';
 * import { configureClientLogger } from 'hazo_logs/ui';
 *
 * configureClientLogger({
 *   apiBasePath: '/api/hazo_logs/logs',
 * });
 * ```
 */

import type { ClientLogLevel } from './client-logger.js';

export interface ClientLoggerGlobalConfig {
  /** API endpoint to post logs to (required) */
  apiBasePath: string;
  /** Minimum log level to send */
  minLevel?: ClientLogLevel;
  /** Whether to also log to browser console */
  consoleOutput?: boolean;
  /** Batch logs and send periodically */
  batchMode?: boolean;
  /** Batch interval in ms */
  batchInterval?: number;
}

let globalConfig: ClientLoggerGlobalConfig | undefined = undefined;
let configWarningShown = false;

/**
 * Configure global defaults for all client loggers.
 * Call this once at app initialization (e.g., in layout.tsx or providers.tsx).
 *
 * @param config - Global configuration options (apiBasePath is required)
 * @throws Error if apiBasePath is not provided
 *
 * @example
 * ```tsx
 * configureClientLogger({
 *   apiBasePath: '/api/hazo_logs/logs',
 *   minLevel: 'info',
 * });
 * ```
 */
export function configureClientLogger(config: ClientLoggerGlobalConfig): void {
  if (!config.apiBasePath) {
    throw new Error('[HazoLog] configureClientLogger requires apiBasePath');
  }
  globalConfig = { ...config };
}

/**
 * Get the current global client logger configuration.
 * Returns undefined if not configured.
 */
export function getClientLoggerConfig(): ClientLoggerGlobalConfig | undefined {
  return globalConfig ? { ...globalConfig } : undefined;
}

/**
 * Check if client logger has been globally configured.
 */
export function isClientLoggerConfigured(): boolean {
  return globalConfig !== undefined;
}

/**
 * Reset global configuration (primarily for testing).
 */
export function resetClientLoggerConfig(): void {
  globalConfig = undefined;
  configWarningShown = false;
}

/** @internal Mark that the configuration warning has been shown */
export function _markWarningShown(): void {
  configWarningShown = true;
}

/** @internal Check if the configuration warning has been shown */
export function _wasWarningShown(): boolean {
  return configWarningShown;
}
