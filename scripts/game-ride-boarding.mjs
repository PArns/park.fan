/**
 * park.fan Coaster — what the coaster and the flume are worth over a park day.
 *
 * It began as the harness for a park that had neither: `buildWorld` answered
 * `{path, scenery, shop, ride, pool, building}`, the four flat rides carried the whole day, and
 * this script dropped a coaster on the `coaster` shelf and a slide on the `flumes` pad to measure
 * what a park with them looks like. `demo-park` has since placed both (`build.ts`, §4f), so the
 * default run is now simply the demo park's own day and **`--flat-only` is the interesting one**:
 * it strips every `coaster` and `flume` entity back out and gives the before column.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs \
 *     scripts/game-ride-boarding.mjs
 *   … --hours=14 --speed=20 --seed=1 --json=.game-render/boarding.json
 *   … --flat-only          # the same day with the two machines removed: the before column
 *
 * The placement itself is `docs/game/requests/rides.md` §5 and now lives in `demo-park`, which is
 * why nothing here names a layout any more: a script that placed its own coaster beside the park's
 * would measure a park nobody plays.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import { buildWorld } from '@/lib/game/demo-park/index.ts';
import { Registry } from '@/lib/game/core/registry.ts';
import { MINUTES_PER_TICK_AT_SPEED_1 } from '@/lib/game/core/types.ts';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1'];
  })
);
const hours = Number(args.hours ?? 14);
const speed = Number(args.speed ?? 20);
const seed = Number(args.seed ?? 1);
const flatOnly = args['flat-only'] === '1';
const jsonOut = args.json ?? null;

const packs = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(
    readFileSync(new URL(`../lib/game/content/packs/${id}/pack.json`, import.meta.url), 'utf8')
  )
);

const events = [];
const runtime = new SimRuntime(GAME_MODULES, (msg) => {
  if (msg.type === 'error') events.push(msg);
});
const registry = new Registry();
for (const pack of packs) registry.registerPack(pack);
const world = buildWorld(seed, registry);

/**
 * `--flat-only`: the park as it was before `demo-park` placed the two machines.
 *
 * Removing them is not the same as never having built them — the entity ids the factory allocated
 * are spent either way — but the world is seeded and the ids are allocated in a fixed order, so
 * every remaining entity keeps the id and the position it had. What changes is the venue list the
 * `guests` module builds, which is the whole point of the column.
 */
if (flatOnly) {
  for (const [id, e] of Object.entries(world.entities)) {
    // The slide's splashdown lane goes with it: a run-out pool with no run-out over it is not
    // part of "the park before the two machines", it is a rectangle of water nobody built.
    const isRunout = e.kind === 'pool' && e.data?.splashdownFor != null;
    if (e.kind === 'coaster' || e.kind === 'flume' || isRunout) delete world.entities[id];
  }
}

runtime.init({ type: 'init', world, packs, modules: GAME_MODULES.map((m) => m.id), seed });
runtime.setSpeed(speed);

const handle = (id) => runtime.handles?.get(id)?.api ?? null;
const minutesPerTick = speed * MINUTES_PER_TICK_AT_SPEED_1;
const ticksPerHour = Math.max(1, Math.round(60 / minutesPerTick));

const STATES = [
  'arriving',
  'walking',
  'idle',
  'sitting',
  'queuing',
  'riding',
  'buying',
  'leaving',
  'lost',
];
const rows = [];

function sample() {
  const g = handle('guests')?.stats?.() ?? null;
  const r = handle('rides')?.stats?.() ?? null;
  if (!g) return null;
  const alive = Object.values(g.byState).reduce((a, b) => a + b, 0) || 1;
  return {
    minute: Math.round(world.clock.minute),
    guests: g.count,
    pct: Object.fromEntries(STATES.map((k) => [k, ((g.byState[k] ?? 0) / alive) * 100])),
    arrived: g.arrivedToday,
    left: g.leftToday,
    bought: g.boughtToday,
    refused: { ...g.refusedToday },
    stuck: g.stuck,
    lost: g.lost,
    rideRiders: r?.ridersToday ?? null,
    rideQueued: r?.queued ?? null,
  };
}

rows.push({ ...sample(), label: 'boot' });
for (let h = 0; h < hours; h++) {
  for (let t = 0; t < ticksPerHour; t++) runtime.tick();
  const row = sample();
  if (row) rows.push({ ...row, label: hhmm(row.minute) });
}

function hhmm(minute) {
  const m = ((minute % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60) % 60).padStart(2, '0')}`;
}
const pct = (v) => (v == null ? '   —' : `${v.toFixed(0).padStart(3)}%`);
const num = (v, w = 6) => (v == null ? '—'.padStart(w) : String(v).padStart(w));

console.log(
  `one park day, seed ${seed}, speed ${speed} (${minutesPerTick} park min/tick)` +
    `${flatOnly ? ' — FLAT RIDES ONLY' : ' — the demo park as built'}\n`
);
console.log(
  [
    'time ',
    'guests',
    ...STATES.map((s) => s.slice(0, 4).padStart(4)),
    '  riders',
    ' queued',
    ' bought',
  ].join(' ')
);
for (const r of rows) {
  console.log(
    [
      r.label.padEnd(5),
      num(r.guests),
      ...STATES.map((s) => pct(r.pct[s])),
      num(r.rideRiders, 7),
      num(r.rideQueued),
      num(r.bought),
    ].join(' ')
  );
}

const last = rows[rows.length - 1];
const visits = Math.max(1, last.arrived);
console.log(`\narrived ${last.arrived} · left ${last.left} · still in ${last.guests}`);
console.log(
  `interactions per visitor: ${(((last.rideRiders ?? 0) + last.bought) / visits).toFixed(2)} ` +
    `(${last.rideRiders ?? 0} rides + ${last.bought} purchases over ${visits} arrivals)`
);
console.log(`refused: ${JSON.stringify(last.refused)}`);

const rideViews = handle('rides')?.list?.() ?? [];
if (rideViews.length) {
  console.log('\nrides');
  for (const v of rideViews) {
    const e = world.entities[v.id];
    const at = e ? `(${Math.round(e.position[0])}, ${Math.round(e.position[2])})` : '';
    console.log(
      `  ${String(v.key).padEnd(26)} ${String(v.dispatchedBy).padEnd(7)} ` +
        `${String(v.ridersToday).padStart(5)} riders · queue ${String(v.queueLength).padStart(3)} · ` +
        `util ${(v.utilisation * 100).toFixed(0).padStart(3)}% · ` +
        `rated ${String(Math.round(v.ratedThroughput)).padStart(4)}/h ${at}`
    );
  }
}
const fleets = handle('trains')?.statuses?.() ?? [];
for (const f of fleets) {
  console.log(
    `  fleet ${f.rideId}: ${f.trains} trains × ${f.seats} seats · cycle ${f.cycleSeconds} s · ` +
      `${f.dispatches} dispatches · last load ${f.riders}`
  );
}
const slides = handle('flumes')?.views?.() ?? [];
for (const s of slides) {
  console.log(
    `  slide ${s.id}: ${s.descents} descents · ${s.rideSeconds.toFixed(0)} s · ` +
      `${s.ridersPerHour}/h nameplate`
  );
}
console.log(`stuck ${last.stuck} · lost ${last.lost}`);
if (events.length) console.log(`\nsim errors: ${JSON.stringify(events.slice(0, 5))}`);

if (jsonOut) {
  await mkdir(path.dirname(jsonOut), { recursive: true });
  await writeFile(jsonOut, JSON.stringify({ seed, speed, hours, flatOnly, rows }, null, 2));
  console.log(`\n→ ${jsonOut}`);
}
