/**
 * API Route Handler Factory for Log Viewer
 */

import {
  readLogs,
  getAvailableLogDates,
  getUniquePackages,
  getUniqueExecutionIds,
  getUniqueSessionIds,
  getUniqueReferences,
} from '../../lib/log-reader.js';
import { loadConfig } from '../../lib/config_loader.js';
import type { LogLevel } from '../../lib/types.js';
import type { LogApiConfig, LogApiHandler } from '../types.js';

/**
 * Helper to create JSON responses (compatible with Next.js Response)
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create a Next.js API route handler for log queries
 *
 * @param config - Optional configuration
 * @returns Handler object with GET method
 *
 * @example
 * ```typescript
 * // app/api/logs/route.ts
 * import { createLogApiHandler } from 'hazo_logs';
 *
 * const handler = createLogApiHandler();
 * export const { GET } = handler;
 * ```
 */
export function createLogApiHandler(config?: LogApiConfig): LogApiHandler {
  const logDirectory = config?.logDirectory;

  return {
    GET: async (request: Request): Promise<Response> => {
      const hazoConfig = loadConfig();

      // Check if log viewer is enabled
      if (!hazoConfig.enable_log_viewer) {
        return jsonResponse({ error: 'Log viewer is disabled' }, 403);
      }

      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');

      try {
        // Handle different actions
        switch (action) {
          case 'dates':
            return handleGetDates(logDirectory);
          case 'packages':
            return handleGetPackages(logDirectory, searchParams.get('date') || undefined);
          case 'executionIds':
            return handleGetExecutionIds(logDirectory, searchParams.get('date') || undefined);
          case 'sessionIds':
            return handleGetSessionIds(logDirectory, searchParams.get('date') || undefined);
          case 'references':
            return handleGetReferences(logDirectory, searchParams.get('date') || undefined);
          default:
            return handleGetLogs(logDirectory, searchParams);
        }
      } catch (error) {
        console.error('[HazoLog] API error:', error);
        return jsonResponse({ error: 'Internal Server Error', message: String(error) }, 500);
      }
    },
  };
}

/**
 * Handle GET /api/logs - Query logs with filters
 */
async function handleGetLogs(
  logDirectory: string | undefined,
  searchParams: URLSearchParams
): Promise<Response> {
  const date = searchParams.get('date') || undefined;
  const levelParam = searchParams.get('level');
  const packageParam = searchParams.get('package');
  const executionIdParam = searchParams.get('executionId');
  const sessionIdParam = searchParams.get('sessionId');
  const referenceParam = searchParams.get('reference');
  const search = searchParams.get('search') || undefined;
  const sortBy = searchParams.get('sortBy') as
    | 'timestamp'
    | 'level'
    | 'package'
    | 'executionId'
    | 'sessionId'
    | 'reference'
    | undefined;
  const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

  // Parse level filter (comma-separated)
  const level = levelParam
    ? (levelParam.split(',').filter(Boolean) as LogLevel[])
    : undefined;

  // Parse package filter (comma-separated)
  const packageFilter = packageParam
    ? packageParam.split(',').filter(Boolean)
    : undefined;

  // Parse execution ID filter (comma-separated)
  const executionId = executionIdParam
    ? executionIdParam.split(',').filter(Boolean)
    : undefined;

  // Parse session ID filter (comma-separated)
  const sessionId = sessionIdParam
    ? sessionIdParam.split(',').filter(Boolean)
    : undefined;

  // Parse reference filter (comma-separated)
  const reference = referenceParam
    ? referenceParam.split(',').filter(Boolean)
    : undefined;

  const result = await readLogs({
    logDirectory,
    date,
    level,
    package: packageFilter,
    executionId,
    sessionId,
    reference,
    search,
    sortBy,
    sortOrder,
    page,
    pageSize,
  });

  return jsonResponse(result);
}

/**
 * Handle GET /api/logs?action=dates - Get available log dates
 */
async function handleGetDates(logDirectory: string | undefined): Promise<Response> {
  const dates = await getAvailableLogDates(logDirectory);
  return jsonResponse({ dates });
}

/**
 * Handle GET /api/logs?action=packages - Get unique package names
 */
async function handleGetPackages(
  logDirectory: string | undefined,
  date: string | undefined
): Promise<Response> {
  const packages = await getUniquePackages(logDirectory, date);
  return jsonResponse({ packages });
}

/**
 * Handle GET /api/logs?action=executionIds - Get unique execution IDs
 */
async function handleGetExecutionIds(
  logDirectory: string | undefined,
  date: string | undefined
): Promise<Response> {
  const executionIds = await getUniqueExecutionIds(logDirectory, date);
  return jsonResponse({ executionIds });
}

/**
 * Handle GET /api/logs?action=sessionIds - Get unique session IDs
 */
async function handleGetSessionIds(
  logDirectory: string | undefined,
  date: string | undefined
): Promise<Response> {
  const sessionIds = await getUniqueSessionIds(logDirectory, date);
  return jsonResponse({ sessionIds });
}

/**
 * Handle GET /api/logs?action=references - Get unique references
 */
async function handleGetReferences(
  logDirectory: string | undefined,
  date: string | undefined
): Promise<Response> {
  const references = await getUniqueReferences(logDirectory, date);
  return jsonResponse({ references });
}
