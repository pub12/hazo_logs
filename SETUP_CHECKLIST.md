# Setup Checklist - hazo_logs

Complete step-by-step installation and configuration guide for hazo_logs.

## Prerequisites

Check that you have the required software installed:

- [ ] **Node.js** >= 18.0.0 (check with `node --version`)
- [ ] **npm** or **yarn** or **pnpm** (package manager)
- [ ] **Next.js** >= 14.0.0 (if using UI features)
- [ ] **React** >= 18.0.0 (if using UI features)

Verify your environment:

```bash
node --version    # Should be >= 18.0.0
npm --version     # Any recent version
```

---

## Part 1: Core Logging Setup (No UI)

Use this section if you only need logging functionality without the UI viewer.

### Step 1: Install Package

- [ ] Install hazo_logs:

```bash
npm install hazo_logs
```

**Verification**: Check that package appears in `package.json`:
```bash
grep hazo_logs package.json
```

Expected output:
```json
"hazo_logs": "^1.0.0"
```

---

### Step 2: Create Configuration File (Optional)

Configuration is optional. hazo_logs works with defaults if no config file is provided.

- [ ] Create the `config/` directory in your project root:

```bash
mkdir -p config
```

- [ ] Copy the example config file from the package:

```bash
cp node_modules/hazo_logs/config/hazo_logs_config.example.ini config/hazo_logs_config.ini
```

Or create `config/hazo_logs_config.ini` manually with your preferred settings:

```ini
[hazo_logs]
# Directory for log files (relative to process.cwd() or absolute)
log_directory = ./logs

# Minimum log level (error, warn, info, debug)
log_level = info

# Enable console output with colors
enable_console = true

# Enable file output with daily rotation
enable_file = true

# Maximum size per log file before rotation
# Supports: k, m, g (e.g., 20m = 20 megabytes)
max_file_size = 20m

# Maximum retention for log files
# Supports: number of files or age (e.g., 14d = 14 days)
max_files = 14d

# Date pattern for log file names
date_pattern = YYYY-MM-DD

# Enable the log viewer UI feature (set to false if not using UI)
enable_log_viewer = true

# Number of log entries per page in the viewer
log_viewer_page_size = 50

# Maximum number of log entries to load for filtering/sorting
log_viewer_max_results = 1000
```

**Verification**: Check config file syntax:
```bash
cat config/hazo_logs_config.ini
```

---

### Step 3: Create Logger in Your Code

- [ ] Create a logger for your package/module:

Example file: `src/services/user-service.ts`

```typescript
import { createLogger } from 'hazo_logs';

// Create logger tagged with your package name
const logger = createLogger('user-service');

export function registerUser(email: string) {
  logger.info('User registration started', { email });

  try {
    // ... registration logic
    logger.info('User registered successfully', { email });
  } catch (error) {
    logger.error('User registration failed', { email, error });
    throw error;
  }
}
```

**Verification**: Run your application and check for log output:
- Console should show colored log messages
- Log directory should be created (default: `./logs`)
- Log file should exist: `./logs/hazo-YYYY-MM-DD.log`

```bash
# Check log directory exists
ls -la ./logs

# Check today's log file exists
ls -la ./logs/hazo-$(date +%Y-%m-%d).log

# View log contents
cat ./logs/hazo-$(date +%Y-%m-%d).log
```

Expected log file format (NDJSON - one JSON object per line):
```json
{"timestamp":"2025-12-18T10:30:45.123Z","level":"info","package":"user-service","message":"User registration started","filename":"user-service.ts","line":8,"executionId":"2025-12-18-10:30:45-1234","data":{"email":"user@example.com"}}
```

---

### Step 4: Test All Log Levels

- [ ] Test all four log levels:

```typescript
import { createLogger } from 'hazo_logs';

const logger = createLogger('test');

logger.error('This is an error', { code: 500 });
logger.warn('This is a warning', { code: 400 });
logger.info('This is info', { code: 200 });
logger.debug('This is debug', { code: 100 });
```

**Verification**:
- All messages appear in console (with colors)
- All messages appear in log file
- Error messages are red, warnings are yellow, info is green, debug is blue (in console)

---

### Step 5: Configure Log Directory Permissions

- [ ] Ensure log directory is writable:

```bash
# Check current permissions
ls -ld ./logs

# Fix permissions if needed (Linux/Mac)
chmod 755 ./logs

# For production: consider dedicated user
# chown app-user:app-group ./logs
```

**Verification**: Create a test file in log directory:
```bash
touch ./logs/test.txt && rm ./logs/test.txt
```

If this succeeds without errors, permissions are correct.

---

## Part 2: UI Setup (Optional)

Use this section to add the log viewer UI to your Next.js application.

### Step 6: Install UI Dependencies

- [ ] Install peer dependencies for UI:

```bash
npm install next react hazo_ui
```

**Note**: Ensure versions meet requirements:
- next >= 14.0.0
- react >= 18.0.0
- hazo_ui >= 2.0.0

**Verification**: Check installed versions:
```bash
npm list next react hazo_ui
```

---

### Step 7: Create API Route Handler

- [ ] Create API route file: `app/api/logs/route.ts`

```bash
# Create directory if it doesn't exist
mkdir -p app/api/logs
```

- [ ] Add the following code to `app/api/logs/route.ts`:

```typescript
import { createLogApiHandler } from 'hazo_logs/ui/server';

const handler = createLogApiHandler();

// GET for log viewer queries, POST for client-side logging
export const { GET, POST } = handler;
```

**Note**: Export both `GET` and `POST` if you plan to use client-side logging from the browser.

**Verification**: Start your Next.js dev server and test the API:
```bash
npm run dev

# In another terminal, test the API
curl http://localhost:3000/api/logs?action=dates
```

Expected response:
```json
{"dates":["2025-12-18","2025-12-17"]}
```

---

### Step 8: Create Log Viewer Page

- [ ] Create UI page file: `app/logs/page.tsx`

```bash
# Create directory if it doesn't exist
mkdir -p app/logs
```

- [ ] Add the following code to `app/logs/page.tsx`:

```typescript
'use client';

import { LogViewerPage } from 'hazo_logs/ui';

export default function LogsPage() {
  return (
    <LogViewerPage
      apiBasePath="/api/logs"
      title="System Logs"
    />
  );
}
```

**Verification**: Visit the log viewer in your browser:
```
http://localhost:3000/logs
```

You should see:
- Page title "System Logs"
- Date selector with available log dates
- Filter and sort buttons
- Log table or timeline view
- Pagination controls (if logs exist)

---

### Step 9: Test UI Features

- [ ] **Filter by Log Level**:
  1. Click "Filters" button
  2. Add filter: "Log Level" = "error"
  3. Click "Apply"
  4. Verify only error logs are shown

- [ ] **Filter by Package**:
  1. Click "Filters" button
  2. Add filter: "Package" = (select a package)
  3. Click "Apply"
  4. Verify only logs from that package are shown

- [ ] **Sort Logs**:
  1. Click "Sort" button
  2. Select "Sort By" = "Level"
  3. Select "Order" = "Ascending"
  4. Click "Apply"
  5. Verify logs are sorted by level

- [ ] **Search Logs**:
  1. Click "Filters" button
  2. Add filter: "Search" = (enter search term)
  3. Click "Apply"
  4. Verify only matching logs are shown

- [ ] **Change Date**:
  1. Select different date from dropdown
  2. Verify logs for that date are loaded

- [ ] **Switch to Timeline View**:
  1. Click "Timeline View" tab
  2. Verify logs are grouped by package
  3. Verify session grouping (if sessionId exists)

- [ ] **Pagination**:
  1. If you have >50 logs, verify pagination controls appear
  2. Click "Next Page"
  3. Verify page 2 loads
  4. Change "Page Size" to 100
  5. Verify more logs per page

**Verification**: All features work without errors.

---

### Step 10: Add Authentication (Recommended for Production)

- [ ] Update `app/api/logs/route.ts` with authentication:

```typescript
import { createLogApiHandler, withLogAuth } from 'hazo_logs/ui/server';
import { getServerSession } from 'next-auth'; // or your auth library

const handler = createLogApiHandler();

const authHandler = withLogAuth(handler, async (request) => {
  // Example: Check if user is admin
  const session = await getServerSession();
  return session?.user?.role === 'admin';
});

export const { GET } = authHandler;
```

**Verification**: Test authentication:
```bash
# Without auth, should return 403 Forbidden
curl http://localhost:3000/api/logs

# With valid admin session, should return logs
```

---

### Step 10: Configure Client-Side Logging (If Using Browser Logging)

If your application logs from client-side components (browser), configure global client logger settings.

- [ ] Create a client initialization file or add to your providers:

**Option A: Dedicated init file** (`lib/hazo-init.ts`):

```typescript
'use client';
import { configureClientLogger } from 'hazo_logs/ui';

// Configure once - all client loggers will inherit these settings
configureClientLogger({
  apiBasePath: '/api/logs',  // Must match your API route location
  minLevel: 'info',          // Optional: minimum log level to send
});
```

Then import this file early in your app (e.g., in `app/layout.tsx`):

```typescript
import '@/lib/hazo-init';
```

**Option B: In providers component** (`app/providers.tsx`):

```typescript
'use client';
import { configureClientLogger } from 'hazo_logs/ui';

// Configure on module load
configureClientLogger({
  apiBasePath: '/api/logs',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] Create client loggers in your components:

```typescript
'use client';
import { createClientLogger } from 'hazo_logs/ui';

// No apiBasePath needed - inherits from global config
const logger = createClientLogger({
  packageName: 'my-component',
});

logger.info('Component mounted');
```

**Verification**:
- Check browser console for log messages
- Check server logs for client log entries (marked with `source: 'client'`)
- No 404 errors for POST requests to log endpoint

**Why this matters**: Without global configuration, client loggers default to `/api/logs`. If your API is at a different path (e.g., `/api/hazo_logs/logs`), you'll see 404 errors. Global config ensures all loggers—including those from dependency packages—use the correct endpoint.

---

## Part 3: Advanced Configuration

### Step 11: Session Tracking Setup (Optional)

Use session tracking to group logs by user session or request. **Note**: Session tracking requires server-side imports.

- [ ] Wrap request handlers with log context:

```typescript
// Use hazo_logs/server for full server capabilities
import { createLogger, runWithLogContext } from 'hazo_logs/server';

const logger = createLogger('api');

export async function handleRequest(req: Request) {
  await runWithLogContext(
    {
      sessionId: req.headers.get('x-session-id') || undefined,
      reference: `user-${req.headers.get('x-user-id')}`,
      depth: 0,
    },
    async () => {
      logger.info('Request started');

      // All logs within this context automatically include
      // sessionId and reference
      await processRequest(req);

      logger.info('Request completed');
    }
  );
}
```

**Verification**:
- Check log file for `sessionId` and `reference` fields
- Filter logs by sessionId in UI
- Verify all logs for a session are grouped

---

### Step 12: Embedded Viewer Setup (Optional)

Use the log viewer as a sidebar or embedded component.

- [ ] Create embedded viewer in your dashboard:

```typescript
'use client';

import { LogViewerPage } from 'hazo_logs/ui';

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800">
        <nav>Navigation</nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Dashboard widgets */}
        <div className="flex-1">
          Dashboard Content
        </div>

        {/* Embedded Log Viewer */}
        <div className="h-96 border-t">
          <LogViewerPage
            apiBasePath="/api/logs"
            title="Recent Logs"
            embedded={true}
            showHeader={true}
            className="h-full"
          />
        </div>
      </main>
    </div>
  );
}
```

**Verification**:
- Log viewer appears in dashboard
- Scrolling works independently from main content
- Filters and pagination work in embedded mode

---

## Part 4: Production Deployment

### Step 13: Configure Log Retention

- [ ] Update retention settings in `config/hazo_logs_config.ini`:

```ini
[hazo_logs]
# Keep logs for 30 days in production
max_files = 30d

# Limit file size to 50MB
max_file_size = 50m
```

**Verification**: After 30 days, check that old logs are deleted:
```bash
ls -la ./logs
# Should not see files older than 30 days
```

---

### Step 14: Configure Log Directory for Production

For production, use a dedicated log directory outside the application directory.

- [ ] Update log directory in config:

```ini
[hazo_logs]
# Absolute path for production
log_directory = /var/log/myapp
```

- [ ] Create log directory with correct permissions:

```bash
# Create directory
sudo mkdir -p /var/log/myapp

# Set ownership (replace with your app user)
sudo chown app-user:app-group /var/log/myapp

# Set permissions
sudo chmod 755 /var/log/myapp
```

**Verification**: Run application and check logs are written:
```bash
sudo ls -la /var/log/myapp
```

---

### Step 15: Set Up Log Rotation (Optional)

If using system log rotation in addition to built-in rotation:

- [ ] Create logrotate config: `/etc/logrotate.d/myapp`

```bash
/var/log/myapp/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

**Note**: This is optional. hazo_logs has built-in rotation via winston-daily-rotate-file.

---

### Step 16: Configure Monitoring (Optional)

- [ ] Monitor log directory disk usage:

```bash
# Add to cron (daily check)
0 0 * * * du -sh /var/log/myapp

# Alert if size exceeds threshold
0 0 * * * [ $(du -s /var/log/myapp | cut -f1) -gt 10485760 ] && echo "Log directory exceeds 10GB" | mail -s "Log Alert" admin@example.com
```

---

### Step 17: Test Production Build

- [ ] Build your Next.js application:

```bash
npm run build
```

- [ ] Start production server:

```bash
npm run start
```

- [ ] Verify logs are written:

```bash
tail -f /var/log/myapp/hazo-$(date +%Y-%m-%d).log
```

- [ ] Test log viewer UI in production mode:

```
https://your-domain.com/logs
```

**Verification**: All features work in production build.

---

## Part 5: Docker Deployment (Optional)

### Step 18: Configure Docker for Logging

- [ ] Create volume for logs in `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    volumes:
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
```

- [ ] Or use named volume:

```yaml
services:
  app:
    build: .
    volumes:
      - hazo-logs:/app/logs

volumes:
  hazo-logs:
```

- [ ] Update `Dockerfile` to create log directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Create log directory with permissions
RUN mkdir -p /app/logs && chown -R node:node /app/logs

# Switch to non-root user
USER node

EXPOSE 3000

CMD ["npm", "start"]
```

**Verification**: Run container and check logs:
```bash
docker-compose up -d
docker-compose exec app ls -la /app/logs
```

---

## Part 6: Troubleshooting

### Common Issues and Solutions

#### Issue: No logs appearing in console

- [ ] **Check log level configuration**:
  - Ensure `log_level` in config is not too restrictive
  - Try setting to `debug` temporarily

- [ ] **Check console transport is enabled**:
  ```ini
  enable_console = true
  ```

- [ ] **Check logger is created correctly**:
  ```typescript
  const logger = createLogger('my-package');
  console.log('Logger created:', logger);
  ```

---

#### Issue: No log files created

- [ ] **Check file transport is enabled**:
  ```ini
  enable_file = true
  ```

- [ ] **Check log directory permissions**:
  ```bash
  ls -ld ./logs
  chmod 755 ./logs
  ```

- [ ] **Check disk space**:
  ```bash
  df -h
  ```

- [ ] **Check for errors in console**:
  Look for Winston error messages

---

#### Issue: UI shows "No logs found"

- [ ] **Check API endpoint is accessible**:
  ```bash
  curl http://localhost:3000/api/logs?action=dates
  ```

- [ ] **Check log files exist for selected date**:
  ```bash
  ls -la ./logs/hazo-$(date +%Y-%m-%d).log
  ```

- [ ] **Check log viewer is enabled in config**:
  ```ini
  enable_log_viewer = true
  ```

- [ ] **Check selected date in UI**:
  - Select today's date from dropdown
  - Verify logs exist for that date

---

#### Issue: UI shows 403 Forbidden

- [ ] **Check authentication middleware**:
  - Verify `withLogAuth` is correctly configured
  - Test without auth temporarily

- [ ] **Check CORS settings** (if API on different domain):
  - Add CORS headers to API route

---

#### Issue: Logs missing sessionId or reference

- [ ] **Check context wrapper**:
  - Ensure code is wrapped in `runWithLogContext()`
  - Verify context object has `sessionId` and `reference`

- [ ] **Check AsyncLocalStorage compatibility**:
  - Node.js >= 18.0.0 required
  - Some serverless environments may not support AsyncLocalStorage

---

#### Issue: Incorrect caller info (filename/line)

- [ ] **Check for custom logger wrappers**:
  - Custom wrappers add stack frames
  - Use logger directly without wrappers

- [ ] **Check source maps** (in production):
  - Source maps may not be available in production
  - Consider disabling caller info for production

---

#### Issue: "Module not found: Can't resolve 'async_hooks'" or "fs" errors

- [ ] **Check import paths for client components**:
  - The root `hazo_logs` import now works on both client and server
  - For full server features, use `hazo_logs/server`
  - For client components, use `hazo_logs/ui` for `createClientLogger`

  ```typescript
  // Universal - works everywhere (basic logging)
  import { createLogger } from 'hazo_logs';

  // Server-only - full capabilities
  import { createLogger, runWithLogContext } from 'hazo_logs/server';

  // Client components - browser logging
  import { createClientLogger } from 'hazo_logs/ui';
  ```

- [ ] **Check for indirect imports**:
  - If a dependency imports from `hazo_logs/server` in client code, it will fail
  - Ensure server-only code paths use proper import separation

---

#### Issue: POST /api/logs 404 errors in console

- [ ] **Check client logger global configuration**:
  - Client loggers default to `/api/logs`
  - If your API is at a different path, configure globally:

  ```typescript
  // lib/hazo-init.ts
  'use client';
  import { configureClientLogger } from 'hazo_logs/ui';

  configureClientLogger({
    apiBasePath: '/api/hazo_logs/logs',  // Match your actual route
  });
  ```

- [ ] **Check that global config is loaded before loggers are created**:
  - Import the init file early in your app layout
  - Ensure `configureClientLogger()` runs before any `createClientLogger()` calls

- [ ] **Check dependency packages**:
  - Packages like `hazo_collab_forms` may create their own loggers
  - Global config ensures they use the correct endpoint

---

#### Issue: "Invalid JSON in request body" or empty body errors

- [ ] **Check client logger is sending valid data**:
  - This usually indicates race conditions or page unload issues
  - The API handler now gracefully handles empty/malformed requests
  - Ensure you're on the latest version of hazo_logs

- [ ] **Check network tab for request payload**:
  - Open browser DevTools > Network
  - Find POST request to your log endpoint
  - Verify the request body contains valid JSON with `{ logs: [...] }`

---

## Completion Checklist

### Core Logging (Minimum Setup)
- [ ] hazo_logs installed
- [ ] Logger created in code
- [ ] Logs appear in console
- [ ] Logs written to files
- [ ] Log directory permissions correct

### UI Viewer (Full Setup)
- [ ] UI dependencies installed
- [ ] API route created
- [ ] UI page created
- [ ] Log viewer accessible
- [ ] Filters work
- [ ] Sorting works
- [ ] Pagination works
- [ ] Authentication configured (production)
- [ ] Client logger global config set (if using browser logging)

### Production Deployment
- [ ] Log directory configured for production
- [ ] Log retention configured
- [ ] Permissions set correctly
- [ ] Production build tested
- [ ] Monitoring configured (optional)
- [ ] Docker volumes configured (if using Docker)

---

## Next Steps

After completing setup:

1. **Read the Documentation**:
   - README.md for usage examples
   - TECHDOC.md for architecture details
   - CLAUDE.md for AI assistant reference

2. **Explore Advanced Features**:
   - Session tracking with runWithLogContext
   - Custom log metadata
   - Embedded viewer layouts

3. **Monitor Logs**:
   - Set up alerts for error logs
   - Track log volume growth
   - Review logs regularly

4. **Optimize Configuration**:
   - Adjust log levels for different environments
   - Configure retention based on disk space
   - Tune page size for UI performance

---

## Support

If you encounter issues not covered in this checklist:

- Check [GitHub Issues](https://github.com/pub12/hazo_logs/issues)
- Open a new issue with:
  - hazo_logs version
  - Node.js version
  - Next.js version (if using UI)
  - Steps to reproduce
  - Error messages
  - Configuration file contents
