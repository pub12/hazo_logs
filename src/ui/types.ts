/**
 * Type definitions for hazo_logs UI components
 */

/**
 * Generic request type compatible with Next.js NextRequest
 * This allows the package to be built without requiring Next.js at compile time
 */
export interface LogRequest {
  url: string;
  headers: Headers;
}

/**
 * Auth check function type for protecting log viewer routes
 */
export type AuthCheckFn = (request: Request) => Promise<boolean> | boolean;

/**
 * Configuration for the log API handler
 */
export interface LogApiConfig {
  logDirectory?: string;
}

/**
 * Next.js API route handler interface
 * Uses Request for compatibility with Next.js 15+ route handlers
 */
export interface LogApiHandler {
  GET: (request: Request) => Promise<Response>;
}

/**
 * Props for the LogViewerPage component
 */
export interface LogViewerPageProps {
  apiBasePath?: string;
  title?: string;
  className?: string;
  /** If true, use a compact layout suitable for embedding in pages with existing navigation */
  embedded?: boolean;
  /** Control visibility of the header (default: true) */
  showHeader?: boolean;
}

/**
 * Props for the LogTable component
 */
export interface LogTableProps {
  logs: LogEntryDisplay[];
  isLoading?: boolean;
  onRowClick?: (log: LogEntryDisplay) => void;
}

/**
 * Extended log entry with display-specific fields
 */
export interface LogEntryDisplay {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  package: string;
  message: string;
  filename: string;
  line: number;
  executionId: string;
  sessionId?: string;
  reference?: string;
  depth?: number;
  data?: Record<string, unknown>;
}

/**
 * Props for LogTimeline component
 */
export interface LogTimelineProps {
  logs: LogEntryDisplay[];
  isLoading: boolean;
  availableSessions?: string[];
  selectedSession?: string;
  onSessionChange?: (sessionId: string | null) => void;
  groupByPackage?: boolean;
  showDepthIndentation?: boolean;
}

/**
 * Props for LogPagination component
 */
export interface LogPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

/**
 * Props for LogLevelBadge component
 */
export interface LogLevelBadgeProps {
  level: 'error' | 'warn' | 'info' | 'debug';
  className?: string;
}

/**
 * API response for log queries
 */
export interface LogQueryResponse {
  logs: LogEntryDisplay[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API response for available dates
 */
export interface LogDatesResponse {
  dates: string[];
}

/**
 * API response for available packages
 */
export interface LogPackagesResponse {
  packages: string[];
}

/**
 * API response for available execution IDs
 */
export interface LogExecutionIdsResponse {
  executionIds: string[];
}

/**
 * API response for available session IDs
 */
export interface LogSessionIdsResponse {
  sessionIds: string[];
}

/**
 * API response for available references
 */
export interface LogReferencesResponse {
  references: string[];
}
