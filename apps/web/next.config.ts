import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/config',
        destination: `${backendUrl}/api/admin/config`,
      },
      {
        source: '/api/config/:key',
        destination: `${backendUrl}/api/admin/config`,
      },
      {
        source: '/api/alerts',
        destination: `${backendUrl}/api/admin/alerts`,
      },
      {
        source: '/api/alerts/:id',
        destination: `${backendUrl}/api/admin/alerts/:id`,
      },
      {
        source: '/api/cron/status',
        destination: `${backendUrl}/api/admin/status`,
      },
    ];
  },
};

export default nextConfig;
