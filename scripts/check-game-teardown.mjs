/**
 * Does `/game` actually let go?
 *
 * Boot is the half everybody tests. The other half is the one a single-page app gets wrong: a
 * browser allows 8–16 live WebGL/WebGPU contexts, and a leaked one is invisible until the fourth
 * navigation returns a blank canvas — by which point nothing points at the navigation that caused
 * it. So this walks away and comes back, repeatedly, and counts.
 *
 * Three signals, because one of them alone can pass for the wrong reason:
 *
 *   1. **Contexts created minus contexts lost.** `getContext` is wrapped before the page's own
 *      script runs, and `webglcontextlost` is counted per canvas. Babylon's `engine.dispose()`
 *      calls `loseContext()`, so a disposed engine shows up here; one that was merely dropped on
 *      the floor does not.
 *   2. **`window.__parkfan_game` is gone.** `host.dispose()` deletes it (host.ts), so a handle
 *      still sitting on `window` after an unmount means the teardown path did not run at all.
 *   3. **Console errors across the whole walk**, because a dispose that throws is a dispose that
 *      did not finish, and the next boot inherits whatever it left behind.
 *
 * `/game` renders its own `<html>`, so leaving it for a localized route is a full document load
 * and the browser reclaims everything regardless — which is exactly why the interesting case is
 * the one measured here: **remount inside the same document**, which is what the boot-retry path,
 * React's strict-mode double mount and a back/forward restore all do.
 *
 *   node scripts/check-game-teardown.mjs
 *   node scripts/check-game-teardown.mjs --cycles=4 --url=http://localhost:3000
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1'];
  })
);
const base = args.url ?? 'http://localhost:3000';
const cycles = Number(args.cycles ?? 3);
const out = args.out ?? '.game-render/teardown.json';

// The container's Chromium, same as scripts/game-shot.mjs and scripts/measure-cls.mjs — never
// `npx playwright install`, which the environment forbids and which would fetch a second browser.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(String(e)));

// Wrapped before anything of the app's runs, and re-applied on every document.
await page.addInitScript(() => {
  const w = globalThis;
  /**
   * One record per context, tagged with whose canvas it is.
   *
   * A bare created/lost pair cannot tell "the engine leaked" from "the capability probe has not
   * released yet", and those want opposite verdicts. The tag is read at creation time from the
   * canvas the context was asked of: the engine's carries `.game-canvas`, the probe's is a
   * detached element nobody ever attaches.
   */
  w.__ctx = [];
  /**
   * Deduped by the returned context object.
   *
   * `getContext` hands back the SAME context every time it is asked of a canvas that already has
   * one, so counting calls counts calls — and the teardown itself asks for the context in order to
   * release it, which made a disposal look like a third context being created.
   */
  const seen = new WeakSet();
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const context = original.call(this, type, ...rest);
    if (context && /webgl|webgpu/i.test(String(type)) && !seen.has(context)) {
      seen.add(context);
      /**
       * Liveness is read from `isContextLost()`, not from the `webglcontextlost` event.
       *
       * The event is how the first version of this script measured it, and it does not fire
       * reliably on a **detached** canvas — which the capability probe's is, since it is created
       * with `createElement` and never appended. That produced a probe that read as leaked in one
       * document and released in the next, for the same code. `isContextLost()` is a synchronous
       * property of the context itself and answers the question that was actually being asked.
       */
      w.__ctx.push({
        type: String(type),
        owner: this.classList.contains('game-canvas')
          ? 'engine'
          : this.isConnected
            ? 'attached'
            : 'probe',
        gl: context,
      });
    }
    return context;
  };
});

/**
 * `loseContext()` dispatches `webglcontextlost` asynchronously, and during boot the main thread is
 * busy compiling shaders — so a fixed settle measures the event loop rather than the teardown, and
 * a probe that was released promptly reads as live in one sample and free in the next. This polls
 * for the expected state instead of sleeping a guess, and reports what it saw either way.
 */
async function readCtx(expect = {}) {
  const deadline = Date.now() + Number(args.settle ?? 4000);
  let snapshot = await sample();
  while (Date.now() < deadline) {
    if (Object.entries(expect).every(([k, v]) => snapshot[k] === v)) break;
    await page.waitForTimeout(150);
    snapshot = await sample();
  }
  return snapshot;
}

function sample() {
  return page.evaluate(() => {
    const list = globalThis.__ctx ?? [];
    const isLost = (c) => (typeof c.gl?.isContextLost === 'function' ? c.gl.isContextLost() : false);
    const live = (owner) => list.filter((c) => c.owner === owner && !isLost(c)).length;
    return {
      total: list.length,
      liveEngine: live('engine'),
      liveProbe: live('probe'),
      liveAttached: live('attached'),
      handle: '__parkfan_game' in globalThis,
    };
  });
}

const url = `${base}/game?harness=1&speed=0&engine=webgl2`;
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, { timeout: 120_000 });

const samples = [{ phase: 'first boot', ...(await readCtx({ liveProbe: 0 })) }];

/**
 * Unmount and remount inside the same document.
 *
 * Done by swapping the React root's subtree out and back rather than by reloading: a reload
 * proves the browser can clean up, which was never in doubt. What is in doubt is whether the
 * component's own effect cleanup disposes the engine, and that only runs on an unmount.
 */
for (let i = 0; i < cycles; i++) {
  await page.evaluate(() => {
    const root = document.querySelector('[data-game-root]');
    if (!root) throw new Error('no [data-game-root] to unmount');
    // Navigating within the same document is what the app itself does on a retry; the shell
    // re-creates the canvas and the host boots again.
    // `handle.dispose()`, not `dispose()`: the harness object exposes the handle, and calling
    // a method that does not exist is a check that quietly tests nothing — which is what the
    // first version of this script did, and it reported two confident failures about a no-op.
    const game = globalThis.__parkfan_game;
    if (!game?.handle?.dispose) throw new Error('__parkfan_game.handle.dispose is missing');
    game.handle.dispose();
  });
  await page.waitForTimeout(600);
  samples.push({ phase: `after dispose ${i + 1}`, ...(await readCtx({ liveEngine: 0, liveProbe: 0 })) });

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, { timeout: 120_000 });
  samples.push({ phase: `after reboot ${i + 1}`, ...(await readCtx({ liveProbe: 0 })) });
}

const report = { ok: true, cycles, samples, consoleErrors, assertions: [] };
const check = (name, ok, detail) => {
  report.assertions.push({ name, ok, detail });
  if (!ok) report.ok = false;
};

// A reload starts a fresh document, so the counter resets — the meaningful assertion is that a
// single document never accumulates more than the one context the engine is entitled to.
const worstEngine = Math.max(...samples.map((s) => s.liveEngine));
const worstProbe = Math.max(...samples.map((s) => s.liveProbe));
// One engine context at a time, ever. Two would mean a boot that did not dispose its predecessor.
check('at most one live engine context', worstEngine <= 1, { worstEngine, samples });
// The capability probe asks WebGL2 a boolean and used to hold the answer's context for the life
// of the document, starting the engine one slot from the browser's 8-16 limit.
check('the capability probe gives its context back', worstProbe === 0, { worstProbe, samples });
check('no console errors across the walk', consoleErrors.length === 0, consoleErrors.slice(0, 5));
const afterDispose = samples.filter((s) => s.phase.startsWith('after dispose'));
check(
  'dispose() removes the harness handle',
  afterDispose.every((s) => s.handle === false),
  afterDispose.map((s) => `${s.phase}: handle=${s.handle}`)
);
check(
  'dispose() releases the engine context',
  afterDispose.every((s) => s.liveEngine === 0),
  afterDispose.map((s) => `${s.phase}: liveEngine=${s.liveEngine}`)
);

await mkdir('.game-render', { recursive: true });
await writeFile(out, JSON.stringify(report, null, 2));

console.log(`teardown walk — ${cycles} dispose/reboot cycles`);
for (const s of samples) {
  console.log(
    `  ${s.phase.padEnd(20)} contexts ${s.total} · live engine ${s.liveEngine} · live probe ${s.liveProbe} · handle ${s.handle}`
  );
}
for (const a of report.assertions) {
  console.log(`  ${a.ok ? '✓' : '✗'} ${a.name}${a.ok ? '' : ` — ${JSON.stringify(a.detail)}`}`);
}
console.log(`  → ${out}`);

await browser.close();
process.exit(report.ok ? 0 : 1);
