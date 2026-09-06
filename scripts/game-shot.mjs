/**
 * park.fan Coaster — screenshot + metrics harness.
 *
 * Opens /game in the container's Chromium (software GL), waits for `window.__parkfan_game.ready`,
 * applies every requested time-of-day × camera preset, and writes one PNG per combination plus
 * one JSON with console errors, hydration warnings, fps, draw calls, triangles, sim tick time,
 * boot time and the game's chunk sizes. Exit code 1 when the page logged an error.
 *
 *   node scripts/game-shot.mjs                                   # demo park, 3 times × 3 cameras
 *   node scripts/game-shot.mjs --showcase=terrain --cam=overview,close --tod=09:00,18:30,23:00
 *   node scripts/game-shot.mjs --step=1200                          # advance the sim first
 *   node scripts/game-shot.mjs --url=http://localhost:3000 --seed=7 --quality=high --out=.game-render/x
 *
 * Runs against `pnpm dev` (default port 3000) or `pnpm build && pnpm start`. WebGPU is not
 * available in headless Chromium here, so the harness asks for WebGL2 unless --engine=webgpu.
 * Chromium ships with the container and PLAYWRIGHT_BROWSERS_PATH points at it; never run
 * `playwright install`.
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
const showcase = args.showcase ?? null;
const cams = (args.cam ?? 'overview,close,ground').split(',').filter(Boolean);
const tods = (args.tod ?? '09:00,18:30,23:00').split(',').filter(Boolean);
const out = args.out ?? path.join('.game-render', showcase ? `showcase-${showcase}` : 'park');
const settleMs = Number(args.wait ?? 1200);
const viewport = { width: Number(args.w ?? 1280), height: Number(args.h ?? 720) };
const engine = args.engine ?? 'webgl2';
const stepTicks = Number(args.step ?? 0);

const query = new URLSearchParams({ harness: '1', speed: args.speed ?? '0', engine });
if (showcase) query.set('showcase', showcase);
if (args.seed) query.set('seed', args.seed);
if (args.quality) query.set('quality', args.quality);
if (args.park) query.set('park', args.park);
if (args.weather) query.set('weather', args.weather);
const url = `${base}/game?${query.toString()}`;

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
const console_ = { errors: [], warnings: [], hydration: [] };
page.on('console', (m) => {
  const text = m.text();
  if (/hydrat/i.test(text)) console_.hydration.push(text.slice(0, 400));
  if (m.type() === 'error') console_.errors.push(text.slice(0, 400));
  else if (m.type() === 'warning' && !/WebGPU Context Provider/.test(text))
    console_.warnings.push(text.slice(0, 400));
});
page.on('pageerror', (e) => console_.errors.push(`pageerror: ${e.message}`));

const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
let bootMs = null;
try {
  await page.waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, {
    timeout: Number(args.timeout ?? 90000),
  });
  bootMs = Date.now() - t0;
} catch {
  console_.errors.push('timeout: world:ready never fired');
}

const shots = [];
if (bootMs != null) {
  for (const tod of tods) {
    for (const cam of cams) {
      await page.evaluate(
        ({ tod, cam }) => {
          const g = globalThis.__parkfan_game;
          const m = /^(\d{1,2}):(\d{2})$/.exec(tod);
          g.setTimeOfDay(m ? Number(m[1]) * 60 + Number(m[2]) : Number(tod));
          g.setCamera(cam);
        },
        { tod, cam }
      );
      await page.waitForTimeout(settleMs);
      // `--step=N` advances the simulation N ticks and waits for them to land.
      //
      // The harness runs at `speed=0` so a screenshot is repeatable, and that is right for
      // everything the world builds at boot — but it means a module whose output only exists once
      // the sim has run photographs as an empty park. The first frames of the guests module were
      // exactly that: "Guests 0" and an avenue with nobody on it, because nobody had been admitted
      // yet. Stepping is still deterministic (a fixed number of fixed-length ticks from a seeded
      // world), so `--step=1200` is the same picture every run.
      if (stepTicks > 0) {
        const before = await page.evaluate(() => globalThis.__parkfan_game.metrics().tick);
        await page.evaluate((n) => globalThis.__parkfan_game.step(n), stepTicks);
        // Polled from node in short calls rather than one `waitForFunction`.
        //
        // `waitForFunction` installs a long-lived promise in the page, and under SwiftShader a
        // scene heavy enough to stall the render loop gets it garbage-collected: the harness dies
        // with "Resulting promise was garbage collected" instead of taking a screenshot. It was
        // reproducible on `--cam=overview --step=…` in four runs of four, and adding the shops to
        // the demo park made `ground` do it too. Each poll below is its own short evaluate, so
        // there is never a promise sitting in the page long enough to be collected.
        const deadline = Date.now() + Number(args.timeout ?? 90000);
        let tick = before;
        while (tick < before + stepTicks && Date.now() < deadline) {
          await page.waitForTimeout(250);
          tick = await page
            .evaluate(() => globalThis.__parkfan_game.metrics().tick)
            .catch(() => tick);
        }
        if (tick < before + stepTicks) {
          console_.warnings.push(`step: reached tick ${tick} of ${before + stepTicks}`);
        }
        await page.waitForTimeout(400);
      }
      await page.evaluate(() => globalThis.__parkfan_game.nextFrame());
      await page.evaluate(() => globalThis.__parkfan_game.nextFrame());
      const file = path.join(out, `${tod.replace(':', '')}-${cam}.png`);
      await page.screenshot({ path: file });
      const metrics = await page.evaluate(() => globalThis.__parkfan_game.metrics());
      shots.push({ tod, cam, file, metrics });
    }
  }
}

const chunks = await page.evaluate(() =>
  performance
    .getEntriesByType('resource')
    .filter((r) => r.name.includes('/_next/static/'))
    .map((r) => ({
      name: r.name.split('/_next/static/')[1],
      bytes: r.encodedBodySize || r.transferSize || 0,
    }))
    .sort((a, b) => b.bytes - a.bytes)
);
const errors =
  bootMs == null
    ? console_.errors
    : [...console_.errors, ...(await page.evaluate(() => globalThis.__parkfan_game.errors))];
const report = {
  url,
  viewport,
  bootMs,
  shots,
  chunks: { total: chunks.reduce((s, c) => s + c.bytes, 0), files: chunks.slice(0, 40) },
  console: { ...console_, errors },
  ok: errors.length === 0 && console_.hydration.length === 0 && bootMs != null,
};
await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();
const last = shots.at(-1)?.metrics;
console.log(
  `${report.ok ? 'OK ' : 'FAIL'} ${url}\n  boot ${bootMs ?? '—'} ms · ${shots.length} shots → ${out}\n  fps ${last?.fps?.toFixed(1) ?? '—'} · draw calls ${last?.drawCalls ?? '—'} · tris ${last?.triangles ?? '—'} · sim ${last?.simTickMs?.toFixed(2) ?? '—'} ms · chunks ${(report.chunks.total / 1024).toFixed(0)} KB\n  errors ${errors.length} · warnings ${console_.warnings.length} · hydration ${console_.hydration.length}`
);
for (const e of errors.slice(0, 10)) console.log('  ✗', e);
process.exit(report.ok ? 0 : 1);
