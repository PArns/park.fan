import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withBundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Cache Components (PPR) is intentionally OFF. The high-traffic detail pages (park, attraction,
  // home) are `export const dynamic = 'force-dynamic'` — rendered per request so there is NO per-URL
  // ISR shell write (the catalog × 6-locale write explosion that PPR caused). Content is server-
  // rendered (content-first, no skeleton); live data is client-loaded (React Query → CDN-cached /api
  // routes). Server data fetches are cached in the Vercel Data Cache via `fetch` `next:{revalidate}`
  // (see lib/api/*). Content pages (glossary, legal, hubs) stay static via generateStaticParams.
  staticPageGenerationTimeout: 180,
  // Include blog content + images in the deployment bundle. lib/blog/authors,
  // lib/blog/categories and lib/blog/gallery read these via process.cwd() at
  // runtime, which Next.js can't statically trace through imports.
  outputFileTracingIncludes: {
    '/[locale]/blog/**': ['./content/blog/**/*', './public/blog/**/*'],
    '/sitemap.xml': ['./content/blog/**/*'],
    '/[locale]': ['./content/blog/**/*'],
  },
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
    ],
    // Optimize CSS to reduce render-blocking
    optimizeCss: true,
    // NOTE: no `webVitalsAttribution` here. In Next 16 it does not wire attribution into
    // `useReportWebVitals` (the flag's env vars are defined but never consumed). The RUM
    // reporter imports `web-vitals/attribution` directly instead — see
    // components/analytics/web-vitals-reporter.tsx.
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1200, 1920, 2560, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    qualities: [50, 60, 75, 85, 90],
    minimumCacheTTL: 31536000, // 1 year
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.park.fan',
      },
    ],
  },
  async redirects() {
    // All locale → canonical glossary URL segment mappings (including EN)
    const localeSegments: Record<string, string> = {
      en: 'glossary',
      de: 'glossar',
      fr: 'glossaire',
      it: 'glossario',
      nl: 'woordenboek',
      es: 'glosario',
    };
    // All known segments including legacy woordenlijst (old NL segment before rename to woordenboek)
    const allSegments = [...new Set([...Object.values(localeSegments), 'woordenlijst'])];
    const rules: { source: string; destination: string; permanent: boolean }[] = [];

    // 1. Cross-locale wrong segments: /[locale]/[wrong-segment] → /[locale]/[correct-segment]
    //    Covers: EN locale (was missing), /de/glossary (EN segment under DE), old woordenlijst
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
    //    e.g. /glossar/top-hat → /de/glossar/top-hat, /glossary/dark-ride → /en/glossary/dark-ride
    for (const [locale, segment] of Object.entries(localeSegments)) {
      rules.push(
        { source: `/${segment}`, destination: `/${locale}/${segment}`, permanent: true },
        { source: `/${segment}/:term`, destination: `/${locale}/${segment}/:term`, permanent: true }
      );
    }
    // Old NL segment without locale prefix
    rules.push(
      { source: '/woordenlijst', destination: '/nl/woordenboek', permanent: true },
      { source: '/woordenlijst/:term', destination: '/nl/woordenboek/:term', permanent: true }
    );

    // 3. Old /v1/parks/ API URLs → current frontend URLs (no locale prefix — middleware detects it)
    rules.push(
      {
        source: '/v1/parks/:continent/:country/:city/:park/attractions/:slug',
        destination: '/parks/:continent/:country/:city/:park/:slug',
        permanent: true,
      },
      {
        source: '/v1/parks/:continent/:country/:city/:park',
        destination: '/parks/:continent/:country/:city/:park',
        permanent: true,
      }
    );
    // Note: /parks/:path* without locale is handled by the next-intl middleware (locale detection)
    // No explicit redirect needed here.

    // 4. Renamed parks
    rules.push(
      {
        source: '/:locale/parks/europe/france/paris/walt-disney-studios-park',
        destination: '/:locale/parks/europe/france/paris/disney-adventure-world',
        permanent: true,
      },
      {
        source: '/parks/europe/france/paris/walt-disney-studios-park',
        destination: '/parks/europe/france/paris/disney-adventure-world',
        permanent: true,
      }
    );

    // 5. Relocated cities — the API moved the Disneyland Paris resort from the
    // old `marne-la-vallee` city slug to `paris`. Old footer links (fixed in
    // c346615) and the Google index still point at marne-la-vallee, producing
    // 404s. Forward the whole city to paris so e.g. disneyland-park resolves.
    rules.push(
      {
        source: '/:locale/parks/europe/france/marne-la-vallee/:park*',
        destination: '/:locale/parks/europe/france/paris/:park*',
        permanent: true,
      },
      {
        source: '/parks/europe/france/marne-la-vallee/:park*',
        destination: '/parks/europe/france/paris/:park*',
        permanent: true,
      }
    );

    // 6. Re-slugged/relocated cities — the API switched its umlaut transliteration
    // to ae/oe/ue (Brühl: bruhl → bruehl, Günzburg: gunzburg → guenzburg) and moved
    // several parks to new city slugs (verified against the GSC 404 export of
    // 2026-07-06 + the current /v1/discovery/geo structure). The Google index still
    // holds the old URLs (park, attractions, city hub); 301 them (incl. the bare
    // city-hub URL via the zero-or-more :park* wildcard) so link equity transfers
    // instead of 404ing. Park/attraction URLs with other stale geo segments are
    // additionally healed at request time by findRelocatedParkRedirect (redirect-utils).
    const relocatedCities: Array<[string, string, string]> = [
      ['europe/germany', 'bruhl', 'bruehl'], // Phantasialand (umlaut re-slug)
      ['europe/germany', 'gunzburg', 'guenzburg'], // Legoland Deutschland (umlaut re-slug)
      ['north-america/mexico', 'cocoyoc', 'oaxtepec'], // Hurricane Harbor Oaxtepec
      ['north-america/united-states', 'glendale', 'phoenix'], // Hurricane Harbor Phoenix
      ['north-america/united-states', 'valencia', 'santa-clarita'], // Six Flags Magic Mountain
      ['north-america/united-states', 'willis', 'spring'], // Hurricane Harbor Splashtown
    ];
    for (const [geo, oldCity, newCity] of relocatedCities) {
      rules.push(
        {
          source: `/:locale/parks/${geo}/${oldCity}/:park*`,
          destination: `/:locale/parks/${geo}/${newCity}/:park*`,
          permanent: true,
        },
        {
          source: `/parks/${geo}/${oldCity}/:park*`,
          destination: `/parks/${geo}/${newCity}/:park*`,
          permanent: true,
        }
      );
    }

    // 7. Renamed parks (from the GSC 404 export, matched against current API slugs).
    // Explicit list only — NO blanket six-flags-* rule: six-flags-hurricane-harbor-
    // {los-angeles,oklahoma-city,rockford} and many six-flags-* parks still exist
    // under their old slugs. :city stays a param so old AND new city slugs both
    // match (rule 6 may fix the city in a separate hop); :rest* carries attractions.
    const renamedParks: Array<[string, string, string]> = [
      [
        'north-america/:country/:city',
        'six-flags-hurricane-harbor-arlington',
        'hurricane-harbor-arlington',
      ],
      [
        'north-america/:country/:city',
        'six-flags-hurricane-harbor-concord',
        'hurricane-harbor-concord',
      ],
      [
        'north-america/:country/:city',
        'six-flags-hurricane-harbor-new-jersey',
        'hurricane-harbor-new-jersey',
      ],
      [
        'north-america/:country/:city',
        'six-flags-hurricane-harbor-oaxtepec',
        'hurricane-harbor-oaxtepec',
      ],
      [
        'north-america/:country/:city',
        'six-flags-hurricane-harbor-phoenix',
        'hurricane-harbor-phoenix',
      ],
      [
        'north-america/:country/:city',
        'six-flags-hurricane-harbor-splashtown',
        'hurricane-harbor-splashtown',
      ],
      ['north-america/:country/:city', 'universals-epic-universe', 'universal-epic-universe'],
      ['north-america/:country/:city', 'universals-volcano-bay', 'universal-volcano-bay'],
      [
        'north-america/:country/:city',
        'disneys-animal-kingdom-theme-park',
        'disney-animal-kingdom',
      ],
      ['north-america/:country/:city', 'adventure-island', 'adventure-island-tampa'],
      ['europe/:country/:city', 'toverland', 'attractiepark-toverland'],
      ['asia/:country/:city', 'lotte-world', 'lotte-world-adventure'],
    ];
    for (const [scope, oldPark, newPark] of renamedParks) {
      rules.push(
        {
          source: `/:locale/parks/${scope}/${oldPark}/:rest*`,
          destination: `/:locale/parks/${scope}/${newPark}/:rest*`,
          permanent: true,
        },
        {
          source: `/parks/${scope}/${oldPark}/:rest*`,
          destination: `/parks/${scope}/${newPark}/:rest*`,
          permanent: true,
        }
      );
    }
    // One-offs that also change the city or collapse a resort URL:
    // - universal-studios@bull-creek → Universal Studios Hollywood (Los Angeles)
    // - walt-disney-world resort page → Orlando city hub (parks are separate pages now)
    // - disneyland-paris resort page → Disneyland Park (Paris)
    rules.push(
      {
        source: '/:locale/parks/north-america/united-states/bull-creek/universal-studios/:rest*',
        destination:
          '/:locale/parks/north-america/united-states/los-angeles/universal-studios-hollywood/:rest*',
        permanent: true,
      },
      {
        source: '/parks/north-america/united-states/bull-creek/universal-studios/:rest*',
        destination:
          '/parks/north-america/united-states/los-angeles/universal-studios-hollywood/:rest*',
        permanent: true,
      },
      {
        source: '/:locale/parks/north-america/united-states/orlando/walt-disney-world/:rest*',
        destination: '/:locale/parks/north-america/united-states/orlando',
        permanent: true,
      },
      {
        source: '/parks/north-america/united-states/orlando/walt-disney-world/:rest*',
        destination: '/parks/north-america/united-states/orlando',
        permanent: true,
      },
      {
        source: '/:locale/parks/europe/france/:city/disneyland-paris/:rest*',
        destination: '/:locale/parks/europe/france/paris/disneyland-park/:rest*',
        permanent: true,
      },
      {
        source: '/parks/europe/france/:city/disneyland-paris/:rest*',
        destination: '/parks/europe/france/paris/disneyland-park/:rest*',
        permanent: true,
      }
    );

    // 8. Old URL scheme without the /parks segment — /{locale}/{continent}/... and
    // /{continent}/... URLs are still in Google's index and currently hard-404.
    const CONTINENTS = 'europe|north-america|south-america|asia|oceania|africa';
    rules.push(
      {
        source: `/:locale(en|de|nl|fr|es|it)/:continent(${CONTINENTS})/:path*`,
        destination: '/:locale/parks/:continent/:path*',
        permanent: true,
      },
      {
        source: `/:continent(${CONTINENTS})/:path*`,
        destination: '/parks/:continent/:path*',
        permanent: true,
      }
    );

    // 9. Doubled locale prefixes (/en/en/glossary, /de/de/glossar, /es/es — seen in
    // the GSC 404 export). Only same-locale doubles exist, so collapse exactly those.
    for (const locale of ['en', 'de', 'nl', 'fr', 'es', 'it']) {
      rules.push({
        source: `/${locale}/${locale}/:path*`,
        destination: `/${locale}/:path*`,
        permanent: true,
      });
    }

    // 10. The web manifest lives at /manifest.webmanifest (app/manifest.ts);
    // crawlers still request the conventional /manifest.json.
    rules.push({ source: '/manifest.json', destination: '/manifest.webmanifest', permanent: true });

    return rules;
  },
  async rewrites() {
    // Serve localized glossary segments via the actual /glossary route.
    // e.g. /de/glossar/:term → /de/glossary/:term (internal, no URL change)
    const localeSegments: Record<string, string> = {
      de: 'glossar',
      fr: 'glossaire',
      it: 'glossario',
      nl: 'woordenboek',
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
      // Cacheable /api routes — these MUST come AFTER the blanket /api no-store rule above, because
      // Next applies header rules last-match-wins per key
      // (nextjs.org/docs/app/api-reference/config/next-config-js/headers#header-overriding-behavior):
      // a specific rule placed *after* the broad one re-enables caching for just those paths. (og +
      // featured-parks used to sit *before* the blanket, so it silently overrode them to no-store —
      // moved here too.) The park calendar/stats/nowcast back the park page's client-loaded
      // BestDays/Stats/weather sections; CDN-caching keeps the heavy calendar (~450 KB) + the stats
      // off the backend on every park view.
      {
        source: '/api/og/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
          },
        ],
      },
      {
        source: '/api/parks/:continent/:country/:city/:park/calendar',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
      {
        source: '/api/parks/:continent/:country/:city/:park/stats',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=82800' },
        ],
      },
      {
        // Attraction detail (history + hourlyForecast time-series) backing the attraction page's
        // client-loaded daily chart + history grid. Like calendar/stats, this specific rule AFTER the
        // blanket /api no-store re-enables CDN caching — without it the route handler's Cache-Control
        // is clobbered to no-store. Today's forecast refines through the day, so a short window
        // (10 min + 5 min SWR) matches the backend's ~5-min attraction cache.
        source: '/api/parks/:continent/:country/:city/:park/attractions/:attraction',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=600, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/api/parks/:continent/:country/:city/:park/weather/nowcast',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },
      {
        // Hub "X parks open now" live-counts batch, polled by every continent/country/city card grid.
        // A 60s shared CDN window collapses concurrent polls off the backend (it was no-store).
        source: '/api/discovery/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },
      {
        // Live park poll (use-live-park-data, every visitor every 5 min). The backend already
        // caches this 5 min (Redis + CDN), so data can never be fresher than that — a 60s shared
        // CDN window adds no real staleness but collapses all concurrent visitors of a park onto
        // a single function invocation (fetch + lean transform + re-serialize of the full payload).
        source: '/api/parks/:continent/:country/:city/:park',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=240' },
        ],
      },
      {
        // Homepage live stats (ticker / realtime / geo-live), polled by every homepage visitor
        // every 5 min — param-less shared data, same collapse rationale as discovery above.
        source: '/api/analytics/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },
      {
        // Search results are query-keyed and the backend caches them 60s — a matching CDN window
        // collapses popular queries without changing freshness.
        source: '/api/search',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },
      {
        // Glossary search runs over build-time data — responses are immutable until the next
        // deploy (which purges the CDN), so cache them hard.
        source: '/api/glossary-search',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=86400' },
        ],
      },
      {
        // Background image list is a filesystem walk over build-time assets — immutable per deploy.
        source: '/api/parks/backgrounds',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=86400' },
        ],
      },
      {
        // Park image redirect (slug → optimizer). The slug→file mapping is stable,
        // so cache the 307 at the edge to skip the resolver hop on cache miss.
        // MUST stay after the blanket /api no-store rule to re-enable CDN caching.
        source: '/api/image',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
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
