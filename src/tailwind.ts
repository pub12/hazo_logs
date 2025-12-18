/**
 * Tailwind CSS configuration helpers for hazo_logs
 *
 * Consumers using the hazo_logs UI components need to:
 * 1. Add the content path to their tailwind.config.ts
 * 2. Add the safelist classes to prevent purging of dynamic classes
 *
 * Usage in consumer's tailwind.config.ts:
 *
 * ```typescript
 * import { tailwindSafelist, tailwindContentPath } from 'hazo_logs/tailwind';
 *
 * export default {
 *   content: [
 *     './src/**\/*.{js,ts,jsx,tsx}',
 *     tailwindContentPath,
 *   ],
 *   safelist: tailwindSafelist,
 *   // ... rest of config
 * };
 * ```
 */

/**
 * Content path for Tailwind to scan hazo_logs UI components
 * Add this to your tailwind.config.ts content array
 */
export const tailwindContentPath = './node_modules/hazo_logs/dist/**/*.{js,jsx}';

/**
 * Safelist of dynamic Tailwind classes used by hazo_logs UI components
 * These classes are constructed dynamically and would otherwise be purged
 */
export const tailwindSafelist: string[] = [
  // LogLevelBadge - level-specific colors
  'bg-red-100',
  'text-red-700',
  'border-red-200',
  'bg-yellow-100',
  'text-yellow-700',
  'border-yellow-200',
  'bg-blue-100',
  'text-blue-700',
  'border-blue-200',
  'bg-gray-100',
  'text-gray-600',
  'border-gray-200',

  // LogTimeline - dot colors for log levels
  'bg-red-500',
  'bg-yellow-500',
  'bg-blue-500',
  'bg-gray-400',

  // LogTimeline - client log ring indicator
  'ring-2',
  'ring-purple-400',
  'ring-offset-1',

  // LogTable & LogTimeline - source badges (client/server)
  'bg-purple-100',
  'text-purple-800',
  'bg-purple-50',
  'bg-purple-50/50',
  'text-purple-700',
  'border-purple-200',

  // LogTimeline - package grouping
  'bg-purple-500',
  'text-purple-600',
  'bg-purple-200',

  // Context badges
  'bg-blue-50',
  'bg-green-50',
  'text-green-700',
  'border-green-200',
  'text-green-600',
  'text-blue-600',

  // LogViewerPage - active filter badges
  'bg-blue-100',
  'text-blue-800',

  // Tab navigation states
  'border-blue-500',
  'text-blue-600',
  'border-transparent',
];

/**
 * Tailwind preset for hazo_logs
 * Alternative to manually adding safelist - use as a preset
 *
 * Usage:
 * ```typescript
 * import { hazoLogsPreset } from 'hazo_logs/tailwind';
 *
 * export default {
 *   presets: [hazoLogsPreset],
 *   content: [
 *     './src/**\/*.{js,ts,jsx,tsx}',
 *     './node_modules/hazo_logs/dist/**\/*.{js,jsx}',
 *   ],
 * };
 * ```
 */
export const hazoLogsPreset = {
  safelist: tailwindSafelist,
};

export default {
  tailwindSafelist,
  tailwindContentPath,
  hazoLogsPreset,
};
