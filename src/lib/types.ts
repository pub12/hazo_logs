/**
 * Type definitions for hazo_logs
 */

/**
 * Log levels supported by hazo_logs
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Additional data that can be attached to log entries
 */
export type LogData = Record<string, unknown>;

/**
 * Log source - where the log originated from
 */
export type LogSource = 'server' | 'client';

/**
 * Log entry structure written to JSON files
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  package: string;
  message: string;
  filename: string;
  line: number;
  executionId: string;
  sessionId?: string;
  reference?: string;
  depth?: number;
  data?: LogData;
  /** Source of the log entry (server or client) */
  source?: LogSource;
}

/**
 * Logger interface - the public API for logging
 */
export interface Logger {
  error(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  debug(message: string, data?: LogData): void;
}

/**
 * Configuration options loaded from hazo_logs_config.ini
 */
export interface HazoLogConfig {
  log_directory: string;
  log_level: LogLevel;
  enable_console: boolean;
  enable_file: boolean;
  max_file_size: string;
  max_files: string;
  date_pattern: string;
  // Log Viewer UI Settings
  enable_log_viewer: boolean;
  log_viewer_page_size: number;
  log_viewer_max_results: number;
}

/**
 * Options for creating a package logger
 */
export interface PackageLoggerOptions {
  packageName: string;
}

/**
 * Log context for session and reference tracking
 */
export interface LogContext {
  sessionId?: string;
  reference?: string;
  depth?: number;
}
