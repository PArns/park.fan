/**
 * park.fan Coaster — where does a guest's park day actually go?
 *
 * Two open findings say the same thing from opposite ends: 124 ride boardings in a park day across
 * four machines rated for 2,136 an hour, and a shop counter whose queue reads 0 at every sample.
 * Both were filed against D-006, the time compression — `speed` on an archetype is metres per PARK
 * minute, so a venue 60 m away is a half-hour walk and every score gets divided by the trip. That
 * explanation is arithmetically true and it is not, on its own, enough: a guest who stays five park
 * hours walks about 600 m at 2 m per park minute, which is two or three destinations in a park
 * 400 m across, and the park is delivering less than one interaction per visitor.
 *
 * So this asks the question directly instead of reasoning about it. It runs the real `SimRuntime`
 * in node — the same import-safe path `game-soak.mjs` uses, no DOM and no Babylon — for one park
 * day, and samples the guest state histogram every park hour along with what the rides and the
 * shops took. The output is a time budget: what fraction of the population is walking, queuing,
 * riding, buying, idling or lost at each hour of the day.
 *
 *   node scripts/game-day-budget.mjs
 *   node scripts/game-day-budget.mjs --hours=14 --speed=20 --seed=7 --json=.game-render/day.json
 *
 * Reading it: WALKING is the cost of the park's size and is expected to dominate. IDLE is not — a
 * guest is idle when it has no errand it wants, which is a decision that came back empty, and a
 * park where idle beats walking is a park whose venues are being refused rather than one whose
 * guests are far away. That is the difference the two findings could not tell apart.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import { buildWorld } from '@/lib/game/demo-park/index.ts';
import { Registry } from '@/lib/game/core/registry.ts';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1'];
  })
);
const hours = Number(args.hours ?? 14);
const speed = Number(args.speed ?? 20);
const seed = Number(args.seed ?? 1);
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
runtime.init({ type: 'init', world, packs, modules: GAME_MODULES.map((m) => m.id), seed });
runtime.setSpeed(speed);

const handle = (id) => runtime.handles?.get(id)?.api ?? null;
const minutesPerTick = speed / 20;
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
  const s = handle('shops')?.stats?.() ?? null;
  if (!g) return null;
  const alive = Object.values(g.byState).reduce((a, b) => a + b, 0) || 1;
  return {
    minute: Math.round(world.clock.minute),
    guests: g.count,
    byState: Object.fromEntries(STATES.map((k) => [k, g.byState[k] ?? 0])),
    pct: Object.fromEntries(STATES.map((k) => [k, ((g.byState[k] ?? 0) / alive) * 100])),
    arrived: g.arrivedToday,
    left: g.leftToday,
    bought: g.boughtToday,
    spent: g.spentToday,
    refused: { ...g.refusedToday },
    stuck: g.stuck,
    lost: g.lost,
    rideRiders: r?.ridersToday ?? null,
    rideQueued: r?.queued ?? null,
    rideRiding: r?.riding ?? null,
    shopQueue: s?.sim?.queue ?? s?.queue ?? null,
    shopTakings: s?.sim?.takingsToday ?? s?.takingsToday ?? null,
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

console.log(`one park day, seed ${seed}, speed ${speed} (${minutesPerTick} park min/tick)\n`);
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
  `interactions per visitor: ${((last.rideRiders ?? 0) + last.bought) / visits} ` +
    `(${last.rideRiders ?? 0} rides + ${last.bought} purchases over ${visits} arrivals)`
);
console.log(`refused: ${JSON.stringify(last.refused)}`);

// Per machine, because "the park did 275 rides" and "one machine did 271 of them" are different
// parks and the total cannot tell them apart.
const rideViews = handle('rides')?.list?.() ?? [];
if (rideViews.length) {
  console.log('\nrides');
  for (const v of rideViews) {
    const e = Object.values(world.entities).find((x) => x.id === v.id);
    const at = e ? `(${Math.round(e.position[0])}, ${Math.round(e.position[2])})` : '';
    console.log(
      `  ${String(v.key).padEnd(26)} ${String(v.ridersToday).padStart(5)} riders · ` +
        `queue ${String(v.queueLength).padStart(3)} · util ${(v.utilisation * 100).toFixed(0).padStart(3)}% · ` +
        `rated ${String(Math.round(v.ratedThroughput)).padStart(4)}/h ${at}`
    );
  }
}
console.log(`stuck ${last.stuck} · lost ${last.lost}`);
if (events.length) console.log(`\nsim errors: ${JSON.stringify(events.slice(0, 5))}`);

if (jsonOut) {
  await mkdir(path.dirname(jsonOut), { recursive: true });
  await writeFile(jsonOut, JSON.stringify({ seed, speed, hours, rows }, null, 2));
  console.log(`\n→ ${jsonOut}`);
}
