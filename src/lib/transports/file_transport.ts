/**
 * Daily rotating JSON file transport for hazo_logs
 */

import DailyRotateFile from 'winston-daily-rotate-file';
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import type { HazoLogConfig } from '../types.js';

/**
 * Custom format that outputs fields in a logical, readable order
 */
const orderedJsonFormat = winston.format.printf((info) => {
  const ordered: Record<string, unknown> = {
    timestamp: info.timestamp,
    level: info.level,
    package: info.package,
    message: info.message,
    filename: info.filename,
    line: info.line,
    executionId: info.executionId,
  };

  // Add optional context fields if present
  if (info.sessionId) {
    ordered.sessionId = info.sessionId;
  }
  if (info.reference) {
    ordered.reference = info.reference;
  }
  if (info.depth !== undefined) {
    ordered.depth = info.depth;
  }

  // Add data field if present
  if (info.data) {
    ordered.data = info.data;
  }

  return JSON.stringify(ordered);
});

/**
 * Create a Winston daily rotating file transport with JSON format
 */
export function createFileTransport(config: HazoLogConfig): DailyRotateFile {
  // Ensure log directory exists
  const logDir = path.resolve(config.log_directory);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return new DailyRotateFile({
    level: config.log_level,
    dirname: logDir,
    filename: 'hazo-%DATE%.log',
    datePattern: config.date_pattern,
    maxSize: config.max_file_size,
    maxFiles: config.max_files,
    format: winston.format.combine(
      winston.format.timestamp(),
      orderedJsonFormat
    ),
  });
}
