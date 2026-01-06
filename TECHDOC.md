# Technical Documentation - hazo_logs

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Consumer Application                     │
│  ┌────────────────┐              ┌─────────────────────┐   │
│  │  Library Code  │              │   Next.js App       │   │
│  │                │              │                     │   │
│  │ createLogger() │              │  /logs (UI Page)    │   │
│  │ logger.info()  │              │  /api/logs (Route)  │   │
│  └───────┬────────┘              └──────────┬──────────┘   │
│          │                                  │              │
└──────────┼──────────────────────────────────┼──────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       hazo_logs Package                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Core Logging (hazo_logs)                 │  │
│  │  ┌──────────────┐      ┌────────────────┐            │  │
│  │  │PackageLogger │─────▶│  HazoLogger    │            │  │
│  │  │  (wrapper)   │      │  (singleton)   │            │  │
│  │  └──────────────┘      └────────┬───────┘            │  │
│  │                                 │                     │  │
│  │                         ┌───────▼────────┐            │  │
│  │                         │ Winston Logger │            │  │
│  │                         └───────┬────────┘            │  │
│  │                                 │                     │  │
│  │                   ┌─────────────┴──────────────┐      │  │
│  │                   ▼                            ▼      │  │
│  │          ┌─────────────────┐        ┌──────────────┐ │  │
│  │          │Console Transport│        │File Transport│ │  │
│  │          └─────────────────┘        └──────┬───────┘ │  │
│  │                                            │         │  │
│  └────────────────────────────────────────────┼─────────┘  │
│                                               │            │
│  ┌────────────────────────────────────────────┼─────────┐  │
│  │              UI Layer (hazo_logs/ui)       │         │  │
│  │  ┌──────────────────┐    ┌────────────────▼──────┐  │  │
│  │  │ LogViewerPage    │◀───│ createLogApiHandler   │  │  │
│  │  │ (React Client)   │    │ (Next.js Server)      │  │  │
│  │  │                  │    │                        │  │  │
│  │  │ - LogTable       │    │ - readLogs()          │  │  │
│  │  │ - LogTimeline    │    │ - getAvailableLogDates│  │  │
│  │  │ - Filters/Sorts  │    │ - getUniquePackages   │  │  │
│  │  └──────────────────┘    └───────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │  File System       │
                    │  ./logs/           │
                    │  hazo-YYYY-MM-DD   │
                    │  .log              │
                    └────────────────────┘
```

## Component Architecture

### 1. Core Logging System

#### HazoLogger (Singleton)

**Responsibility**: Manage the global Winston logger instance.

**Key Methods**:
```typescript
class HazoLogger {
  static getInstance(configPath?: string): HazoLogger
  static reset(): void  // Testing only

  log(entry: LogEntry): void
  getConfig(): HazoLogConfig
  getExecutionId(): string

  private generateExecutionId(): string
  private createWinstonLogger(): winston.Logger
}
```

**Lifecycle**:
1. First call to `getInstance()` creates singleton
2. Loads config from INI file (searches up directory tree)
3. Generates unique execution ID
4. Creates Winston logger with configured transports
5. Subsequent calls return same instance

**Execution ID Generation**:
```typescript
// Format: YYYY-MM-DD-HH:MM:SS-XXXX
// Example: 2025-12-18-10:30:45-7342
const now = new Date();
const datePart = now.toISOString().split('T')[0];
const timePart = now.toTimeString().split(' ')[0];
const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
return `${datePart}-${timePart}-${randomPart}`;
```

#### PackageLogger

**Responsibility**: Package-specific logger wrapper with auto-tagging.

**Key Methods**:
```typescript
class PackageLogger implements Logger {
  constructor(options: PackageLoggerOptions, coreLogger?: HazoLogger)

  error(message: string, data?: LogData): void
  warn(message: string, data?: LogData): void
  info(message: string, data?: LogData): void
  debug(message: string, data?: LogData): void

  private log(level: LogLevel, message: string, data?: LogData): void
}
```

**Log Entry Construction**:
```typescript
private log(level: LogLevel, message: string, data?: LogData): void {
  const { filename, line } = getCallerInfo();  // Stack trace analysis
  const context = getLogContext();             // AsyncLocalStorage

  this.coreLogger.log({
    timestamp: new Date().toISOString(),
    level,
    package: this.packageName,
    message,
    filename,
    line,
    executionId: this.coreLogger.getExecutionId(),
    ...(context?.sessionId ? { sessionId: context.sessionId } : {}),
    ...(context?.reference ? { reference: context.reference } : {}),
    ...(context?.depth ? { depth: context.depth } : {}),
    ...(data ? { data } : {}),
  });
}
```

### 2. Configuration System

#### Config Loader

**Search Strategy**:
```typescript
function findConfigFile(): string | null {
  const searchPaths = [
    process.cwd(),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), '..', '..'),
    path.join(process.cwd(), '..', '..', '..'),
  ];

  for (const searchPath of searchPaths) {
    const configPath = path.join(searchPath, 'config/hazo_logs_config.ini');
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}
```

**Default Configuration**:
```typescript
const DEFAULT_CONFIG: HazoLogConfig = {
  log_directory: './logs',
  log_level: 'info',
  enable_console: true,
  enable_file: true,
  max_file_size: '20m',
  max_files: '14d',
  date_pattern: 'YYYY-MM-DD',
  enable_log_viewer: true,
  log_viewer_page_size: 50,
  log_viewer_max_results: 1000,
};
```

### 3. Transports

#### Console Transport

**Configuration**:
```typescript
new winston.transports.Console({
  level: logLevel,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length > 0
        ? `\n${JSON.stringify(meta, null, 2)}`
        : '';
      return `${timestamp} [${level}] ${message}${metaStr}`;
    })
  ),
})
```

#### File Transport (Daily Rotation)

**Configuration**:
```typescript
new DailyRotateFile({
  level: config.log_level,
  dirname: path.resolve(config.log_directory),
  filename: 'hazo-%DATE%.log',
  datePattern: config.date_pattern,
  maxSize: config.max_file_size,
  maxFiles: config.max_files,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
})
```

**File Output Format**:
Each line is a complete JSON object (NDJSON):
```json
{"timestamp":"2025-12-18T10:30:45.123Z","level":"info","package":"auth","message":"User logged in","filename":"auth.ts","line":42,"executionId":"2025-12-18-10:30:45-1234","sessionId":"sess_abc","reference":"user-456","depth":0,"data":{"userId":456}}
```

### 4. Context System (AsyncLocalStorage)

#### Implementation

**Context Storage**:
```typescript
import { AsyncLocalStorage } from 'async_hooks';

const logContextStorage = new AsyncLocalStorage<LogContext>();

export function runWithLogContext<T>(
  context: LogContext,
  fn: () => Promise<T>
): Promise<T> {
  return logContextStorage.run(context, fn);
}

export function getLogContext(): LogContext | undefined {
  return logContextStorage.getStore();
}
```

**Usage Pattern**:
```typescript
await runWithLogContext(
  {
    sessionId: 'sess_abc123',
    reference: 'user-456',
    depth: 0,
  },
  async () => {
    logger.info('Request started');  // Includes sessionId and reference
    await processRequest();
    logger.info('Request completed');
  }
);
```

**Context Propagation**:
- AsyncLocalStorage automatically propagates across async/await boundaries
- Context survives Promise chains, setTimeout, setImmediate
- No manual passing required through function parameters

### 5. Caller Info Extraction

#### Stack Trace Analysis

**Implementation**:
```typescript
export function getCallerInfo(): { filename: string; line: number } {
  const stack = new Error().stack || '';
  const lines = stack.split('\n');

  // Skip error line and internal frames
  // Target: consumer code calling logger methods
  const callerLine = lines[4] || lines[3] || '';

  const match = callerLine.match(/\((.+):(\d+):\d+\)/)
             || callerLine.match(/at\s+(.+):(\d+):\d+/);

  if (match) {
    return {
      filename: path.basename(match[1]),
      line: parseInt(match[2], 10),
    };
  }

  return { filename: 'unknown', line: 0 };
}
```

**Stack Depth Assumptions**:
```
0: Error
1: getCallerInfo()
2: PackageLogger.log()
3: PackageLogger.info/warn/error/debug()
4: Consumer code  ← Target
```

**Limitations**:
- Assumes fixed call stack depth
- Custom wrappers may offset line numbers
- Transpiled code may have incorrect mappings
- Performance: ~0.5ms per call (stack trace generation)

## Data Flow

### Logging Flow

```
Consumer Code
    │
    ├─ logger.info("message", data)
    │
    ▼
PackageLogger
    │
    ├─ Extract caller info (stack trace)
    ├─ Get context (AsyncLocalStorage)
    ├─ Build LogEntry object
    │
    ▼
HazoLogger
    │
    ├─ Add execution ID
    ├─ Pass to Winston
    │
    ▼
Winston Logger
    │
    ├─ Level filtering
    ├─ Format application
    │
    ├────────────────┬────────────────┐
    ▼                ▼                ▼
Console         File             (Custom)
Transport       Transport        Transport
    │                │
    ▼                ▼
  stdout        hazo-2025-12-18.log
```

### Log Reading Flow

```
UI Component (LogViewerPage)
    │
    ├─ User interaction (filter, sort, page)
    │
    ▼
API Request
    │
    ├─ GET /api/logs?date=2025-12-18&level=error&page=1
    │
    ▼
createLogApiHandler()
    │
    ├─ Parse query params
    ├─ Check enable_log_viewer config
    │
    ▼
readLogs(options)
    │
    ├─ Resolve log file path
    ├─ Check file exists
    │
    ▼
parseLogFile()
    │
    ├─ Create file read stream
    ├─ Readline interface
    ├─ Parse each line as JSON
    │
    ▼
applyFilters()
    │
    ├─ Filter by level
    ├─ Filter by package
    ├─ Filter by executionId
    ├─ Filter by sessionId
    ├─ Filter by reference
    ├─ Text search
    │
    ▼
applySorting()
    │
    ├─ Sort by field (timestamp, level, package, etc.)
    ├─ Apply sort order (asc/desc)
    │
    ▼
Pagination
    │
    ├─ Slice results by page
    │
    ▼
JSON Response
    │
    ├─ { logs: [], total, page, pageSize, totalPages }
    │
    ▼
UI Component
    │
    ├─ Render LogTable or LogTimeline
    └─ Update pagination controls
```

## Performance Characteristics

### Log Writing

**Benchmarks** (approximate):
- Singleton creation: ~10-20ms (one-time)
- Config loading: ~5-10ms (one-time)
- Log entry creation: ~0.5-1ms (per call)
- Stack trace extraction: ~0.3-0.5ms (per call)
- Winston write: ~0.1-0.5ms (async, buffered)

**Total Latency**: ~1-2ms per log call (synchronous portion)

**File I/O**: Asynchronous, buffered by Winston
- Batched writes reduce disk I/O
- No blocking on log calls

### Log Reading

**Parsing Performance**:
- 1,000 entries: ~50-100ms
- 10,000 entries: ~500ms-1s
- 100,000 entries: Limited by `log_viewer_max_results`

**Filtering**:
- Linear scan (O(n))
- No indexes
- Suitable for daily log files (<100K entries)

**Memory Usage**:
- Readline streaming: ~1MB baseline
- Parsed logs in memory: ~1KB per entry
- Max memory: ~1MB + (entries × 1KB)

**Optimization Strategy**:
- Enforce `log_viewer_max_results` limit (default: 1000)
- Pagination applied after filtering to reduce transfer size
- No in-memory caching

## Security Considerations

### Log Viewer Access

**Default Behavior**: No authentication
- API endpoints are publicly accessible
- Logs may contain sensitive information

**Mitigation**: Use `withLogAuth` middleware
```typescript
const authHandler = withLogAuth(handler, async (request) => {
  const session = await getSession(request);
  return session?.user?.role === 'admin';
});
```

### File Path Traversal

**Protection**:
- Log directory resolved to absolute path
- Date parameter validated (must match YYYY-MM-DD pattern)
- Filename constructed as `hazo-${date}.log` (no user input in path)

**Safe Implementation**:
```typescript
const logFilePath = path.resolve(logDir, `hazo-${date}.log`);
// path.resolve prevents directory traversal
```

### Log Injection

**Vulnerability**: User input in log messages could manipulate JSON structure

**Mitigation**:
- Winston's JSON formatter escapes special characters
- Each log line is a complete JSON object (no multiline messages)
- Parser skips malformed lines silently

### Information Disclosure

**Risk**: Logs may contain:
- User IDs
- Session tokens
- API keys
- Personal data

**Best Practices**:
1. Sanitize sensitive data before logging
2. Protect log viewer with authentication
3. Configure appropriate log retention (GDPR compliance)
4. Use separate log files for sensitive operations

## Error Handling

### Configuration Errors

**Missing Config File**:
```typescript
console.warn('[HazoLog] Config file not found, using defaults');
// Continues with DEFAULT_CONFIG
```

**Invalid Config Values**:
- Invalid log level → Defaults to 'info'
- Invalid boolean → Uses default value
- Invalid number → Uses default value

### Logging Errors

**Winston Transport Failures**:
- Console transport errors: Silently ignored (stderr may be unavailable)
- File transport errors: Logged to console, continues with other transports

**File System Errors**:
- Log directory missing: Auto-created by winston-daily-rotate-file
- Disk full: Winston stops writing, no exception thrown to caller

### Log Reading Errors

**Missing Log File**:
```typescript
if (!fs.existsSync(logFilePath)) {
  return {
    logs: [],
    total: 0,
    page,
    pageSize,
    totalPages: 0,
  };
}
```

**Malformed JSON Lines**:
```typescript
try {
  const entry = JSON.parse(line) as LogEntry;
  logs.push(entry);
} catch {
  // Skip malformed lines silently
}
```

**API Errors**:
```typescript
try {
  // ... handle request
} catch (error) {
  console.error('[HazoLog] API error:', error);
  return jsonResponse({
    error: 'Internal Server Error',
    message: String(error)
  }, 500);
}
```

## Integration Patterns

### Next.js App Router

**Recommended Structure**:
```
app/
├── api/
│   └── logs/
│       └── route.ts          # API handler
├── logs/
│   └── page.tsx              # UI page (full screen)
└── dashboard/
    └── page.tsx              # UI page (embedded)
```

**Route Handler** (`app/api/logs/route.ts`):
```typescript
import { createLogApiHandler, withLogAuth } from 'hazo_logs/ui/server';

const handler = createLogApiHandler();

// Optional: Add authentication
const authHandler = withLogAuth(handler, async (request) => {
  // Your auth logic
  return true;
});

export const { GET } = authHandler;
```

**Full Page** (`app/logs/page.tsx`):
```typescript
'use client';
import { LogViewerPage } from 'hazo_logs/ui';

export default function LogsPage() {
  return <LogViewerPage apiBasePath="/api/logs" />;
}
```

**Embedded** (`app/dashboard/page.tsx`):
```typescript
'use client';
import { LogViewerPage } from 'hazo_logs/ui';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-4 h-screen">
      <div>Dashboard Content</div>
      <LogViewerPage
        apiBasePath="/api/logs"
        embedded={true}
        showHeader={true}
        className="h-full"
      />
    </div>
  );
}
```

### Library Integration

**Package Logger Creation**:
```typescript
// In your library/package
import { createLogger } from 'hazo_logs';

const logger = createLogger('my-package');

export function myFunction() {
  logger.info('Function called');
  // ... logic
}
```

**With Context**:
```typescript
import { createLogger, runWithLogContext } from 'hazo_logs';

const logger = createLogger('api');

export async function handleRequest(req: Request) {
  await runWithLogContext(
    {
      sessionId: req.headers.get('x-session-id') || undefined,
      reference: `req-${Date.now()}`,
      depth: 0,
    },
    async () => {
      logger.info('Request received', {
        method: req.method,
        url: req.url
      });

      const result = await processRequest(req);

      logger.info('Request completed', {
        status: result.status
      });
    }
  );
}
```

## Testing Strategies

### Unit Testing

**Reset Singleton Between Tests**:
```typescript
import { HazoLogger } from 'hazo_logs';

afterEach(() => {
  HazoLogger.reset();  // Clean up singleton
});

test('logger creates entries', () => {
  const logger = createLogger('test');
  logger.info('test message');
  // ... assertions
});
```

**Temporary Log Directory**:
```typescript
import fs from 'fs';
import path from 'path';
import { loadConfig } from 'hazo_logs';

test('reads logs from file', async () => {
  const tempDir = fs.mkdtempSync('/tmp/hazo-test-');

  // Create test config
  fs.mkdirSync(path.join(tempDir, 'config'), { recursive: true });
  fs.writeFileSync(
    path.join(tempDir, 'config/hazo_logs_config.ini'),
    '[hazo_logs]\nlog_directory = ' + tempDir
  );

  // ... test code

  // Cleanup
  fs.rmSync(tempDir, { recursive: true });
});
```

### Integration Testing

**Test with Real Files**:
```typescript
test('log viewer API returns logs', async () => {
  const handler = createLogApiHandler();

  const request = new Request('http://localhost/api/logs?date=2025-12-18');
  const response = await handler.GET(request);

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toHaveProperty('logs');
  expect(data).toHaveProperty('total');
});
```

## Caching Strategy

**Current Implementation**: No caching

**Rationale**:
- Log files change frequently during active logging
- Real-time visibility preferred over performance
- Daily file size (~1-10MB) manageable without cache

**Future Considerations**:
- Cache parsed logs for 30-60 seconds
- Invalidate on file modification (fs.watch)
- Trade-off: Complexity vs. performance gain

## Monitoring and Observability

### Internal Logging

**hazo_logs self-logging**:
- Config warnings: `console.warn('[HazoLog] ...')`
- API errors: `console.error('[HazoLog] API error:', error)`
- No internal use of hazo_logs (avoids recursion)

### Metrics to Track

**Recommended Monitoring** (in consuming applications):
- Log volume per package (track growth)
- Error/warn ratio (quality signal)
- Log file sizes (disk usage)
- API response times (UI performance)

### Health Checks

**Log Directory**:
```typescript
import fs from 'fs';
import { loadConfig } from 'hazo_logs';

export function checkLogHealth() {
  const config = loadConfig();
  const dir = path.resolve(config.log_directory);

  return {
    directoryExists: fs.existsSync(dir),
    isWritable: fs.accessSync(dir, fs.constants.W_OK),
    diskSpace: /* use third-party library */,
  };
}
```

## Deployment Considerations

### Log Directory Permissions

- Ensure write access to log directory
- Consider dedicated log partition
- Set up log rotation if disk space limited

### Environment Variables

**Not currently supported**, but could be added:
```typescript
// Future enhancement
const logDir = process.env.HAZO_LOG_DIR || config.log_directory;
```

### Container Deployments

**Docker**:
```dockerfile
# Map log directory to volume
VOLUME /app/logs

# Set permissions
RUN mkdir -p /app/logs && chown node:node /app/logs
```

**Kubernetes**:
```yaml
# PersistentVolumeClaim for logs
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: hazo-logs-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### Serverless Environments

**Limitations**:
- File-based logging not suitable for serverless (ephemeral filesystem)
- Console transport works
- Consider custom transport for cloud logging services

**Workaround**:
```ini
[hazo_logs]
enable_file = false
enable_console = true
```

## Extension Points

### Custom Transports

**Add Custom Winston Transport**:
```typescript
import { HazoLogger } from 'hazo_logs';
import { Transport } from 'winston';

class MyCustomTransport extends Transport {
  log(info: any, callback: () => void) {
    // Send to external service
    callback();
  }
}

// Note: Currently requires modifying HazoLogger source
// Future: Expose addTransport() method
```

### Custom Log Formatters

**Winston Format**:
```typescript
// Custom format in file transport
import winston from 'winston';

const customFormat = winston.format.printf(({ timestamp, level, ...meta }) => {
  return `[${timestamp}] ${level}: ${JSON.stringify(meta)}`;
});
```

### Custom UI Components

**Build Your Own Viewer**:
```typescript
import { readLogs } from 'hazo_logs';
import { LogTable } from 'hazo_logs/ui';

export default async function CustomLogPage() {
  // Server-side data fetching
  const { logs } = await readLogs({ date: '2025-12-18' });

  return <LogTable logs={logs} isLoading={false} />;
}
```
