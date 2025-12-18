# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Custom transport support via public API
- Environment variable configuration support
- Log aggregation across multiple files
- Performance metrics tracking
- Structured error objects with stack traces

## [1.0.0] - 2025-12-18

### Added

#### Core Logging Features
- **HazoLogger Singleton**: Central Winston logger manager with unique execution ID per server start
- **PackageLogger**: Package-scoped logger wrapper with automatic tagging
- **Factory Function**: `createLogger(packageName)` for easy logger instantiation
- **Four Log Levels**: error, warn, info, debug
- **Caller Info Extraction**: Automatic filename and line number capture via stack traces
- **Execution ID**: Unique identifier per server start in format `YYYY-MM-DD-HH:MM:SS-XXXX`

#### Context System
- **AsyncLocalStorage Integration**: Session and reference tracking across async operations
- **runWithLogContext()**: Context provider for scoped logging metadata
- **Automatic Propagation**: Context survives Promise chains and async/await
- **Context Fields**: sessionId, reference, depth

#### Configuration
- **INI File Support**: `hazo_logs_config.ini` configuration file
- **Automatic Discovery**: Searches current directory and up to 3 parent directories
- **Sensible Defaults**: Works out of the box without configuration
- **12 Configuration Options**: Complete control over logging and UI behavior

#### Transports
- **Console Transport**: Colorized, formatted output for development
- **File Transport**: Daily rotation with configurable retention
- **Winston Integration**: Full Winston transport ecosystem available
- **NDJSON Format**: Newline-delimited JSON for efficient parsing

#### Log Reading
- **readLogs() Function**: Server-side log file parsing with filtering and pagination
- **Filter Support**: By level, package, executionId, sessionId, reference, text search
- **Sort Support**: By timestamp, level, package, executionId, sessionId, reference (asc/desc)
- **Pagination**: Page-based result splitting with configurable page size
- **Metadata Queries**: getAvailableLogDates(), getUniquePackages(), getUniqueExecutionIds(), getUniqueSessionIds(), getUniqueReferences()

#### UI Components (hazo_logs/ui)
- **LogViewerPage**: Complete log viewer with filtering, sorting, and pagination
- **LogTable**: Table view with expandable log details
- **LogTimeline**: Timeline view with package/session grouping
- **LogPagination**: Page navigation with size controls
- **LogLevelBadge**: Color-coded log level badges
- **Embedded Mode**: Sidebar-friendly layout option
- **hazo_ui Integration**: Filter and sort dialogs via HazoUiMultiFilterDialog and HazoUiMultiSortDialog
- **Dual View Modes**: Table and Timeline tabs

#### Server API (hazo_logs/ui/server)
- **createLogApiHandler()**: Next.js route handler factory
- **withLogAuth()**: Authentication middleware wrapper
- **REST API**: Query logs, dates, packages, executionIds, sessionIds, references
- **Next.js Compatibility**: App Router (Next.js 14+) support
- **Web Standard Response**: Uses Web API Response objects

#### TypeScript Support
- **Full Type Definitions**: Complete .d.ts files for all exports
- **Generic Logger Interface**: Compatible with standard logging interfaces
- **Strict Typing**: No `any` types in public API

#### Testing
- **Vitest Framework**: Unit and integration tests
- **Config Loader Tests**: INI parsing and defaults
- **Logger Tests**: Singleton behavior and entry creation
- **Test Utilities**: HazoLogger.reset() for test isolation

#### Package Configuration
- **Three Export Paths**:
  - `hazo_logs` - Core logging
  - `hazo_logs/ui` - Client components
  - `hazo_logs/ui/server` - Server handlers
- **Optional Peer Dependencies**: next, react, hazo_ui marked as optional
- **ES Modules**: Pure ESM package with .js extensions
- **Example Config**: hazo_logs_config.example.ini included in package

### Design Decisions

#### Why Singleton Pattern?
The singleton pattern ensures:
- Single Winston instance prevents duplicate logs
- Consistent execution ID across all package loggers
- No transport conflicts from multiple logger instances
- Simplified testing with reset capability

#### Why NDJSON Format?
Newline-delimited JSON provides:
- Line-by-line parsing without loading entire file
- Stream processing for large files
- Easy grep/awk/sed integration for DevOps
- Resilient to partial writes (each line is complete)

#### Why Separate UI Exports?
Separating UI into optional exports allows:
- Server-only usage without React dependencies
- Smaller bundle size when UI not needed
- Independent versioning of core vs. UI
- Clear API boundaries (client vs. server)

#### Why AsyncLocalStorage?
AsyncLocalStorage enables:
- Context propagation without manual passing
- Request-scoped metadata in serverless environments
- No performance impact on non-context operations
- Native Node.js feature (no third-party deps)

#### Why INI Configuration?
INI format chosen because:
- Human-readable and operator-friendly
- Simple key-value structure (no nesting complexity)
- Traditional format familiar to ops teams
- No runtime dependencies (ini package ~10KB)

### Migration Notes

**From Console.log**:
```typescript
// Before
console.log('User logged in', userId);

// After
import { createLogger } from 'hazo_logs';
const logger = createLogger('auth');
logger.info('User logged in', { userId });
```

**From Other Winston Wrappers**:
- Replace direct Winston usage with createLogger()
- Add hazo_logs_config.ini instead of programmatic config
- Use runWithLogContext() for request-scoped metadata

### Known Limitations

1. **File-Only Storage**: No built-in support for remote log aggregation (use custom Winston transport)
2. **No Log Rotation API**: Relies on winston-daily-rotate-file's built-in rotation
3. **Linear Search**: Log reading has O(n) complexity (no indexing)
4. **No Real-Time Updates**: UI requires manual refresh (no WebSocket/SSE)
5. **Stack Trace Depth**: Assumes fixed call depth; custom wrappers may break caller info
6. **Next.js Only**: UI components require Next.js (not compatible with plain React)

### Dependencies

#### Production
- `winston` ^3.17.0 - Logging engine
- `winston-daily-rotate-file` ^5.0.0 - File rotation transport
- `ini` ^4.1.0 - Configuration parser

#### Peer (Optional)
- `next` >=14.0.0 - For UI route handlers
- `react` >=18.0.0 - For UI components
- `hazo_ui` >=2.0.0 - For filter/sort dialogs

#### Development
- `typescript` ^5.7.2
- `vitest` ^4.0.15
- `@types/node` ^22.10.2
- `@types/ini` ^4.1.1
- `@types/react` ^19.0.1

## [0.1.0] - Development Phase

### Added
- Initial prototype
- Basic Winston integration
- Console and file transports
- Package logger concept

### Changed
- Evolved to singleton pattern from multiple instances
- Switched from JSON config to INI format
- Added UI components in later iterations

---

## Version History Summary

- **1.0.0** (2025-12-18): Initial stable release with full logging and UI features
- **0.1.0**: Development phase (not published)

---

## Links

- [Repository](https://github.com/pub12/hazo_logs)
- [Issue Tracker](https://github.com/pub12/hazo_logs/issues)
- [NPM Package](https://www.npmjs.com/package/hazo_logs)
