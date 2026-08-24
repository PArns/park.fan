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
    // Blog images no longer need tracing: galleries resolve through the media
    // manifest (a normal import Next follows) instead of reading /public at runtime.
    '/[locale]/blog/**': ['./content/blog/**/*'],
    '/sitemap.xml': ['./content/blog/**/*'],
    '/[locale]': ['./content/blog/**/*'],
    // The OG renderer inlines its images off disk instead of fetching them over HTTP on every
    // render (see lib/og/brand-mark.tsx and lib/og/background-photo.ts). Next can't trace a
    // runtime readFileSync, so the assets are named explicitly: the `-16x9` crops are what the
    // 1200×630 card paints (~119 KB each vs ~376 KB for the uncropped source), cut into
    // public/media by `scripts/generate-image-crops.mjs` during `prebuild`.
    //
    // Do not budget against this entry. `next build --turbo` never calls `collectBuildTraces`
    // (`bundler !== Bundler.Turbopack` guards the call in next/dist/build/index.js), and that is
    // the only place includes and excludes are applied — so under the build this project ships,
    // every key here is inert; `build:webpack` and `analyze` are the only paths that read them.
    // What actually puts the photos in the OG function is the tracer's own answer to that
    // unresolvable `join(process.cwd(), 'public', …)`: it bundles the whole directory it is
    // rooted at, i.e. all of /public. Which is also why that function has no size headroom to
    // spare — see docs/changelog.md 2.11.0.
    '/api/og/[...path]': [
      './public/logo-dark.png',
      './public/parkfan-dark.png',
      // Every image in the media database now lives under public/media, so one
      // pattern covers the park backgrounds, the ride photos AND the blog covers
      // that used to need a second `*cover*` rule of their own.
      './public/media/**/*-16x9.jpg',
    ],
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
    // Media-database paths carry a `?v=<content hash>` so the optimizer's cache key
    // moves when an image's pixels or focal point change — without it a retargeted
    // crop would be served from the 1-year rendition cache for a year. Next only
    // allows a query on a local image when a pattern permits it, and an omitted
    // `search` means "any query"; the second entry keeps every other local image
    // (logos, icons, textures) on the default no-query rule.
    localPatterns: [{ pathname: '/media/**' }, { pathname: '/**', search: '' }],
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
      // Four entries used to live here — Toverland, Magic Kingdom, Hollywood Studios and Animal
      // Kingdom — and they are deliberately gone rather than flipped again.
      //
      // Upstream (ThemeParks Wiki) does not rename these once, it oscillates. The comment that
      // stood here recorded one flip already ("`toverland -> attractiepark-toverland` used to be
      // listed the other way round"), and upstream has since flipped all four BACK: the API now
      // answers 200 on `attractiepark-toverland`, `magic-kingdom-park`,
      // `disneys-hollywood-studios` and `disneys-animal-kingdom-theme-park`, and 301s the short
      // names to them. A static rule pointing at the short name therefore sent the working URL to
      // one that redirects straight back — four park pages were answering with a redirect LOOP,
      // which a browser reports as a failed navigation (Aug 2026).
      //
      // No rule replaces them because none is needed: the park page already canonicalises on what
      // the API actually returns. It follows the API's 301, notices the slug it is holding differs
      // from the one in the URL and 308s to the real path — verified as the source of the correct
      // `/toverland -> /attractiepark-toverland` redirect. That path follows upstream on its own,
      // through this flip and the next one; a hard-coded pair only ever races it.
      //
      // The entries that remain below are a different case: there the API 404s the old slug
      // instead of redirecting, so nothing dynamic can rescue the URL and a static rule is the
      // only thing standing between an indexed link and a dead end. Before adding one here, check
      // which of the two it is — `curl -sI https://api.park.fan/v1/parks/<geo>/<slug>`. A 301
      // means leave it alone.
      //
      // 'adventure-island' -> 'adventure-island-tampa' was dropped: the park is gone from the
      // API entirely (Tampa now lists only Busch Gardens and Islands of Adventure), so the rule
      // only redirected one dead url to another. A plain 404 is the honest answer.
      ['asia/:country/:city', 'lotte-world', 'lotte-world-adventure'],
      // Upstream re-labelled the Eureka, MO park to its destination name — the API now
      // answers only on `mid-america-parks` (same coordinates, 42 attractions), while
      // `six-flags-st-louis` still 404s the backend on every indexed link.
      ['north-america/:country/:city', 'six-flags-st-louis', 'mid-america-parks'],
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

    // Best-time-to-visit hub: localized segment canonicalization (mirrors glossary).
    // The canonical route folder is the EN slug; non-EN locales live on localized
    // slugs (served via the rewrite below). Redirect wrong-segment + unprefixed URLs.
    const bestTimeSegments: Record<string, string> = {
      en: 'best-time-to-visit',
      de: 'beste-reisezeit',
      fr: 'meilleure-periode-pour-visiter',
      it: 'periodo-migliore-per-visitare',
      nl: 'beste-tijd-om-te-bezoeken',
      es: 'mejor-epoca-para-visitar',
    };
    const bestTimeAll = Object.values(bestTimeSegments);
    for (const [locale, correct] of Object.entries(bestTimeSegments)) {
      for (const wrong of bestTimeAll) {
        if (wrong === correct) continue;
        rules.push({
          source: `/${locale}/${wrong}`,
          destination: `/${locale}/${correct}`,
          permanent: true,
        });
      }
      rules.push({
        source: `/${correct}`,
        destination: `/${locale}/${correct}`,
        permanent: true,
      });
    }

    // "How park.fan works" guide: localized segment canonicalization (mirrors the
    // best-time hub above). The page shipped for a year on `/howto` in all six
    // languages, so the legacy segment is folded into the wrong-segment set — it
    // is what the index, the daily IndexNow push and every old link still name.
    const howtoSegments: Record<string, string> = {
      en: 'how-park-fan-works',
      de: 'so-funktioniert-park-fan',
      fr: 'comment-fonctionne-park-fan',
      it: 'come-funziona-park-fan',
      nl: 'hoe-park-fan-werkt',
      es: 'como-funciona-park-fan',
    };
    const howtoAll = [...Object.values(howtoSegments), 'howto'];
    for (const [locale, correct] of Object.entries(howtoSegments)) {
      for (const wrong of howtoAll) {
        if (wrong === correct) continue;
        rules.push({
          source: `/${locale}/${wrong}`,
          destination: `/${locale}/${correct}`,
          permanent: true,
        });
      }
      rules.push({
        source: `/${correct}`,
        destination: `/${locale}/${correct}`,
        permanent: true,
      });
    }
    // Bare `/howto` is deliberately absent: it names no language, so the intl
    // middleware resolves the visitor's locale first and the rule above then
    // takes `/de/howto` the rest of the way.

    // 11. Blog tag slug unified. French posts carried two spellings of the same tag
    // (`temps-attente` in two posts, `temps-d-attente` in a third), which split the archive
    // in two AND made the cross-locale tag mapping ambiguous, so the French tag pages lost
    // their hreflang alternates entirely (see lib/blog/tags.ts). The content now uses
    // `temps-d-attente` throughout; this keeps the published URL alive.
    rules.push({
      source: '/fr/blog/tag/temps-attente',
      destination: '/fr/blog/tag/temps-d-attente',
      permanent: true,
    });

    // 12. Blog posts that dropped the year from their slug. The Phantasialand
    // guide is evergreen (it is updated in place, not re-published per season),
    // so `-2026` in the URL only made it look stale. The old slugs are indexed,
    // so 301 them. Both the locale-prefixed and the bare form: the bare one is
    // what people paste into chats, and the intl middleware would otherwise
    // resolve it to a locale and then 404 on the missing slug.
    const renamedPosts: Array<[string, string]> = [
      ['phantasialand-tipps-2026', 'phantasialand-tipps'],
      ['phantasialand-wait-times-tips-2026', 'phantasialand-wait-times-tips'],
      ['phantasialand-tiempos-de-espera-consejos-2026', 'phantasialand-tiempos-de-espera-consejos'],
      ['phantasialand-temps-d-attente-conseils-2026', 'phantasialand-temps-d-attente-conseils'],
      ['phantasialand-tempi-di-attesa-consigli-2026', 'phantasialand-tempi-di-attesa-consigli'],
      ['phantasialand-wachttijden-tips-2026', 'phantasialand-wachttijden-tips'],
      ['toverland-troy-wartezeiten-tipps-2026', 'toverland-troy-wartezeiten-tipps'],
    ];
    for (const [oldSlug, newSlug] of renamedPosts) {
      rules.push(
        {
          source: `/:locale(en|de|fr|it|nl|es)/blog/${oldSlug}`,
          destination: `/:locale/blog/${newSlug}`,
          permanent: true,
        },
        {
          source: `/blog/${oldSlug}`,
          destination: `/blog/${newSlug}`,
          permanent: true,
        }
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
    // Best-time-to-visit hub: serve localized segments via the canonical route
    // folder (app/[locale]/best-time-to-visit). EN needs no rewrite.
    const bestTimeSegments: Record<string, string> = {
      de: 'beste-reisezeit',
      fr: 'meilleure-periode-pour-visiter',
      it: 'periodo-migliore-per-visitare',
      nl: 'beste-tijd-om-te-bezoeken',
      es: 'mejor-epoca-para-visitar',
    };
    for (const [locale, segment] of Object.entries(bestTimeSegments)) {
      rules.push({
        source: `/${locale}/${segment}`,
        destination: `/${locale}/best-time-to-visit`,
      });
    }

    // "How park.fan works" guide: serve localized segments via the canonical
    // route folder (app/[locale]/how-park-fan-works). EN needs no rewrite.
    const howtoSegments: Record<string, string> = {
      de: 'so-funktioniert-park-fan',
      fr: 'comment-fonctionne-park-fan',
      it: 'come-funziona-park-fan',
      nl: 'hoe-park-fan-werkt',
      es: 'como-funciona-park-fan',
    };
    for (const [locale, segment] of Object.entries(howtoSegments)) {
      rules.push({
        source: `/${locale}/${segment}`,
        destination: `/${locale}/how-park-fan-works`,
      });
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
      // Static images served from /public. Vercel serves /public with `max-age=0,
      // must-revalidate` by default, and the Image Optimization response INHERITS the source
      // image's Cache-Control — so every `/_next/image` hit came back `max-age=0,
      // must-revalidate` too and browsers re-validated each image on every page view.
      // `images.minimumCacheTTL` does NOT fix this: it only sets the floor for Vercel's own
      // optimizer cache (x-vercel-cache: HIT), not the browser-facing header. Setting a real
      // max-age on the SOURCE is what makes the optimized output cacheable — and it also cuts
      // image transformations/cache writes, which is what Vercel bills for.
      // Trade-off: replacing an image under the same filename won't reach returning browsers
      // for up to 31 days. That is rare here (3 in-place replacements in the last 200 commits);
      // when it matters, change the filename.
      // Kept BEFORE the .svg rule below so SVGs keep their stronger 1-year immutable value
      // (Next applies header rules last-match-wins per key).
      // `media` is where every photo now lives; `images` and `blog` are the pre-media-database
      // trees and are empty today. Dropping them would be tidier, but a rule that silently
      // matches nothing is exactly how this regressed once — the migration moved all 444 files
      // to /media and left the rule naming the old two, so every photo on the site went back to
      // `max-age=0` and re-validating on every page view. They stay listed as a tripwire.
      {
        source: '/:dir(media|images|blog|textures)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2678400' }],
      },
      // Brand/icon PNGs at the root of /public (logo*, parkfan*, icon-*, apple-touch-icon).
      // Single-segment `:file` on purpose: park photos under /images keep the shorter,
      // replaceable 31-day value from the rule above rather than a 1-year immutable one.
      {
        source: '/:file.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
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
      // Cacheable /api routes — these MUST come AFTER the blanket /api no-store rule above, because
      // Next applies header rules last-match-wins per key
      // (nextjs.org/docs/app/api-reference/config/next-config-js/headers#header-overriding-behavior):
      // a specific rule placed *after* the broad one re-enables caching for just those paths. (og +
      // featured-parks used to sit *before* the blanket, so it silently overrode them to no-store —
      // moved here too.) The park calendar/stats/nowcast back the park page's client-loaded
      // BestDays/Stats/weather sections; CDN-caching keeps the heavy calendar (~450 KB) + the stats
      // off the backend on every park view.
      {
        // 30 days, matching the value the route handler sets on its own response. It had to be
        // repeated here and the two had drifted: this rule said 1 day, and a `headers()` rule
        // OVERRIDES a route handler's Cache-Control (that override is the whole reason this entry
        // exists — see the blanket /api no-store above), so the cards were silently re-rendering
        // 30× more often than the route intended. At ~860 ms a render that was most of the OG
        // function bill. 30 days is safe because these cards carry no live data any more: status,
        // crowd level and wait time were deliberately removed from them (see the route), since a
        // social platform re-shows a cached preview for days anyway.
        source: '/api/og/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // The media database catalog. Safe to cache harder than anything else under
        // /api because it carries no live data at all: it changes only when a
        // deployment ships new images or sidecars, and the route hands out a strong
        // ETag derived from the content revision, so a client past the fresh window
        // revalidates into a 304 rather than re-downloading. A day fresh, a week
        // stale-while-revalidate. Repeated here because this rule OVERRIDES the
        // route handler's own Cache-Control (see the blanket /api no-store above) —
        // keep the two in step.
        source: '/api/media/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        // Same for the collection route itself, which `/api/media/:path*` does not match.
        source: '/api/media',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
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
        // is clobbered to no-store.
        //
        // 5 min, down from 10: this response now also carries the ride page's LIVE panel (status,
        // queues, wait time) since useLiveAttractionData stopped polling the whole park for them,
        // and live values must not sit behind a window twice as long as the one the park poll had.
        // 300 is exactly what the backend caches an attraction for (HttpCacheInterceptor(300)), so
        // this adds no origin load — it just stops the edge holding a copy past the point where a
        // fresher one exists.
        source: '/api/parks/:continent/:country/:city/:park/attractions/:attraction',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/api/parks/:continent/:country/:city/:park/weather/nowcast',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },
      {
        // Card-overlay live status batch (use-live-parks-by-region), polled by every hub card grid,
        // the featured-parks strip and the blog's park references. Same 60s collapse rationale as
        // the park poll below; the response is byte-identical for every visitor of a region set,
        // so the window is nearly a pure hit.
        source: '/api/parks/live',
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
      // NOTE — the park and attraction pages cannot be given a Cache-Control from here, and this
      // is now settled on the platform they actually run on, not just locally.
      //
      // They are `export const dynamic = 'force-dynamic'` and answer `private, no-cache, no-store,
      // max-age=0, must-revalidate`. A `headers()` rule overrides Cache-Control for ROUTE HANDLERS
      // (which is what every /api entry above relies on) but not for a dynamic PAGE. Both ways in
      // were measured in Aug 2026 and both lose:
      //
      //   1. `headers()` here, deployed to production. The rule MATCHES — a marker header added
      //      to the same `source` arrived on the park URL and, correctly, not on the `/de/parks/
      //      europe` hub — but `Cache-Control` came back as the page's own value. Confirmed
      //      against a deployment that had definitely rolled out (the `data-dpl-id` in the HTML
      //      changed first). So the older "verified against the dev server" note held on Vercel
      //      too; the routing layer applying rules after the function does not help here.
      //   2. `proxy.ts`. Same picture, one step earlier: a custom marker header set on the
      //      middleware response survives to the client, `Cache-Control` specifically gets
      //      overwritten by the page.
      //
      // What this costs: the Cloudflare Cache Rule in front cannot run on "use cache-control
      // header if present" — with no `s-maxage` to read it would simply bypass. It has to use
      // "ignore cache-control and use this TTL", and that override is why its matcher must
      // exclude `/api/` by hand: without the exclusion it also catches `/api/parks/…` and serves
      // the 60-second live wait-time poll from the page cache. The TTL therefore lives in the
      // dashboard, not in this file. See "The HTML never reaches Cloudflare's cache" in
      // docs/architecture/caching-strategy.md.
      //
      // Do not try this again from here. The only remaining lever at the origin would be giving
      // up force-dynamic, and that brings back the per-URL ISR writes it was chosen to avoid
      // (~250k write units/day in Jun 2026).
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
