/**
 * A frame of the thing this round was for: people standing in a line at a coaster station.
 *
 * `scripts/game-shot.mjs` photographs the demo park as the world factory builds it, and that park
 * has no coaster and no flume in it — so the one picture that proves boarding works cannot be
 * taken with it. This script boots the same route, dispatches a coaster onto the `coaster` shelf
 * and a slide onto the `flumes` pad through the harness's own `entity:add`, steps the simulation
 * until guests have walked there and formed a line, and then photographs the station from close
 * range with the numbers printed beside it.
 *
 *   node scripts/game-shot-coaster-queue.mjs --url=http://localhost:3001 --out=.game-render/queue
 *
 * `--step` is in TICKS and is applied after the clock is set, so a frame reads later than the
 * `--tod` it was asked for; the park times printed in the summary are the clock the shot was
 * actually taken at, not the request.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { register } from 'node:module';

register('./register-path-alias.mjs', pathToFileURL(`${process.cwd()}/scripts/`));
const { TRACK_LAYOUTS, layoutData } = await import('@/lib/game/track/index.ts');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1'];
  })
);
const base = args.url ?? 'http://localhost:3001';
const out = args.out ?? '.game-render/coaster-queue';
const tod = args.tod ?? '13:00';
const steps = Number(args.step ?? 20000);
const viewport = { width: Number(args.w ?? 1280), height: Number(args.h ?? 720) };

/** The same placement `game-ride-boarding.mjs` measures, so the picture and the numbers agree. */
const preset = TRACK_LAYOUTS.find((p) => p.id === 'kleiner-kreisel');
const origin = [-66, 8, -30];
const yaw = -Math.PI / 2;
const coaster = {
  id: 'demo-coaster',
  kind: 'coaster',
  pack: 'core-classic',
  item: 'family-invert',
  position: origin,
  yaw,
  data: { ...layoutData(preset), origin, yaw },
};
const flume = {
  id: 'demo-flume',
  kind: 'flume',
  pack: 'neon-lagoon',
  item: 'tube-slide',
  position: [160, 2.2, 18],
  yaw: Math.PI / 2,
  data: { layout: 'spiral-tower' },
};

const query = new URLSearchParams({
  harness: '1',
  engine: 'webgl2',
  quality: 'high',
  seed: '1',
  speed: '0',
  tod,
});
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
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 300));
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

/**
 * Re-wait for the harness before every call into it.
 *
 * A dev server recompiling under another agent tears `__parkfan_game` down and builds it again,
 * and this script holds the page for several minutes while it steps twenty thousand ticks — long
 * enough for that to happen twice. `game-shot.mjs` documents the same trap and the same fix; a
 * run of this one died on `Cannot read properties of undefined (reading 'step')` before it had
 * one. It also means a mid-run recompile RESTARTS the world, so the entities are re-dispatched
 * and the step budget starts again rather than the shot coming back of an empty shelf.
 */
async function harness() {
  await page.waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, {
    timeout: 180000,
  });
}
async function place() {
  await page.evaluate(
    ({ coaster, flume }) => {
      const g = globalThis.__parkfan_game;
      if (g.world().entities[coaster.id]) return false;
      g.dispatch('entity:add', coaster);
      g.dispatch('entity:add', flume);
      return true;
    },
    { coaster, flume }
  );
}

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
await harness();

await place();
await page.waitForTimeout(2000);
// The build palette opens over the bottom third of the window and a screenshot of a park is not
// a screenshot of a palette.
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// Step in slices so the worker is never handed one enormous batch, and so a long run can be
// watched from the outside.
const slice = 500;
for (let done = 0; done < steps; done += slice) {
  await harness();
  await place();
  await page.evaluate((n) => globalThis.__parkfan_game.step(n), Math.min(slice, steps - done));
  await page.waitForTimeout(250);
}
await page.waitForTimeout(2500);

/**
 * The HUD is an absolutely positioned overlay on top of the canvas, so a canvas-element
 * screenshot still captures it — Playwright composites, it does not read the framebuffer. Hiding
 * `[data-game-hud]` is the only way to get the picture without the panel over it, and the panel's
 * counters are evidence, so both are taken.
 */
const HIDE_HUD = '[data-game-hud]{display:none!important}';
async function setHud(visible) {
  await page.evaluate(
    ({ visible, css }) => {
      let tag = document.getElementById('pf-hide-hud');
      if (visible) {
        tag?.remove();
        return;
      }
      if (tag) return;
      tag = document.createElement('style');
      tag.id = 'pf-hide-hud';
      tag.textContent = css;
      document.head.appendChild(tag);
    },
    { visible, css: HIDE_HUD }
  );
}

/**
 * Put the camera where it was asked to go, and know it got there.
 *
 * Not `scene.activeCamera.alpha = …`. The `camera` module drives that camera every frame: it
 * NOTICES an outside write and adopts it as a goal (its own docblock says so, "last write wins,
 * whoever wrote it") and then EASES towards it, and under SwiftShader at about one frame a
 * second a 2.5-second settle is three frames of easing — so a directly-written pose is
 * photographed somewhere on the way to itself.
 *
 * `focus(point, { radius, pitch, bearing, instant })` is that module's own snap, and it is the
 * one to use rather than `setPose`: `radius` is the size of the thing being framed and the
 * module works the camera distance out from it (measured: 8 m of subject to 22 m of camera),
 * and `bearing` is degrees from north, which is a number a person can reason about. Poses
 * written as raw alpha and beta cost three rounds of screenshots pointing at grass.
 */
async function armFrames() {
  await page.evaluate(() => {
    const w = globalThis;
    const scene = w.__parkfan_game?.scene?.();
    if (!scene || w.__pfScene === scene) return;
    w.__pfScene = scene;
    w.__pfFrames = 0;
    scene.onAfterRenderObservable.add(() => {
      w.__pfFrames += 1;
    });
  });
}

async function waitFrames(n) {
  const start = await page.evaluate(() => globalThis.__pfFrames ?? 0).catch(() => null);
  if (start == null) return;
  const deadline = Date.now() + 30000;
  for (;;) {
    const now = await page.evaluate(() => globalThis.__pfFrames ?? 0).catch(() => start);
    if (now >= start + n || Date.now() > deadline) return;
    await page.waitForTimeout(150);
  }
}

async function aim(pose) {
  return page.evaluate((p) => {
    const g = globalThis.__parkfan_game;
    const cam = g.handle?.module?.('camera');
    if (!cam?.focus) return null;
    cam.focus(p.at, { radius: p.radius, pitch: p.pitch, bearing: p.bearing, instant: true });
    return cam.pose?.() ?? null;
  }, pose);
}

const aimed = [];
async function shoot(name, pose) {
  await harness();
  await armFrames();
  const got = await aim(pose);
  aimed.push({ name, asked: pose, got });
  await waitFrames(4);
  const files = [];
  await setHud(true);
  await waitFrames(2);
  const full = path.join(out, `${name}-hud.png`);
  await page.screenshot({ path: full, timeout: 120000 });
  files.push(full);
  await setHud(false);
  await waitFrames(2);
  const bare = path.join(out, `${name}.png`);
  await page.screenshot({ path: bare, timeout: 120000 });
  files.push(bare);
  await setHud(true);
  return files;
}

/**
 * What the page can and cannot tell us.
 *
 * The `rides` queue lives in the WORKER, and the harness only reaches main-thread handles, so
 * there is no `rides.list()` from in here. The numbers per machine come from
 * `scripts/game-ride-boarding.mjs`, which runs the same placement in node against the same
 * modules; this reports what the frame carries — the clock, the crowd, and that the two entities
 * really arrived — and the rest of the proof is the picture.
 */
const report = await page.evaluate(() => {
  const g = globalThis.__parkfan_game;
  const kinds = {};
  for (const e of Object.values(g.world().entities)) kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
  return { clock: g.metrics().clock, metrics: g.metrics(), kinds };
});

const files = [];
/**
 * Where to stand to see a coaster station.
 *
 * The line ends at (-75, -25.5) — what `rides.entrance('demo-coaster')` answers, which is what
 * `trains.dock()` computed off the station block and what every guest in it walked to — and the
 * platform runs west from (-66, 8, -30) to (-84, 8, -30), 18 m of `station` drive. A bearing
 * near 100-115 degrees puts the camera east of the plot looking back along the platform with the
 * line in front of it; anything from the south looks into the hill the shelf is cut out of.
 *
 * Two passes 400 ticks apart, because the line is SHORT: measured, this coaster takes about 1.7
 * guests a park minute and dispatches every 0.77, so at any instant there are one to four people
 * at the platform and which instant you photograph decides whether you see them. That is a fact
 * about this park's demand — no machine in it, flat ride included, ever holds a long queue — and
 * not about the boarding.
 */
const POSES = {
  station: { at: { x: -80, y: 8.4, z: -28 }, radius: 7, pitch: 14, bearing: 100 },
  platform: { at: { x: -79, y: 8.4, z: -28.5 }, radius: 11, pitch: 17, bearing: 110 },
  approach: { at: { x: -77, y: 8.4, z: -29 }, radius: 16, pitch: 19, bearing: 118 },
  flume: { at: { x: 155, y: 2.4, z: 18 }, radius: 8, pitch: 13, bearing: 110 },
};
const passes = Number(args.passes ?? 2);
for (let pass = 0; pass < passes; pass++) {
  for (const [name, pose] of Object.entries(POSES)) {
    files.push(...(await shoot(`${name}-${pass}`, pose)));
  }
  if (pass < passes - 1) {
    await harness();
    await page.evaluate(() => globalThis.__parkfan_game.step(400));
    await waitFrames(3);
  }
}

await writeFile(
  path.join(out, 'report.json'),
  JSON.stringify({ url, steps, tod, report, aimed, errors, files }, null, 2)
);
console.log(`${url}\n  step ${steps} ticks · clock ${JSON.stringify(report.clock)}`);
console.log(`  entities ${JSON.stringify(report.kinds)}`);
console.log(
  `  guests ${report.metrics.guests} · draw calls ${report.metrics.drawCalls} · ` +
    `tris ${report.metrics.triangles} · sim ${report.metrics.simTickMs?.toFixed?.(2)} ms`
);
console.log(`  errors ${errors.length}${errors.length ? `: ${errors[0]}` : ''}`);
console.log(`  → ${files.join('\n  → ')}`);
await browser.close();
