import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { HOMEPAGE_LINK_HEADER } from './lib/agents/api-catalog';
import { LICENSE_LINK_HEADER } from './lib/agents/licensing';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/**
 * A shared-cache window as the two headers it takes to reach both caches in front of this app.
 *
 * Vercel strips `s-maxage` and `stale-while-revalidate` out of `Cache-Control` before the response
 * leaves its edge unless a `CDN-Cache-Control` rides along, so Cloudflare — which sits in front of
 * Vercel and whose `/api/*` rule reads "use cache-control header if present, bypass if not" — used
 * to see a bare `public`: present, no TTL, therefore its own default edge TTL. See
 * lib/api/cdn-cache-headers.ts, which does the same for route handlers.
 */
const sharedCache = (value: string) => [
  { key: 'Cache-Control', value },
  { key: 'CDN-Cache-Control', value },
];

/**
 * The park calendar's URL segment per locale, for the header rules below.
 *
 * A third copy of a list that `lib/parks/calendar-segments.ts` owns and the rewrite block further
 * down repeats — and it is a copy rather than an import because `next.config.ts` is loaded before
 * the path aliases exist and that module resolves `@/i18n/config`. Unlike the rewrite map this one
 * includes `en`, whose segment needs no rewrite but whose URLs still need a cache window.
 *
 * If a segment ever changes, all three move together: a stale entry here is a calendar page that
 * silently loses its cache window, which nothing renders and no test would catch.
 */
/**
 * A shared-cache window for a page, as the ONE header a dynamic page cannot overwrite.
 *
 * `Cache-Control` is off limits here — a Next page writes its own and wins (see the long note in
 * the headers block). `CDN-Cache-Control` is RFC 9213's targeted header: Vercel forwards it and
 * Cloudflare reads it ahead of `Cache-Control`, so it is the only place a page's edge window can
 * be written down in this repo instead of in a dashboard nobody can diff.
 *
 * The shape is deliberate and the same everywhere: a SHORT `s-maxage` with a LONG
 * `stale-while-revalidate`. Nothing in either repo can purge Cloudflare, so a long fresh window
 * is how an edited blog post or a curated correction stays wrong for a day. With SWR the edge
 * answers from cache and refreshes behind the reader, so a fix is out after roughly the
 * `s-maxage` — at practically the hit rate of the long window.
 */
const edgeCache = (value: string) => [{ key: 'CDN-Cache-Control', value }];

/**
 * A day fresh, an hour of stale on top. The default for anything whose content only moves when
 * a deploy moves it: blog, glossary, the guide hubs, the legal pages, the contribute form.
 *
 * It was an hour until 2026-09-03, out of respect for the fact that NOTHING in either repo can
 * purge Cloudflare — a deploy would otherwise stay invisible for as long as the window runs.
 * The owner takes that trade knowingly and purges by hand after a deploy that has to be seen
 * immediately, which is what buys the other 23 hours.
 *
 * The pages that did NOT come along are the two that date themselves, and the check is in the
 * markup rather than in an opinion: a park page carries the current date once in its markup and
 * **49 times in its FAQPage JSON-LD**, and the calendar hub renders whichever month is current.
 * Both stay at an hour. Blog, glossary, guide and homepage carry the date zero times.
 */
const CONTENT_WINDOW = 'public, s-maxage=86400, stale-while-revalidate=3600';
/** Same window for documents a machine polls rather than a person reads (sitemaps, feeds, agent files). */
const MACHINE_WINDOW = 'public, s-maxage=86400, stale-while-revalidate=3600';

/**
 * The localized URL segments for the three routes that live on a localized slug.
 *
 * Copies of the maps in the `redirects()`/`rewrites()` blocks below, for the same reason
 * `parkCalendarHeaderSegments` is one: this file is loaded before the path aliases exist.
 * `headers()` matches the INCOMING url, before any rewrite, so these must be the localized
 * segments — matching the canonical route folder would set the header on a path nobody requests.
 * A stale entry here is a page that silently loses its cache window; nothing renders it and no
 * test catches it.
 */
const glossaryHeaderSegments = [
  'glossary',
  'glossar',
  'glossaire',
  'glossario',
  'woordenboek',
  'glosario',
];
const bestTimeHeaderSegments = [
  'best-time-to-visit',
  'beste-reisezeit',
  'meilleure-periode-pour-visiter',
  'periodo-migliore-per-visitare',
  'beste-tijd-om-te-bezoeken',
  'mejor-epoca-para-visitar',
];
const howtoHeaderSegments = [
  'how-park-fan-works',
  'so-funktioniert-park-fan',
  'comment-fonctionne-park-fan',
  'come-funziona-park-fan',
  'hoe-park-fan-werkt',
  'como-funciona-park-fan',
];
/**
 * The trip planner, in the six segments a browser actually asks for.
 *
 * The rewrites below serve all six on the English route folder, but a header
 * rule matches the INCOMING path — so `/de/tagesplaner` needs its own entry and
 * a rule on `/:locale/trip-planner` would cover one locale in six. Same list as
 * `PLANNER_SEGMENTS` in `lib/planner/segments.ts`; spelled out here because this
 * file is the build config and cannot import from `@/`.
 */
const plannerHeaderSegments = [
  'trip-planner',
  'tagesplaner',
  'planificateur',
  'pianificatore',
  'dagplanner',
  'planificador',
];

const parkCalendarHeaderSegments: Record<string, string> = {
  en: 'wait-time-calendar',
  de: 'wartezeiten-kalender',
  fr: 'calendrier-temps-attente',
  it: 'calendario-tempi-attesa',
  nl: 'wachttijden-kalender',
  es: 'calendario-tiempos-espera',
};

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
      {
        // YouTube poster frames, for the facade in components/blog/blog-youtube-embed.tsx.
        // Routed through the optimizer ON PURPOSE rather than pointed at directly: the whole
        // point of the facade is that a reader who never presses play never talks to Google, and
        // an `<img src="https://i.ytimg.com/…">` would hand them a request on page load instead
        // of on the tap. Our server fetches it, the browser sees our origin — and gets AVIF at
        // the size it will draw rather than a 480×360 JPEG.
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/vi/**',
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
    const howtoLegacySegment = 'howto';
    const howtoAll = [...Object.values(howtoSegments), howtoLegacySegment];
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
    // Same for the planner: one page, six segments, and a visitor who lands on
    // the wrong one — a shared link, a guessed URL — is sent to theirs rather
    // than served a second copy at a URL that then competes with it.
    const plannerRedirectSegments: Record<string, string> = {
      en: 'trip-planner',
      de: 'tagesplaner',
      fr: 'planificateur',
      it: 'pianificatore',
      nl: 'dagplanner',
      es: 'planificador',
    };
    const plannerAll = Object.values(plannerRedirectSegments);
    for (const [locale, correct] of Object.entries(plannerRedirectSegments)) {
      for (const wrong of plannerAll) {
        if (wrong === correct) continue;
        rules.push({
          source: `/${locale}/${wrong}`,
          destination: `/${locale}/${correct}`,
          permanent: true,
        });
      }
    }

    // Bare `/howto` gets no rule of its own on purpose. It names no language, so
    // any fixed destination here would pin a German visitor to the English page.
    // Left alone it goes the same way every unprefixed path goes: the intl
    // middleware resolves the locale (`/howto` → `/de/howto`), and the per-locale
    // rule above finishes it (`/de/howto` → `/de/so-funktioniert-park-fan`). Two
    // hops, but it lands in the reader's language. Verified against a production
    // build; `howtoLegacySegment` is only in the wrong-segment set above.

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

    // The trip planner's own page (app/[locale]/trip-planner). Same shape as the
    // guide above. Keep in step with `lib/planner/segments.ts` — that module is
    // what every link and every canonical URL is built from, this is only what
    // serves them.
    const plannerSegments: Record<string, string> = {
      de: 'tagesplaner',
      fr: 'planificateur',
      it: 'pianificatore',
      nl: 'dagplanner',
      es: 'planificador',
    };
    for (const [locale, segment] of Object.entries(plannerSegments)) {
      rules.push({
        source: `/${locale}/${segment}`,
        destination: `/${locale}/trip-planner`,
      });
    }

    // A park's crowd calendar (app/[locale]/parks/…/[park]/calendar). Same pattern one level
    // deeper: the segment sits after four geo segments, so the rule names all four. EN needs no
    // rewrite. Keep in step with `lib/parks/calendar-segments.ts` — that module is what every
    // link and every canonical URL is built from, this is only what serves them.
    const parkCalendarSegments: Record<string, string> = {
      de: 'wartezeiten-kalender',
      fr: 'calendrier-temps-attente',
      it: 'calendario-tempi-attesa',
      nl: 'wachttijden-kalender',
      es: 'calendario-tiempos-espera',
    };
    for (const [locale, segment] of Object.entries(parkCalendarSegments)) {
      const from = `/${locale}/parks/:continent/:country/:city/:park/${segment}`;
      const to = `/${locale}/parks/:continent/:country/:city/:park/wait-time-calendar`;
      // Two rules, because the route is an optional catch-all: the hub and the month URLs under
      // it. `:date*` alone would also match the bare segment, but writing both makes the pair
      // explicit and keeps the hub's rewrite independent of how the month path is spelled.
      rules.push(
        { source: from, destination: to },
        { source: `${from}/:date*`, destination: `${to}/:date*` }
      );
    }

    return rules;
  },
  async headers() {
    const locales = ['de', 'fr', 'it', 'nl', 'es', 'en'];
    const localeHeaderRules = locales.map((locale) => ({
      source: `/${locale}/:path*`,
      headers: [
        { key: 'Content-Language', value: locale },
        // The licence, on the page it applies to (RSL 1.0 §4.5). robots.txt carries the same
        // association, but the audience for a licence is precisely the crawler that did not
        // read robots.txt — so it rides along on the rule that already matches every page,
        // and on nothing else: /_next assets and the API are not what is being licensed.
        { key: 'Link', value: LICENSE_LINK_HEADER },
      ],
    }));

    return [
      // Content-Language per locale — helps Google associate pages with their language
      ...localeHeaderRules,
      // Machine-readable entry points, advertised where an agent arrives first (RFC 8288 +
      // RFC 9727 §3): the API catalog, and the OpenAPI/docs URLs it would otherwise take a
      // second round trip through the catalog to reach.
      //
      // Homepage only, in both forms it exists in — `/`, which the proxy redirects to a
      // locale, and the six locale roots (a client that follows the redirect reads the
      // headers off `/en`, not off the 307). Not site-wide: the header says something about
      // the site, not about a ride page, and ~250 bytes on all ~35k of those buys nothing.
      //
      // These have to be two rules. `/:locale(en|de|…)` matches the locale root ONLY, while
      // the Content-Language rules above end in `:path*` and therefore match every page
      // under a locale — reusing that shape here is how this would silently go site-wide.
      //
      // The value carries the licence link as well: the locale rules above also match a locale
      // root, Next resolves a repeated header key last-match-wins rather than appending, and
      // these rules come later — so a homepage that set only the catalog links would be the one
      // page on the site with no licence header.
      {
        source: '/',
        headers: [{ key: 'Link', value: `${HOMEPAGE_LINK_HEADER}, ${LICENSE_LINK_HEADER}` }],
      },
      {
        source: `/:locale(${locales.join('|')})`,
        headers: [{ key: 'Link', value: `${HOMEPAGE_LINK_HEADER}, ${LICENSE_LINK_HEADER}` }],
      },
      // The back office, on every surface that could index or summarize it. `/admin` carries
      // `robots: { index: false }` in its layout metadata already, but a meta tag has to be
      // rendered to be read — a header is on the response whether or not anything renders, and
      // it is the only signal the JSON endpoints under /api/admin can carry at all. robots.txt
      // disallows the same three paths; this is the half that survives a crawler that ignores it.
      ...['/admin', '/admin/:path*', '/api/admin/:path*', '/dev', '/dev/:path*'].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      })),
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
      // park.fan Coaster: fetched CC0 kit assets (glTF, KTX2, HDR, audio) under /game/assets are
      // pinned by scripts/fetch-game-assets.mjs and never edited in place, so they are immutable.
      {
        source: '/game/assets/:path*',
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
      //
      // Which of the two wins DEPENDS ON WHERE IT RUNS, so never let them disagree. `next dev`
      // resolves a `headers()` rule over the route handler's own Cache-Control (the note this block
      // used to carry, and it is right about dev); Vercel resolves it the other way — a header on a
      // function response beats the rule for the same route
      // (vercel.com/docs/caching/cdn-cache#using-vercel-json-and-next-config-js), verifiable on
      // production, where `/api/parks/<geo>/<park>` answers the handler's `no-store` while the rule
      // for it said `s-maxage=60`. Two sources of truth resolving in opposite directions is how
      // the attraction detail spent months serving its handler's 600 s while this file said 300.
      //
      // So every cacheable /api route is listed here with EXACTLY the value its handler returns,
      // and a route whose handler answers `no-store` is not listed at all — the blanket rule above
      // already says so. Change one half and change the other.
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
        headers: sharedCache(
          'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400'
        ),
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
        headers: sharedCache('public, s-maxage=86400, stale-while-revalidate=604800'),
      },
      {
        // Same for the collection route itself, which `/api/media/:path*` does not match.
        source: '/api/media',
        headers: sharedCache('public, s-maxage=86400, stale-while-revalidate=604800'),
      },
      {
        // A day, and it is the handler's own number rather than a second opinion: the route
        // was raised from 300 s to 86400 on 2026-09-02 when today's cell stopped carrying a
        // live occupancy reading, and this rule stayed at 300 — so the two halves disagreed by
        // a factor of 288 for three days, and which one a visitor got depended on the platform.
        // Measured against `pnpm start` on this build, `curl -D -` gave `s-maxage=300` while
        // the handler was asking for a day. Keep the two identical; the reasoning for the value
        // lives at the handler, where the payload is.
        source: '/api/parks/:continent/:country/:city/:park/calendar',
        headers: sharedCache('public, s-maxage=86400, stale-while-revalidate=86400'),
      },
      {
        source: '/api/parks/:continent/:country/:city/:park/best-days',
        headers: sharedCache('public, s-maxage=3600, stale-while-revalidate=86400'),
      },
      {
        // The blog's inline ride references poll this, so it is live data — but the backend
        // caches it 5 min anyway, and one post naming ten rides in one park is one request.
        source: '/api/parks/:continent/:country/:city/:park/wait-times',
        headers: sharedCache('public, s-maxage=60, stale-while-revalidate=240'),
      },
      {
        // A day, matching what api.park.fan itself answers for this object
        // (`max-age=86400, s-maxage=86400`) and what `getParkHistoricalStats` documents. It said
        // an hour for months, which capped a once-a-day aggregate at 24 origin refills a day.
        // Keep in step with STATS_AGGREGATE_CACHE in app/api/parks/[...path]/route.ts — on Vercel
        // the handler wins, in `next dev` this rule does, so the two must be identical.
        source: '/api/parks/:continent/:country/:city/:park/stats',
        headers: sharedCache('public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400'),
      },
      {
        // `/stats/hourly` is a separate path — the `/stats` rule above does not match it.
        source: '/api/parks/:continent/:country/:city/:park/stats/hourly',
        headers: sharedCache('public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400'),
      },
      {
        // `/stats/day` had no rule at all, so in `next dev` it fell through to the blanket
        // `/api/:path*` no-store while production served the handler's window — the exact drift
        // the note above this block was written about, on the one branch nobody had listed.
        source: '/api/parks/:continent/:country/:city/:park/stats/day',
        headers: sharedCache('public, s-maxage=300, stale-while-revalidate=600'),
      },
      {
        // `/plan/day` was the same branch one release later: the handler returns
        // `s-maxage=900, stale-while-revalidate=1800` and nothing listed it here, so the two
        // sides answered differently — measured against `pnpm start` on this build,
        // `curl -D -` gave `no-store, must-revalidate` for `plan/day` while `stats/day` beside
        // it gave its real window. On Vercel the handler wins and production caches the fifteen
        // minutes; locally the blanket rule wins and nothing caches at all, which is a planner
        // panel re-fetching every park-day on every open for anyone measuring it here. Identical
        // to the handler's own value, like every rule in this block.
        source: '/api/parks/:continent/:country/:city/:park/plan/day',
        headers: sharedCache('public, s-maxage=900, stale-while-revalidate=1800'),
      },
      {
        // Attraction detail (history + hourlyForecast time-series) backing the attraction page's
        // client-loaded daily chart + history grid. Like calendar/stats, this specific rule AFTER the
        // blanket /api no-store re-enables CDN caching — without it the route handler's Cache-Control
        // is clobbered to no-store.
        //
        // 5 min fresh + 1 min stale, and the reasoning is in the route handler — keep the two
        // values identical, they resolve in opposite directions on Vercel and in `next dev`.
        source: '/api/parks/:continent/:country/:city/:park/attractions/:attraction',
        headers: sharedCache('public, s-maxage=300, stale-while-revalidate=60'),
      },
      {
        source: '/api/parks/:continent/:country/:city/:park/weather/nowcast',
        headers: sharedCache('public, s-maxage=60, stale-while-revalidate=120'),
      },
      {
        // Card-overlay live status batch (use-live-parks-by-region), polled by every hub card grid,
        // the featured-parks strip and the blog's park references. Same 60s collapse rationale as
        // the park poll below; the response is byte-identical for every visitor of a region set,
        // so the window is nearly a pure hit.
        source: '/api/parks/live',
        headers: sharedCache('public, s-maxage=60, stale-while-revalidate=120'),
      },
      // NOT listed, on purpose: `/api/parks/:continent/:country/:city/:park` (the live park poll
      // behind every park page's cards) and `/api/analytics/:path*`. Both handlers answer
      // `no-store`, both did so in production while a rule here claimed `s-maxage=60`, and on
      // Vercel the handler is the half that won. The rules are gone rather than corrected to
      // `no-store`, because the blanket `/api` rule above already says exactly that. Keeping the
      // park poll uncached is also what makes a park page's cards the fresher of the two readings
      // of a queue — the ride page's live panel is served from the attraction detail, which is
      // shared-cached above.
      {
        // Search results are query-keyed and the backend caches them 60s — a matching CDN window
        // collapses popular queries without changing freshness.
        source: '/api/search',
        headers: sharedCache('public, s-maxage=60, stale-while-revalidate=120'),
      },
      {
        // Glossary search runs over build-time data — responses are immutable until the next
        // deploy (which purges the CDN), so cache them hard.
        source: '/api/glossary-search',
        headers: sharedCache('public, s-maxage=86400, stale-while-revalidate=86400'),
      },
      {
        // Background image list is a filesystem walk over build-time assets — immutable per deploy.
        source: '/api/parks/backgrounds',
        headers: sharedCache('public, s-maxage=86400, stale-while-revalidate=86400'),
      },
      {
        // Park image redirect (slug → optimizer). The slug→file mapping is stable,
        // so cache the 307 at the edge to skip the resolver hop on cache miss.
        // MUST stay after the blanket /api no-store rule to re-enable CDN caching.
        source: '/api/image',
        headers: sharedCache('public, s-maxage=86400, stale-while-revalidate=604800'),
      },
      {
        // Open-Meteo's hourly forecast for one park-day, behind the weather day chart.
        source: '/api/weather/hourly',
        headers: sharedCache('public, s-maxage=900, stale-while-revalidate=900'),
      },
      {
        // The header menu's cities+parks pane, fetched per opened country. Structure, not status.
        source: '/api/nav/geo/:continent/:country',
        headers: sharedCache('public, max-age=300, s-maxage=86400, stale-while-revalidate=604800'),
      },
      {
        // Build-time glossary ids — immutable until the next deploy.
        source: '/api/glossary-term-ids',
        headers: sharedCache('public, s-maxage=3600, stale-while-revalidate=86400'),
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
      // Do not try this again from here with `Cache-Control`. The only remaining lever at the
      // origin would be giving up force-dynamic, and that brings back the per-URL ISR writes it
      // was chosen to avoid (~250k write units/day in Jun 2026).
      //
      // `CDN-Cache-Control` is a DIFFERENT key and is not the one the page writes, which is why
      // the rule below is not a third attempt at the same thing. Both experiments above set
      // `Cache-Control`; what they measured is a collision on that key, not an inability to add
      // a header — their own control condition says so ("a marker header added to the same
      // `source` arrived on the park URL"). RFC 9213's targeted header is read by Vercel's edge
      // and forwarded downstream, so Cloudflare can be moved off "ignore cache-control, use this
      // TTL" and onto "use cache-control header if present" — which is what puts the number in
      // this file instead of in a dashboard nobody can diff, and what removes the reason its
      // matcher has to exclude `/api/` by hand.
      //
      // VERIFY AFTER DEPLOY, do not assume: `curl -sI` a month URL and read back
      // `cdn-cache-control`. If it is absent, the page overwrites this key too and the note
      // above simply grows a third entry. The Cloudflare rule change is a separate, manual step
      // and must not be made until that header is confirmed on the wire.
      // ---------------------------------------------------------------------------------------
      // Edge windows for everything OUTSIDE /parks/. Measured 2026-09-03: every one of these
      // answered `cf-cache-status: DYNAMIC` and carried no window at all, so each request left
      // Vercel in full. On the prerendered ones that is no invocation but the whole payload —
      // the transfer line, not the compute line.
      //
      // They are listed BEFORE the /parks/ block so the more specific park rules win on any
      // path both could claim.
      // ---------------------------------------------------------------------------------------
      {
        // The homepage. An hour, not a day: its global counters are an SSR seed that a client
        // overlay replaces on mount, but the seed is what a crawler reads and what a reader
        // sees before hydration.
        source: `/:locale(${locales.join('|')})`,
        headers: edgeCache(CONTENT_WINDOW),
      },
      {
        // The whole blog: index, categories, tags, authors and the posts. One rule, because
        // every one of them is markdown from this repo plus a manifest built at deploy time —
        // they change together, when a deploy happens, and nothing here moves on its own.
        source: '/:locale/blog/:path*',
        headers: edgeCache(CONTENT_WINDOW),
      },
      {
        // The six blog feeds. Listed AFTER the blog rule so this more specific source wins:
        // a feed reader polls on its own clock and a week of stale would hide a new post from
        // the one surface whose entire job is announcing it.
        source: '/:locale/blog/feed.xml',
        headers: edgeCache(MACHINE_WINDOW),
      },
      // The glossary (hub + term pages) and the two localized guide hubs. Their content is
      // build-time data — a term page changes when a deploy changes it, never in between.
      ...glossaryHeaderSegments.flatMap((segment) => [
        { source: `/:locale/${segment}`, headers: edgeCache(CONTENT_WINDOW) },
        { source: `/:locale/${segment}/:term`, headers: edgeCache(CONTENT_WINDOW) },
      ]),
      ...[
        ...bestTimeHeaderSegments,
        ...howtoHeaderSegments,
        // The trip planner's own page. It was left out of this block, and the
        // reason is visible in its own docblock: it shipped `force-dynamic`,
        // where an edge window would have been meaningless, and when it became
        // a prerendered route nothing brought it back here. It is
        // `initialRevalidateSeconds: 604800` in the manifest — the longest
        // window in the house — and was still leaving Vercel in full on every
        // request, which is the transfer line rather than the compute one.
        ...plannerHeaderSegments,
        'fancast',
      ].map((segment) => ({
        source: `/:locale/${segment}`,
        headers: edgeCache(CONTENT_WINDOW),
      })),
      {
        // Legal pages. A day fresh — they change once a year, and when they do, being an hour
        // late is not the risk; being a week late is.
        source: '/:locale/:page(impressum|datenschutz)',
        headers: edgeCache(CONTENT_WINDOW),
      },
      // The machine-facing surface. Nothing on the site renders any of it (see the agent-surface
      // rule in CLAUDE.md), so a wrong window here is invisible — which is exactly why the
      // window is short and the staleness long rather than the other way round.
      ...[
        '/robots.txt',
        '/sitemap.xml',
        '/sitemap-attractions.xml',
        '/sitemap-calendar.xml',
        '/sitemap-attractions/:locale.xml',
        '/sitemap-calendar/:locale.xml',
        '/llms.txt',
        '/license.xml',
        '/rss.xml',
        '/manifest.webmanifest',
      ].map((source) => ({ source, headers: edgeCache(MACHINE_WINDOW) })),
      {
        // The contribute form and its thank-you page. This pair was left out of the first pass
        // with the note "a cached challenge is a challenge already solved" — which is wrong, and
        // measurably so. `TurnstileWidget` is `'use client'` and injects Cloudflare's script from
        // the browser; the HTML carries the PUBLIC site key and no token, so there is nothing in
        // it that belongs to one visitor. Both routes have `generateStaticParams()`.
        //
        // The cost of that mistake is written down one file over, in this route's own docblock:
        // every park and ride page links here through `buildContributeHref`, which mints one
        // crawlable URL per entity, and over 24 h the page took **4 K requests and 154 MB — more
        // than the park pages themselves**. The `rel="nofollow"` on those links stops new ones
        // being walked; this is the half that stops paying for the ones already indexed.
        //
        // The query string stays in Cloudflare's cache key, so a prefilled variant and the bare
        // page are separate entries and nobody gets somebody else's preselection.
        source: '/:locale/contribute/:path*',
        headers: edgeCache(CONTENT_WINDOW),
      },
      // NOT listed, on purpose:
      //   /:locale/search          — answers `no-store` and must keep doing so; a query-keyed
      //                              page shared across readers is a privacy question, not a
      //                              cache question.
      //   /admin, /api, /dev       — the Cloudflare rule excludes the first two by hand; giving
      //                              any of them a window here would be the way to undo that.
      // The RIDE page and the PARK page, the two highest-invocation routes in the app. Listed
      // BEFORE the calendar block below so the calendar's own, more specific sources win — the
      // hub `…/:park/<segment>` has the same segment count as `…/:park/:attraction` and would
      // otherwise be claimed by the ride rule.
      //
      // These carry ONLY `CDN-Cache-Control`, for the reason the long note above gives: a
      // dynamic page overwrites `Cache-Control` with its own `no-store`, and the RFC 9213
      // targeted header is a different key that survives. Verified on the wire for the calendar
      // month URL (2026-09-03) before these two were added.
      //
      // THEY DO NOTHING UNTIL THE CLOUDFLARE RULE MOVES. The `/*/parks/*` Cache Rule is on
      // "ignore cache-control header and use this TTL", which wins over the origin. Proof: an
      // out-of-range calendar month answers `308` carrying `cdn-cache-control: s-maxage=86400`
      // and is still `cf-cache-status: BYPASS`. These rules exist so that rule CAN be moved to
      // "use cache-control header if present" — which is the only way the TTL becomes a number
      // in this file, diffable, instead of a dashboard field nobody can review.
      //
      // Before that switch: every page under `/*/parks/*` needs a window here, or the ones
      // without a header fall back to the page's `no-store` and stop being cached entirely.
      // Still missing at the time of writing: the geo hubs (`/:locale/parks`, `/…/:continent`,
      // `/…/:country`, `/…/:city`). See docs/optimization/README.md.
      {
        // A ride page. A day fresh and only an hour of staleness on top, and BOTH numbers are
        // the point — the ceiling on how old a served copy can be is their SUM, not the first
        // of them. It started at 48 h + 24 h, which is 72 h, on a page whose own title says
        // "Wartezeiten LIVE".
        //
        // That sum matters more here than anywhere else on the site, because on a long-tail
        // ride URL the crawler is usually the ONLY visitor: it gets the stale copy and triggers
        // the refresh that only the next crawl, ~42 h later, would benefit from. A long
        // stale window therefore does not shorten what a crawler sees — it is exactly what a
        // crawler sees, every time.
        //
        // What that costs: the hit ceiling against a ~42 h crawl interval drops from ~53 % to
        // ~36 %. What it buys: the one self-dating element in the rendered markup — an
        // `Aktualisiert <time>` stamp, a clock time with the full ISO date in its attribute —
        // is never more than a day behind. (The park page carries a full written-out date in
        // its FAQ text and its FAQPage JSON-LD, which is why that one sits at an hour.)
        //
        // No measured ranking effect exists in either direction; what is real is the snippet
        // and what a reader sees before hydration. Raising this again wants a Cloudflare purge
        // in `/api/revalidate` first — nothing in this repo or the backend can purge it today.
        source: `/:locale(${locales.join('|')})/parks/:continent/:country/:city/:park/:attraction`,
        headers: [
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=3600',
          },
        ],
      },
      {
        // The geo hubs: `/:locale/parks`, and the continent, country and city levels under it.
        // They are prerendered (ISR) and their live bits arrive through `/api/parks/live` on the
        // client, so an hour costs no freshness and collapses a crawl burst.
        //
        // They are here for a second reason: the Cloudflare rule matches `/*/parks/*`, so once it
        // moves to "use cache-control header if present" ANY page under that prefix without a
        // window falls back to the page's own `no-store` and stops being cached at all. This
        // block plus the two above plus the calendar block is that prefix, complete.
        source: `/:locale(${locales.join('|')})/parks/:continent?/:country?/:city?`,
        headers: edgeCache(CONTENT_WINDOW),
      },
      {
        // A park page. An hour, not the ride page's two days: the backend POSTs this park's own
        // cache tag at every status flip (see the API-budget rule in CLAUDE.md), and a long edge
        // window is exactly what would swallow that. An hour still collapses a crawl burst.
        //
        // Measured 2026-09-03, and it is the stronger of the two reasons — this page is
        // day-bound in its CONTENT, not merely in a phrasing that could be rewritten:
        //
        //   - a visible sentence naming the WEEKDAY: "Heute, Donnerstag, 3. September 2026 …",
        //     the shape CLAUDE.md names as the reason Google prints "vor 6 Tagen" beside this
        //     site's own results
        //   - today's date 49 times across its JSON-LD: `AmusementPark`, the FAQ graph (36),
        //     and four `Event` blocks
        //   - today's opening hours, which are the point of the page
        //
        // None of it is client-replaced: JSON-LD and the FAQ are server-rendered. Every other
        // page that moved to a day on this date (blog, glossary, guide hubs, homepage) carries
        // the date ZERO times. That check is what decided which pages came along, not taste.
        source: `/:locale(${locales.join('|')})/parks/:continent/:country/:city/:park`,
        headers: [
          {
            // An hour of stale, not a day: the ceiling is the SUM, and 1 h + 24 h would be 25 —
            // which would hand a crawler exactly the day-old FAQ date this window exists to
            // prevent.
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=3600',
          },
        ],
      },
      ...Object.entries(parkCalendarHeaderSegments).flatMap(([locale, segment]) => [
        {
          // A calendar MONTH page: `…/<segment>/2026/10`. A WEEK, and the reason is that this
          // HTML is a shell rather than the data: `useCalendarData` fetches the grid's numbers
          // client-side from `/api/parks/…/calendar?from&to`, and `ParkTodayPanel` replaces the
          // "heute im Park" band on mount through `useLiveParkData`. Both of those sources
          // carry their OWN, shorter windows — the calendar proxy is 86400 s — so a reader
          // never sees week-old figures no matter how long this document stood at the edge.
          //
          // It is also the route where a longer window pays most. Measured 2026-09-03: the
          // calendar has 5,718 URLs against the ride route's 42,912, which is 3.81 requests per
          // URL per day against 0.70 — and it is the only route whose hit rate actually moved
          // (12 % → 22 %). A cache entry is only ever read twice if the same URL comes back
          // inside its window, so the route with the dense traffic is the one where widening
          // the window converts into hits.
          //
          // Unlike the hub below, a month URL names its month, so no amount of standing makes
          // it show the wrong one.
          //
          // Only `CDN-Cache-Control`: the browser keeps the page's own `no-store`, so a
          // visitor's own tab never pins a week-old copy, while the shared caches get an
          // explicit window.
          source: `/${locale}/parks/:continent/:country/:city/:park/${segment}/:year/:month`,
          headers: [
            {
              key: 'CDN-Cache-Control',
              value: 'public, s-maxage=604800, stale-while-revalidate=3600',
            },
          ],
        },
        {
          // The HUB, deliberately short and deliberately listed AFTER the month rule so the
          // more specific source wins. The hub has no month in its URL: it renders the park's
          // CURRENT month, and measured 2026-09-03 that month sits in the `<title>`, the `<h1>`
          // and eight places in the markup — none of them client-replaced, unlike the grid
          // below them. A day-long copy made on 30 September would therefore be served on
          // 1 October under a heading that says September, above a calendar showing October.
          //
          // Unlike the park page above, this is a PHRASING problem rather than a content one:
          // a month-free title ("Wartezeiten-Kalender") would let the hub take the same day as
          // everything else. It is not worth an SEO title for 1,278 URLs (213 parks × 6
          // locales) — but that, and not the date itself, is what keeps it here.
          source: `/${locale}/parks/:continent/:country/:city/:park/${segment}`,
          headers: [
            {
              key: 'CDN-Cache-Control',
              value: 'public, s-maxage=3600, stale-while-revalidate=3600',
            },
          ],
        },
      ]),
      {
        // The search PAGE. `:locale` is pinned to the six real locales because a bare `:locale`
        // matches any single segment — including `api`, so this rule sat after the `/api/search`
        // rule above and quietly clobbered it back to `no-store`, on the one /api route whose
        // window is set here and nowhere else.
        source: `/:locale(${locales.join('|')})/search`,
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
