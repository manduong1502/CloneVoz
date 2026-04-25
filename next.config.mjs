/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ioredis', 'pusher'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // Tắt cảnh báo xr-spatial-tracking
            key: 'Permissions-Policy',
            value: 'xr-spatial-tracking=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
