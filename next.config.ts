import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Optimize bundle splitting and tree shaking + Accessibility
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'tailwindcss',
      '@tailwindcss/postcss',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
    ],
    // typedRoutes: true, // Disabled for now due to TypeScript conflicts
  },

  // Compress and optimize output
  compress: true,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Headers for better accessibility and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Accessibility headers
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
