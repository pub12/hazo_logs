/**
 * Utility to extract filename and line number from call stack
 */

export interface CallerInfo {
  filename: string;
  line: number;
}

/**
 * Get the filename and line number of the caller
 * Walks up the stack to find the actual calling code (not the logger internals)
 */
export function getCallerInfo(): CallerInfo {
  const originalPrepareStackTrace = Error.prepareStackTrace;

  try {
    const err = new Error();
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = err.stack as unknown as NodeJS.CallSite[];
    Error.prepareStackTrace = originalPrepareStackTrace;

    // Walk up the stack to find user code
    for (let i = 0; i < stack.length; i++) {
      const frame = stack[i];
      const filename = frame.getFileName() || '';

      // Skip if no filename
      if (!filename) continue;

      // Skip frames that are part of the logger internals
      if (isInternalFrame(filename)) continue;

      // Found user code
      return {
        filename: extractFilename(filename),
        line: frame.getLineNumber() || 0,
      };
    }

    return { filename: 'unknown', line: 0 };
  } catch {
    return { filename: 'unknown', line: 0 };
  }
}

/**
 * Check if a filename is an internal frame that should be skipped
 */
function isInternalFrame(filename: string): boolean {
  const lowered = filename.toLowerCase();

  // Skip node internals
  if (lowered.startsWith('node:')) return true;

  // Skip node_modules (including hazo_logs when used as a package)
  if (lowered.includes('node_modules')) return true;

  // Skip hazo_logs package source files (src/lib or dist/lib)
  // Be specific to avoid skipping user files in directories that happen to contain "hazo_log"
  if (
    lowered.includes('hazo_logs/src/lib') ||
    lowered.includes('hazo_logs/dist/lib') ||
    lowered.includes('hazo_logs\\src\\lib') ||
    lowered.includes('hazo_logs\\dist\\lib')
  ) {
    return true;
  }

  return false;
}

/**
 * Extract just the filename from a full path
 */
function extractFilename(fullPath: string): string {
  const parts = fullPath.split(/[/\\]/);
  return parts[parts.length - 1] || fullPath;
}
