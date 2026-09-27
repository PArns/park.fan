#!/usr/bin/env node
/**
 * How tall a page is on a phone, and where that height goes.
 *
 * Run: pnpm measure:mobile-height                          (needs a running site, see --base)
 *      pnpm measure:mobile-height /de/parks/europe/germany/rust/europa-park
 *      pnpm measure:mobile-height --json baseline.json
 *      pnpm measure:mobile-height --compare baseline.json
 *
 * Every ticket in the "Mobile Optimierungen" project has to say how much height it saves. This
 * is the one ruler they all use, so a before/after is two runs of the same script rather than
 * two estimates.
 *
 * WHAT IT PRINTS, PER PAGE
 *
 *   total      document height in px and in screens (px / visible viewport height)
 *   h1         y of the page's first <h1>
 *   first      y of the first top-level `main section` — where the content starts
 *   chapter    height of every top-level `main section` (a section with no section above it
 *              inside <main>), named by its first heading
 *   footer     height of the site footer
 *   ride/park  cards: count, median height, cards per row
 *
 * THE PAGE IS SCROLLED TO THE END BEFORE ANYTHING IS MEASURED
 *
 * `LazyMount` holds a placeholder until its block nears the viewport, and the placeholder is
 * only an estimate of the real height. Measured from the top without scrolling, a park page
 * reports the reservation of its attraction grid, not the grid. So the run walks down one
 * screen at a time until the document stops growing, waits for the page to settle, and only
 * then reads the geometry.
 *
 * HOW CARDS ARE FOUND
 *
 * Without markers added for this script: a ride card is the element carrying
 * `data-planner-ride` (the root of `AttractionCard`), a park card is an `article[data-card-fx]`
 * that is not inside one, or the `[data-park-card-row]` that `ParkCard` renders in its place
 * below `sm`. Only visible ones count, so a card and its row are never both. Cards per row is
 * the largest number of cards sharing one top edge.
 *
 * Needs a PRODUCTION site (`pnpm build && pnpm start`) at `localhost` — a `next dev` server
 * ships its CSS through JavaScript and lays out differently until it lands, and the live site
 * answers repeated runs with 429/403 from Cloudflare.
 */

import { chromium, devices } from 'playwright';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const valueOf = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i >= 0) return args[i + 1];
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const BASE = valueOf('base', process.env.MOBILE_HEIGHT_BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  ''
);
const JSON_OUT = valueOf('json', null);
const COMPARE = valueOf('compare', null);
/** Time to wait at the bottom of the page for late sections before measuring. */
const SETTLE_MS = Number(valueOf('settle', '3000'));
/** Same client IP as `measure-cls`: without it `/api/nearby` answers with no parks, and the
 *  nearby block settles on its short empty state instead of the list a visitor gets. */
const CLIENT_IP = valueOf('ip', '91.64.1.1');

/** The ticket's device: 390 × 664 visible, touch, mobile layout. */
const DEVICE = devices['iPhone 13'];
const SCREEN_PX = DEVICE.viewport.height;

const PARK = '/de/parks/europe/germany/bruehl/phantasialand';
const DEFAULT_PATHS = [
  '/de',
  '/de/parks',
  '/de/parks/europe/germany',
  PARK,
  `${PARK}/taron`,
  `${PARK}/wartezeiten-kalender`,
  `${PARK}/durchschnittliche-wartezeiten`,
];

/** Flags that take a value; everything else not starting with `--` is a path. */
const VALUED = new Set(['base', 'json', 'compare', 'settle', 'ip']);
const paths = args.filter((a, i) => {
  if (a.startsWith('--')) return false;
  const prev = args[i - 1];
  return !(prev && prev.startsWith('--') && VALUED.has(prev.slice(2)));
});
const PATHS = paths.length ? paths : DEFAULT_PATHS;

const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const LAUNCH = existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {};

/** Runs in the page: scrolls down one screen at a time until the document stops growing. */
async function scrollToEnd(page) {
  let lastHeight = 0;
  let stable = 0;
  for (let step = 0; step < 400 && stable < 3; step++) {
    const { y, height, inner } = await page.evaluate(() => ({
      y: window.scrollY,
      height: document.documentElement.scrollHeight,
      inner: window.innerHeight,
    }));
    if (y + inner >= height - 2) {
      stable = height === lastHeight ? stable + 1 : 0;
    }
    lastHeight = height;
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.9)));
    await page.waitForTimeout(250);
  }
}

/** Runs in the page: reads every number the report prints. */
function collect() {
  const docY = (el) => el.getBoundingClientRect().top + window.scrollY;
  const height = (el) => el.getBoundingClientRect().height;
  const median = (xs) => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const cards = (els) => {
    const shown = els.filter(visible);
    const rows = new Map();
    for (const el of shown) {
      const top = Math.round(docY(el));
      rows.set(top, (rows.get(top) ?? 0) + 1);
    }
    return {
      count: shown.length,
      medianHeight: shown.length ? Math.round(median(shown.map(height))) : null,
      perRow: rows.size ? Math.max(...rows.values()) : null,
    };
  };

  const main = document.querySelector('main');
  const h1 = document.querySelector('h1');
  const sections = main
    ? [...main.querySelectorAll('section')].filter(
        (s) => !s.parentElement?.closest('section') && visible(s)
      )
    : [];
  const seen = new Map();
  const chapters = sections.map((s) => {
    const heading = s.querySelector('h1, h2, h3');
    const base =
      (heading?.textContent || s.getAttribute('aria-label') || s.id || '(no heading)')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 40) || '(no heading)';
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return {
      name: n > 1 ? `${base} #${n}` : base,
      y: Math.round(docY(s)),
      height: Math.round(height(s)),
    };
  });
  // The site footer is the last <footer> outside <main>; cards and articles carry their own.
  const footer = [...document.querySelectorAll('footer')]
    .filter((f) => !f.closest('main, article'))
    .pop();

  const rideCards = [...document.querySelectorAll('[data-planner-ride]')];
  const parkCards = [
    ...document.querySelectorAll('article[data-card-fx], [data-park-card-row]'),
  ].filter((a) => !a.closest('[data-planner-ride]'));

  return {
    total: Math.round(document.documentElement.scrollHeight),
    h1Y: h1 ? Math.round(docY(h1)) : null,
    firstSectionY: chapters.length ? chapters[0].y : null,
    chapters,
    footer: footer ? Math.round(height(footer)) : null,
    rideCards: cards(rideCards),
    parkCards: cards(parkCards),
  };
}

async function measure(browser, path) {
  const context = await browser.newContext({
    ...DEVICE,
    extraHTTPHeaders: { 'x-forwarded-for': CLIENT_IP },
  });
  const page = await context.newPage();
  try {
    const res = await page.goto(BASE + path, { waitUntil: 'load', timeout: 60_000 });
    if (!res || res.status() >= 400) {
      return { path, error: `HTTP ${res ? res.status() : 'no response'}` };
    }
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await scrollToEnd(page);
    await page.waitForTimeout(SETTLE_MS);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    return { path, finalUrl: page.url().replace(BASE, ''), ...(await page.evaluate(collect)) };
  } catch (err) {
    return { path, error: String(err.message || err).split('\n')[0] };
  } finally {
    await context.close();
  }
}

const screens = (px) => (px / SCREEN_PX).toFixed(1);

/** One flat list of rows per page, so printing and comparing read the same keys. */
function rows(r) {
  if (r.error) return [];
  const out = [
    ['total', r.total, `${r.total} px · ${screens(r.total)} screens`],
    ['h1 y', r.h1Y, r.h1Y === null ? '—' : `${r.h1Y} px`],
    ['first section y', r.firstSectionY, r.firstSectionY === null ? '—' : `${r.firstSectionY} px`],
  ];
  for (const c of r.chapters) {
    out.push([`chapter: ${c.name}`, c.height, `${c.height} px · ${screens(c.height)} screens`]);
  }
  out.push(['footer', r.footer, r.footer === null ? '—' : `${r.footer} px`]);
  for (const [label, k] of [
    ['ride cards', 'rideCards'],
    ['park cards', 'parkCards'],
  ]) {
    const c = r[k];
    out.push([`${label}: count`, c.count, String(c.count)]);
    if (c.count) {
      out.push([`${label}: median height`, c.medianHeight, `${c.medianHeight} px`]);
      out.push([`${label}: per row`, c.perRow, String(c.perRow)]);
    }
  }
  return out;
}

function print(results, previous) {
  const before = new Map(
    (previous?.pages ?? []).map((p) => [p.path, new Map(rows(p).map(([k, v]) => [k, v]))])
  );
  const width = 50;
  for (const r of results) {
    console.log(`\n${r.path}${r.finalUrl && r.finalUrl !== r.path ? `  → ${r.finalUrl}` : ''}`);
    if (r.error) {
      console.log(`  error: ${r.error}`);
      continue;
    }
    const old = before.get(r.path);
    const current = rows(r);
    for (const [key, value, text] of current) {
      let delta = '';
      if (old) {
        if (!old.has(key)) delta = '  (new)';
        else if (typeof value === 'number' && typeof old.get(key) === 'number') {
          const d = value - old.get(key);
          delta = d === 0 ? '  ±0' : `  ${d > 0 ? '+' : ''}${d}`;
        } else delta = value === old.get(key) ? '  ±0' : `  (was ${old.get(key) ?? '—'})`;
      }
      console.log(`  ${key.padEnd(width)} ${text}${delta}`);
    }
    if (old) {
      const keys = new Set(current.map(([k]) => k));
      for (const [key, value] of old) {
        if (!keys.has(key)) console.log(`  ${key.padEnd(width)} (gone, was ${value})`);
      }
    }
  }
}

const previous = COMPARE ? JSON.parse(readFileSync(COMPARE, 'utf8')) : null;
const browser = await chromium.launch(LAUNCH);
const results = [];
for (const path of PATHS) results.push(await measure(browser, path));
await browser.close();

console.log(
  `measure-mobile-height · ${BASE} · ${DEVICE.viewport.width} × ${SCREEN_PX} visible` +
    (previous ? ` · compared with ${COMPARE} (${previous.measuredAt})` : '')
);
print(results, previous);

if (JSON_OUT) {
  const doc = {
    measuredAt: new Date().toISOString(),
    base: BASE,
    viewport: DEVICE.viewport,
    pages: results,
  };
  writeFileSync(JSON_OUT, JSON.stringify(doc, null, 2) + '\n');
  console.log(`\nwrote ${JSON_OUT}`);
}

if (results.some((r) => r.error)) process.exitCode = 1;
