import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../lib/config_loader.js';
import { DEFAULT_CONFIG } from '../lib/utils/constants.js';
import fs from 'fs';
import path from 'path';

describe('config_loader', () => {
  const testConfigPath = path.join(process.cwd(), 'test_hazo_logs_config.ini');

  afterEach(() => {
    // Clean up test config file
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  it('should return default config when no config file exists', () => {
    const config = loadConfig('/non/existent/path.ini');
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('should load config from specified path', () => {
    const testConfig = `
[hazo_logs]
log_directory = ./test-logs
log_level = debug
enable_console = true
enable_file = false
max_file_size = 10m
max_files = 7d
date_pattern = YYYY-MM-DD-HH
`;
    fs.writeFileSync(testConfigPath, testConfig);

    const config = loadConfig(testConfigPath);

    expect(config.log_directory).toBe('./test-logs');
    expect(config.log_level).toBe('debug');
    expect(config.enable_console).toBe(true);
    expect(config.enable_file).toBe(false);
    expect(config.max_file_size).toBe('10m');
    expect(config.max_files).toBe('7d');
    expect(config.date_pattern).toBe('YYYY-MM-DD-HH');
  });

  it('should apply defaults for missing values', () => {
    const testConfig = `
[hazo_logs]
log_directory = ./custom-logs
`;
    fs.writeFileSync(testConfigPath, testConfig);

    const config = loadConfig(testConfigPath);

    expect(config.log_directory).toBe('./custom-logs');
    expect(config.log_level).toBe(DEFAULT_CONFIG.log_level);
    expect(config.enable_console).toBe(DEFAULT_CONFIG.enable_console);
    expect(config.enable_file).toBe(DEFAULT_CONFIG.enable_file);
  });

  it('should validate log level and use default for invalid values', () => {
    const testConfig = `
[hazo_logs]
log_level = invalid_level
`;
    fs.writeFileSync(testConfigPath, testConfig);

    const config = loadConfig(testConfigPath);

    expect(config.log_level).toBe(DEFAULT_CONFIG.log_level);
  });

  it('should parse boolean values correctly', () => {
    const testConfig = `
[hazo_logs]
enable_console = false
enable_file = 1
`;
    fs.writeFileSync(testConfigPath, testConfig);

    const config = loadConfig(testConfigPath);

    expect(config.enable_console).toBe(false);
    expect(config.enable_file).toBe(true);
  });
});
