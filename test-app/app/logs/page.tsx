'use client';

import { LogViewerPage } from 'hazo_logs/ui';

export default function LogsPage() {
  return <LogViewerPage apiBasePath="/api/logs" title="System Logs" />;
}
