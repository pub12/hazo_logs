import type { Config } from 'tailwindcss';
import hazoUiPreset from 'hazo_ui/tailwind-preset';

const config: Config = {
  presets: [hazoUiPreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/hazo_ui/dist/**/*.{js,jsx}',
    './node_modules/hazo_logs/dist/**/*.{js,jsx}',
  ],
  safelist: [
    // Log level badge colors
    'bg-red-100', 'text-red-700', 'border-red-200',
    'bg-yellow-100', 'text-yellow-700', 'border-yellow-200',
    'bg-blue-100', 'text-blue-700', 'border-blue-200',
    'bg-gray-100', 'text-gray-600', 'border-gray-200',
    // Button styles
    'bg-blue-600', 'bg-blue-700', 'hover:bg-blue-700',
    'bg-gray-200', 'hover:bg-gray-300',
    // Filter panel
    'bg-gray-50', 'border-gray-300', 'rounded-md', 'shadow-sm',
    'focus:border-blue-500', 'focus:ring-blue-500',
    // Table
    'bg-white', 'divide-y', 'divide-gray-200',
    'bg-red-50', 'bg-gray-100',
  ],
};

export default config;
