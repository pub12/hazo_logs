/**
 * Default configuration values for hazo_logs
 */

import type { HazoLogConfig } from '../types.js';

export const DEFAULT_CONFIG: HazoLogConfig = {
  log_directory: './logs',
  log_level: 'info',
  enable_console: true,
  enable_file: true,
  max_file_size: '20m',
  max_files: '14d',
  date_pattern: 'YYYY-MM-DD',
  // Log Viewer UI defaults
  enable_log_viewer: true,
  log_viewer_page_size: 50,
  log_viewer_max_results: 1000,
};

/**
 * Console color codes for different log levels
 */
export const COLORS = {
  error: '\x1b[31m',   // Red
  warn: '\x1b[33m',    // Yellow
  info: '\x1b[36m',    // Cyan
  debug: '\x1b[90m',   // Gray
  reset: '\x1b[0m',
} as const;
