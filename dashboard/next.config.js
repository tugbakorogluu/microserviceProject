/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/packages/:path*',
          destination: 'http://localhost:3001/packages/:path*',
        },
        {
          source: '/api/trackings/:path*',
          destination: 'http://localhost:3002/trackings/:path*',
        },
        {
          source: '/api/notifications/:path*',
          destination: 'http://localhost:3003/notifications/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
