'use client';

import React from 'react';
import type { LogLevelBadgeProps } from '../types.js';

const LEVEL_STYLES = {
  error: 'bg-red-100 text-red-700 border-red-200',
  warn: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  debug: 'bg-gray-100 text-gray-600 border-gray-200',
} as const;

/**
 * Color-coded badge for log levels
 */
export function LogLevelBadge({ level, className = '' }: LogLevelBadgeProps) {
  const styles = LEVEL_STYLES[level] || LEVEL_STYLES.info;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles} ${className}`}
    >
      {level.toUpperCase()}
    </span>
  );
}
