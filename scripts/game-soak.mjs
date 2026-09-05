/**
 * park.fan Coaster — headless soak.
 *
 * Runs the real simulation runtime in node (no DOM, no Babylon — `SimRuntime` is written to be
 * import-safe on both) for 48 park-hours at 100×, then walks the world looking for the four things
 * a park sim goes wrong in, none of which a green build or a screenshot would show:
 *
 *   1. a non-finite number anywhere        — the number-one find, and it poisons a save
 *   2. a guest that stopped moving         — a navigation dead end, invisible in a still frame
 *   3. a queue with no route to the gate   — a park nobody can reach, which reads as "quiet"
 *   4. an entity nothing owns any more     — the leak signature
 *
 * plus finances that stayed plausible, because a park that made a billion euros overnight is a
 * bug in exactly the same way a NaN is.
 *
 *   node scripts/game-soak.mjs
 *   node scripts/game-soak.mjs --hours=48 --speed=100 --seed=7 --out=.game-render/soak.json
 *
 * Exit code 1 on any failed assertion, so it can gate a build.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import { buildWorld } from '@/lib/game/demo-park/index.ts';
import { Registry } from '@/lib/game/core/registry.ts';
import { deserializeWorld, serializeWorld } from '@/lib/game/core/world.ts';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1'];
  })
);
const hours = Number(args.hours ?? 48);
const speed = Number(args.speed ?? 100);
const seed = Number(args.seed ?? 1);
const out = args.out ?? '.game-render/soak.json';

const packs = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(
    readFileSync(new URL(`../lib/game/content/packs/${id}/pack.json`, import.meta.url), 'utf8')
  )
);

// The runtime posts to the main thread; here that is a collector, so a module that reports an
// error during the run cannot do it silently.
const posted = [];
const runtime = new SimRuntime(GAME_MODULES, (msg) => {
  if (msg.type === 'error' || msg.type === 'event') posted.push(msg);
});

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

/** Park minutes advanced per tick at this speed. */
const minutesPerTick = speed / 20;
const ticks = Math.max(1, Math.round((hours * 60) / minutesPerTick));

const tickMs = [];
const guestSeries = [];
const cashSeries = [];
let maxTickMs = 0;

const started = performance.now();
for (let i = 0; i < ticks; i++) {
  const t0 = performance.now();
  runtime.tick();
  const took = performance.now() - t0;
  tickMs.push(took);
  if (took > maxTickMs) maxTickMs = took;
  // Sampled rather than every tick: 576 samples of a number that moves once a park-hour is noise,
  // and the series is what a human reads when an assertion fails.
  if (i % Math.max(1, Math.floor(ticks / 48)) === 0) {
    guestSeries.push(guestCount(runtime));
    cashSeries.push(runtime.world.finance.cash);
  }
}
const wallMs = performance.now() - started;

function guestCount(rt) {
  const api = rt.handles.get('guests')?.api;
  if (api && typeof api.count === 'function') return api.count();
  const stat = rt.world.modules.guests;
  if (stat && typeof stat === 'object' && 'count' in stat) return Number(stat.count) || 0;
  return 0;
}

// ── 1. non-finite numbers ─────────────────────────────────────────────────────────────────────
// Walked rather than caught from `serializeWorld`, because the serializer stops at the first one
// and the useful answer is *where they all are*.
const nonFinite = [];
function walk(value, at) {
  if (nonFinite.length >= 25) return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) nonFinite.push(at);
    return;
  }
  if (ArrayBuffer.isView(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!Number.isFinite(value[i])) {
        nonFinite.push(`${at}[${i}]`);
        if (nonFinite.length >= 25) return;
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${at}[${i}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, `${at}.${k}`);
  }
}
walk(runtime.world, '$');

// ── 2. stuck guests ───────────────────────────────────────────────────────────────────────────
const guestApi = runtime.handles.get('guests')?.api;
const stuckGuests = typeof guestApi?.stuckCount === 'function' ? guestApi.stuckCount() : 0;
const guestsMeasured = typeof guestApi?.count === 'function';

// ── 3. unreachable queues ─────────────────────────────────────────────────────────────────────
const pathsApi = runtime.handles.get('paths')?.api;
let unreachableQueues = 0;
let reachabilityMeasured = false;
if (typeof pathsApi?.reachable === 'function' && typeof pathsApi?.entrance === 'function') {
  reachabilityMeasured = true;
  const gate = pathsApi.entrance();
  for (const entity of Object.values(runtime.world.entities)) {
    if (entity.kind !== 'ride' && entity.kind !== 'shop') continue;
    const [x, , z] = entity.position;
    if (!pathsApi.reachable(gate.x, gate.z, x, z)) unreachableQueues++;
  }
}

// ── 4. leaked entities ────────────────────────────────────────────────────────────────────────
// An entity whose kind no module claimed is one nothing will ever draw, tick or free.
//
// Asked of the RUNTIME's registry, not the one this script built to shape the world: `registerKind`
// is called during `createModules`, so only the runtime's copy knows who owns what. Against the
// local one every entity reads as an orphan — which is a check that would have gone green here
// only because the demo park has no entities to get it wrong about yet.
const orphanKinds = new Map();
for (const entity of Object.values(runtime.world.entities)) {
  const owner = runtime.registry.ownerOfKind(entity.kind);
  if (!owner) orphanKinds.set(entity.kind, (orphanKinds.get(entity.kind) ?? 0) + 1);
}
const orphanEntities = [...orphanKinds.values()].reduce((s, v) => s + v, 0);

// ── 5. the save still round-trips after a long run ────────────────────────────────────────────
let roundTrip = 'ok';
try {
  const a = runtime.serialize();
  const b = serializeWorld(deserializeWorld(a));
  if (a !== b) roundTrip = 'not byte-identical';
} catch (error) {
  roundTrip = error instanceof Error ? error.message : String(error);
}

const errors = posted.filter((m) => m.type === 'error');
const meanTickMs = tickMs.reduce((s, v) => s + v, 0) / tickMs.length;
const cash = runtime.world.finance.cash;

const report = {
  ok: true,
  hours,
  speed,
  seed,
  ticks,
  wallMs: Math.round(wallMs),
  meanTickMs: Number(meanTickMs.toFixed(3)),
  maxTickMs: Number(maxTickMs.toFixed(3)),
  budgetTickMs: 6,
  day: runtime.world.clock.day,
  minute: Math.round(runtime.world.clock.minute),
  entities: Object.keys(runtime.world.entities).length,
  guests: guestCount(runtime),
  guestsMeasured,
  guestSeries,
  cash,
  cashSeries,
  nonFinite,
  stuckGuests,
  unreachableQueues,
  reachabilityMeasured,
  orphanEntities,
  roundTrip,
  failedModules: [...runtime.failed],
  runtimeErrors: errors.map((e) => `${e.where}: ${e.message}`),
  assertions: [],
};

function check(name, ok, detail) {
  report.assertions.push({ name, ok, detail });
  if (!ok) report.ok = false;
}

check('no non-finite numbers', nonFinite.length === 0, nonFinite.slice(0, 10));
check('no runtime errors', errors.length === 0, report.runtimeErrors.slice(0, 10));
check('no module failed to build', runtime.failed.length === 0, [...runtime.failed]);
check('save round-trips after the run', roundTrip === 'ok', roundTrip);
check('no stuck guests', stuckGuests === 0, stuckGuests);
check('no unreachable queues', unreachableQueues === 0, unreachableQueues);
check('no orphan entities', orphanEntities === 0, Object.fromEntries(orphanKinds));
check('mean tick within budget', meanTickMs <= 6, `${meanTickMs.toFixed(3)} ms`);
// Plausible finance: a park may lose money and may make it, but not by a factor a person would
// notice as a bug. The band is wide on purpose — this catches a runaway sign error, not a
// balancing opinion.
check(
  'finances plausible',
  Number.isFinite(cash) && cash > -50_000_000_00 && cash < 1_000_000_000_00,
  cash
);

// What was NOT measured is reported rather than passed silently: a soak that says "0 stuck guests"
// because no guests module exists yet is a green light nobody earned.
report.notMeasured = [
  ...(guestsMeasured ? [] : ['stuckGuests / guests — no guests module api yet']),
  ...(reachabilityMeasured ? [] : ['unreachableQueues — no paths module api yet']),
];

await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(report, null, 2));

const mark = (ok) => (ok ? '✓' : '✗');
console.log(
  `soak ${hours} park-hours at ${speed}× — ${ticks} ticks in ${Math.round(wallMs)} ms ` +
    `(mean ${meanTickMs.toFixed(2)} ms/tick, max ${maxTickMs.toFixed(2)})`
);
for (const a of report.assertions) {
  console.log(`  ${mark(a.ok)} ${a.name}${a.ok ? '' : ` — ${JSON.stringify(a.detail)}`}`);
}
for (const n of report.notMeasured) console.log(`  · not measured: ${n}`);
console.log(`  → ${out}`);

process.exit(report.ok ? 0 : 1);
