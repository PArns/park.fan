/**
 * Photograph the build bar with a category open, which `scripts/game-shot.mjs` cannot do.
 *
 * It lived in `lib/game/tools/` for one round, which was wrong twice: every other harness in this
 * repo is in `scripts/` (`game-shot.mjs`, `check-game-teardown.mjs`), and a module folder is the
 * thing being measured rather than the place the tape measure is kept. `selftest.mjs` stays where
 * it is — that one really is the module's own, and `pnpm test:game-tools` runs it from there.
 *
 * That harness takes a picture of the park: it sets a time of day and a camera preset and shoots.
 * It has no way to press anything, so the one thing this round has to prove — that a carousel, a
 * ferris wheel and a shop are three different pictures in an OPEN palette — is not a shot it can
 * take. This clicks a tab, waits for the renders to land, and shoots the whole viewport and the bar
 * on its own.
 *
 *   node scripts/game-shot-bar.mjs --url=http://localhost:3100 --out=.game-render/tools-bar
 *   node scripts/game-shot-bar.mjs --tabs=ride,shop --tod=13:00,23:00 --w=390 --h=844
 *
 * It writes `report.json` beside the PNGs with the console errors, the thumbnail studio's own
 * figures (items rendered, items refused, total and slowest milliseconds) and the scene's draw
 * calls and triangles before and after the palette was opened — which is the number that says
 * whether the studio leaked anything into the park's frame.
 *
 * It also HARVESTS every tile: the SHA-256 of each `<img>` source, the well's box, the image's
 * intrinsic size and the bounding box of its non-transparent pixels. "The pictures are different"
 * is then a count of distinct hashes rather than an impression, and "the model fills the well" is
 * the ink box over the well box rather than a claim. Round 2 of this module was graded on exactly
 * those two numbers, taken by the critic; they belong in the builder's own harness.
 *
 * Run it against the PRODUCTION server. `next dev` recompiles under whoever else is working and
 * tears `__parkfan_game` down mid-run.
 */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
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
/** `--dump=1` writes every tile's picture to `<out>/tiles/<tab>/<key>.png`, so two runs can be
 *  diffed pixel by pixel rather than compared by eye. */
const DUMP = args.dump === '1';
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

/**
 * Shut every open HUD panel before shooting.
 *
 * The bar is the subject; a panel from another module docked over it is not. On a 390 px phone the
 * park panel covers the whole build bar, so a shot taken with one open is a photograph of somebody
 * else's work with this module's geometry underneath it — the boxes this script measures are right
 * either way (`getBoundingClientRect` does not care what is painted on top), but the PNG is not
 * evidence about this module. Panels are the `ui` module's and are closed through their own close
 * key rather than by hiding anything.
 */
await page
  .evaluate(() => {
    for (const panel of document.querySelectorAll('[data-panel]')) {
      // The header is the panel's first child and the close key is its last button — dock and
      // collapse come before it. Scoped to the header so a button in the BODY is never pressed.
      const keys = panel.firstElementChild?.querySelectorAll('button') ?? [];
      if (keys.length) keys[keys.length - 1].click();
    }
  })
  .catch(() => {});
await page.waitForTimeout(500);

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
    /**
     * One row per tile: the picture's bytes, its well and the ink inside it.
     *
     * The ink box is measured by drawing the data URL into a canvas and walking the alpha
     * channel — the studio clears to transparent, so every non-zero alpha pixel is model. That is
     * the only honest answer to "how much of the well is the picture": the image element fills the
     * well whatever the model does, and an `<img>` with 90 % transparent margin looks exactly like
     * a small one.
     */
    const harvest = await page.evaluate(async () => {
      const out = [];
      for (const tile of document.querySelectorAll('[data-build-tray] [data-item]')) {
        const key = tile.getAttribute('data-item');
        // `data-well` on this round's tile; `firstElementChild` is what the shipped build offers,
        // so the same harness measures both sides of the A/B.
        const well = tile.querySelector('[data-well]') ?? tile.firstElementChild;
        const img = tile.querySelector('img');
        const wellBox = well?.getBoundingClientRect();
        const row = {
          key,
          mode: tile.getAttribute('data-thumb'),
          well: wellBox ? { w: +wellBox.width.toFixed(1), h: +wellBox.height.toFixed(1) } : null,
          src: img?.getAttribute('src') ?? null,
          ink: null,
          natural: null,
        };
        if (img?.src) {
          const bitmap = await createImageBitmap(await (await fetch(img.src)).blob());
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(bitmap, 0, 0);
          const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
          let minX = bitmap.width;
          let minY = bitmap.height;
          let maxX = -1;
          let maxY = -1;
          for (let y = 0; y < bitmap.height; y++) {
            for (let x = 0; x < bitmap.width; x++) {
              if (data[(y * bitmap.width + x) * 4 + 3] < 8) continue;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
          row.natural = { w: bitmap.width, h: bitmap.height };
          row.ink =
            maxX < 0
              ? { w: 0, h: 0, fill: 0 }
              : {
                  w: maxX - minX + 1,
                  h: maxY - minY + 1,
                  fill: +(
                    ((maxX - minX + 1) * (maxY - minY + 1)) /
                    (bitmap.width * bitmap.height)
                  ).toFixed(3),
                };
          bitmap.close();
        }
        out.push(row);
      }
      return out;
    });
    for (const row of harvest) {
      row.sha256 = row.src ? createHash('sha256').update(row.src).digest('hex') : null;
      if (DUMP && row.src?.startsWith('data:image/png;base64,')) {
        const dir = path.join(out, 'tiles', tab);
        await mkdir(dir, { recursive: true });
        row.png = path.join(dir, `${row.key.replace(/[^a-z0-9]+/gi, '_')}.png`);
        await writeFile(row.png, Buffer.from(row.src.slice(22), 'base64'));
      }
      delete row.src;
    }
    const hashes = harvest.map((r) => r.sha256).filter(Boolean);
    const distinct = new Set(hashes).size;
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
    const bar = await page.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { h: +r.height.toFixed(1), w: +r.width.toFixed(1) };
      };
      return {
        bar: box('[data-build-bar]'),
        tray: box('[data-build-tray]'),
        belt: box('[data-build-belt]'),
        viewportH: window.innerHeight,
      };
    });
    shots.push({
      tod,
      tab,
      file,
      barFile,
      tiles,
      drawn: filled,
      pictures: hashes.length,
      distinctPictures: distinct,
      bar,
      studio,
      harvest,
    });
    console.log(
      `${tod} ${tab}: ${filled}/${tiles} tiles drawn, ${distinct}/${hashes.length} distinct ` +
        `pictures, bar ${bar.bar?.h}px of ${bar.viewportH} -> ${file}`
    );
  }
}

/**
 * The closing census, and it may not be able to cost the whole run.
 *
 * A `next dev` server rebuilds when ANY agent saves a file, and a rebuild tears the game down:
 * `__parkfan_game` goes undefined and every `page.evaluate` after it throws. That happened once
 * during round 2 and took a completed four-tab run's `report.json` with it — twenty minutes of
 * SwiftShader renders lost to a census. The shots are the measurement; this is the footnote.
 */
let after = null;
let document_ = null;
try {
  // Back to the first time of day before the closing census: a park at 23:00 draws fewer meshes
  // than the same park at 13:00, so an `after` taken at the end of the list is a different scene
  // and the draw-call delta it reports is the sunset rather than anything this module did.
  await page.evaluate((t) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t);
    globalThis.__parkfan_game.setTimeOfDay(m ? Number(m[1]) * 60 + Number(m[2]) : Number(t));
  }, tods[0]);
  await page.waitForTimeout(4000);
  after = await page.evaluate(() => globalThis.__parkfan_game.metrics());
  document_ = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
} catch (error) {
  console_.warnings.push(`closing census failed: ${error.message.slice(0, 200)}`);
}
const report = {
  viewport,
  before: { drawCalls: before.drawCalls, triangles: before.triangles, fps: before.fps },
  after: after ? { drawCalls: after.drawCalls, triangles: after.triangles, fps: after.fps } : null,
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
