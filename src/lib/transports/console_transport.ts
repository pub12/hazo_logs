/**
 * Colored console transport for hazo_logs
 */

import winston from 'winston';
import type { LogLevel } from '../types.js';
import { COLORS } from '../utils/constants.js';

/**
 * Create a Winston console transport with colored output
 */
export function createConsoleTransport(level: LogLevel): winston.transport {
  return new winston.transports.Console({
    level,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf((info) => {
        const { timestamp, level: logLevel, message, package: pkg, filename, line } = info;
        const color = COLORS[logLevel as keyof typeof COLORS] || COLORS.reset;
        const levelUpper = logLevel.toUpperCase().padEnd(5);
        const location = `${filename}:${line}`;

        return `${color}[${timestamp}] [${levelUpper}] [${pkg}] ${message} (${location})${COLORS.reset}`;
      })
    ),
  });
}
