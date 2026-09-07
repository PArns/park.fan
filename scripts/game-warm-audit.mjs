/**
 * park.fan Coaster — what is invisible in a tick-0 screenshot?
 *
 * Two features in this game turned out to be working and unphotographable within one session, and
 * both cost a round of "is this broken?" before anybody thought to advance the clock:
 *
 *   - the rain particles, because Babylon ages a particle by the REAL frame delta and SwiftShader's
 *     is longer than a raindrop lives, so every drop was born and expired inside one update
 *     (`--particles` in `game-shot.mjs` is the fix);
 *   - the wet-surface pass, because `wetness` accumulates over PARK MINUTES and the harness runs at
 *     `speed=0`, so 53 seconds of storm left the paving at its dry `albedoColor` 1 / `roughness` 1.
 *
 * The pattern is the same both times: a time-dependent system photographed with a stopped clock.
 * This script finds the next one by asking rather than by luck. It boots `/game`, reads every built
 * module's `stats()` at tick 0 and again after 30 and 120 park minutes, and prints every value that
 * moved. Anything in that list is something a `--step`-less screenshot cannot show.
 *
 *   node scripts/game-warm-audit.mjs                  # the demo park as it boots
 *   node scripts/game-warm-audit.mjs --weather=storm  # and with weather forced
 *
 * Needs a running site (`pnpm dev`, or `pnpm build && pnpm start`). Chromium ships with the
 * container and `PLAYWRIGHT_BROWSERS_PATH` points at it; never run `playwright install`.
 *
 * Reading the output: a value that moves is not a bug. It is a claim about what a screenshot of
 * this game means, and the useful question is whether anybody has ever photographed the far end of
 * it.
 */
import { chromium } from 'playwright';

const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const base = arg('url', 'http://localhost:3000');
const weather = arg('weather', '');
const early = Number(arg('early', 600));
const late = Number(arg('late', 1800));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
const query = new URLSearchParams({ harness: '1', speed: '0', engine: 'webgl2' });
if (weather) query.set('weather', weather);
await page.goto(`${base}/game?${query}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, { timeout: 120000 });

/** Wait for the harness handle, again — a dev server recompiling under a builder tears it down and
 *  re-creates it, and a snapshot taken across that gap reads `undefined`. */
const ready = () =>
  page.waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, { timeout: 120000 });

/** Every module handle that publishes a `stats()`, plus the two numbers core owns. */
const snapshot = async () => {
  await ready();
  return page.evaluate(() => {
    const game = globalThis.__parkfan_game;
    const out = {};
    for (const [id, handle] of game.handle.handles) {
      if (typeof handle.api?.stats !== 'function') continue;
      try {
        out[id] = JSON.parse(JSON.stringify(handle.api.stats()));
      } catch {
        out[id] = 'unserialisable';
      }
    }
    out.__env = { wetness: game.handle.handles.get('environment')?.api?.wetness?.() ?? null };
    const m = game.metrics();
    out.__scene = { drawCalls: m.drawCalls, triangles: m.triangles, guests: m.guests };
    return out;
  });
};

const flatten = (value, prefix = '', into = {}) => {
  for (const [key, v] of Object.entries(value ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, into);
    else into[path] = Array.isArray(v) ? JSON.stringify(v) : v;
  }
  return into;
};

/** Step and wait, polling the tick from node in short calls — a long-lived promise in the page
 *  gets garbage-collected under SwiftShader, which is the failure `game-shot.mjs` documents. */
async function step(ticks) {
  await ready();
  const before = await page.evaluate(() => globalThis.__parkfan_game.metrics().tick);
  await page.evaluate((n) => globalThis.__parkfan_game.step(n), ticks);
  const deadline = Date.now() + 240000;
  let tick = before;
  while (tick < before + ticks && Date.now() < deadline) {
    await page.waitForTimeout(500);
    tick = await page.evaluate(() => globalThis.__parkfan_game.metrics().tick).catch(() => tick);
  }
  await page.waitForTimeout(1500);
}

const atBoot = flatten(await snapshot());
await step(early);
const atEarly = flatten(await snapshot());
await step(late);
const atLate = flatten(await snapshot());

const moved = [];
for (const key of new Set([...Object.keys(atBoot), ...Object.keys(atEarly), ...Object.keys(atLate)])) {
  if (atBoot[key] === atEarly[key] && atEarly[key] === atLate[key]) continue;
  moved.push({ key, boot: atBoot[key], early: atEarly[key], late: atLate[key] });
}
moved.sort((a, b) => a.key.localeCompare(b.key));

const minutes = (t) => (t / 20).toFixed(0);
console.log(
  `${moved.length} values move with park time (boot / +${minutes(early)} min / +${minutes(early + late)} min)` +
    (weather ? `, weather=${weather}` : '')
);
for (const row of moved) {
  console.log(
    `  ${row.key.padEnd(42)} ${String(row.boot).padStart(12)} → ${String(row.early).padStart(12)} → ${String(row.late).padStart(12)}`
  );
}
if (errors.length) console.log('page errors:', errors);
await browser.close();
process.exit(errors.length ? 1 : 0);
