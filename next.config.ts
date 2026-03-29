import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withBundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compiler: {
    // Remove React properties that are not needed in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-avatar',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      'recharts',
    ],
    // Optimize CSS to reduce render-blocking
    optimizeCss: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1200, 1920, 2560, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85],
    minimumCacheTTL: 31536000, // 1 year
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.park.fan',
      },
    ],
  },
  async redirects() {
    // Localized glossary segments per non-EN locale (EN uses /glossary directly)
    const localeSegments: Record<string, string> = {
      de: 'glossar',
      fr: 'glossaire',
      it: 'glossario',
      nl: 'woordenlijst',
      es: 'glosario',
    };
    const allSegments = Object.values(localeSegments);
    const rules: { source: string; destination: string; permanent: boolean }[] = [];

    // 1. Cross-locale wrong segments: /[locale]/[wrong-segment] → /[locale]/[correct-segment]
    //    e.g. /nl/glossaire/:term → /nl/woordenlijst/:term  (Google indexed from stale hreflang)
    for (const [locale, correctSegment] of Object.entries(localeSegments)) {
      for (const wrongSegment of allSegments) {
        if (wrongSegment === correctSegment) continue;
        rules.push(
          {
            source: `/${locale}/${wrongSegment}`,
            destination: `/${locale}/${correctSegment}`,
            permanent: true,
          },
          {
            source: `/${locale}/${wrongSegment}/:term`,
            destination: `/${locale}/${correctSegment}/:term`,
            permanent: true,
          }
        );
      }
    }

    // 2. Missing locale prefix: /[segment]/:term → /[locale]/[segment]/:term
    //    e.g. /glossar/top-hat → /de/glossar/top-hat  (indexed before localePrefix: 'always')
    for (const [locale, segment] of Object.entries(localeSegments)) {
      rules.push(
        { source: `/${segment}`, destination: `/${locale}/${segment}`, permanent: true },
        { source: `/${segment}/:term`, destination: `/${locale}/${segment}/:term`, permanent: true }
      );
    }

    return rules;
  },
  async rewrites() {
    // Serve localized glossary segments via the actual /glossary route.
    // e.g. /de/glossar/:term → /de/glossary/:term (internal, no URL change)
    const localeSegments: Record<string, string> = {
      de: 'glossar',
      fr: 'glossaire',
      it: 'glossario',
      nl: 'woordenlijst',
      es: 'glosario',
    };
    const rules: { source: string; destination: string }[] = [];
    for (const [locale, segment] of Object.entries(localeSegments)) {
      rules.push(
        { source: `/${locale}/${segment}`, destination: `/${locale}/glossary` },
        { source: `/${locale}/${segment}/:term`, destination: `/${locale}/glossary/:term` }
      );
    }
    return rules;
  },
  async headers() {
    const localeHeaderRules = ['de', 'fr', 'it', 'nl', 'es', 'en'].map((locale) => ({
      source: `/${locale}/:path*`,
      headers: [{ key: 'Content-Language', value: locale }],
    }));

    return [
      // Content-Language per locale — helps Google associate pages with their language
      ...localeHeaderRules,
      // OG images are semi-static — cache aggressively (must come before the /api no-store rule)
      {
        source: '/api/og/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
          },
        ],
      },
      // Static SVGs served from /public — cache for 1 year (immutable via content hash)
      {
        source: '/:file*.svg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Only disable cache for API and search; let Next.js handle page caching (ISR/static)
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        source: '/:locale/search',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(), microphone=()',
          },
        ],
      },
    ];
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withNextIntl(bundleAnalyzer(nextConfig));
