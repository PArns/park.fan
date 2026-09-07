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
 *
 * ## What a shot with no `--step` cannot show
 *
 * This harness runs at `speed=0` so a screenshot is repeatable, and that is right for everything
 * the world builds at boot — but it means anything that accumulates over park minutes is at its
 * zero. Twice in one session a feature was working and unphotographable for exactly that reason
 * (the wet-surface pass, and the rain particles for the related reason that Babylon ages a particle
 * by the real frame delta). `pnpm game:warm-audit` lists what moves; measured on the demo park in a
 * storm, it is:
 *
 *   - **guests** — 0 at boot, 82 after 30 park minutes, 376 after 120. A shot with no `--step` is a
 *     park with nobody in it.
 *   - **`environment.wetness`** — 0 at boot, 0.963 after 30 minutes, which takes the paving's
 *     `albedoColor` from 1 to 0.576 and its `roughness` from 1 to 0.403. Use `--step` for any
 *     weather shot.
 *   - **shops** — 4 of 7 open at 09:00 against 7 later, and `takingsToday` 0 until the early
 *     afternoon.
 *
 * Terrain, paths, scenery, track, camera and tools do not move, so those are honest at tick 0.
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
/**
 * `--particles=<seconds per frame>` — how a particle effect gets photographed at all.
 *
 * SwiftShader renders this game at 0.3-2 fps, and Babylon ages particles by
 * `updateSpeed * scene.getAnimationRatio()`, where the ratio is the real frame delta. So one frame
 * advances the rain by one to three SECONDS while a raindrop lives 1.15-1.5 s: every drop is born
 * and expires inside a single update, and the shot comes back with 1,375 live particles reported
 * and not one of them on screen. Every "rain" frame anybody has taken on this branch is a picture
 * of an overcast day.
 *
 * With this flag each rendered frame advances every particle system by a FIXED amount instead, so
 * `--particles=0.1 --particle-frames=14` builds up about 1.4 s of rain over fourteen frames and
 * photographs it. It costs those frames in wall clock (14 x ~3 s in the demo park) and it is off by
 * default, because it changes what the picture means: the result is a particle field of a stated
 * age, not a frame of the game running.
 */
const particleStep = args.particles ? Number(args.particles) : 0;
const particleFrames = Number(args['particle-frames'] ?? 14);

const query = new URLSearchParams({ harness: '1', speed: args.speed ?? '0', engine });
if (showcase) query.set('showcase', showcase);
if (args.seed) query.set('seed', args.seed);
if (args.quality) query.set('quality', args.quality);
if (args.park) query.set('park', args.park);
/**
 * `--weather=rain|storm|…` forces the weather, and **on its own it photographs a dry park in the
 * rain.**
 *
 * The sky, the fog, the exposure and the particles all move the instant the command lands, but
 * `wetness` is an accumulator over PARK MINUTES and the harness runs at `speed=0`, so it sits at
 * exactly 0 for as long as the clock does. Measured: 53 seconds of wall clock in a storm leaves
 * `environment.wetness()` at 0 and `path-concrete-slab` at its dry `albedoColor` 1 / `roughness` 1;
 * 30 park minutes of `--step` takes wetness to 0.963 and the same material to 0.576 / 0.403, which
 * is the wet-surface pass doing exactly what it says.
 *
 * So a weather shot wants `--step=600` or more. It is the same shape as the particle problem
 * `--particles` solves: the feature was working and the verification loop could not see it.
 */
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

/**
 * A frame counter in the page, for the same reason the step wait polls: a promise that lives in
 * the page across a slow render can be garbage-collected under SwiftShader, and `nextFrame()` is
 * exactly that promise. Measured over the camera module's runs, 4 of 14 first attempts died on it
 * with "Resulting promise was garbage collected". The observable is registered once, and every
 * wait below is a short evaluate that reads a number.
 */
/**
 * Wait for the harness handle, and re-arm the frame counter if it is a NEW one.
 *
 * A dev server recompiling under another agent tears `__parkfan_game` down and builds it again, and
 * every `page.evaluate` in this file assumes it is there — three runs died on
 * `Cannot read properties of undefined (reading 'metrics')` in one session, which reads like a
 * broken harness and is a race with somebody else's save. `game-warm-audit.mjs` already re-waits
 * for exactly this reason; this file did not, and a shot list is longer than an audit.
 *
 * The counter has to be re-armed rather than merely kept: it is registered on the SCENE's
 * `onAfterRenderObservable`, so after a rebuild the observable hangs off a disposed scene, the
 * number stops moving, and `waitFrames` spins to its 30 s deadline before every screenshot.
 */
async function readyHandle() {
  await page
    .waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, { timeout: 120000 })
    .catch(() => null);
  await page
    .evaluate(() => {
      const w = globalThis;
      const scene = w.__parkfan_game?.scene?.();
      if (!scene || w.__pfScene === scene) return;
      w.__pfScene = scene;
      w.__pfFrames = 0;
      scene.onAfterRenderObservable.add(() => {
        w.__pfFrames += 1;
      });
    })
    .catch(() => null);
}

if (bootMs != null) await readyHandle();

/** Wait for `n` rendered frames, or give up after 30 s and let the screenshot happen anyway. */
async function waitFrames(n) {
  const start = await page.evaluate(() => globalThis.__pfFrames ?? 0).catch(() => null);
  if (start == null) return;
  const deadline = Date.now() + 30000;
  for (;;) {
    const now = await page.evaluate(() => globalThis.__pfFrames ?? 0).catch(() => start);
    if (now >= start + n || Date.now() > deadline) return;
    await page.waitForTimeout(120);
  }
}

const shots = [];
if (bootMs != null) {
  for (const tod of tods) {
    for (const cam of cams) {
      await readyHandle();
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
        await readyHandle();
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
      await waitFrames(2);
      if (particleStep > 0) {
        await readyHandle();
        await page.evaluate((step) => {
          const scene = globalThis.__parkfan_game.scene();
          const w = globalThis;
          w.__pfParticleSaved ??= new Map();
          for (const ps of scene.particleSystems) {
            if (!w.__pfParticleSaved.has(ps)) w.__pfParticleSaved.set(ps, ps.updateSpeed);
          }
          w.__pfParticleObs?.remove?.();
          w.__pfParticleObs = scene.onBeforeRenderObservable.add(() => {
            const ratio = scene.getAnimationRatio() || 1;
            for (const ps of scene.particleSystems) ps.updateSpeed = step / ratio;
          });
        }, particleStep);
        await waitFrames(particleFrames);
      }
      const file = path.join(out, `${tod.replace(':', '')}-${cam}.png`);
      await page.screenshot({ path: file });
      await readyHandle();
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
    : [
        ...console_.errors,
        ...(await page.evaluate(() => globalThis.__parkfan_game?.errors ?? []).catch(() => [])),
      ];
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
