import { locales } from '@/i18n/config';

/**
 * What a production deploy purges from Cloudflare, and what it leaves.
 *
 * A deploy changes the markup and the chunk hashes it references, so every page, every relay and
 * every machine file goes. What stays has URLs that move when their content does: `/_next/` is
 * content-hashed, `/media/` carries `?v=<content hash>`, and an OG card URL carries
 * `OG_CARD_VERSION`. Why the OG cards stay: docs/optimization/decisions.md.
 *
 * Cloudflare cannot purge "a host except a path", so the purge is spelled out: a prefix per locale
 * and per `/api/` route directory, and single URLs for the files at the root. Prefixes end without
 * a slash, so they match the same URLs whether Cloudflare compares strings or path segments; no
 * purged name is the start of `api/og`, `media` or `_next`. `pnpm test:deploy-purge` fails when a
 * route directory in `app/` or a file at the root of `public/` is in no list.
 */

/** Top-level `/api/` route directories a deploy purges. Every directory in `app/api` but `og`. */
export const PURGED_API_DIRS = [
  'account',
  'admin',
  'analytics',
  'assistant-config',
  'assistant-post',
  'assistant-posts',
  'blog-latest',
  'card-images',
  'contribute',
  'cron',
  'developer',
  'developers',
  'favorites',
  'glossary-search',
  'glossary-term-ids',
  'health',
  'image',
  'mcp',
  'media',
  'ml',
  'nav',
  'nearby',
  'parks',
  'push',
  'revalidate',
  'search',
  'trip-regions',
  'trips',
  'weather',
  'webhooks',
] as const;

/** Top-level `/api/` route directories a deploy leaves cached. */
export const KEPT_API_DIRS = ['og'] as const;

/** Route directories at the root of `app/` that a deploy purges, besides locales and `/api/`. */
export const ROOT_PREFIXES = ['/sitemap-attractions', '/sitemap-calendar', '/.well-known'];

/** Route files at the root of `app/` that a deploy purges, by the URL each serves. */
export const ROOT_FILES = [
  '/',
  '/robots.txt',
  '/llms.txt',
  '/rss.xml',
  '/license.xml',
  '/manifest.webmanifest',
  '/auth.md',
  '/favicon.ico',
  '/sitemap.xml',
  '/sitemap-attractions.xml',
  '/sitemap-calendar.xml',
  '/sitemap-news.xml',
];

/**
 * Files at the root of `public/`. Their names carry no hash and `next.config.ts` lets the brand
 * marks be cached for a year, so a replaced logo or icon reaches readers only through this purge.
 */
export const PUBLIC_ROOT_FILES = [
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/icon.svg',
  '/logo-big-dark.png',
  '/logo-big-dark.svg',
  '/logo-big.png',
  '/logo-big.svg',
  '/logo-dark.png',
  '/logo-dark.svg',
  '/logo-small-dark.png',
  '/logo-small-dark.svg',
  '/logo-small.png',
  '/logo-small.svg',
  '/logo.png',
  '/logo.svg',
  '/parkfan-dark.png',
  '/parkfan-dark.svg',
  '/parkfan.png',
  '/parkfan.svg',
  '/sw.js',
  '/world.svg',
];

/** Cloudflare's limit of URLs or prefixes in one purge call, on every plan. */
export const PURGE_BATCH_SIZE = 100;

/** One request body for `POST /zones/:zone/purge_cache`. */
export type PurgeBody = { prefixes: string[] } | { files: string[] };

/**
 * The purge calls a deploy sends for `host`, batched to Cloudflare's per-call limit. Prefixes are
 * written without a scheme, files as absolute URLs, as the API takes them. A locale's home page is
 * also purged as a file, in case a prefix does not reach the path it is equal to.
 */
export function deployPurgeBodies(host: string): PurgeBody[] {
  const prefixes = [
    ...locales.map((locale) => `${host}/${locale}`),
    ...PURGED_API_DIRS.map((dir) => `${host}/api/${dir}`),
    ...ROOT_PREFIXES.map((path) => `${host}${path}`),
  ];
  const files = [
    ...locales.map((locale) => `https://${host}/${locale}`),
    ...[...ROOT_FILES, ...PUBLIC_ROOT_FILES].map((path) => `https://${host}${path}`),
  ];
  return [
    ...chunk(prefixes).map((batch) => ({ prefixes: batch })),
    ...chunk(files).map((batch) => ({ files: batch })),
  ];
}

function chunk(items: string[]): string[][] {
  const batches: string[][] = [];
  for (let i = 0; i < items.length; i += PURGE_BATCH_SIZE) {
    batches.push(items.slice(i, i + PURGE_BATCH_SIZE));
  }
  return batches;
}
