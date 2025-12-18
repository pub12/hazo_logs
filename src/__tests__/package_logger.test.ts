import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PackageLogger, createLogger } from '../lib/package_logger.js';
import { HazoLogger } from '../lib/hazo_logger.js';
import fs from 'fs';
import path from 'path';

describe('PackageLogger', () => {
  const testConfigPath = path.join(process.cwd(), 'test_hazo_logs_config.ini');
  const testLogDir = path.join(process.cwd(), 'test-logs');

  beforeEach(() => {
    HazoLogger.reset();

    // Create a config that disables file output to avoid file system side effects
    const testConfig = `
[hazo_logs]
log_directory = ./test-logs
log_level = debug
enable_console = false
enable_file = false
`;
    fs.writeFileSync(testConfigPath, testConfig);
    HazoLogger.getInstance(testConfigPath);
  });

  afterEach(() => {
    HazoLogger.reset();
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (fs.existsSync(testLogDir)) {
      fs.rmSync(testLogDir, { recursive: true });
    }
  });

  it('should create logger with package name', () => {
    const logger = createLogger('test_package');
    expect(logger).toBeInstanceOf(PackageLogger);
  });

  it('should have all log methods', () => {
    const logger = createLogger('test_package');

    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should not throw when logging', () => {
    const logger = createLogger('test_package');

    expect(() => {
      logger.info('Test info message');
      logger.error('Test error message');
      logger.warn('Test warn message');
      logger.debug('Test debug message');
    }).not.toThrow();
  });

  it('should accept optional data parameter', () => {
    const logger = createLogger('test_package');

    expect(() => {
      logger.info('Test message', { key: 'value' });
      logger.error('Test error', { error: 'details' });
    }).not.toThrow();
  });

  it('should create independent loggers for different packages', () => {
    const logger1 = createLogger('package_a');
    const logger2 = createLogger('package_b');

    expect(logger1).not.toBe(logger2);
  });
});
