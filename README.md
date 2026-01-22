# hazo_logs

A Winston-based logging library for Node.js/Next.js applications with a built-in log viewer UI.

[![npm version](https://img.shields.io/npm/v/hazo_logs.svg)](https://www.npmjs.com/package/hazo_logs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **Structured Logging**: Winston wrapper with singleton pattern for consistent logging across your app
- **Package Tagging**: Automatically tag logs by package/module name
- **Daily Rotation**: Automatic log file rotation with configurable retention
- **Session Tracking**: Track logs across async operations with sessionId and reference
- **Built-in UI**: React-based log viewer with filtering, sorting, and pagination
- **Zero Config**: Works out of the box with sensible defaults
- **Minimal Integration**: Add log viewer to your app with just 2 files (~6 lines of code)

## Quick Start

### Installation

```bash
npm install hazo_logs
```

For the UI components, also install peer dependencies:

```bash
npm install hazo_logs next react hazo_ui
```

### Basic Usage (Logging Only)

**1. Create a logger in your code:**

```typescript
import { createLogger } from 'hazo_logs';

const logger = createLogger('my-package');

logger.info('Application started');
logger.warn('This is a warning', { userId: 123 });
logger.error('Something went wrong', { error: 'details' });
logger.debug('Debug information');
```

**2. (Optional) Configure logging:**

Create a `config/` directory and add `hazo_logs_config.ini`:

```bash
mkdir -p config
cp node_modules/hazo_logs/config/hazo_logs_config.example.ini config/hazo_logs_config.ini
```

Or create `config/hazo_logs_config.ini` manually:

```ini
[hazo_logs]
log_directory = ./logs
log_level = info
enable_console = true
enable_file = true
max_file_size = 20m
max_files = 14d
```

That's it! Logs will be written to `./logs/hazo-YYYY-MM-DD.log` files.

### Add Log Viewer UI (Optional)

Add a log viewer to your Next.js app with just 2 files:

**1. Create API route** (`app/api/logs/route.ts`):

```typescript
import { createLogApiHandler } from 'hazo_logs/ui/server';

const handler = createLogApiHandler();

// GET for log viewer, POST for client-side logging
export const { GET, POST } = handler;
```

**2. Create UI page** (`app/logs/page.tsx`):

```typescript
'use client';

import { LogViewerPage } from 'hazo_logs/ui';

export default function LogsPage() {
  return <LogViewerPage apiBasePath="/api/logs" title="System Logs" />;
}
```

**3. Configure Tailwind CSS** (`tailwind.config.ts`):

```typescript
import type { Config } from 'tailwindcss';
import { tailwindSafelist, tailwindContentPath } from 'hazo_logs/tailwind';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    tailwindContentPath, // Add hazo_logs components
  ],
  safelist: tailwindSafelist, // Prevent purging of dynamic classes
  // ... rest of your config
};

export default config;
```

Visit `/logs` in your app to view logs!

### Client-Side Logging (Browser)

For logging from client components (browser), use the client logger.

**1. Configure global defaults (recommended):**

Set up global configuration once at app initialization. This ensures all client loggers (including those from dependency packages) use the correct API endpoint:

```typescript
// app/providers.tsx or lib/hazo-init.ts
'use client';
import { configureClientLogger } from 'hazo_logs/ui';

// Configure once at app startup
configureClientLogger({
  apiBasePath: '/api/logs',  // Required: your log API endpoint
  minLevel: 'info',          // Optional: minimum log level
});
```

**2. Create loggers in your components:**

```typescript
'use client';
import { createClientLogger } from 'hazo_logs/ui';

// No need to specify apiBasePath - inherits from global config
const logger = createClientLogger({
  packageName: 'my-app-client',
});

logger.info('User clicked button', { buttonId: 'submit' });
logger.error('Failed to load data', { error: err.message });
```

**Why use global configuration?**

- Dependency packages (like `hazo_collab_forms`) automatically use your configured endpoint
- Avoids 404 errors from loggers using the wrong default path
- Single place to configure all client logging settings

## Important Notes

### Server-Only Core Logger

The main `hazo_logs` import uses Node.js APIs (`fs`, `async_hooks`) and **cannot be imported in client components**. If you try to import it in a client component, you'll get build errors.

```typescript
// Server components, API routes, middleware - OK
import { createLogger } from 'hazo_logs';

// Client components - use client logger instead
import { createClientLogger } from 'hazo_logs/ui';
```

### Tailwind CSS Setup Required

The log viewer UI uses dynamic Tailwind classes that would be purged during build. You **must** configure both:

1. **Content path**: So Tailwind scans the hazo_logs component files
2. **Safelist**: To preserve dynamically-constructed classes

```typescript
import { tailwindSafelist, tailwindContentPath } from 'hazo_logs/tailwind';

export default {
  content: [
    // your paths...
    tailwindContentPath,
  ],
  safelist: tailwindSafelist,
};
```

Alternatively, use the preset:

```typescript
import { hazoLogsPreset } from 'hazo_logs/tailwind';

export default {
  presets: [hazoLogsPreset],
  content: [
    // your paths...
    './node_modules/hazo_logs/dist/**/*.{js,jsx}',
  ],
};
```

## Advanced Usage

### Session and Reference Tracking

Track logs across async operations:

```typescript
import { createLogger } from 'hazo_logs';
import { runWithLogContext } from 'hazo_logs';

const logger = createLogger('auth');

async function handleRequest(req) {
  await runWithLogContext(
    {
      sessionId: req.sessionId,
      reference: `user-${req.userId}`,
      depth: 0,
    },
    async () => {
      logger.info('Request started'); // Automatically includes sessionId and reference
      await processRequest(req);
      logger.info('Request completed');
    }
  );
}
```

### Embedded Log Viewer

Use the log viewer as a sidebar component:

```typescript
import { LogViewerPage } from 'hazo_logs/ui';

function AdminPanel() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <LogViewerPage
          apiBasePath="/api/logs"
          title="Recent Logs"
          embedded={true}
          showHeader={true}
          className="h-screen"
        />
      </div>
    </div>
  );
}
```

### Custom Authentication

Protect your log viewer with authentication:

```typescript
import { createLogApiHandler, withLogAuth } from 'hazo_logs/ui/server';

const handler = createLogApiHandler();

const authHandler = withLogAuth(handler, async (request) => {
  const session = await getSession(request);
  return session?.user?.role === 'admin';
});

export const { GET } = authHandler;
```

### Individual Components

Import components separately for custom layouts:

```typescript
import {
  LogTable,
  LogTimeline,
  LogPagination,
  LogLevelBadge,
} from 'hazo_logs/ui';

// Build your own custom log viewer
function CustomLogViewer() {
  const [logs, setLogs] = useState([]);

  return (
    <div>
      <LogTable logs={logs} isLoading={false} />
      <LogPagination
        currentPage={1}
        totalPages={10}
        pageSize={50}
        total={500}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
```

## Configuration Reference

Create a `config/` directory in your project root and add `hazo_logs_config.ini`:

```bash
mkdir -p config
cp node_modules/hazo_logs/config/hazo_logs_config.example.ini config/hazo_logs_config.ini
```

Configuration options:

```ini
[hazo_logs]
# Core Logging Settings
log_directory = ./logs          # Where to write log files
log_level = info                # Minimum level: error, warn, info, debug
enable_console = true           # Log to console
enable_file = true              # Log to files with rotation
max_file_size = 20m             # Max size per file (supports k, m, g)
max_files = 14d                 # Retention period (e.g., 14d = 14 days)
date_pattern = YYYY-MM-DD       # Date format for log filenames

# Log Viewer UI Settings
enable_log_viewer = true        # Enable the API endpoints
log_viewer_page_size = 50       # Results per page
log_viewer_max_results = 1000   # Max entries to load for filtering
```

If no config file is found, sensible defaults are used.

## API Reference

### Core Exports (`hazo_logs`)

#### `createLogger(packageName: string): Logger`

Create a package-specific logger.

```typescript
const logger = createLogger('my-package');
logger.info('Hello world');
```

#### `Logger` Interface

```typescript
interface Logger {
  error(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}
```

#### `runWithLogContext(context: LogContext, fn: () => Promise<T>): Promise<T>`

Run code with log context (sessionId, reference, depth).

#### `readLogs(options): Promise<LogQueryResult>`

Read logs from files with filtering and pagination (server-side only).

### UI Exports (`hazo_logs/ui`)

#### `configureClientLogger(config: ClientLoggerGlobalConfig): void`

Configure global defaults for all client loggers. Call once at app initialization.

```typescript
configureClientLogger({
  apiBasePath: '/api/logs',  // Required
  minLevel: 'info',          // Optional
  consoleOutput: true,       // Optional
  batchMode: false,          // Optional
  batchInterval: 5000,       // Optional (ms)
});
```

#### `getClientLoggerConfig(): ClientLoggerGlobalConfig | undefined`

Get current global configuration (returns undefined if not configured).

#### `isClientLoggerConfigured(): boolean`

Check if global configuration has been set.

#### `createClientLogger(config?: ClientLoggerConfig): ClientLogger`

Create a client-side logger. Inherits from global config if set.

```typescript
const logger = createClientLogger({
  packageName: 'my-component',  // Tag for this logger
  sessionId: 'sess_123',        // Optional session tracking
  reference: 'user_456',        // Optional reference tracking
});
```

#### `LogViewerPage`

Main log viewer component.

**Props:**
- `apiBasePath?: string` - API endpoint path (default: `/api/logs`)
- `title?: string` - Page title (default: `Log Viewer`)
- `className?: string` - Additional CSS classes
- `embedded?: boolean` - Embedded mode (default: `false`)
- `showHeader?: boolean` - Show header (default: `true`)

#### Individual Components

- `LogTable` - Table view of logs
- `LogTimeline` - Timeline view with grouping
- `LogPagination` - Pagination controls
- `LogLevelBadge` - Badge for log levels

### Server Exports (`hazo_logs/ui/server`)

#### `createLogApiHandler(config?): LogApiHandler`

Create Next.js API route handler.

**Options:**
- `logDirectory?: string` - Override default log directory

**Returns:**
```typescript
{
  GET: (request: Request) => Promise<Response>,  // Log viewer queries
  POST: (request: Request) => Promise<Response>, // Client-side log ingestion
}
```

#### `withLogAuth(handler, authCheck): LogApiHandler`

Wrap handler with authentication.

```typescript
const authHandler = withLogAuth(handler, async (request) => {
  // Return true to allow access, false to deny
  return await isAdmin(request);
});
```

## Log File Format

Logs are stored as newline-delimited JSON:

```json
{"timestamp":"2025-12-18T10:30:45.123Z","level":"info","package":"auth","message":"User logged in","filename":"auth.ts","line":42,"executionId":"2025-12-18-10:30:45-1234","sessionId":"sess_abc123","reference":"user-456","data":{"userId":456}}
```

**Fields:**
- `timestamp` - ISO 8601 timestamp
- `level` - Log level (error, warn, info, debug)
- `package` - Package name from createLogger
- `message` - Log message
- `filename` - Source file name
- `line` - Line number in source file
- `executionId` - Unique ID per server start
- `sessionId` - Optional session ID from context
- `reference` - Optional reference from context
- `depth` - Optional call depth from context
- `data` - Optional additional data

## UI Screenshots

### Table View
Filter and sort logs by level, package, session, execution ID, or search text.

### Timeline View
Visualize logs grouped by package or session with hierarchical depth display.

## Examples

See the `test-app/` directory for a complete working example.

## Troubleshooting

### Config file not found

If you see `[HazoLog] Config file 'config/hazo_logs_config.ini' not found`, the library will still work with defaults. The warning shows the paths that were searched. To configure custom settings:

```bash
mkdir -p config
cp node_modules/hazo_logs/config/hazo_logs_config.example.ini config/hazo_logs_config.ini
```

### Logs not appearing in UI

1. Check that you're looking at the correct date (UI defaults to today)
2. Verify logs are being written to the `log_directory` configured
3. Check browser console for API errors

### Styles broken in log viewer

1. Ensure `tailwindContentPath` is in your Tailwind `content` array
2. Ensure `tailwindSafelist` is in your Tailwind `safelist` array
3. Rebuild your project after config changes (`npm run build`)

### Import errors in client components

```
Error: fs is not defined
Error: async_hooks is not defined
```

The core `hazo_logs` import is server-only. Use `createClientLogger` from `hazo_logs/ui` for browser logging.

### hazo_ui missing errors

The log viewer UI requires `hazo_ui` package. Install it:

```bash
npm install hazo_ui
```

### POST /api/logs 404 errors

If you see repeated `POST /api/logs 404` errors, client loggers are using the default endpoint which doesn't match your API route location.

**Solution**: Configure the global client logger at app startup:

```typescript
// app/providers.tsx or lib/hazo-init.ts
'use client';
import { configureClientLogger } from 'hazo_logs/ui';

configureClientLogger({
  apiBasePath: '/api/hazo_logs/logs',  // Match your actual route
});
```

This ensures all client loggers (including those from dependency packages) use the correct endpoint.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repo
git clone https://github.com/pub12/hazo_logs.git
cd hazo_logs

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Test with example app
npm run dev:test-app
```

## License

MIT - See LICENSE file for details

## Author

Pubs Abayasiri

## Links

- [GitHub Repository](https://github.com/pub12/hazo_logs)
- [Issue Tracker](https://github.com/pub12/hazo_logs/issues)
- [NPM Package](https://www.npmjs.com/package/hazo_logs)

## Related Packages

- [hazo_ui](https://github.com/pub12/hazo_ui) - UI component library (required for log viewer)

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/pub12/hazo_logs/issues)
- Check existing issues for solutions
