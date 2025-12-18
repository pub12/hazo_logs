'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HazoUiMultiFilterDialog,
  HazoUiMultiSortDialog,
  type FilterField,
  type FilterConfig,
  type SortField,
  type SortConfig,
} from 'hazo_ui';
import { LogTable } from './LogTable.js';
import { LogTimeline } from './LogTimeline.js';
import { LogPagination } from './LogPagination.js';
import type {
  LogViewerPageProps,
  LogQueryResponse,
  LogDatesResponse,
  LogPackagesResponse,
  LogExecutionIdsResponse,
  LogSessionIdsResponse,
  LogReferencesResponse,
  LogEntryDisplay,
} from '../types.js';

const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];

// Tab type
type ViewTab = 'table' | 'timeline';

/**
 * Main Log Viewer Page Component
 */
export function LogViewerPage({
  apiBasePath = '/api/logs',
  title = 'Log Viewer',
  className = '',
  embedded = false,
  showHeader = true,
}: LogViewerPageProps) {
  // State
  const [logs, setLogs] = useState<LogEntryDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<ViewTab>('table');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Date filter state
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availablePackages, setAvailablePackages] = useState<string[]>([]);
  const [availableExecutionIds, setAvailableExecutionIds] = useState<string[]>([]);
  const [availableSessionIds, setAvailableSessionIds] = useState<string[]>([]);
  const [availableReferences, setAvailableReferences] = useState<string[]>([]);

  // Filter state (hazo_ui format)
  const [filters, setFilters] = useState<FilterConfig[]>([]);

  // Sort state (hazo_ui format)
  const [sorts, setSorts] = useState<SortConfig[]>([
    { field: 'timestamp', direction: 'desc' },
  ]);

  // Timeline-specific state
  const [timelineSelectedSession, setTimelineSelectedSession] = useState<string | null>(null);

  // Fetch available dates
  const fetchDates = useCallback(async () => {
    try {
      const response = await fetch(`${apiBasePath}?action=dates`);
      if (response.ok) {
        const data = (await response.json()) as LogDatesResponse;
        setAvailableDates(data.dates);
        if (data.dates.length > 0 && !data.dates.includes(selectedDate)) {
          setSelectedDate(data.dates[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dates:', err);
    }
  }, [apiBasePath, selectedDate]);

  // Fetch available packages
  const fetchPackages = useCallback(async () => {
    try {
      const response = await fetch(`${apiBasePath}?action=packages&date=${selectedDate}`);
      if (response.ok) {
        const data = (await response.json()) as LogPackagesResponse;
        setAvailablePackages(data.packages);
      }
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    }
  }, [apiBasePath, selectedDate]);

  // Fetch available execution IDs
  const fetchExecutionIds = useCallback(async () => {
    try {
      const response = await fetch(`${apiBasePath}?action=executionIds&date=${selectedDate}`);
      if (response.ok) {
        const data = (await response.json()) as LogExecutionIdsResponse;
        setAvailableExecutionIds(data.executionIds);
      }
    } catch (err) {
      console.error('Failed to fetch execution IDs:', err);
    }
  }, [apiBasePath, selectedDate]);

  // Fetch available session IDs
  const fetchSessionIds = useCallback(async () => {
    try {
      const response = await fetch(`${apiBasePath}?action=sessionIds&date=${selectedDate}`);
      if (response.ok) {
        const data = (await response.json()) as LogSessionIdsResponse;
        setAvailableSessionIds(data.sessionIds);
      }
    } catch (err) {
      console.error('Failed to fetch session IDs:', err);
    }
  }, [apiBasePath, selectedDate]);

  // Fetch available references
  const fetchReferences = useCallback(async () => {
    try {
      const response = await fetch(`${apiBasePath}?action=references&date=${selectedDate}`);
      if (response.ok) {
        const data = (await response.json()) as LogReferencesResponse;
        setAvailableReferences(data.references);
      }
    } catch (err) {
      console.error('Failed to fetch references:', err);
    }
  }, [apiBasePath, selectedDate]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('date', selectedDate);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      // Apply filters from hazo_ui format
      const levelFilters = filters.filter(f => f.field === 'level').map(f => f.value);
      if (levelFilters.length > 0) {
        params.set('level', levelFilters.join(','));
      }

      const packageFilters = filters.filter(f => f.field === 'package').map(f => f.value);
      if (packageFilters.length > 0) {
        params.set('package', packageFilters.join(','));
      }

      const executionIdFilters = filters.filter(f => f.field === 'executionId').map(f => f.value);
      if (executionIdFilters.length > 0) {
        params.set('executionId', executionIdFilters.join(','));
      }

      const sessionIdFilters = filters.filter(f => f.field === 'sessionId').map(f => f.value);
      if (sessionIdFilters.length > 0) {
        params.set('sessionId', sessionIdFilters.join(','));
      }

      const referenceFilters = filters.filter(f => f.field === 'reference').map(f => f.value);
      if (referenceFilters.length > 0) {
        params.set('reference', referenceFilters.join(','));
      }

      const searchFilter = filters.find(f => f.field === 'search');
      if (searchFilter?.value) {
        params.set('search', searchFilter.value);
      }

      // Apply sorting from hazo_ui format
      if (sorts.length > 0) {
        params.set('sortBy', sorts[0].field);
        params.set('sortOrder', sorts[0].direction);
      }

      const response = await fetch(`${apiBasePath}?${params.toString()}`);

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to fetch logs');
      }

      const data = (await response.json()) as LogQueryResponse;
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiBasePath, selectedDate, page, pageSize, filters, sorts]);

  // Initial load
  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  // Fetch filter options when date changes
  useEffect(() => {
    fetchPackages();
    fetchExecutionIds();
    fetchSessionIds();
    fetchReferences();
  }, [fetchPackages, fetchExecutionIds, fetchSessionIds, fetchReferences]);

  // Fetch logs when dependencies change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle filter changes from hazo_ui
  const handleFilterChange = (newFilters: FilterConfig[]) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Handle sort changes from hazo_ui
  const handleSortChange = (newSorts: SortConfig[]) => {
    setSorts(newSorts);
    setPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchLogs();
  };

  // Filter fields configuration for hazo_ui
  const filterFields: FilterField[] = useMemo(() => [
    {
      value: 'level',
      label: 'Log Level',
      type: 'combobox' as const,
      comboboxOptions: LOG_LEVELS.map(level => ({
        value: level,
        label: level.toUpperCase(),
      })),
    },
    {
      value: 'package',
      label: 'Package',
      type: 'combobox' as const,
      comboboxOptions: availablePackages.map(pkg => ({ value: pkg, label: pkg })),
    },
    {
      value: 'executionId',
      label: 'Execution',
      type: 'combobox' as const,
      comboboxOptions: availableExecutionIds.map(id => ({ value: id, label: id })),
    },
    {
      value: 'sessionId',
      label: 'Session',
      type: 'combobox' as const,
      comboboxOptions: availableSessionIds.map(id => ({ value: id, label: id })),
    },
    {
      value: 'reference',
      label: 'Reference',
      type: 'combobox' as const,
      comboboxOptions: availableReferences.map(ref => ({ value: ref, label: ref })),
    },
    {
      value: 'search',
      label: 'Search',
      type: 'text' as const,
    },
  ], [availablePackages, availableExecutionIds, availableSessionIds, availableReferences]);

  // Sort fields configuration for hazo_ui
  const sortFields: SortField[] = useMemo(() => [
    { value: 'timestamp', label: 'Timestamp' },
    { value: 'level', label: 'Level' },
    { value: 'package', label: 'Package' },
    { value: 'executionId', label: 'Execution' },
    { value: 'sessionId', label: 'Session' },
    { value: 'reference', label: 'Reference' },
  ], []);

  // Container classes based on embedded mode
  const containerClass = embedded
    ? `flex flex-col h-full ${className}`
    : `min-h-screen bg-gray-50 ${className}`;

  const headerClass = embedded
    ? 'p-4 border-b bg-white'
    : 'bg-white shadow';

  const headerInnerClass = embedded
    ? ''
    : 'px-4 sm:px-6 lg:px-8 py-4';

  const contentClass = embedded
    ? 'flex-1 overflow-auto p-4'
    : 'px-4 sm:px-6 lg:px-8 py-6';

  return (
    <div className={containerClass}>
      {/* Header */}
      {showHeader && (
        <div className={headerClass}>
          <div className={headerInnerClass}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className={embedded ? 'text-xl font-bold text-gray-900' : 'text-2xl font-bold text-gray-900'}>
                {title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Date selector */}
                <div className="flex items-center gap-2">
                  <label htmlFor="date" className="text-sm font-medium text-gray-700">
                    Date:
                  </label>
                  <select
                    id="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {availableDates.map((date) => (
                      <option key={date} value={date}>
                        {date}
                      </option>
                    ))}
                  </select>
                </div>

                {/* hazo_ui Filter Dialog */}
                <HazoUiMultiFilterDialog
                  availableFields={filterFields}
                  initialFilters={filters}
                  onFilterChange={handleFilterChange}
                />

                {/* hazo_ui Sort Dialog */}
                <HazoUiMultiSortDialog
                  availableFields={sortFields}
                  initialSortFields={sorts}
                  onSortChange={handleSortChange}
                />

                {/* Refresh button */}
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Active filters summary */}
            {filters.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">Active filters:</span>
                {filters.map((filter, index) => (
                  <span
                    key={`${filter.field}-${index}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {filter.field}: {String(filter.value)}
                  </span>
                ))}
                <button
                  onClick={() => handleFilterChange([])}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={contentClass}>
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            {error}
          </div>
        ) : (
          <div className={embedded ? 'bg-white rounded-lg overflow-hidden border' : 'bg-white shadow rounded-lg overflow-hidden'}>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'table'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Table View
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'timeline'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Timeline View
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'table' ? (
              <>
                <LogTable logs={logs} isLoading={isLoading} />
                {!isLoading && logs.length > 0 && (
                  <LogPagination
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                  />
                )}
              </>
            ) : (
              <LogTimeline
                logs={logs}
                isLoading={isLoading}
                availableSessions={availableSessionIds}
                selectedSession={timelineSelectedSession ?? undefined}
                onSessionChange={setTimelineSelectedSession}
                groupByPackage={true}
                showDepthIndentation={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
