import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.park.fan',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: 'https://api.park.fan/v1/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        // Redirect legacy routes (missing locale) to default locale (en)
        // Matches checks for paths that do NOT start with en|de|api|_next or contain a dot (file extension)
        // The .+ ensures we don't match the root path '/'
        source: '/:slug((?!en|de|api|_next|.*\\..*).+)',
        destination: '/en/:slug',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
