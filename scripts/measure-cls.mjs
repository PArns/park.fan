#!/usr/bin/env node
/**
 * Layout-shift inventory for a running site.
 *
 * Run: pnpm measure:cls                     (needs a running site, see --base)
 *      pnpm measure:cls --json
 *      pnpm measure:cls --url=/de/parks/europe/germany/rust/europa-park
 *      pnpm measure:cls --late               (replay the stream slowly, read real CLS)
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
 *
 * `--late` IS THE OTHER HALF: PROVING A FIX
 *
 * The diff above finds candidates. It cannot tell you what the browser would score,
 * and CPU throttling is no substitute — the same page under the same 4× throttle
 * measured 0.000 and 0.088 in two consecutive runs, so a before/after comparison built
 * on it is a coin toss.
 *
 * So `--late` stages the race deterministically. It fetches the page once, finds where
 * React parked the resolved Suspense content (`<div hidden id="S:1">` near the end of
 * the body) and re-serves the document through a local proxy that flushes everything
 * before it immediately and the rest N ms later. No throttling of any kind: the shell
 * paints, then the tail lands, which is the shape of a cold start whose sub-request
 * missed cache. Under that, Chromium reports the same score every time, and the run
 * prints its own `layout-shift` entries with the element each one blames.
 *
 * A page that prints "does not stream" has no deferred boundary left — which, for a
 * page that used to have one, is the fix landing.
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import http from 'node:http';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const has = (name) => args.includes(`--${name}`);

/**
 * The site to measure.
 *
 * `localhost`, NOT `127.0.0.1`, and that is not cosmetic: `next dev` refuses cross-origin
 * requests for `/_next/static/chunks/*` and answers **403** when the browser's origin is not
 * one it recognises, which `127.0.0.1` is not. Every chunk then fails, the page never
 * hydrates, and the run happily reports a page with no client JS in it at all — three
 * consecutive "CLS 0.0000" verdicts on a page the field scores above 0.25. See
 * `assertMeasurable`, which now refuses that run instead of grading it.
 */
const BASE = flag('base', process.env.CLS_BASE_URL || 'http://localhost:3000');
const AS_JSON = has('json');
const SETTLE_MS = Number(flag('settle', '9000'));
/** Ignore sub-pixel noise and rounding; below this nothing is worth reporting. */
const MIN_DELTA_PX = Number(flag('min', '8'));
/** Fail the run when a single in-view block is worse than this. Off unless asked for. */
const THRESHOLD = flag('threshold', null);
/**
 * The client IP the run pretends to come from, as `x-forwarded-for`.
 *
 * Without it every request arrives from 127.0.0.1, `/api/nearby` answers
 * `userLocation: {0, 0}` with an empty park list, and the nearby card settles on its short
 * "no parks near you" state — which is NOT what a visitor gets. A real IP geolocates (this
 * one to Berlin) and the card settles on the six-card list instead, roughly 576 px taller.
 * Measuring the wrong one of those two is how a placeholder gets tuned backwards.
 */
const CLIENT_IP = flag('ip', '91.64.1.1');

/** `--late` / `--late=2500`: replay mode, and how long the streamed tail is held back. */
const LATE_MS = has('late') ? 1500 : Number(flag('late', '0'));
/** Where the reader is parked in `--late` mode. A shift only scores what is in view. */
const SCROLL_TO = Number(flag('scroll', '0'));

/** Same fallback the other Playwright scripts use: the CI image's build when it is there, and
 *  otherwise nothing, which hands the choice to Playwright's own resolution. `CHROMIUM_PATH` is
 *  the name `check-card-framing`, `check-webmcp` and `render-coaster-elements` already honour —
 *  a second spelling would be a variable a developer exports and this script ignores. */
const PREINSTALLED =
  process.env.CHROMIUM_PATH ?? process.env.CLS_CHROMIUM ?? '/opt/pw-browsers/chromium';
if (!process.env.CHROMIUM_PATH && process.env.CLS_CHROMIUM) {
  // `CLS_CHROMIUM` was this script's own name for the override before it adopted the one its
  // three sibling harnesses use. Still honoured, but say so — an override that is silently
  // ignored is the failure this whole fallback exists to remove.
  console.warn('note: CLS_CHROMIUM is deprecated, use CHROMIUM_PATH (the other harnesses read it)');
}
const LAUNCH = existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {};

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
  '/de/glossar/giga-coaster', // glossary term: the field's second-worst page, and the
  // one this list was missing when the field first reported it
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

/**
 * Walks both trees in step, emitting every in-flow block whose height changed.
 *
 * An inserted node is only a shift if it actually pushed something. A placeholder that is
 * swapped for real content of the same height displaces nothing — but the two are often
 * different elements (a `div` skeleton replaced by an `<svg>` map), so no alignment can pair
 * them and the newcomer looks like it appeared from nowhere. The test that settles it is not
 * identity but consequence: did any following sibling move? If every one of them sits at the
 * same offset inside the parent, the insertion was a swap and is reported as contained.
 */
function diffTrees(before, after, minDelta) {
  const rows = [];
  const visit = (a, b, path, depth) => {
    if (depth > 14) return;

    const pairs = alignChildren(a ? a.children : [], b.children);
    // Offsets are taken relative to the parent, so a parent that itself moved does not make
    // every child look displaced.
    const movedSiblings = pairs.some(
      ([ca, cb]) => ca && cb && Math.abs(cb.y - b.y - (ca.y - a.y)) >= minDelta
    );

    if (b.inFlow) {
      if (!a) rows.push({ path, ...b, dh: b.h, inserted: true, contained: false });
      else if (Math.abs(b.h - a.h) >= minDelta)
        rows.push({ path, ...b, dh: b.h - a.h, inserted: false, contained: false });
    }

    const seen = {};
    for (const [ca, cb] of pairs) {
      seen[cb.sig] = (seen[cb.sig] ?? 0) + 1;
      const childPath = `${path}>${cb.sig}:${seen[cb.sig]}`;
      if (!ca && cb.inFlow && !movedSiblings && a) {
        // Appeared, and nothing around it moved: a swap, not a shift.
        rows.push({ path: childPath, ...cb, dh: cb.h, inserted: true, contained: true });
        continue;
      }
      visit(ca, cb, childPath, depth + 1);
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

/**
 * Refuse to grade a run that did not measure the real page.
 *
 * Two setups produce confident zeros, and neither announces itself:
 *
 * 1. **A dev server.** `next dev` injects the stylesheet through JavaScript, so the
 *    JS-OFF pass — this script's entire model of the first paint — renders unstyled
 *    markup. The diff then compares an unstyled document against a styled one and every
 *    row it prints is noise (a park page reported an 8695 px "first" layout against a
 *    4408 px settled one, all of it Tailwind that had not arrived).
 * 2. **Chunks that 403.** See {@link BASE}.
 *
 * So the JS-OFF pass asserts that CSS is present (the layout sets `font-sans` on `<body>`;
 * with no stylesheet the browser falls back to its serif default) and every pass asserts
 * that no `/_next/` subresource failed. Both are properties of the page under test rather
 * than a version sniff, so they also catch a build that was never run.
 */
function assertMeasurable({ url, js, failed, bodyFont }) {
  if (failed.length) {
    const [first] = failed;
    throw new Error(
      `${url}: ${failed.length} subresource(s) failed (${first.status} ${first.url}).\n` +
        `  A 403 on /_next/static/chunks means a \`next dev\` server reached over an origin it\n` +
        `  does not accept — measure a production build (\`pnpm build && pnpm start\`) and use\n` +
        `  --base=http://localhost:3000, never 127.0.0.1.`
    );
  }
  if (!js && bodyFont && /^(times|serif$)/i.test(bodyFont.trim())) {
    throw new Error(
      `${url}: the JS-off pass rendered without CSS (body font "${bodyFont}").\n` +
        `  \`next dev\` ships the stylesheet through JavaScript, so its first-paint layout is\n` +
        `  unstyled and every row this script prints against it is noise. Measure a production\n` +
        `  build: pnpm build && pnpm start.`
    );
  }
}

async function layoutFor(browser, url, viewport, js, blockImages = false) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile,
    javaScriptEnabled: js,
    extraHTTPHeaders: { 'x-forwarded-for': CLIENT_IP },
  });
  const page = await ctx.newPage();
  const failed = [];
  page.on('response', (r) => {
    if (r.status() >= 400 && new URL(r.url()).pathname.startsWith('/_next/')) {
      failed.push({ status: r.status(), url: r.url() });
    }
  });
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
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    assertMeasurable({ url, js, failed, bodyFont });
    return await page.evaluate(collectTree);
  } finally {
    await ctx.close();
  }
}

/**
 * Serves one captured document split in two, and proxies everything else (JS chunks,
 * images, API routes) straight through to the real server so the page still works.
 *
 * `cut` sits right before React's `<div hidden id="S:…">` block — everything before it
 * is the shell the browser paints, everything after is the deferred boundary content
 * plus the `$RC()` call that grafts it into place.
 */
function serveSplit(html, cut, delayMs, splitPath) {
  const server = http.createServer(async (req, res) => {
    if (req.url === splitPath) {
      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      });
      res.write(html.slice(0, cut));
      setTimeout(() => res.end(html.slice(cut)), delayMs);
      return;
    }
    try {
      const upstream = await fetch(BASE + req.url, {
        headers: { accept: req.headers.accept || '*/*', 'x-forwarded-for': CLIENT_IP },
      });
      const body = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(502).end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** Chromium's own layout-shift entries, scored the way CLS scores them. */
function readShifts() {
  window.__cls = [];
  const label = (node) => {
    if (!node || node.nodeType !== 1) return '?';
    const parts = [];
    for (let el = node, i = 0; el && el.nodeType === 1 && i < 3; el = el.parentElement, i++) {
      const cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2);
      parts.unshift(
        el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + cls.map((c) => `.${c}`).join('')
      );
    }
    return parts.join('>');
  };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__cls.push({
        t: Math.round(e.startTime),
        v: Number(e.value.toFixed(4)),
        sources: (e.sources || []).slice(0, 2).map((src) => ({
          el: label(src.node),
          move: `${Math.round(src.previousRect.top)}→${Math.round(src.currentRect.top)}`,
        })),
      });
    }
  }).observe({ type: 'layout-shift', buffered: true });
}

/** The CLS session window: entries within 1s of each other and 5s of the first. */
function sessionWindowMax(entries) {
  let best = 0;
  let current = 0;
  let start = 0;
  let last = 0;
  for (const e of entries) {
    if (current && (e.t - last > 1000 || e.t - start > 5000)) {
      best = Math.max(best, current);
      current = 0;
    }
    if (!current) start = e.t;
    current += e.v;
    last = e.t;
  }
  return Math.max(best, current);
}

if (LATE_MS > 0) {
  const browser = await chromium.launch(LAUNCH);
  console.log(
    `Streamed tail held back ${LATE_MS} ms, no throttling.` +
      (SCROLL_TO ? ` Reader parked at y=${SCROLL_TO}.` : ' Reader at the top of the page.')
  );
  for (const path of URLS) {
    const url = path.startsWith('http') ? path : BASE + path;
    const html = await fetch(url, {
      headers: { accept: 'text/html', 'x-forwarded-for': CLIENT_IP },
    }).then((r) => r.text());
    const cut = html.indexOf('<div hidden id="S:');
    console.log('\n' + '='.repeat(94));
    console.log(url);
    if (cut < 0) {
      console.log('  does not stream — no deferred boundary to hold back, nothing to measure here');
      continue;
    }
    // Served under the page's OWN pathname, not a made-up one. Next ships the route in the
    // RSC payload and the client router re-resolves it on hydration: from `/__cls_split` it
    // found a different route than the HTML had been rendered for, threw React #418 and
    // re-rendered the page on the client — so the run measured a partly client-rendered page
    // and called it the server's. Same bytes under the real path: no error.
    const splitPath = new URL(url).pathname + new URL(url).search;
    const server = await serveSplit(html, cut, LATE_MS, splitPath);
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
      for (const viewport of VIEWPORTS) {
        const ctx = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.isMobile,
          hasTouch: viewport.isMobile,
          extraHTTPHeaders: { 'x-forwarded-for': CLIENT_IP },
        });
        const page = await ctx.newPage();
        await page.addInitScript(readShifts);
        if (SCROLL_TO) {
          // Re-asserted every frame, not set once: right after `commit` the document is
          // still the shell and often too short to scroll that far, so a single call
          // silently lands at the bottom and the reader ends up somewhere else.
          await page.addInitScript((y) => {
            const hold = () => {
              if (window.scrollY !== y) window.scrollTo(0, y);
              if (performance.now() < 20000) requestAnimationFrame(hold);
            };
            requestAnimationFrame(hold);
          }, SCROLL_TO);
        }
        // Surfaces the hydration errors the split used to cause itself — a run that prints
        // these is not measuring the page the server sent.
        const pageErrors = [];
        page.on('console', (m) => {
          if (m.type() === 'error') pageErrors.push(m.text().split('\n')[0].slice(0, 120));
        });
        // Same guard as the diff mode: a chunk that 403s leaves a page that never hydrates,
        // and an unhydrated page scores 0.0000 with nothing to say it did not measure.
        const failed = [];
        page.on('response', (r) => {
          if (r.status() >= 400 && new URL(r.url()).pathname.startsWith('/_next/')) {
            failed.push({ status: r.status(), url: r.url() });
          }
        });
        await page.goto(origin + splitPath, { waitUntil: 'commit', timeout: 90000 });
        await page.waitForTimeout(LATE_MS + 6000);
        assertMeasurable({ url, js: true, failed });
        const entries = await page.evaluate(() => window.__cls);
        const cls = sessionWindowMax(entries);
        console.log(`  ${viewport.name.padEnd(8)} CLS ${cls.toFixed(4)}`);
        for (const err of [...new Set(pageErrors)].slice(0, 3)) {
          console.log(`      ⚠️  console error: ${err}`);
        }
        for (const e of entries.filter((x) => x.v > 0)) {
          console.log(
            `      ${String(e.t).padStart(6)} ms  ${e.v.toFixed(4).padStart(7)}  ` +
              e.sources.map((src) => `${src.el} ${src.move}`).join(' | ')
          );
        }
        await ctx.close();
      }
    } finally {
      server.close();
    }
  }
  await browser.close();
  process.exit(0);
}

const browser = await chromium.launch(LAUNCH);
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
      causes: scored
        .filter((r) => r.y <= fold && !inheritedFromBelow(r) && !r.contained)
        .slice(0, 10),
      below: scored.filter((r) => r.y > fold || inheritedFromBelow(r) || r.contained).slice(0, 5),
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
