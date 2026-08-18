#!/usr/bin/env node
/**
 * Layout-shift inventory for a running site.
 *
 * Run: pnpm measure:cls                     (needs a running site, see --base)
 *      pnpm measure:cls --json
 *      pnpm measure:cls --url /de/parks/europe/germany/rust/europa-park
 *
 * WHY THIS EXISTS, AND WHY IT DOES NOT JUST READ `layout-shift` ENTRIES
 *
 * The obvious harness — open the page, listen to PerformanceObserver('layout-shift'),
 * print the score — reports ~0 against a local server and is worthless. Locally the
 * document is flushed in one go and every Suspense boundary resolves before the first
 * paint, so nothing shifts. That is also why Lighthouse says 0 while the field says
 * otherwise (docs/development/analytics.md). Throttling does not fix it: it delays the
 * whole document evenly, so the boundaries still land before paint.
 *
 * What a visitor on a slow connection actually sees is TWO layouts: the one the first
 * HTML paints (Suspense fallbacks in place, no client data yet) and the one that is
 * there once everything has landed. Every block whose geometry differs between those
 * two is a shift waiting for a slow enough device — and the distance the page below it
 * travels is what CLS charges. So this script diffs the two layouts directly:
 *
 *   A  javaScriptEnabled: false  → the first-paint layout. Streamed boundaries that
 *      resolved late are absent, their fallbacks are what the HTML carries, and no
 *      client query has run.
 *   B  javaScriptEnabled: true, settled → the final layout.
 *
 * It walks EVERY element (matched across the two runs by a structural path) instead of
 * a hand-written list of selectors. That is the point: the three sources this found on
 * its first run — the weather card, the stats section and the FAQ — were all missed by
 * measuring the blocks somebody already suspected.
 *
 * READING THE OUTPUT
 *
 * `Δh` is what a block grows by; that is the distance everything below it travels.
 * `est. CLS` is that distance over the viewport height — the score a visitor pays if
 * they are looking at the content below when it moves, which is the worst case and the
 * one the field reports. Blocks are listed worst first.
 *
 * Not every finding is a bug. A reservation can be deliberately absent because the
 * content is optional and reserving it would collapse the box on the pages that never
 * get it — see the nearby-parks note in docs/architecture/system-overview.md. Judge a
 * row by whether the content is predictable, not by its size alone.
 */

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const has = (name) => args.includes(`--${name}`);

const BASE = flag('base', process.env.CLS_BASE_URL || 'http://127.0.0.1:3000');
const AS_JSON = has('json');
const SETTLE_MS = Number(flag('settle', '9000'));
/** Ignore sub-pixel noise and rounding; below this nothing is worth reporting. */
const MIN_DELTA_PX = Number(flag('min', '8'));
/** Fail the run when a single block is worse than this. Off unless asked for. */
const THRESHOLD = flag('threshold', null);

const EXECUTABLE = process.env.CLS_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, isMobile: true },
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
];

/**
 * One URL per page TYPE, and where a type behaves differently depending on its data,
 * one per behaviour — a park with neighbouring parks and one without do not shift the
 * same way, and testing only the first hides half the catalog.
 */
const DEFAULT_URLS = [
  '/de',
  '/de/parks/europe/germany/rust/europa-park', // big park, has nearby + blog + holiday warning
  '/de/parks/europe/germany/soltau/heide-park', // no nearby section (48% of the catalog)
  '/de/parks/europe/germany/bruehl/phantasialand/taron', // ride page
  '/de/blog',
];

const urlArg = args.filter((a) => a.startsWith('--url=')).map((a) => a.slice(6));
const URLS = urlArg.length ? urlArg : DEFAULT_URLS;

/**
 * Structural path for an element, stable across the two runs: tag plus its index among
 * same-tag siblings, up to the body. Class names are deliberately NOT part of the key —
 * a block that changes a conditional class would otherwise read as "removed and a
 * different one inserted" and hide the very growth we are measuring.
 */
function collect() {
  const out = [];
  const walk = (el, path, depth) => {
    if (depth > 12) return;
    const r = el.getBoundingClientRect();
    const h = Math.round(r.height);
    // Zero-height wrappers carry no layout of their own.
    if (h > 0) {
      out.push({
        path,
        y: Math.round(r.top + window.scrollY),
        h,
        label:
          el.tagName.toLowerCase() +
          (el.getAttribute('class')
            ? '.' + el.getAttribute('class').trim().split(/\s+/).slice(0, 3).join('.')
            : ''),
        text: (el.textContent || '').trim().slice(0, 40).replace(/\s+/g, ' '),
      });
    }
    const seen = {};
    for (const child of el.children) {
      const tag = child.tagName.toLowerCase();
      seen[tag] = (seen[tag] ?? 0) + 1;
      walk(child, `${path}>${tag}:${seen[tag]}`, depth + 1);
    }
  };
  const root = document.querySelector('main') || document.body;
  walk(root, 'main', 0);
  return { blocks: out, doc: Math.round(document.documentElement.scrollHeight) };
}

async function layoutFor(browser, url, viewport, js, blockImages = false) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile,
    javaScriptEnabled: js,
  });
  const page = await ctx.newPage();
  try {
    if (blockImages) {
      // Not a network-speed simulation: the point is the layout an element occupies
      // while its picture has not arrived. A photo with a reserved box looks identical
      // either way; one without collapses, and that difference is the shift.
      await page.route('**/*', (route) =>
        route.request().resourceType() === 'image' ? route.abort() : route.continue()
      );
    }
    await page.goto(url, { waitUntil: js ? 'domcontentloaded' : 'load', timeout: 90000 });
    await page.waitForTimeout(js ? SETTLE_MS : 800);
    return await page.evaluate(collect);
  } finally {
    await ctx.close();
  }
}

/**
 * A block that grows also moves every block below it, and those all report the same
 * displacement. Reporting each of them would bury the one that caused it, so only the
 * outermost block of a growth is kept: a child whose Δh equals its parent's is the same
 * finding seen one level down.
 */
function dedupeToCauses(rows) {
  const byPath = new Map(rows.map((r) => [r.path, r]));
  return rows.filter((r) => {
    let parent = r.path.slice(0, r.path.lastIndexOf('>'));
    while (parent.includes('>')) {
      const p = byPath.get(parent);
      if (p && Math.abs(p.dh - r.dh) < 4) return false;
      parent = parent.slice(0, parent.lastIndexOf('>'));
    }
    return true;
  });
}

const browser = await chromium.launch({ executablePath: EXECUTABLE });
const report = [];

for (const path of URLS) {
  const url = path.startsWith('http') ? path : BASE + path;
  for (const viewport of VIEWPORTS) {
    let first, settled, noImages;
    try {
      first = await layoutFor(browser, url, viewport, false);
      settled = await layoutFor(browser, url, viewport, true);
      noImages = await layoutFor(browser, url, viewport, true, true);
    } catch (err) {
      report.push({ url, viewport: viewport.name, error: err.message.split('\n')[0] });
      continue;
    }

    const firstBy = new Map(first.blocks.map((b) => [b.path, b]));
    const rows = [];
    for (const b of settled.blocks) {
      const a = firstBy.get(b.path);
      if (!a) {
        // Present only once settled: inserted content, and it reserved nothing.
        rows.push({ ...b, dh: b.h, inserted: true });
        continue;
      }
      const dh = b.h - a.h;
      if (Math.abs(dh) >= MIN_DELTA_PX) rows.push({ ...b, dh, inserted: false });
    }

    // Where a block sits decides whether anybody is looking when it moves. Boundaries
    // resolve within a second or two of load, and by then a visitor is still near the
    // top — so a block two viewports down is what the field actually reports, while a
    // 30,000px growth further down is the attraction grid mounting under a reader who
    // has not scrolled there yet. Split rather than mix: the same number means two very
    // different things at the two depths. Note the fold depends on the PARK — a small
    // park puts its nearby section where a big one puts its ride list.
    const fold = viewport.height * 2;
    const scored = dedupeToCauses(rows)
      .map((r) => ({ ...r, est: Math.min(1, Math.abs(r.dh) / viewport.height) }))
      .sort((x, y) => Math.abs(y.dh) - Math.abs(x.dh));

    // An ancestor that starts above the fold grows by whatever its children grew, so the
    // <main> of a park page "grows" by the 30,000px the attraction grid adds two
    // viewports down. Reporting that as an in-view shift is how a list like this becomes
    // noise: it puts the biggest number on the element that did nothing. A block counts
    // as in-view only if the growth is its OWN — not inherited from a descendant that
    // sits below the fold.
    const inheritedFromBelow = (row) =>
      scored.some(
        (d) =>
          d !== row &&
          d.path.startsWith(row.path + '>') &&
          d.y > fold &&
          Math.abs(d.dh) >= Math.abs(row.dh) * 0.8
      );
    const causes = scored.filter((r) => r.y <= fold && !inheritedFromBelow(r)).slice(0, 10);
    const below = scored.filter((r) => r.y > fold || inheritedFromBelow(r)).slice(0, 5);

    // Third state: everything settled EXCEPT the pictures. A block that is a different
    // height here than with the photos in place is a picture whose box is not reserved,
    // and it shifts the moment the bytes land — a state the JS-on/JS-off diff above
    // cannot see at all, because images behave the same in both of its runs.
    const noImgBy = new Map(noImages.blocks.map((b) => [b.path, b]));
    const imageRows = [];
    for (const b of settled.blocks) {
      const n = noImgBy.get(b.path);
      if (!n) continue;
      const dh = b.h - n.h;
      if (Math.abs(dh) >= MIN_DELTA_PX) imageRows.push({ ...b, dh, inserted: false });
    }
    const imageCauses = dedupeToCauses(imageRows)
      .map((r) => ({ ...r, est: Math.min(1, Math.abs(r.dh) / viewport.height) }))
      .sort((x, y) => Math.abs(y.dh) - Math.abs(x.dh))
      .slice(0, 8);

    report.push({
      url,
      viewport: viewport.name,
      docFirst: first.doc,
      docSettled: settled.doc,
      causes,
      below,
      imageCauses,
    });
  }
}

await browser.close();

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  let worst = 0;
  for (const entry of report) {
    console.log('\n' + '='.repeat(94));
    console.log(`${entry.viewport.toUpperCase().padEnd(8)} ${entry.url}`);
    if (entry.error) {
      console.log(`  ⚠️  ${entry.error}`);
      continue;
    }
    console.log(`document ${entry.docFirst} → ${entry.docSettled} px`);
    const table = (rows, heading) => {
      if (!rows.length) return;
      console.log(`\n  ${heading}`);
      console.log(
        '  ' +
          'y'.padStart(7) +
          '  ' +
          'Δh'.padStart(7) +
          '  ' +
          'est.'.padStart(6) +
          '  ' +
          'block'.padEnd(40) +
          'content'
      );
      for (const c of rows) {
        const mark = c.inserted ? ' (neu)' : '';
        console.log(
          '  ' +
            String(c.y).padStart(7) +
            '  ' +
            `${c.dh > 0 ? '+' : ''}${c.dh}`.padStart(7) +
            '  ' +
            c.est.toFixed(3).padStart(6) +
            '  ' +
            (c.label.slice(0, 38) + mark).padEnd(40) +
            c.text
        );
      }
    };
    if (!entry.causes.length && !entry.below.length && !entry.imageCauses.length) {
      console.log('  ✅ nothing moves between first paint and settled');
      continue;
    }
    for (const c of entry.causes) worst = Math.max(worst, c.est);
    table(entry.causes, 'IN VIEW at first paint — this is what the field reports:');
    table(entry.below, 'further down — only a visitor who already scrolled there sees it:');
    for (const c of entry.imageCauses) worst = Math.max(worst, c.est);
    table(entry.imageCauses, 'PICTURES — box not reserved, shifts when the bytes land:');
  }
  console.log(
    `\nworst in-view block: est. CLS ${worst.toFixed(3)} — the score a visitor pays who is\n` +
      'looking at the content below it when it moves. Only the in-view tables count\n' +
      'towards this and towards --threshold.\n'
  );
  if (THRESHOLD !== null && worst > Number(THRESHOLD)) {
    console.error(`❌ over the --threshold=${THRESHOLD}`);
    process.exit(1);
  }
}
