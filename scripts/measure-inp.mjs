#!/usr/bin/env node
/**
 * INP of the taps a phone visitor makes on a page, measured inside the page.
 *
 * Run: pnpm measure:inp                                   (Six Flags Great Adventure, 4x CPU)
 *      pnpm measure:inp --path=/de/parks/europe/germany/rust/europa-park --cpu=6
 *      pnpm measure:inp --only=tab,search                  (steps whose label contains a word)
 *
 * Needs a PRODUCTION site (`pnpm build && pnpm start`) at `localhost`, like measure-cls: `next dev`
 * renders in development mode and every number it gives is several times too high.
 *
 * WHAT IT PRINTS
 *
 * 1. The style probe: what one text change in one card costs in forced style + layout. A few ms is
 *    healthy. Hundreds means a change anywhere restyles the whole document — the regression behind
 *    Search Console's INP report of 2026-09-23, caused by `:has()` rules
 *    (docs/rules/no-has-selector-in-the-stylesheet.md). Every React commit pays this number.
 * 2. Every tap, as its Event Timing entry: the duration INP uses, split into input delay (the main
 *    thread was busy when the finger landed), processing (the handlers) and presentation (the
 *    render and paint after them). The split says what to fix; see
 *    docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md.
 *
 * Read the entries from INSIDE the page (a PerformanceObserver installed before load), never by
 * timing `tap()` from the test: the round trip through CDP is not part of the interaction and
 * the entry's own phases are.
 *
 * Absolute numbers depend on the machine. Compare runs on one machine, and read the ratio.
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const BASE = flag('base', 'http://localhost:3000');
const PATH = flag(
  'path',
  '/en/parks/north-america/united-states/jackson-township/six-flags-great-adventure'
);
const CPU = Number(flag('cpu', '4'));
const SETTLE_MS = Number(flag('settle', '15000'));
const ONLY = flag('only', null)?.split(',');
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

const browser = await chromium.launch(
  existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}
);
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'en-US',
});
await context.addInitScript(() => {
  window.__inp = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (!e.interactionId) continue;
      window.__inp.push({
        id: e.interactionId,
        name: e.name,
        dur: e.duration,
        input: e.processingStart - e.startTime,
        proc: e.processingEnd - e.processingStart,
        pres: e.startTime + e.duration - e.processingEnd,
      });
    }
  }).observe({ type: 'event', durationThreshold: 16, buffered: true });
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });

await page.goto(BASE + PATH, { waitUntil: 'load', timeout: 120_000 });
await page.waitForTimeout(SETTLE_MS);

const r = (n) => Math.round(n);
console.log(`${PATH}  390 px, touch, ${CPU}x CPU`);

// 1. The style probe.
const probe = await page.evaluate(() => {
  const leaf = [...document.querySelectorAll('main article span, main h1')].find(
    (e) => e.children.length === 0 && e.textContent.trim().length > 2
  );
  if (!leaf) return null;
  const original = leaf.textContent;
  const times = [];
  for (let i = 0; i < 5; i++) {
    leaf.textContent = original + (i % 2 ? '\u200b' : '');
    const t = performance.now();
    // Reading a layout property forces the style and layout pass the change queued.
    void document.body.offsetHeight;
    times.push(performance.now() - t);
  }
  leaf.textContent = original;
  times.sort((a, b) => a - b);
  return times[2];
});
console.log(
  `style probe: one text change costs ${probe === null ? '?' : r(probe)} ms of forced style + layout` +
    (probe !== null && probe > 50 ? '  ← the whole document restyles on every change' : '')
);

// 2. The taps.
const drain = () => page.evaluate(() => window.__inp.splice(0));
const results = [];
async function step(label, act) {
  if (ONLY && !ONLY.some((o) => label.includes(o))) return;
  try {
    await act();
  } catch (e) {
    console.log(`  ${label.padEnd(30)} skipped (${String(e.message).split('\n')[0].slice(0, 70)})`);
    return;
  }
  await page.waitForTimeout(1800);
  const byId = new Map();
  for (const e of await drain())
    if (!byId.has(e.id) || e.dur > byId.get(e.id).dur) byId.set(e.id, e);
  const worst = [...byId.values()].sort((a, b) => b.dur - a.dur)[0];
  if (!worst) return console.log(`  ${label.padEnd(30)} < 16 ms`);
  results.push({ label, ...worst });
  console.log(
    `  ${label.padEnd(30)} ${String(r(worst.dur)).padStart(5)} ms   input ${String(r(worst.input)).padStart(4)} · processing ${String(r(worst.proc)).padStart(4)} · presentation ${String(r(worst.pres)).padStart(4)}   (${worst.name})`
  );
}
async function tap(locator) {
  const el = locator.filter({ visible: true }).first();
  await el.scrollIntoViewIfNeeded({ timeout: 5000 });
  await page.waitForTimeout(1200);
  await drain();
  await el.tap({ timeout: 5000 });
}
const tile = (name) => page.locator('[role="tab"]').filter({ hasText: name });

for (const name of ['Shows', 'Restaurants', 'Weather', 'Map', 'Attractions']) {
  if ((await tile(name).count()) > 0) await step(`tab: ${name}`, () => tap(tile(name)));
}
await step('filter sheet: open', () =>
  tap(page.locator('main button[aria-haspopup="dialog"]').filter({ hasText: /Filter/ }))
);
await step('filter sheet: first pill', async () => {
  await page.waitForTimeout(600);
  await tap(page.locator('[role="dialog"] button[aria-pressed]'));
});
await step('filter sheet: close', async () => {
  await drain();
  await page.keyboard.press('Escape');
});
await step('search: focus', () => tap(page.locator('main input[placeholder]')));
await step('search: type', async () => {
  await drain();
  await page.keyboard.type('ka', { delay: 300 });
});
await step('search: clear', async () => {
  await drain();
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(300);
  await page.keyboard.press('Backspace');
});
await step('favourite star', () => tap(page.locator('main button[aria-label*="favorite" i]')));
await step('favourite star (undo)', () =>
  tap(page.locator('main button[aria-label*="favorite" i]'))
);
await step('FAQ: first question', () => tap(page.locator('main details summary')));

const sorted = results.map((x) => x.dur).sort((a, b) => a - b);
if (sorted.length) {
  console.log(
    `worst ${r(sorted.at(-1))} ms (${results.find((x) => x.dur === sorted.at(-1)).label}), median ${r(sorted[Math.floor(sorted.length / 2)])} ms over ${sorted.length} taps`
  );
}
await browser.close();
