/**
 * Photograph the build bar with a category open, which `scripts/game-shot.mjs` cannot do.
 *
 * That harness takes a picture of the park: it sets a time of day and a camera preset and shoots.
 * It has no way to press anything, so the one thing this round has to prove — that a carousel, a
 * ferris wheel and a shop are three different pictures in an OPEN palette — is not a shot it can
 * take. This clicks a tab, waits for the renders to land, and shoots the whole viewport and the bar
 * on its own.
 *
 *   node lib/game/tools/shot-bar.mjs --url=http://localhost:3000 --out=.game-render/tools-bar
 *   node lib/game/tools/shot-bar.mjs --tabs=ride,shop --tod=13:00,23:00 --w=390 --h=844
 *
 * It writes `report.json` beside the PNGs with the console errors, the thumbnail studio's own
 * figures (items rendered, items refused, total and slowest milliseconds) and the scene's draw
 * calls and triangles before and after the palette was opened — which is the number that says
 * whether the studio leaked anything into the park's frame.
 *
 * Run it against the PRODUCTION server. `next dev` recompiles under whoever else is working and
 * tears `__parkfan_game` down mid-run.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1'];
  })
);
const base = args.url ?? 'http://localhost:3000';
const out = args.out ?? '.game-render/tools-bar';
const tabs = (args.tabs ?? 'ride,shop,scenery').split(',').filter(Boolean);
const tods = (args.tod ?? '13:00').split(',').filter(Boolean);
const viewport = { width: Number(args.w ?? 1440), height: Number(args.h ?? 900) };
/** How long to keep waiting for renders once no new tile has filled in. */
const QUIET_MS = Number(args.quiet ?? 4000);
const DEADLINE_MS = Number(args.deadline ?? 60000);

await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl-draft-extensions',
  ],
});
const page = await browser.newPage({ viewport });
const console_ = { errors: [], warnings: [] };
page.on('console', (m) => {
  const text = m.text().slice(0, 400);
  if (m.type() === 'error') console_.errors.push(text);
  else if (m.type() === 'warning' && !/WebGPU Context Provider/.test(text))
    console_.warnings.push(text);
});
page.on('pageerror', (e) => console_.errors.push(`pageerror: ${e.message}`));

const query = new URLSearchParams({ harness: '1', speed: '0', engine: 'webgl2' });
if (args.quality) query.set('quality', args.quality);
if (args.seed) query.set('seed', args.seed);
await page.goto(`${base}/game?${query}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, {
  timeout: 300000,
});
await page.waitForSelector('[data-build-bar]', { timeout: 180000 });

const before = await page.evaluate(() => globalThis.__parkfan_game.metrics());
const shots = [];

for (const tod of tods) {
  await page.evaluate((t) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t);
    globalThis.__parkfan_game.setTimeOfDay(m ? Number(m[1]) * 60 + Number(m[2]) : Number(t));
  }, tod);
  for (const tab of tabs) {
    const found = await page.$(`[data-tab="${tab}"]`);
    if (!found) {
      console_.warnings.push(`no tab "${tab}" in the palette`);
      continue;
    }
    // `element.click()` in the page rather than Playwright's, and `clip` rather than an element
    // screenshot below, for the same reason: both of Playwright's helpers wait for the element to
    // be "stable" and to finish scrolling into view, and on a box running four agents' Chromiums
    // that wait times out on a bar that is not moving at all.
    await page.$eval(`[data-tab="${tab}"]`, (el) => el.click());
    // Wait for the renders. A tile that can never be drawn (a coaster has no point geometry) keeps
    // its icon for ever, so the wait is "nothing new has arrived for a while", not "all of them".
    const startedAt = Date.now();
    let filled = -1;
    let lastChange = Date.now();
    for (;;) {
      const now = await page.evaluate(
        () => document.querySelectorAll('[data-build-tray] [data-thumb="render"]').length
      );
      if (now !== filled) {
        filled = now;
        lastChange = Date.now();
      }
      const total = await page.evaluate(
        () => document.querySelectorAll('[data-build-tray] [data-item]').length
      );
      if (now >= total) break;
      if (Date.now() - lastChange > QUIET_MS) break;
      if (Date.now() - startedAt > DEADLINE_MS) break;
      await page.waitForTimeout(400);
    }
    const tiles = await page.evaluate(
      () => document.querySelectorAll('[data-build-tray] [data-item]').length
    );
    const file = path.join(out, `${tod.replace(':', '')}-${tab}.png`);
    await page.screenshot({ path: file });
    const box = await page.evaluate(() => {
      const el = document.querySelector('[data-build-bar]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.floor(r.x),
        y: Math.floor(r.y),
        width: Math.ceil(r.width),
        height: Math.ceil(r.height),
      };
    });
    const barFile = path.join(out, `${tod.replace(':', '')}-${tab}-bar.png`);
    if (box && box.width > 0 && box.height > 0) await page.screenshot({ path: barFile, clip: box });
    const studio = await page.evaluate(() => {
      const api = globalThis.__parkfan_game.handle.module('tools');
      return api?.thumbnailStats?.() ?? null;
    });
    shots.push({ tod, tab, file, barFile, tiles, drawn: filled, studio });
    console.log(`${tod} ${tab}: ${filled}/${tiles} tiles drawn -> ${file}`);
  }
}

// Back to the first time of day before the closing census: a park at 23:00 draws fewer meshes
// than the same park at 13:00, so an `after` taken at the end of the list is a different scene
// and the draw-call delta it reports is the sunset rather than anything this module did.
await page.evaluate((t) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  globalThis.__parkfan_game.setTimeOfDay(m ? Number(m[1]) * 60 + Number(m[2]) : Number(t));
}, tods[0]);
await page.waitForTimeout(4000);
const after = await page.evaluate(() => globalThis.__parkfan_game.metrics());
const document_ = await page.evaluate(() => ({
  documentWidth: document.documentElement.scrollWidth,
  viewportWidth: window.innerWidth,
}));
const report = {
  viewport,
  before: { drawCalls: before.drawCalls, triangles: before.triangles, fps: before.fps },
  after: { drawCalls: after.drawCalls, triangles: after.triangles, fps: after.fps },
  document: document_,
  shots,
  errors: [
    ...console_.errors,
    ...(await page.evaluate(() => globalThis.__parkfan_game?.errors ?? []).catch(() => [])),
  ],
  warnings: console_.warnings,
};
await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();
console.log(
  `\n${report.errors.length} console error(s). report -> ${path.join(out, 'report.json')}`
);
process.exit(report.errors.length ? 1 : 0);
