/**
 * Core singleton logger for hazo_logs
 * Manages the Winston logger instance and transports
 *
 * This module is server-only. All imports are lazy-loaded to prevent
 * bundlers from including server-only dependencies in client bundles.
 */

import type { HazoLogConfig, LogEntry, LogLevel } from './types.js';

// Lazy-loaded dependencies (populated on first getInstance call)
let winston: typeof import('winston') | null = null;
let loadConfigFn: ((configPath?: string) => HazoLogConfig) | null = null;
let createConsoleTransportFn: ((level: LogLevel) => import('winston').transport) | null = null;
let createFileTransportFn: ((config: HazoLogConfig) => import('winston').transport) | null = null;
let dependenciesLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load server-only dependencies asynchronously
 * Uses dynamic import to avoid static analysis by bundlers
 */
async function loadDependencies(): Promise<void> {
  if (dependenciesLoaded) return;
  if (loadPromise) return loadPromise;

  // Only load on server
  if (typeof window !== 'undefined') {
    throw new Error('[hazo_logs] HazoLogger cannot be used on the client. Use createLogger from hazo_logs (universal) or createClientLogger from hazo_logs/ui instead.');
  }

  loadPromise = (async () => {
    const [winstonMod, configMod, consoleMod, fileMod] = await Promise.all([
      import('winston'),
      import('./config_loader.js'),
      import('./transports/console_transport.js'),
      import('./transports/file_transport.js'),
    ]);

    winston = winstonMod.default;
    loadConfigFn = configMod.loadConfig;
    createConsoleTransportFn = consoleMod.createConsoleTransport;
    createFileTransportFn = fileMod.createFileTransport;
    dependenciesLoaded = true;
  })();

  return loadPromise;
}

export class HazoLogger {
  private static instance: HazoLogger | null = null;
  private static instancePromise: Promise<HazoLogger> | null = null;
  private winstonLogger!: import('winston').Logger;
  private config!: HazoLogConfig;
  private executionId: string;

  private constructor(configPath?: string) {
    if (!dependenciesLoaded || !loadConfigFn) {
      throw new Error('[hazo_logs] Dependencies not loaded. Use HazoLogger.getInstanceAsync() instead.');
    }
    this.executionId = this.generateExecutionId();
    this.config = loadConfigFn(configPath);
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
   * Get the singleton instance of HazoLogger (async)
   * @param configPath - Optional path to config file (only used on first call)
   */
  public static async getInstanceAsync(configPath?: string): Promise<HazoLogger> {
    if (HazoLogger.instance) {
      return HazoLogger.instance;
    }

    if (HazoLogger.instancePromise) {
      return HazoLogger.instancePromise;
    }

    HazoLogger.instancePromise = (async () => {
      await loadDependencies();
      HazoLogger.instance = new HazoLogger(configPath);
      return HazoLogger.instance;
    })();

    return HazoLogger.instancePromise;
  }

  /**
   * Get the singleton instance of HazoLogger (synchronous)
   * Only works if dependencies have already been loaded via getInstanceAsync
   * @param configPath - Optional path to config file (only used on first call)
   */
  public static getInstance(configPath?: string): HazoLogger {
    if (HazoLogger.instance) {
      return HazoLogger.instance;
    }

    if (!dependenciesLoaded) {
      throw new Error(
        '[hazo_logs] HazoLogger.getInstance() requires dependencies to be pre-loaded. ' +
        'Use HazoLogger.getInstanceAsync() instead, or call loadDependencies() first.'
      );
    }

    HazoLogger.instance = new HazoLogger(configPath);
    return HazoLogger.instance;
  }

  /**
   * Reset the singleton instance (primarily for testing)
   */
  public static reset(): void {
    if (HazoLogger.instance) {
      HazoLogger.instance.winstonLogger?.close();
      HazoLogger.instance = null;
      HazoLogger.instancePromise = null;
    }
  }

  /**
   * Log an entry - called by PackageLogger
   */
  public log(entry: LogEntry): void {
    if (!this.winstonLogger) return;
    const { level, message, ...meta } = entry;
    this.winstonLogger.log(level, message, meta);
  }

  /**
   * Log a client-side entry - called by API handler
   * Used for logs sent from the browser
   */
  public logClient(entry: Omit<LogEntry, 'executionId' | 'filename' | 'line'>): void {
    if (!this.winstonLogger) return;
    const fullEntry: LogEntry = {
      ...entry,
      executionId: this.executionId,
      filename: 'client',
      line: 0,
      source: 'client',
    };
    const { level, message, ...meta } = fullEntry;
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

  private createWinstonLogger(): import('winston').Logger {
    if (!winston || !createConsoleTransportFn || !createFileTransportFn) {
      throw new Error('[hazo_logs] Dependencies not loaded');
    }

    const transports: import('winston').transport[] = [];

    if (this.config.enable_console) {
      transports.push(createConsoleTransportFn(this.config.log_level));
    }

    if (this.config.enable_file) {
      transports.push(createFileTransportFn(this.config));
    }

    return winston.createLogger({
      level: this.config.log_level,
      transports,
    });
  }
}

// Export the async loader for pre-initialization
export { loadDependencies as preloadHazoLogger };
