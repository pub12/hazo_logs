/**
 * Core singleton logger for hazo_logs
 * Manages the Winston logger instance and transports
 */

import winston from 'winston';
import type { HazoLogConfig, LogEntry } from './types.js';
import { loadConfig } from './config_loader.js';
import { createConsoleTransport } from './transports/console_transport.js';
import { createFileTransport } from './transports/file_transport.js';

export class HazoLogger {
  private static instance: HazoLogger | null = null;
  private winstonLogger: winston.Logger;
  private config: HazoLogConfig;
  private executionId: string;

  private constructor(configPath?: string) {
    this.executionId = this.generateExecutionId();
    this.config = loadConfig(configPath);
    this.winstonLogger = this.createWinstonLogger();
  }

  /**
   * Generate a human-readable execution ID
   * Format: 2025-12-17-14:30:45-1234 (date-time-4digit)
   */
  private generateExecutionId(): string {
    const now = new Date();
    const datePart = now.toISOString().split('T')[0]; // 2025-12-17
    const timePart = now.toTimeString().split(' ')[0]; // 14:30:45
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit: 1000-9999
    return `${datePart}-${timePart}-${randomPart}`;
  }

  /**
   * Get the singleton instance of HazoLogger
   * @param configPath - Optional path to config file (only used on first call)
   */
  public static getInstance(configPath?: string): HazoLogger {
    if (!HazoLogger.instance) {
      HazoLogger.instance = new HazoLogger(configPath);
    }
    return HazoLogger.instance;
  }

  /**
   * Reset the singleton instance (primarily for testing)
   */
  public static reset(): void {
    if (HazoLogger.instance) {
      HazoLogger.instance.winstonLogger.close();
      HazoLogger.instance = null;
    }
  }

  /**
   * Log an entry - called by PackageLogger
   */
  public log(entry: LogEntry): void {
    const { level, message, ...meta } = entry;
    this.winstonLogger.log(level, message, meta);
  }

  /**
   * Get current configuration
   */
  public getConfig(): HazoLogConfig {
    return { ...this.config };
  }

  /**
   * Get the execution ID (unique per server start)
   */
  public getExecutionId(): string {
    return this.executionId;
  }

  private createWinstonLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    if (this.config.enable_console) {
      transports.push(createConsoleTransport(this.config.log_level));
    }

    if (this.config.enable_file) {
      transports.push(createFileTransport(this.config));
    }

    return winston.createLogger({
      level: this.config.log_level,
      transports,
    });
  }
}
