#!/usr/bin/env node
/**
 * Measures the API traffic a page actually costs.
 *
 * For every route below it opens a real browser, records every request that leaves for
 * `/api/*` (the proxy routes — i.e. one backend call each) and reports count, transfer
 * size and how long the last one lands after navigation. It also weighs the RSC/HTML
 * payload so "what did we serialize into the page" sits next to "what did we then fetch
 * again from the client".
 *
 * Needs a running site:  pnpm dev  (or pnpm build && pnpm start)
 *   node scripts/measure-api-calls.mjs [--base http://localhost:3000] [--json out.json]
 *
 * The waterfall is grouped per page so a regression ("this page now makes 8 calls")
 * is visible without reading the numbers.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const args = process.argv.slice(2);
const argv = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const BASE = argv('base', 'http://localhost:3000').replace(/\/$/, '');
const JSON_OUT = argv('json', null);
const ONLY = argv('only', null);
/** Seconds to keep watching after load — long enough for the `useLoadLast` gated queries. */
const SETTLE_MS = Number(argv('settle', 9000));

const PARK = '/de/parks/europe/germany/bruehl/phantasialand';

const ROUTES = [
  { name: 'home', path: '/de' },
  { name: 'parks hub', path: '/de/parks' },
  { name: 'continent', path: '/de/parks/europe' },
  { name: 'country', path: '/de/parks/europe/germany' },
  // Rust, not Brühl: a one-park city 308s straight to its park page, so measuring it would
  // just re-measure the park route under the wrong label.
  { name: 'city', path: '/de/parks/europe/germany/rust' },
  { name: 'park', path: PARK },
  { name: 'park #calendar', path: `${PARK}#calendar` },
  { name: 'park #map', path: `${PARK}#map` },
  { name: 'attraction', path: `${PARK}/taron` },
  { name: 'search', path: '/de/search?q=phantasialand' },
  { name: 'best-time-to-visit', path: '/de/best-time-to-visit' },
  { name: 'fancast', path: '/de/fancast' },
  { name: 'blog index', path: '/de/blog' },
];

const KB = (n) => `${(n / 1024).toFixed(1)} KB`;
const pad = (s, n) => String(s).padEnd(n);

async function measure(browser, route) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  /** @type {Map<string, {url: string, size: number, status: number, at: number, count: number}>} */
  const calls = new Map();
  let docBytes = 0;
  let t0 = Date.now();

  page.on('response', async (res) => {
    const url = res.url();
    if (!url.startsWith(BASE)) return;
    const path = url.slice(BASE.length);
    let size = 0;
    try {
      size = (await res.body()).byteLength;
    } catch {
      /* redirects / aborted */
    }
    if (path.startsWith('/api/')) {
      const key = path.split('?')[0] + (path.includes('?') ? '?…' : '');
      const prev = calls.get(key);
      if (prev) {
        prev.count += 1;
        prev.size += size;
        prev.at = Math.max(prev.at, Date.now() - t0);
      } else {
        calls.set(key, { url: key, size, status: res.status(), at: Date.now() - t0, count: 1 });
      }
    } else if (path === route.path || path === route.path.split('#')[0]) {
      docBytes += size;
    }
  });

  t0 = Date.now();
  await page.goto(BASE + route.path, { waitUntil: 'load', timeout: 90_000 }).catch(() => {});
  // The best-travel-time queries are deliberately gated behind `useLoadLast`; scrolling
  // also triggers anything mounted below the fold.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await page.waitForTimeout(1500);

  await ctx.close();

  const list = [...calls.values()].sort((a, b) => a.at - b.at);
  return {
    name: route.name,
    path: route.path,
    docBytes,
    calls: list,
    total: list.reduce((s, c) => s + c.size, 0),
    count: list.reduce((s, c) => s + c.count, 0),
  };
}

// PLAYWRIGHT_CHROMIUM_PATH lets a sandbox point at a pre-installed browser whose build
// number doesn't match this playwright version (CI images ship one, not both).
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
const browser = await chromium.launch({ executablePath });
const results = [];
for (const route of ROUTES) {
  if (ONLY && !route.name.includes(ONLY)) continue;
  process.stderr.write(`… ${route.name}\n`);
  results.push(await measure(browser, route));
}
await browser.close();

console.log(`\nAPI calls per page — ${BASE}\n`);
console.log(`${pad('page', 20)}${pad('calls', 7)}${pad('API bytes', 12)}${pad('document', 12)}`);
console.log('─'.repeat(51));
for (const r of results) {
  console.log(
    `${pad(r.name, 20)}${pad(r.count, 7)}${pad(KB(r.total), 12)}${pad(KB(r.docBytes), 12)}`
  );
}

for (const r of results) {
  if (!r.calls.length) continue;
  console.log(`\n▸ ${r.name}  (${r.path})`);
  for (const c of r.calls) {
    const n = c.count > 1 ? ` ×${c.count}` : '';
    console.log(`   +${String(c.at).padStart(5)}ms  ${pad(KB(c.size), 10)} ${c.url}${n}`);
  }
}

if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify(results, null, 2));
  console.log(`\n→ ${JSON_OUT}`);
}
