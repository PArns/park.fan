/**
 * Every media URL a page actually renders, checked against a running site.
 *
 * Run: pnpm check:media-urls [/extra/page ...]   (needs `pnpm start` on CHECK_BASE, default :3000)
 *
 * With no server, or when no page yields a single media URL, it exits 1: a run that
 * checked nothing is not a pass. Extra pages come from argv or `CHECK_PAGES` (comma
 * separated), so a new post can check its own pages.
 *
 * Two things go wrong silently and only here:
 *
 *  - **A media path with no `?v=`.** Retargeting a focal point rewrites a crop's
 *    bytes at an unchanged URL, and `/media` is served with a month of `max-age`
 *    while the optimizer keeps its renditions for a year. Without the token that
 *    photo stays wrong in every cache until the file name changes.
 *  - **A path the database does not know.** A legacy `/images/parks/…` or a typo
 *    renders as a broken image, and nothing in the build fails.
 *
 * It fetches the HTML rather than driving a browser: `srcset` is in the markup,
 * and this needs to see every candidate, not the one the viewport picked.
 */

import { MEDIA_IMAGES } from '../lib/media/manifest.ts';

const BASE = process.env.CHECK_BASE ?? 'http://localhost:3000';

/** A spread of surfaces: hero, cards, backgrounds, galleries, article bodies, OG. */
const PAGES = [
  '/de',
  '/de/parks/europe/netherlands/sevenum/attractiepark-toverland',
  '/de/parks/europe/netherlands/sevenum/attractiepark-toverland/troy',
  '/de/parks/europe/germany/bruehl/phantasialand',
  '/de/parks/europe',
  '/de/parks/europe/germany',
  '/de/blog',
  '/de/blog/phantasialand-tipps',
  '/de/blog/toverland-troy-wartezeiten-tipps',
  '/de/blog/halloween-freizeitparks-2026',
  '/en/parks/europe/netherlands/sevenum/attractiepark-toverland',
];

const EXTRA_PAGES = [...process.argv.slice(2), ...(process.env.CHECK_PAGES ?? '').split(',')]
  .map((page) => page.trim())
  .filter(Boolean);
const ALL_PAGES = [...new Set([...PAGES, ...EXTRA_PAGES])];

/** `/_next/image?url=…` wraps the real path; unwrap so both forms are checked once. */
function realPath(raw) {
  try {
    const url = new URL(raw, BASE);
    if (url.pathname === '/_next/image')
      return decodeURIComponent(url.searchParams.get('url') ?? '');
    return url.pathname + url.search;
  } catch {
    return raw;
  }
}

const KNOWN = new Set();
for (const image of MEDIA_IMAGES) {
  KNOWN.add(image.src);
  for (const variant of image.variants) KNOWN.add(variant);
}

const unversioned = new Map();
const unknown = new Map();
const legacy = new Map();
let checked = 0;
let loaded = 0;

for (const page of ALL_PAGES) {
  let response;
  try {
    response = await fetch(`${BASE}${page}`);
  } catch (error) {
    console.log(`⚠️  ${page} → ${error instanceof Error ? error.message : error}`);
    continue;
  }
  if (!response.ok) {
    console.log(`⚠️  ${page} → HTTP ${response.status}`);
    continue;
  }
  loaded += 1;
  const html = await response.text();

  // Both bare paths and optimizer-wrapped ones, from src, srcset, and inline CSS.
  const candidates = new Set();
  // Only paths that end in an image extension. A blog article href is
  // `/blog/<slug>/`, which the old pattern happily reported as a missing image.
  for (const match of html.matchAll(
    /["'(]((?:[^"'()\s]*?)\/(?:media|images|blog)\/[^"'()\s]*?\.(?:jpe?g|png|webp|avif|svg)(?:\?[^"'()\s]*)?)["')\s]/g
  )) {
    const url = match[1].replace(/&amp;/g, '&');
    // A URL ending in a bare `?` is never something the page renders — it is a string that got
    // cut at an RSC flight-chunk boundary, where the next `self.__next_f.push(...)` carries the
    // rest of the query. Counting those reported four phantom "unversioned" paths for every real
    // one and buried the genuine finding under them.
    if (url.endsWith('?')) continue;
    candidates.add(url);
  }
  for (const match of html.matchAll(/["'](\/_next\/image\?[^"']+)["']/g)) {
    for (const part of match[1].replace(/&amp;/g, '&').split(/,\s*/)) {
      candidates.add(part.trim().split(/\s+/)[0]);
    }
  }

  for (const candidate of candidates) {
    const path = realPath(candidate);
    if (!path.startsWith('/media/') && !path.startsWith('/images/') && !path.startsWith('/blog/')) {
      continue;
    }
    checked += 1;
    const [clean] = path.split('?');

    if (path.startsWith('/images/') || path.startsWith('/blog/images/')) {
      (legacy.get(path) ?? legacy.set(path, []).get(path)).push(page);
      continue;
    }
    if (!KNOWN.has(clean)) {
      (unknown.get(clean) ?? unknown.set(clean, []).get(clean)).push(page);
      continue;
    }
    if (!/[?&]v=/.test(path)) {
      (unversioned.get(clean) ?? unversioned.set(clean, []).get(clean)).push(page);
    }
  }
}

function report(title, map) {
  if (!map.size) {
    console.log(`✅ ${title}: none`);
    return false;
  }
  console.log(`❌ ${title}: ${map.size}`);
  for (const [path, pages] of map)
    console.log(`   ${path}\n     on ${[...new Set(pages)].join(', ')}`);
  return true;
}

console.log(`\n🔎 ${checked} media URLs across ${loaded} of ${ALL_PAGES.length} pages\n`);
if (loaded === 0 || checked === 0) {
  console.error(
    `❌ Nothing was checked (${loaded} pages loaded, ${checked} media URLs). ` +
      `Is a server running at CHECK_BASE=${BASE}? Start one with \`pnpm start\` first.\n`
  );
  process.exit(1);
}
const failed = [
  report('Unversioned media paths', unversioned),
  report('Paths not in the database', unknown),
  report('Legacy image paths', legacy),
].some(Boolean);

console.log('');
if (failed) process.exit(1);
console.log('🎉 Every rendered media URL is known and content-versioned.\n');
