/**
 * What makes a sim tick spike, measured rather than guessed.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs \
 *     scripts/game-tick-spikes.mjs [--hours=48] [--speed=100] [--seed=7] [--top=12]
 *
 * `game-soak.mjs` measures the maximum tick and deliberately does not assert on it: the budget is
 * 6 ms and the coarse pass has been seen at 61.85 ms, the fine pass at 115.43. The open issue says
 * why the assertion is not there yet — this runs the sim in node with nothing else on the thread,
 * and a spike here is not yet known to be the same thing as a dropped frame in a browser where the
 * worker owns its own thread — and it names the suspects: the guest re-seed and the venue rebuild,
 * both whole-population passes that run inside one tick.
 *
 * This script is the measurement that has to come before the assertion. It does not gate anything
 * and asserts nothing. It subscribes to the runtime's own event bus (`events.onAny`), attributes
 * every event to the tick it was emitted in, and then prints the slowest ticks with the events that
 * happened inside them, so a spike stops being a number and becomes a name.
 *
 * Read the output as a comparison, not as a verdict: what matters is whether the slow ticks carry
 * events the fast ones do not. A spike on a tick that emitted nothing unusual is a spike this
 * script has failed to explain, and saying so is the point of the `unexplained` line.
 */

import { readFileSync } from 'node:fs';
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import { Registry } from '@/lib/game/core/registry.ts';
import { buildWorld } from '@/lib/game/demo-park/build.ts';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  })
);
const hours = Number(args.hours ?? 48);
const speed = Number(args.speed ?? 100);
const seed = Number(args.seed ?? 7);
const top = Number(args.top ?? 12);

const packs = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(
    readFileSync(new URL(`../lib/game/content/packs/${id}/pack.json`, import.meta.url), 'utf8')
  )
);

const runtime = new SimRuntime(GAME_MODULES, () => {});
const registry = new Registry();
for (const pack of packs) registry.registerPack(pack);
const world = buildWorld(seed, registry);
runtime.init({
  type: 'init',
  world,
  packs,
  modules: GAME_MODULES.map((m) => m.id),
  seed,
});
runtime.setSpeed(speed);

/**
 * Events are attributed to the tick that was running when they fired.
 *
 * `onAny` is called synchronously from inside `emit`, which is inside `tick`, so a counter the
 * loop resets per tick is exact — no timestamps to correlate and no ordering to trust.
 */
let current = new Map();
runtime.events.onAny((name) => {
  current.set(name, (current.get(name) ?? 0) + 1);
});

const minutesPerTick = speed / 20;
const ticks = Math.max(1, Math.round((hours * 60) / minutesPerTick));
const rows = [];

for (let i = 0; i < ticks; i++) {
  current = new Map();
  const t0 = performance.now();
  runtime.tick();
  const ms = performance.now() - t0;
  rows.push({
    i,
    ms,
    minute: runtime.world.clock?.minute ?? null,
    day: runtime.world.clock?.day ?? null,
    guests: guestCount(runtime),
    events: current,
  });
}

/** The same reader `game-soak.mjs` uses, so the two scripts count the same thing. */
function guestCount(rt) {
  const api = rt.handles.get('guests')?.api;
  if (api && typeof api.count === 'function') return api.count();
  const stat = rt.world.modules.guests;
  if (stat && typeof stat === 'object' && 'count' in stat) return Number(stat.count) || 0;
  return 0;
}

const sorted = [...rows].sort((a, b) => a.ms - b.ms);
const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))].ms;
const median = at(0.5);
const mean = rows.reduce((s, r) => s + r.ms, 0) / rows.length;

/** A spike is relative to this run's own median, so the number travels between machines. */
const SPIKE = 5;
const spikes = rows.filter((r) => r.ms > median * SPIKE);

console.log(
  `\n${ticks} ticks · ${hours} park-hours at ${speed}× · seed ${seed}\n` +
    `  mean ${mean.toFixed(3)} ms · median ${median.toFixed(3)} · p90 ${at(0.9).toFixed(3)} · ` +
    `p99 ${at(0.99).toFixed(3)} · max ${sorted[sorted.length - 1].ms.toFixed(3)}\n` +
    `  ${spikes.length} tick(s) over ${SPIKE}× the median (${(median * SPIKE).toFixed(3)} ms)`
);

/** Which event names are over-represented in the slow ticks compared with everything else. */
const slow = new Set(spikes.map((r) => r.i));
const tally = new Map();
for (const r of rows) {
  for (const [name, n] of r.events) {
    let t = tally.get(name);
    if (!t) tally.set(name, (t = { slow: 0, fast: 0, slowTicks: 0, fastTicks: 0 }));
    if (slow.has(r.i)) {
      t.slow += n;
      t.slowTicks++;
    } else {
      t.fast += n;
      t.fastTicks++;
    }
  }
}

console.log('\n  event                     in slow ticks      in the rest');
console.log('  ' + '-'.repeat(58));
const fastCount = rows.length - spikes.length;
for (const [name, t] of [...tally].sort(
  (a, b) => b[1].slow / (b[1].fast + 1) - a[1].slow / (a[1].fast + 1)
)) {
  const slowShare = spikes.length ? (t.slowTicks / spikes.length) * 100 : 0;
  const fastShare = fastCount ? (t.fastTicks / fastCount) * 100 : 0;
  console.log(
    `  ${name.padEnd(24)} ${String(t.slow).padStart(6)} (${slowShare.toFixed(0).padStart(3)}% of ticks)` +
      `  ${String(t.fast).padStart(7)} (${fastShare.toFixed(0).padStart(3)}%)`
  );
}

console.log(`\n  the ${Math.min(top, rows.length)} slowest ticks:`);
for (const r of sorted.slice(-top).reverse()) {
  const ev = [...r.events].map(([n, c]) => `${n}×${c}`).join(' ') || '(no events)';
  console.log(
    `  #${String(r.i).padStart(5)}  ${r.ms.toFixed(2).padStart(8)} ms  day ${r.day} ` +
      `min ${String(r.minute).padStart(4)}  ${String(r.guests).padStart(4)} guests  ${ev}`
  );
}

const unexplained = spikes.filter((r) => r.events.size === 0);
console.log(
  `\n  unexplained: ${unexplained.length} of ${spikes.length} spike(s) emitted no event at all` +
    (unexplained.length ? ' — this script does not account for those' : '')
);
console.log();
