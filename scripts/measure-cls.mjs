#!/usr/bin/env node
/**
 * Layout-shift inventory for a running site.
 *
 * Run: pnpm measure:cls                     (needs a running site, see --base)
 *      pnpm measure:cls --json
 *      pnpm measure:cls --url=/de/parks/europe/germany/rust/europa-park
 *
 * WHY THIS EXISTS, AND WHY IT DOES NOT READ `layout-shift` ENTRIES
 *
 * The obvious harness — open the page, listen to PerformanceObserver('layout-shift'),
 * print the score — reports ~0 against a local server and is worthless. Locally the
 * document is flushed in one go and every Suspense boundary resolves before the first
 * paint, so nothing shifts. That is also why Lighthouse says 0 while the field says
 * otherwise (docs/development/analytics.md). Throttling does not fix it: it delays the
 * whole document evenly, so the boundaries still land before paint.
 *
 * What a visitor on a slow connection sees is TWO layouts: the one the first HTML
 * paints (Suspense fallbacks in place, no client data yet) and the one that is there
 * once everything has landed. Every block whose geometry differs between them is a
 * shift waiting for a slow enough device, and the distance the page below it travels is
 * what CLS charges. So this diffs the two layouts directly, over EVERY element rather
 * than a list of blocks somebody already suspected — which is the point, since the
 * sources this turned up on its first run were the ones nobody had thought to measure.
 *
 * THREE STATES ARE COLLECTED
 *
 *   first     JS off            → the first-paint layout
 *   settled   JS on, waited     → the final layout
 *   noImages  JS on, images off → the layout while the pictures are still in flight
 *
 * `first → settled` finds unreserved boundaries and client-mounted blocks.
 * `noImages → settled` finds pictures whose box is not reserved — a difference the
 * first diff cannot see, because images behave identically in both of its runs.
 *
 * MATCHING ELEMENTS BETWEEN TWO RUNS IS THE HARD PART
 *
 * Two obvious keys both produce confident nonsense:
 *   - tag + sibling index: the homepage mounts whole sections on the client, and one
 *     insertion renumbers every section after it — the diff then compares favourites
 *     against blog and reports a 2000px collapse that never happens.
 *   - tag + class signature: a block whose conditional classes change reads as removed
 *     and a different one inserted, so the hero shows up as new on every run.
 *
 * So children are aligned per parent with a longest common subsequence over their
 * signatures. Insertions and removals fall out of the alignment instead of renumbering
 * everything after them, and a block only counts as new when nothing matched it.
 *
 * READING THE OUTPUT
 *
 * `Δh` is what a block grows by, which is the distance everything below it travels.
 * `est.` is that over the viewport height: the score a visitor pays who is looking at
 * the content below when it moves. Rows are split by depth, because a block two
 * viewports down is what the field reports, while a 30,000px growth further down is the
 * attraction grid mounting under a reader who has not scrolled there yet.
 *
 * Not every finding is a bug. A reservation can be deliberately absent because the
 * content is optional and reserving it would collapse the box on the pages that never
 * get it — see the nearby-parks note in docs/architecture/system-overview.md. Judge a
 * row by whether the content is predictable, not by its size.
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
/** Fail the run when a single in-view block is worse than this. Off unless asked for. */
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
  '/de/parks/europe/germany/rust/europa-park', // big park: nearby + blog + holiday warning
  '/de/parks/europe/germany/soltau/heide-park', // no nearby section (48% of the catalog)
  '/de/parks/europe/germany/bruehl/phantasialand/taron', // ride page
  '/de/blog',
];

const urlArg = args.filter((a) => a.startsWith('--url=')).map((a) => a.slice(6));
const URLS = urlArg.length ? urlArg : DEFAULT_URLS;

/** Collects the render tree with the geometry of every element, in flow or not. */
function collectTree() {
  const build = (el, ancestorInFlow) => {
    const r = el.getBoundingClientRect();
    // Out of flow is inherited: a fixed banner and everything inside it moves with the
    // viewport, not with the page, so none of it can displace page content.
    const pos = getComputedStyle(el).position;
    const inFlow = ancestorInFlow && pos !== 'fixed' && pos !== 'absolute';
    const classes = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
    const sig =
      el.tagName.toLowerCase() + (classes.length ? '.' + classes.slice(0, 3).join('.') : '');
    return {
      sig,
      y: Math.round(r.top + window.scrollY),
      h: Math.round(r.height),
      inFlow,
      text: (el.textContent || '').trim().slice(0, 40).replace(/\s+/g, ' '),
      children: [...el.children].map((c) => build(c, inFlow)),
    };
  };
  const root = document.querySelector('main') || document.body;
  return { tree: build(root, true), doc: Math.round(document.documentElement.scrollHeight) };
}

/** Longest common subsequence over child signatures, so an insertion renumbers nothing. */
function alignChildren(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i].sig === b[j].sig ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i].sig === b[j].sig) {
      pairs.push([a[i], b[j]]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++; // only in the "before" tree: removed, nothing to report on the settled side
    } else {
      pairs.push([null, b[j]]);
      j++;
    }
  }
  for (; j < m; j++) pairs.push([null, b[j]]);

  // Second pass, tag only. A block whose conditional classes differ between the two runs
  // survives the first pass unmatched and would be reported as freshly inserted at its
  // full height — the hero did exactly that, showing up as a 656px insertion on a page
  // where it had simply gained a class. Pairing the leftovers by tag, in order, keeps
  // those matched; a genuinely new block has no leftover partner and stays new.
  const leftoverBefore = a.filter((x) => !pairs.some(([pa]) => pa === x));
  for (const pair of pairs) {
    if (pair[0]) continue;
    const idx = leftoverBefore.findIndex(
      (x) => x && x.sig.split('.')[0] === pair[1].sig.split('.')[0]
    );
    if (idx !== -1) {
      pair[0] = leftoverBefore[idx];
      leftoverBefore[idx] = null;
    }
  }
  return pairs;
}

/** Walks both trees in step, emitting every in-flow block whose height changed. */
function diffTrees(before, after, minDelta) {
  const rows = [];
  const visit = (a, b, path, depth) => {
    if (depth > 14) return;
    if (b.inFlow) {
      if (!a) rows.push({ path, ...b, dh: b.h, inserted: true });
      else if (Math.abs(b.h - a.h) >= minDelta)
        rows.push({ path, ...b, dh: b.h - a.h, inserted: false });
    }
    const seen = {};
    for (const [ca, cb] of alignChildren(a ? a.children : [], b.children)) {
      seen[cb.sig] = (seen[cb.sig] ?? 0) + 1;
      visit(ca, cb, `${path}>${cb.sig}:${seen[cb.sig]}`, depth + 1);
    }
  };
  visit(before, after, 'main', 0);
  return rows;
}

/**
 * A block that grows also moves every block below it, and those all report the same
 * displacement. Only the outermost block of a growth is kept: a descendant with the
 * same Δh is the same finding one level down.
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
      // Not a network-speed simulation: the point is the space an element occupies while
      // its picture has not arrived. A photo with a reserved box looks the same either
      // way; one without collapses, and that difference is the shift.
      await page.route('**/*', (route) =>
        route.request().resourceType() === 'image' ? route.abort() : route.continue()
      );
    }
    await page.goto(url, { waitUntil: js ? 'domcontentloaded' : 'load', timeout: 90000 });
    await page.waitForTimeout(js ? SETTLE_MS : 800);
    return await page.evaluate(collectTree);
  } finally {
    await ctx.close();
  }
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

    const fold = viewport.height * 2;
    const scored = dedupeToCauses(diffTrees(first.tree, settled.tree, MIN_DELTA_PX))
      .map((r) => ({ ...r, est: Math.min(1, Math.abs(r.dh) / viewport.height) }))
      .sort((x, y) => Math.abs(y.dh) - Math.abs(x.dh));

    // An ancestor that starts above the fold grows by whatever its children grew, so a
    // park page's <main> "grows" by the 30,000px the attraction grid adds two viewports
    // down. Reporting that as an in-view shift puts the biggest number on the element
    // that did nothing, which is how a list like this becomes noise.
    const inheritedFromBelow = (row) =>
      scored.some(
        (d) =>
          d !== row &&
          d.path.startsWith(row.path + '>') &&
          d.y > fold &&
          Math.abs(d.dh) >= Math.abs(row.dh) * 0.8
      );

    report.push({
      url,
      viewport: viewport.name,
      docFirst: first.doc,
      docSettled: settled.doc,
      causes: scored.filter((r) => r.y <= fold && !inheritedFromBelow(r)).slice(0, 10),
      below: scored.filter((r) => r.y > fold || inheritedFromBelow(r)).slice(0, 5),
      imageCauses: dedupeToCauses(diffTrees(noImages.tree, settled.tree, MIN_DELTA_PX))
        .filter((r) => !r.inserted)
        .map((r) => ({ ...r, est: Math.min(1, Math.abs(r.dh) / viewport.height) }))
        .sort((x, y) => Math.abs(y.dh) - Math.abs(x.dh))
        .slice(0, 8),
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
        console.log(
          '  ' +
            String(c.y).padStart(7) +
            '  ' +
            `${c.dh > 0 ? '+' : ''}${c.dh}`.padStart(7) +
            '  ' +
            c.est.toFixed(3).padStart(6) +
            '  ' +
            (c.sig.slice(0, 38) + (c.inserted ? ' (neu)' : '')).padEnd(40) +
            c.text
        );
      }
    };

    if (!entry.causes.length && !entry.below.length && !entry.imageCauses.length) {
      console.log('  ✅ nothing moves between first paint and settled');
      continue;
    }
    for (const c of entry.causes) worst = Math.max(worst, c.est);
    for (const c of entry.imageCauses) worst = Math.max(worst, c.est);
    table(entry.causes, 'IN VIEW at first paint — this is what the field reports:');
    table(entry.below, 'further down — only a visitor who already scrolled there sees it:');
    table(entry.imageCauses, 'PICTURES — box not reserved, shifts when the bytes land:');
  }
  console.log(
    `\nworst in-view block: est. CLS ${worst.toFixed(3)} — the score a visitor pays who is\n` +
      'looking at the content below it when it moves.\n'
  );
  if (THRESHOLD !== null && worst > Number(THRESHOLD)) {
    console.error(`❌ over the --threshold=${THRESHOLD}`);
    process.exit(1);
  }
}
