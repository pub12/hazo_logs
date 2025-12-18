/**
 * Server-side UI exports for hazo_logs
 *
 * Use these in API routes and server components only.
 */

// API Handler
export { createLogApiHandler } from './api/log-api-handler.js';

// Middleware
export { withLogAuth } from './middleware/with-log-auth.js';

// Types
export type {
  LogApiConfig,
  LogApiHandler,
  AuthCheckFn,
} from './types.js';
