import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/config',
        destination: 'http://localhost:3001/api/admin/config',
      },
      {
        source: '/api/config/:key',
        destination: 'http://localhost:3001/api/admin/config',
      },
      {
        source: '/api/alerts',
        destination: 'http://localhost:3001/api/admin/alerts',
      },
      {
        source: '/api/alerts/:id',
        destination: 'http://localhost:3001/api/admin/alerts/:id',
      },
      {
        source: '/api/cron/status',
        destination: 'http://localhost:3001/api/admin/status',
      },
    ];
  },
};

export default nextConfig;
