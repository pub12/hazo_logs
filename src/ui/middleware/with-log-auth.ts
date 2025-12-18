/**
 * Auth middleware wrapper for log viewer API routes
 */

import type { AuthCheckFn, LogApiHandler } from '../types.js';

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
 * Wrap a log API handler with authentication
 *
 * @param handler - The log API handler to wrap
 * @param authCheck - Function to check if request is authorized
 * @returns Wrapped handler that checks auth before processing
 *
 * @example
 * ```typescript
 * import { createLogApiHandler, withLogAuth } from 'hazo_logs';
 *
 * const handler = createLogApiHandler();
 *
 * export const { GET } = withLogAuth(handler, async (req) => {
 *   const session = await getSession(req);
 *   return session?.user?.role === 'admin';
 * });
 * ```
 */
export function withLogAuth(
  handler: LogApiHandler,
  authCheck: AuthCheckFn
): LogApiHandler {
  const wrapWithAuth = async (
    request: Request,
    handlerFn: (request: Request) => Promise<Response>
  ): Promise<Response> => {
    try {
      const isAuthorized = await authCheck(request);

      if (!isAuthorized) {
        return jsonResponse(
          { error: 'Unauthorized', message: 'Access to logs requires authentication' },
          401
        );
      }

      return handlerFn(request);
    } catch (error) {
      console.error('[HazoLog] Auth check failed:', error);
      return jsonResponse(
        { error: 'Internal Server Error', message: 'Authentication check failed' },
        500
      );
    }
  };

  return {
    GET: (request: Request) => wrapWithAuth(request, handler.GET),
    POST: (request: Request) => wrapWithAuth(request, handler.POST),
  };
}
