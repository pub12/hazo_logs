'use client';

import React, { useState } from 'react';
import { LogLevelBadge } from './LogLevelBadge.js';
import type { LogTableProps, LogEntryDisplay } from '../types.js';

/**
 * Table component for displaying log entries
 */
export function LogTable({ logs, isLoading = false }: LogTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const shortenId = (id: string | undefined) => {
    if (!id) return '';
    return id.length > 8 ? `${id.slice(0, 8)}...` : id;
  };

  const toggleRow = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const hasExpandableContent = (log: LogEntryDisplay) => {
    return log.data || log.sessionId || log.reference;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading logs...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No logs found for the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Context
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Level
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Package
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Message
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log, index) => (
            <React.Fragment key={index}>
              <tr
                className={`hover:bg-gray-50 ${
                  hasExpandableContent(log) ? 'cursor-pointer' : ''
                } ${expandedRow === index ? 'bg-gray-50' : ''} ${
                  log.source === 'client' ? 'bg-purple-50/50' : ''
                }`}
                onClick={() => hasExpandableContent(log) && toggleRow(index)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  {log.source === 'client' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Client
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      Server
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                  <span title={log.executionId}>{shortenId(log.executionId)}</span>
                  {log.sessionId && (
                    <span className="ml-2 text-blue-600" title={log.sessionId}>
                      S:{shortenId(log.sessionId)}
                    </span>
                  )}
                  {log.reference && (
                    <span className="ml-2 text-green-600" title={log.reference}>
                      R:{log.reference}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {formatTimestamp(log.timestamp)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <LogLevelBadge level={log.level} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.package}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate">
                  {log.message}
                  {hasExpandableContent(log) && (
                    <span className="ml-2 text-gray-400 text-xs">
                      {expandedRow === index ? '▼' : '▶'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {log.filename}:{log.line}
                </td>
              </tr>
              {expandedRow === index && hasExpandableContent(log) && (
                <tr>
                  <td colSpan={7} className="px-4 py-3 bg-gray-50">
                    <div className="space-y-2">
                      {/* Source indicator for client logs */}
                      {log.source === 'client' && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-purple-100 text-purple-800">
                            Client-side Log
                          </span>
                          {typeof log.data?.url === 'string' && (
                            <span className="text-gray-500">
                              from: <span className="font-mono text-purple-700">{log.data.url}</span>
                            </span>
                          )}
                        </div>
                      )}
                      {/* Context info */}
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className="text-gray-500">Execution ID:</span>{' '}
                          <span className="font-mono text-gray-700">{log.executionId}</span>
                        </div>
                        {log.sessionId && (
                          <div>
                            <span className="text-gray-500">Session ID:</span>{' '}
                            <span className="font-mono text-blue-700">{log.sessionId}</span>
                          </div>
                        )}
                        {log.reference && (
                          <div>
                            <span className="text-gray-500">Reference:</span>{' '}
                            <span className="font-mono text-green-700">{log.reference}</span>
                          </div>
                        )}
                      </div>
                      {/* Client browser info */}
                      {log.source === 'client' && typeof log.data?.userAgent === 'string' && (
                        <div className="text-xs">
                          <span className="text-gray-500">User Agent:</span>{' '}
                          <span className="font-mono text-gray-600">{log.data.userAgent}</span>
                        </div>
                      )}
                      {/* Data */}
                      {log.data && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Data:</div>
                          <pre className="text-xs text-gray-700 bg-gray-100 p-3 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
