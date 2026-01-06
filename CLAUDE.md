# CLAUDE.md - AI Reference for hazo_logs

## Project Overview

**hazo_logs** is a Winston-based logging library for Node.js/Next.js applications with an integrated log viewer UI. It provides structured logging with singleton pattern management and optional React-based log viewing capabilities.

**Core Purpose**: Centralized logging for the "hazo" ecosystem with minimal configuration and built-in UI for log exploration.

**Version**: 1.0.0
**Repository**: https://github.com/pub12/hazo_logs.git

## Architecture Pattern

### Singleton Core Logger
- `HazoLogger` class implements singleton pattern
- Single Winston instance per process with unique execution ID
- Execution ID format: `YYYY-MM-DD-HH:MM:SS-XXXX` (date-time-4digit random)
- Manages transports (console, file) based on configuration

### Package Logger Wrapper
- `PackageLogger` wraps HazoLogger and tags entries with package name
- Factory function `createLogger(packageName)` creates package-specific loggers
- Automatically captures caller info (filename, line number) using stack traces
- Integrates with AsyncLocalStorage context for session/reference tracking

### Log Context System
- Uses Node.js AsyncLocalStorage for request-scoped metadata
- Tracks: `sessionId`, `reference`, `depth` across async boundaries
- Context is automatically included in log entries when available

## Key Design Decisions

### 1. Why Singleton Pattern?
- Ensures single Winston instance across all modules
- Prevents duplicate log entries and transport conflicts
- Guarantees consistent execution ID per server start

### 2. Why INI Configuration?
- Human-readable format for operations teams
- Simple key-value structure without nesting complexity
- Searches up directory tree (cwd, parent, grandparent) for flexibility

### 3. Why Daily Rotation?
- Log files named: `hazo-YYYY-MM-DD.log`
- Each line is a complete JSON object (newline-delimited JSON)
- Enables efficient line-by-line parsing without loading entire file
- Max file size and retention configurable (default: 20MB, 14 days)

### 4. Why Separate UI Exports?
- `hazo_logs` - Core logging only (no React dependency)
- `hazo_logs/ui` - Client components (requires React 18+, Next.js 14+)
- `hazo_logs/ui/server` - Server-side API handlers
- Peer dependencies marked optional to avoid forcing UI on server-only usage

## Directory Structure

```
hazo_logs/
├── src/
│   ├── lib/                    # Core logging library
│   │   ├── hazo_logger.ts      # Singleton Winston manager
│   │   ├── package_logger.ts   # Package-specific logger wrapper
│   │   ├── config_loader.ts    # INI config parser
│   │   ├── log-reader.ts       # Server-side log file reader
│   │   ├── types.ts            # Core type definitions
│   │   ├── context/
│   │   │   └── log-context.ts  # AsyncLocalStorage context
│   │   ├── transports/
│   │   │   ├── console_transport.ts
│   │   │   └── file_transport.ts
│   │   └── utils/
│   │       ├── caller_info.ts  # Stack trace parser
│   │       └── constants.ts    # Default config
│   ├── ui/                     # Optional UI components
│   │   ├── components/
│   │   │   ├── LogViewerPage.tsx    # Main viewer page
│   │   │   ├── LogTable.tsx         # Table view
│   │   │   ├── LogTimeline.tsx      # Timeline view
│   │   │   ├── LogPagination.tsx    # Pagination controls
│   │   │   └── LogLevelBadge.tsx    # Level badge component
│   │   ├── api/
│   │   │   └── log-api-handler.ts   # Next.js route handler factory
│   │   ├── middleware/
│   │   │   └── with-log-auth.ts     # Auth middleware wrapper
│   │   ├── index.ts            # Client exports
│   │   ├── server.ts           # Server exports
│   │   └── types.ts            # UI type definitions
│   └── index.ts                # Main entry point
├── dist/                       # Compiled output
├── config/
│   └── hazo_logs_config.example.ini
└── package.json
```

## Integration Patterns

### Consuming Applications Setup

**Minimal Integration** (2 files, ~6 lines of code):

1. **API Route** (`app/api/logs/route.ts`):
   ```typescript
   import { createLogApiHandler } from 'hazo_logs/ui/server';
   const handler = createLogApiHandler();
   export const { GET } = handler;
   ```

2. **UI Page** (`app/logs/page.tsx`):
   ```typescript
   'use client';
   import { LogViewerPage } from 'hazo_logs/ui';
   export default function LogsPage() {
     return <LogViewerPage apiBasePath="/api/logs" title="Logs" />;
   }
   ```

### Usage in Library Code
```typescript
import { createLogger } from 'hazo_logs';
const logger = createLogger('my_package');
logger.info('Operation started', { userId: 123 });
```

## Performance Characteristics

### Log Reading
- Max results limit (default: 1000 entries) prevents memory overload
- Pagination applied after filtering to reduce data transfer
- Line-by-line streaming from files (readline interface)
- Index-free filtering (scans all entries - suitable for daily files)

### Memory Footprint
- Singleton logger: ~1 instance per process
- No in-memory log caching
- File handles managed by Winston DailyRotateFile transport

## Common Gotchas

1. **Config File Location**: Searches up 3 parent directories from `process.cwd()`. Place in `config/hazo_logs_config.ini`.
2. **UI Dependencies**: LogViewerPage requires `hazo_ui` package. Install peer deps if using UI.
3. **Caller Info Accuracy**: Stack traces assume specific call depth. Custom wrappers may offset line numbers.
4. **Date Filters**: UI defaults to today's date. Empty logs view may mean no logs for selected date.
5. **Execution ID Resets**: New execution ID on every server restart. Filter by sessionId for cross-restart tracking.

## Testing Strategy

- Unit tests: Vitest for config loading, logger creation
- Integration tests: Test complete logging flow with temp directories
- No UI component tests currently (assumes hazo_ui provides tested components)

## External Dependencies

### Production
- `winston` - Core logging engine
- `winston-daily-rotate-file` - File rotation transport
- `ini` - Configuration parsing

### Peer (Optional)
- `next` (>=14) - For UI route handlers
- `react` (>=18) - For UI components
- `hazo_ui` (>=2.0.0) - For filter/sort dialogs and UI primitives

## Configuration Options

All settings in `config/hazo_logs_config.ini` under `[hazo_logs]` section:

**Core Logging**:
- `log_directory` - Where to write logs (default: `./logs`)
- `log_level` - Minimum level: error|warn|info|debug (default: info)
- `enable_console` - Console transport (default: true)
- `enable_file` - File transport with rotation (default: true)
- `max_file_size` - Per-file size limit (default: 20m)
- `max_files` - Retention period (default: 14d)
- `date_pattern` - Filename date format (default: YYYY-MM-DD)

**UI Settings**:
- `enable_log_viewer` - Enable API endpoints (default: true)
- `log_viewer_page_size` - Results per page (default: 50)
- `log_viewer_max_results` - Maximum queryable logs (default: 1000)

## Edge Cases

1. **Missing Log Directory**: Auto-created by winston-daily-rotate-file
2. **Invalid JSON Lines**: Silently skipped during parsing
3. **Concurrent Writes**: Winston handles file locking
4. **Large Log Files**: Reader enforces `log_viewer_max_results` limit
5. **Missing Date**: Defaults to today (ISO format YYYY-MM-DD)

## Non-Functional Requirements

- **Startup Time**: < 50ms (config load + singleton init)
- **Log Write Latency**: < 5ms (async file writes)
- **UI Load Time**: < 2s for 1000 entries with filters
- **File Size**: Target 20MB daily files in typical usage
