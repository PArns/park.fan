#!/usr/bin/env node
// @ts-check
/**
 * ISR cache probe — inspect Vercel ISR write/read behaviour per route.
 *
 * Vercel bills an ISR *write* every time a cache unit is (re)generated and persisted, and writes
 * cost ~10× a read. This script samples representative routes and classifies each via the
 * `x-vercel-cache` response header, so you can see WHERE writes happen and catch pathological
 * cases the billing chart can't show you per-URL.
 *
 * What it does per URL:
 *   1. Two HEAD requests a short delay apart (the "double-hit test").
 *      - MISS → HIT  : healthy (written once, then served from cache)
 *      - MISS → MISS : NOT caching — every request regenerates (404, too large, or dynamic)
 *      - STALE/REVALIDATED on a hit : a background regeneration (a write) was triggered
 *      - PRERENDER   : served from the build-time static prerender (cheap; writes only on revalidate)
 *   2. One GET to capture the final HTTP status + response size (large pages = heavy write *units*).
 *
 * It auto-samples REAL park URLs from the public sitemap (no API auth needed) and derives each
 * park's city/country/continent ancestors, plus the homepage — covering every geo route type.
 * Attraction URLs are sampled from the first reachable park page's links.
 *
 * Usage:
 *   node scripts/isr-cache-probe.mjs
 *   node scripts/isr-cache-probe.mjs --base https://park.fan --sample 8 --locales en,de
 *   node scripts/isr-cache-probe.mjs /en/parks/europe/germany/rust/europa-park   # explicit paths
 *
 * Flags:
 *   --base <url>        Origin to probe (default: https://park.fan)
 *   --sample <n>        How many park URLs to sample from the sitemap (default: 6)
 *   --locales <list>    Comma-separated locales to probe each park in (default: en)
 *   --delay <ms>        Delay between the two hits of the double-hit test (default: 1500)
 *   --attractions       Also sample attraction URLs from a sampled park page
 *   --oversize-kb <n>   Flag pages larger than this many KB (default: 512)
 *
 * Exit code is always 0 (diagnostic tool). Flagged rows are summarised at the end.
 */

const TIMEOUT_MS = 25_000;

/** Minimal CLI arg parser: collects --flag values and bare positional paths. */
function parseArgs(argv) {
  const opts = {
    base: 'https://park.fan',
    sample: 6,
    locales: ['en'],
    delay: 1500,
    attractions: false,
    oversizeKb: 512,
    paths: /** @type {string[]} */ ([]),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base') opts.base = argv[++i];
    else if (a === '--sample') opts.sample = Number(argv[++i]);
    else if (a === '--locales') opts.locales = argv[++i].split(',').map((s) => s.trim());
    else if (a === '--delay') opts.delay = Number(argv[++i]);
    else if (a === '--attractions') opts.attractions = true;
    else if (a === '--oversize-kb') opts.oversizeKb = Number(argv[++i]);
    else if (a.startsWith('/')) opts.paths.push(a);
    else if (a) console.warn(`Ignoring unknown arg: ${a}`);
  }
  opts.base = opts.base.replace(/\/$/, '');
  return opts;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Read x-vercel-cache + age from a HEAD request (no body). */
async function head(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(TIMEOUT_MS) });
    return {
      cache: res.headers.get('x-vercel-cache') ?? '—',
      age: res.headers.get('age') ?? '?',
      status: res.status,
    };
  } catch (err) {
    return { cache: 'ERR', age: '?', status: 0, error: String(err?.message ?? err) };
  }
}

/** GET to capture final status + byte size (and the body, for link extraction). */
async function get(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const body = await res.text();
    return { status: res.status, bytes: Buffer.byteLength(body), body };
  } catch (err) {
    return { status: 0, bytes: 0, body: '', error: String(err?.message ?? err) };
  }
}

/** Fetch the sitemap and return park paths (locale + /parks/ + 4 geo segments). */
async function sampleParkPaths(base, n, locales) {
  const url = `${base}/sitemap.xml`;
  const { body, status } = await get(url);
  if (status !== 200 || !body) {
    console.warn(`Could not read ${url} (HTTP ${status}); skipping sitemap sampling.`);
    return [];
  }
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  // Keep only park detail URLs of the FIRST requested locale (we re-locale them ourselves).
  const primary = locales[0];
  const parkRe = new RegExp(`^/${primary}/parks/[^/]+/[^/]+/[^/]+/[^/]+$`);
  const parkPaths = locs
    .map((u) => {
      try {
        return new URL(u).pathname;
      } catch {
        return '';
      }
    })
    .filter((p) => parkRe.test(p));
  // Shuffle + take n (deterministic-ish without deps: simple Fisher–Yates).
  for (let i = parkPaths.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parkPaths[i], parkPaths[j]] = [parkPaths[j], parkPaths[i]];
  }
  return parkPaths.slice(0, n);
}

/** From a park path, derive its continent/country/city ancestor paths. */
function ancestors(parkPath) {
  const seg = parkPath.split('/'); // ['', locale, 'parks', continent, country, city, park]
  return [
    seg.slice(0, 4).join('/'), // continent
    seg.slice(0, 5).join('/'), // country
    seg.slice(0, 6).join('/'), // city
  ];
}

/** Swap the locale (segment 1) of a path. */
function reLocale(path, locale) {
  const seg = path.split('/');
  seg[1] = locale;
  return seg.join('/');
}

/** Extract one attraction link (6 geo segments) from a park page body. */
function firstAttractionPath(body, locale) {
  const re = new RegExp(`/${locale}/parks/[^/"']+/[^/"']+/[^/"']+/[^/"']+/[^/"'?#]+`, 'g');
  for (const m of body.matchAll(re)) {
    const p = m[0];
    // '', locale, 'parks', continent, country, city, park, attraction => 8 segments
    if (p.split('/').length === 8) return p;
  }
  return null;
}

function classify(c1, c2, status, bytes, oversizeBytes) {
  const flags = [];
  if (status === 404) flags.push('404 (never cached)');
  else if (c1 === 'MISS' && c2 === 'MISS') flags.push('UNCACHED (MISS→MISS)');
  if (status === 200 && bytes > oversizeBytes)
    flags.push(`OVERSIZE ${(bytes / 1024).toFixed(0)}KB`);
  return flags;
}

async function probe(base, path, delay, oversizeBytes) {
  const url = base + path;
  const h1 = await head(url);
  await sleep(delay);
  const h2 = await head(url);
  const g = await get(url);
  const flags = classify(h1.cache, h2.cache, g.status, g.bytes, oversizeBytes);
  return { path, c1: h1.cache, c2: h2.cache, status: g.status, bytes: g.bytes, flags };
}

function fmtRow({ path, c1, c2, status, bytes, flags }) {
  const size = bytes ? `${(bytes / 1024).toFixed(0)}KB` : '—';
  const flag = flags.length ? `  ⚠ ${flags.join(', ')}` : '';
  return `${String(status).padEnd(4)} ${c1.padEnd(11)}→ ${c2.padEnd(11)} ${size.padStart(7)}  ${path}${flag}`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const oversizeBytes = opts.oversizeKb * 1024;

  console.log(`ISR cache probe → ${opts.base}`);
  console.log(
    `(double-hit test, ${opts.delay}ms apart; flagging 404 / MISS→MISS / >${opts.oversizeKb}KB)\n`
  );

  /** @type {string[]} */
  let paths = [];

  if (opts.paths.length) {
    paths = opts.paths;
  } else {
    // Homepage per locale
    for (const l of opts.locales) paths.push(`/${l}`);
    // Sample real parks from the sitemap + derive hub ancestors, across requested locales.
    const parks = await sampleParkPaths(opts.base, opts.sample, opts.locales);
    if (!parks.length) {
      console.warn('No park URLs sampled — pass explicit paths as arguments instead.\n');
    }
    const set = new Set();
    for (const park of parks) {
      for (const anc of ancestors(park)) set.add(anc); // continent/country/city (primary locale)
      for (const l of opts.locales) set.add(reLocale(park, l));
    }
    paths.push(...set);

    if (opts.attractions && parks.length) {
      const probePark = opts.base + parks[0];
      const { body } = await get(probePark);
      const att = firstAttractionPath(body, opts.locales[0]);
      if (att) paths.push(att);
      else console.warn('Could not extract an attraction link from the sampled park page.\n');
    }
  }

  console.log('STAT 1st-hit     → 2nd-hit       size  path');
  console.log('─'.repeat(96));

  const results = [];
  for (const p of paths) {
    const r = await probe(opts.base, p, opts.delay, oversizeBytes);
    results.push(r);
    console.log(fmtRow(r));
  }

  // Summary
  const tally = {};
  for (const r of results) tally[r.c2] = (tally[r.c2] ?? 0) + 1;
  const flagged = results.filter((r) => r.flags.length);
  console.log('\n' + '─'.repeat(96));
  console.log(
    `2nd-hit cache distribution: ${Object.entries(tally)
      .map(([k, v]) => `${k}=${v}`)
      .join('  ')}`
  );
  if (flagged.length) {
    console.log(`\n⚠ ${flagged.length} flagged route(s) (write hotspots / waste):`);
    for (const r of flagged) console.log(`   ${r.path}  →  ${r.flags.join(', ')}`);
  } else {
    console.log('\n✓ No flagged routes — every sampled page caches on the second hit.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(0); // diagnostic tool — never fail a pipeline
});
