import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HazoLogger } from '../lib/hazo_logger.js';
import fs from 'fs';
import path from 'path';

describe('HazoLogger', () => {
  const testConfigPath = path.join(process.cwd(), 'test_hazo_logs_config.ini');
  const testLogDir = path.join(process.cwd(), 'test-logs');

  beforeEach(() => {
    // Reset singleton before each test
    HazoLogger.reset();
  });

  afterEach(() => {
    // Clean up
    HazoLogger.reset();
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (fs.existsSync(testLogDir)) {
      fs.rmSync(testLogDir, { recursive: true });
    }
  });

  it('should be a singleton', () => {
    const instance1 = HazoLogger.getInstance();
    const instance2 = HazoLogger.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should reset singleton correctly', () => {
    const instance1 = HazoLogger.getInstance();
    HazoLogger.reset();
    const instance2 = HazoLogger.getInstance();

    expect(instance1).not.toBe(instance2);
  });

  it('should load config from specified path', () => {
    const testConfig = `
[hazo_logs]
log_directory = ./test-logs
log_level = debug
enable_console = false
enable_file = false
`;
    fs.writeFileSync(testConfigPath, testConfig);

    const instance = HazoLogger.getInstance(testConfigPath);
    const config = instance.getConfig();

    expect(config.log_directory).toBe('./test-logs');
    expect(config.log_level).toBe('debug');
  });

  it('should log entries correctly', () => {
    const testConfig = `
[hazo_logs]
log_directory = ./test-logs
log_level = debug
enable_console = false
enable_file = true
`;
    fs.writeFileSync(testConfigPath, testConfig);

    const instance = HazoLogger.getInstance(testConfigPath);

    // This should not throw
    expect(() => {
      instance.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        package: 'test_package',
        message: 'Test message',
        filename: 'test.ts',
        line: 10,
      });
    }).not.toThrow();
  });
});
