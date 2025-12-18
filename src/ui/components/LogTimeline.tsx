'use client';

import React, { useMemo, useState } from 'react';
import type { LogEntryDisplay, LogTimelineProps } from '../types.js';
import { LogLevelBadge } from './LogLevelBadge.js';

interface PackageGroup {
  packageName: string;
  logs: LogEntryDisplay[];
}

/**
 * Timeline component for displaying log entries in a vertical timeline format
 * Features:
 * - Session selector dropdown to filter by session
 * - Package grouping with collapsible sections
 * - Depth indentation for nested context calls
 */
export function LogTimeline({
  logs,
  isLoading,
  availableSessions = [],
  selectedSession,
  onSessionChange,
  groupByPackage = true,
  showDepthIndentation = true,
}: LogTimelineProps) {
  // Track collapsed state for each package group
  const [collapsedPackages, setCollapsedPackages] = useState<Set<string>>(new Set());

  // Filter by selected session
  const sessionFilteredLogs = useMemo(() => {
    if (!selectedSession) return logs;
    return logs.filter(log => log.sessionId === selectedSession);
  }, [logs, selectedSession]);

  // Sort by timestamp (oldest first for timeline - top to bottom)
  const sortedLogs = useMemo(() => {
    return [...sessionFilteredLogs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [sessionFilteredLogs]);

  // Group by package if enabled
  const packageGroups = useMemo((): PackageGroup[] => {
    if (!groupByPackage) {
      return [{ packageName: '', logs: sortedLogs }];
    }

    const groups = new Map<string, LogEntryDisplay[]>();

    // Preserve order of first appearance
    for (const log of sortedLogs) {
      const existing = groups.get(log.package);
      if (existing) {
        existing.push(log);
      } else {
        groups.set(log.package, [log]);
      }
    }

    return Array.from(groups.entries()).map(([packageName, packageLogs]) => ({
      packageName,
      logs: packageLogs,
    }));
  }, [sortedLogs, groupByPackage]);

  const togglePackageCollapse = (packageName: string) => {
    setCollapsedPackages(prev => {
      const next = new Set(prev);
      if (next.has(packageName)) {
        next.delete(packageName);
      } else {
        next.add(packageName);
      }
      return next;
    });
  };

  const getDepthIndentation = (depth?: number) => {
    if (!showDepthIndentation || depth === undefined || depth <= 1) return 0;
    return Math.min(depth - 1, 4) * 24; // Max 4 levels, 24px each
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getDotColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-500';
      case 'warn':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      case 'debug':
      default:
        return 'bg-gray-400';
    }
  };

  const getDotStyle = (log: LogEntryDisplay) => {
    const baseColor = getDotColor(log.level);
    // Client logs get a ring to distinguish them
    if (log.source === 'client') {
      return `${baseColor} ring-2 ring-purple-400 ring-offset-1`;
    }
    return baseColor;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading logs...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Session Selector Header */}
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="timeline-session-select" className="text-sm font-medium text-gray-700">
            Session:
          </label>
          <select
            id="timeline-session-select"
            value={selectedSession || ''}
            onChange={(e) => onSessionChange?.(e.target.value || null)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[220px]"
          >
            <option value="">All Sessions</option>
            {availableSessions.map((sessionId) => (
              <option key={sessionId} value={sessionId}>
                {sessionId}
              </option>
            ))}
          </select>
        </div>

        {selectedSession && (
          <span className="text-sm text-gray-500">
            Showing {sessionFilteredLogs.length} log{sessionFilteredLogs.length !== 1 ? 's' : ''} for this session
          </span>
        )}
      </div>

      {/* Timeline Content */}
      {sessionFilteredLogs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {selectedSession
            ? `No logs found for session: ${selectedSession}`
            : 'No logs found for the selected filters.'}
        </div>
      ) : (
        <div className="relative px-4 py-6">
          {/* Main timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

          {packageGroups.map((group, groupIndex) => {
            const isCollapsed = collapsedPackages.has(group.packageName);

            return (
              <div key={group.packageName || groupIndex} className="mb-4">
                {/* Package Header (if grouping enabled) */}
                {groupByPackage && group.packageName && (
                  <div
                    className="relative flex items-center mb-4 ml-8 cursor-pointer group"
                    onClick={() => togglePackageCollapse(group.packageName)}
                  >
                    {/* Package indicator on timeline */}
                    <div className="absolute -left-8 w-4 h-4 rounded-sm bg-purple-500 border-2 border-white shadow" />

                    <div className="flex items-center gap-2 ml-4 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
                      <svg
                        className={`w-4 h-4 text-purple-600 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-semibold text-purple-800">
                        {group.packageName}
                      </span>
                      <span className="text-xs text-purple-600 bg-purple-200 px-2 py-0.5 rounded-full">
                        {group.logs.length} log{group.logs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Logs in this group */}
                {!isCollapsed && group.logs.map((log, logIndex) => {
                  const indentation = getDepthIndentation(log.depth);

                  return (
                    <div
                      key={`${group.packageName}-${logIndex}`}
                      className="relative flex items-start mb-4 ml-8"
                      style={{ paddingLeft: indentation }}
                    >
                      {/* Timeline dot */}
                      <div
                        className={`absolute w-4 h-4 rounded-full border-2 border-white shadow ${getDotStyle(log)}`}
                        style={{ left: indentation - 32 }}
                      />

                      {/* Depth guide line (for nested contexts) */}
                      {showDepthIndentation && log.depth && log.depth > 1 && (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-gray-300"
                          style={{ left: indentation - 16 }}
                        />
                      )}

                      {/* Content card */}
                      <div className="flex-1 bg-white rounded-lg border p-4 ml-4 shadow-sm hover:shadow-md transition-shadow">
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Client/Server source badge */}
                            {log.source === 'client' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Client
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                Server
                              </span>
                            )}
                            <LogLevelBadge level={log.level} />
                            {!groupByPackage && (
                              <span className="text-sm font-medium text-gray-900">{log.package}</span>
                            )}
                            {/* Depth badge */}
                            {showDepthIndentation && log.depth && log.depth > 1 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                depth: {log.depth}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500">{formatTime(log.timestamp)}</span>
                            <span className="text-xs text-gray-400 ml-2">{formatDate(log.timestamp)}</span>
                          </div>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-700 mb-2">{log.message}</p>

                        {/* Context info badges */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {log.sessionId && !selectedSession && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                              Session: {log.sessionId}
                            </span>
                          )}
                          {log.reference && (
                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                              Ref: {log.reference}
                            </span>
                          )}
                          {/* Client URL for client-side logs */}
                          {log.source === 'client' && typeof log.data?.url === 'string' && (
                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 max-w-xs truncate">
                              URL: {log.data.url}
                            </span>
                          )}
                          <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                            {log.filename}:{log.line}
                          </span>
                        </div>

                        {/* Expandable data section */}
                        {log.data && (
                          <details className="mt-3">
                            <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                              View data
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-x-auto border">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
