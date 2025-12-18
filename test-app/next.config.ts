import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['hazo_logs', 'hazo_ui'],
  // Silence warning about multiple lockfiles
  outputFileTracingRoot: path.join(__dirname, '../'),
};

export default nextConfig;
