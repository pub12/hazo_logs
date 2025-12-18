/**
 * Log Reader Service
 * Reads and parses log files with filtering, sorting, and pagination
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import type { LogEntry, LogLevel } from './types.js';
import { loadConfig } from './config_loader.js';

export interface ReadLogsOptions {
  logDirectory?: string;
  date?: string;
  level?: LogLevel[];
  package?: string[];
  executionId?: string[];
  sessionId?: string[];
  reference?: string[];
  search?: string;
  sortBy?: 'timestamp' | 'level' | 'package' | 'executionId' | 'sessionId' | 'reference';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface LogQueryResult {
  logs: LogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Read logs from file with filtering, sorting, and pagination
 */
export async function readLogs(options: ReadLogsOptions = {}): Promise<LogQueryResult> {
  const config = loadConfig();
  const logDir = options.logDirectory || config.log_directory;
  const date = options.date || getTodayDate();
  const pageSize = options.pageSize || config.log_viewer_page_size || 50;
  const page = options.page || 1;
  const maxResults = config.log_viewer_max_results || 1000;

  const logFilePath = path.resolve(logDir, `hazo-${date}.log`);

  if (!fs.existsSync(logFilePath)) {
    return {
      logs: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  // Read and parse all logs from file
  let logs = await parseLogFile(logFilePath);

  // Apply filters
  logs = applyFilters(logs, options);

  // Limit to max results
  if (logs.length > maxResults) {
    logs = logs.slice(0, maxResults);
  }

  const total = logs.length;

  // Apply sorting
  logs = applySorting(logs, options.sortBy, options.sortOrder);

  // Apply pagination
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedLogs = logs.slice(startIndex, startIndex + pageSize);

  return {
    logs: paginatedLogs,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get list of available log dates
 */
export async function getAvailableLogDates(logDirectory?: string): Promise<string[]> {
  const config = loadConfig();
  const logDir = logDirectory || config.log_directory;
  const resolvedDir = path.resolve(logDir);

  if (!fs.existsSync(resolvedDir)) {
    return [];
  }

  const files = fs.readdirSync(resolvedDir);
  const dates: string[] = [];

  for (const file of files) {
    const match = file.match(/^hazo-(\d{4}-\d{2}-\d{2})\.log$/);
    if (match) {
      dates.push(match[1]);
    }
  }

  // Sort dates descending (newest first)
  return dates.sort((a, b) => b.localeCompare(a));
}

/**
 * Get unique package names from logs
 */
export async function getUniquePackages(
  logDirectory?: string,
  date?: string
): Promise<string[]> {
  const config = loadConfig();
  const logDir = logDirectory || config.log_directory;
  const targetDate = date || getTodayDate();
  const logFilePath = path.resolve(logDir, `hazo-${targetDate}.log`);

  if (!fs.existsSync(logFilePath)) {
    return [];
  }

  const logs = await parseLogFile(logFilePath);
  const packages = new Set<string>();

  for (const log of logs) {
    if (log.package) {
      packages.add(log.package);
    }
  }

  return Array.from(packages).sort();
}

/**
 * Get unique execution IDs from logs
 */
export async function getUniqueExecutionIds(
  logDirectory?: string,
  date?: string
): Promise<string[]> {
  const config = loadConfig();
  const logDir = logDirectory || config.log_directory;
  const targetDate = date || getTodayDate();
  const logFilePath = path.resolve(logDir, `hazo-${targetDate}.log`);

  if (!fs.existsSync(logFilePath)) {
    return [];
  }

  const logs = await parseLogFile(logFilePath);
  const executionIds = new Set<string>();

  for (const log of logs) {
    if (log.executionId) {
      executionIds.add(log.executionId);
    }
  }

  return Array.from(executionIds).sort();
}

/**
 * Get unique session IDs from logs
 */
export async function getUniqueSessionIds(
  logDirectory?: string,
  date?: string
): Promise<string[]> {
  const config = loadConfig();
  const logDir = logDirectory || config.log_directory;
  const targetDate = date || getTodayDate();
  const logFilePath = path.resolve(logDir, `hazo-${targetDate}.log`);

  if (!fs.existsSync(logFilePath)) {
    return [];
  }

  const logs = await parseLogFile(logFilePath);
  const sessionIds = new Set<string>();

  for (const log of logs) {
    if (log.sessionId) {
      sessionIds.add(log.sessionId);
    }
  }

  return Array.from(sessionIds).sort();
}

/**
 * Get unique references from logs
 */
export async function getUniqueReferences(
  logDirectory?: string,
  date?: string
): Promise<string[]> {
  const config = loadConfig();
  const logDir = logDirectory || config.log_directory;
  const targetDate = date || getTodayDate();
  const logFilePath = path.resolve(logDir, `hazo-${targetDate}.log`);

  if (!fs.existsSync(logFilePath)) {
    return [];
  }

  const logs = await parseLogFile(logFilePath);
  const references = new Set<string>();

  for (const log of logs) {
    if (log.reference) {
      references.add(log.reference);
    }
  }

  return Array.from(references).sort();
}

/**
 * Parse a log file line by line
 */
async function parseLogFile(filePath: string): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line) as LogEntry;
      logs.push(entry);
    } catch {
      // Skip malformed lines
    }
  }

  return logs;
}

/**
 * Apply filters to logs
 */
function applyFilters(logs: LogEntry[], options: ReadLogsOptions): LogEntry[] {
  let filtered = logs;

  // Filter by level
  if (options.level && options.level.length > 0) {
    filtered = filtered.filter((log) => options.level!.includes(log.level));
  }

  // Filter by package
  if (options.package && options.package.length > 0) {
    filtered = filtered.filter((log) => options.package!.includes(log.package));
  }

  // Filter by execution ID
  if (options.executionId && options.executionId.length > 0) {
    filtered = filtered.filter((log) => options.executionId!.includes(log.executionId));
  }

  // Filter by session ID
  if (options.sessionId && options.sessionId.length > 0) {
    filtered = filtered.filter(
      (log) => log.sessionId && options.sessionId!.includes(log.sessionId)
    );
  }

  // Filter by reference
  if (options.reference && options.reference.length > 0) {
    filtered = filtered.filter(
      (log) => log.reference && options.reference!.includes(log.reference)
    );
  }

  // Filter by search text
  if (options.search) {
    const searchLower = options.search.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.message.toLowerCase().includes(searchLower) ||
        log.package.toLowerCase().includes(searchLower) ||
        log.filename.toLowerCase().includes(searchLower) ||
        (log.sessionId && log.sessionId.toLowerCase().includes(searchLower)) ||
        (log.reference && log.reference.toLowerCase().includes(searchLower))
    );
  }

  return filtered;
}

/**
 * Apply sorting to logs
 */
function applySorting(
  logs: LogEntry[],
  sortBy?: 'timestamp' | 'level' | 'package' | 'executionId' | 'sessionId' | 'reference',
  sortOrder?: 'asc' | 'desc'
): LogEntry[] {
  const order = sortOrder === 'asc' ? 1 : -1;

  return [...logs].sort((a, b) => {
    switch (sortBy) {
      case 'level':
        return (LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]) * order;
      case 'package':
        return a.package.localeCompare(b.package) * order;
      case 'executionId':
        return a.executionId.localeCompare(b.executionId) * order;
      case 'sessionId':
        return (a.sessionId || '').localeCompare(b.sessionId || '') * order;
      case 'reference':
        return (a.reference || '').localeCompare(b.reference || '') * order;
      case 'timestamp':
      default:
        return a.timestamp.localeCompare(b.timestamp) * order;
    }
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}
