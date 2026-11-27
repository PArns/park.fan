import { locales } from '@/i18n/config';

/**
 * What a production deploy purges from Cloudflare, and what it leaves.
 *
 * A deploy changes the markup and the chunk hashes it references, so every page, every relay and
 * every machine file goes. What stays has URLs that move when their content does: `/_next/` is
 * content-hashed, `/media/` carries `?v=<content hash>`, and an OG card URL carries
 * `OG_CARD_VERSION`. Purging those made each deploy re-render every OG card and re-read every
 * photo and image rendition a crawler asked for, several times a day
 * (docs/optimization/decisions.md).
 *
 * Cloudflare cannot purge "a host except a path", so the purge is spelled out: a prefix per locale
 * and per `/api/` route directory, and single URLs for the few files at the root.
 * `pnpm test:deploy-purge` fails when a route directory in `app/` is in neither list.
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

/** Path prefixes at the root that a deploy purges, besides the locales and `/api/`. */
const ROOT_PREFIXES = ['/sitemap', '/.well-known/'];

/** Single files at the root that a deploy purges. */
const ROOT_FILES = [
  '/',
  '/robots.txt',
  '/llms.txt',
  '/rss.xml',
  '/license.xml',
  '/manifest.webmanifest',
  '/auth.md',
];

/** Cloudflare's limit of items in one purge call. */
export const PURGE_BATCH_SIZE = 30;

/** One request body for `POST /zones/:zone/purge_cache`. */
export type PurgeBody = { prefixes: string[] } | { files: string[] };

/**
 * The purge calls a deploy sends for `host`, batched to Cloudflare's per-call limit. Prefixes are
 * written without a scheme, files as absolute URLs, as the API takes them. A locale's own page
 * (`/de`) is purged as a file next to its prefix (`park.fan/de/`), so the prefix needs no
 * assumption about where Cloudflare puts a path boundary.
 */
export function deployPurgeBodies(host: string): PurgeBody[] {
  const prefixes = [
    ...locales.map((locale) => `${host}/${locale}/`),
    ...PURGED_API_DIRS.map((dir) => `${host}/api/${dir}/`),
    ...ROOT_PREFIXES.map((path) => `${host}${path}`),
  ];
  const files = [
    ...locales.map((locale) => `https://${host}/${locale}`),
    ...ROOT_FILES.map((path) => `https://${host}${path}`),
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
