/**
 * Log Context Provider
 * Uses AsyncLocalStorage for zero-overhead context propagation
 *
 * This module is safe for both server and client environments.
 * On the client, context functions are no-ops since AsyncLocalStorage is unavailable.
 */

import type { LogContext, Logger } from '../types.js';

// Type for the storage interface (either real AsyncLocalStorage or stub)
interface LogContextStorage {
  getStore(): LogContext | undefined;
  run<T>(store: LogContext, fn: () => T): T;
}

// Client-side stub implementation
const clientStubStorage: LogContextStorage = {
  getStore: () => undefined,
  run: <T>(_store: LogContext, fn: () => T): T => fn(),
};

// Runtime-initialized storage (populated on server, stub on client)
let logContextStorage: LogContextStorage = clientStubStorage;
let initialized = false;

/**
 * Initialize AsyncLocalStorage on the server
 * This is called lazily when context functions are first used
 */
function ensureInitialized(): void {
  if (initialized) return;
  initialized = true;

  // Only attempt to load async_hooks on the server
  if (typeof window === 'undefined') {
    try {
      // Dynamic require to avoid static analysis by bundlers
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const asyncHooks = require('async_hooks') as typeof import('async_hooks');
      logContextStorage = new asyncHooks.AsyncLocalStorage<LogContext>();
    } catch {
      // If async_hooks is not available, keep using the stub
      console.warn('[hazo_logs] AsyncLocalStorage not available, context tracking disabled');
    }
  }
}

/**
 * Generate a human-readable session ID
 * Format: 2025-12-17-14:30:45-1234 (date-time-4digit)
 */
export function generateSessionId(): string {
  const now = new Date();
  const datePart = now.toISOString().split('T')[0]; // 2025-12-17
  const timePart = now.toTimeString().split(' ')[0]; // 14:30:45
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit: 1000-9999
  return `${datePart}-${timePart}-${randomPart}`;
}

/**
 * Start a new session with auto-generated ID and optional auto-logging
 * Depth starts at 1 for new sessions
 *
 * @example
 * startSession({ reference: 'user_42', logger: myLogger }, () => {
 *   // All logs in this block will have the session context
 *   logger.info('Processing request');
 * });
 */
export function startSession<T>(
  options: { reference?: string; logger?: Logger },
  fn: () => T
): T {
  ensureInitialized();
  const sessionId = generateSessionId();

  return logContextStorage.run({ sessionId, reference: options.reference, depth: 1 }, () => {
    // Auto-log session start if logger provided
    if (options.logger) {
      options.logger.info('Session started', {
        sessionId,
        reference: options.reference,
        startTime: new Date().toISOString()
      });
    }
    return fn();
  });
}

/**
 * Start a new async session with auto-generated ID and optional auto-logging
 * Depth starts at 1 for new sessions
 *
 * @example
 * await startSessionAsync({ reference: 'user_42', logger: myLogger }, async () => {
 *   await processRequest();
 * });
 */
export async function startSessionAsync<T>(
  options: { reference?: string; logger?: Logger },
  fn: () => Promise<T>
): Promise<T> {
  ensureInitialized();
  const sessionId = generateSessionId();

  return logContextStorage.run({ sessionId, reference: options.reference, depth: 1 }, async () => {
    // Auto-log session start if logger provided
    if (options.logger) {
      options.logger.info('Session started', {
        sessionId,
        reference: options.reference,
        startTime: new Date().toISOString()
      });
    }
    return await fn();
  });
}

/**
 * Run code within a log context
 * All logs created within the callback will include the context
 * Automatically inherits sessionId/reference from parent and increments depth
 *
 * @example
 * runWithLogContext({ sessionId: 'sess_123', reference: 'user_42' }, () => {
 *   logger.info('User action'); // includes sessionId and reference
 * });
 */
export function runWithLogContext<T>(context: LogContext, fn: () => T): T {
  ensureInitialized();
  const parentContext = logContextStorage.getStore();
  const parentDepth = parentContext?.depth ?? 0;

  const newContext: LogContext = {
    // Use provided values or inherit from parent
    sessionId: context.sessionId ?? parentContext?.sessionId,
    reference: context.reference ?? parentContext?.reference,
    // Auto-increment depth
    depth: parentDepth + 1,
  };

  return logContextStorage.run(newContext, fn);
}

/**
 * Run async code within a log context
 * Useful for middleware that needs to await the callback
 * Automatically inherits sessionId/reference from parent and increments depth
 *
 * @example
 * await runWithLogContextAsync({ sessionId: req.sessionID }, async () => {
 *   await handleRequest(req, res);
 * });
 */
export function runWithLogContextAsync<T>(
  context: LogContext,
  fn: () => Promise<T>
): Promise<T> {
  ensureInitialized();
  const parentContext = logContextStorage.getStore();
  const parentDepth = parentContext?.depth ?? 0;

  const newContext: LogContext = {
    sessionId: context.sessionId ?? parentContext?.sessionId,
    reference: context.reference ?? parentContext?.reference,
    depth: parentDepth + 1,
  };

  return logContextStorage.run(newContext, fn);
}

/**
 * Get the current log context (used internally by logger)
 * Returns undefined if not within a context
 */
export function getLogContext(): LogContext | undefined {
  ensureInitialized();
  return logContextStorage.getStore();
}

/**
 * Convenience function to run code with just a session ID
 *
 * @example
 * withSession('sess_123', () => {
 *   logger.info('Session started');
 * });
 */
export function withSession<T>(sessionId: string, fn: () => T): T {
  return runWithLogContext({ sessionId }, fn);
}

/**
 * Convenience function to run code with session and reference
 *
 * @example
 * withContext('sess_123', 'user_42', () => {
 *   logger.info('User logged in');
 * });
 */
export function withContext<T>(sessionId: string, reference: string, fn: () => T): T {
  return runWithLogContext({ sessionId, reference }, fn);
}
