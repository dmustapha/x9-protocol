import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Vanish mock API route for Plan B
  async rewrites() {
    return process.env.VANISH_API_KEY
      ? []
      : [
          {
            source: '/mock/vanish/:path*',
            destination: '/api/mock/vanish/:path*',
          },
        ];
  },
};

export default nextConfig;
