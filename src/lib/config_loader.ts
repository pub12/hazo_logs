/**
 * Configuration loader for hazo_logs
 * Loads settings from hazo_logs_config.ini file
 */

import fs from 'fs';
import path from 'path';
import ini from 'ini';
import type { HazoLogConfig, LogLevel } from './types.js';
import { DEFAULT_CONFIG } from './utils/constants.js';

const CONFIG_FILENAME = 'hazo_logs_config.ini';

/**
 * Load configuration from INI file
 * @param configPath - Optional explicit path to config file
 * @returns Parsed configuration with defaults applied
 */
export function loadConfig(configPath?: string): HazoLogConfig {
  const resolvedPath = configPath || findConfigFile();

  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    const searchPaths = getSearchPaths();
    console.warn(
      `[HazoLog] Config file '${CONFIG_FILENAME}' not found. Using defaults.\n` +
      `  Searched in:\n${searchPaths.map(p => `    - ${p}`).join('\n')}\n` +
      `  To configure, create '${CONFIG_FILENAME}' in your project root.`
    );
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = ini.parse(content);
    const logsSection = parsed['hazo_logs'] || {};

    return {
      log_directory: logsSection.log_directory || DEFAULT_CONFIG.log_directory,
      log_level: validateLogLevel(logsSection.log_level),
      enable_console: parseBool(logsSection.enable_console, DEFAULT_CONFIG.enable_console),
      enable_file: parseBool(logsSection.enable_file, DEFAULT_CONFIG.enable_file),
      max_file_size: logsSection.max_file_size || DEFAULT_CONFIG.max_file_size,
      max_files: logsSection.max_files || DEFAULT_CONFIG.max_files,
      date_pattern: logsSection.date_pattern || DEFAULT_CONFIG.date_pattern,
      // Log Viewer UI settings
      enable_log_viewer: parseBool(logsSection.enable_log_viewer, DEFAULT_CONFIG.enable_log_viewer),
      log_viewer_page_size: parseInt(logsSection.log_viewer_page_size, 10) || DEFAULT_CONFIG.log_viewer_page_size,
      log_viewer_max_results: parseInt(logsSection.log_viewer_max_results, 10) || DEFAULT_CONFIG.log_viewer_max_results,
    };
  } catch (error) {
    console.error(`[HazoLog] Failed to load config: ${error}`);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Get the list of paths to search for config file
 */
function getSearchPaths(): string[] {
  return [
    process.cwd(),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), '..', '..'),
    path.join(process.cwd(), '..', '..', '..'),
  ];
}

/**
 * Search for config file in current directory and parent directories
 */
function findConfigFile(): string | null {
  const searchPaths = getSearchPaths();

  for (const searchPath of searchPaths) {
    const configPath = path.join(searchPath, CONFIG_FILENAME);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

/**
 * Validate and return a valid log level
 */
function validateLogLevel(level: string | undefined): LogLevel {
  const validLevels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
  return validLevels.includes(level as LogLevel) ? (level as LogLevel) : DEFAULT_CONFIG.log_level;
}

/**
 * Parse boolean from string or boolean value
 * The ini package may return boolean or string depending on the value
 */
function parseBool(value: string | boolean | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  const strValue = String(value).toLowerCase();
  return strValue === 'true' || strValue === '1';
}
