/**
 * Everything about this module a screenshot cannot show.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/trains/selftest.mjs
 *
 * A `.mjs` next to the code rather than a `scripts/test-game-*.mjs`, for the reason `paths`,
 * `track`, `shops`, `camera` and `tools` all give: these checks are about this module's internals
 * and a builder may not edit `package.json`. The request to wire it into `pnpm test:game` is in
 * `docs/game/requests/trains.md`.
 *
 * Six things are worth testing here and none of them is visible in a still frame: whether the block
 * plan a layout produces is the one a coaster engineer would draw, whether the integrator agrees
 * with the validation run `track` already does, whether two trains ever occupy the same block,
 * whether a save round-trips after the fleet has been running, whether the pack path really carries
 * a train's numbers, and whether two runtimes with the same seed produce the same bytes.
 */

import { readFileSync } from 'node:fs';
import { Registry } from '@/lib/game/core/registry.ts';
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { createWorld, serializeWorld } from '@/lib/game/core/world.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import { TRACK_LAYOUTS, buildTrack, buildOptionsFor, layoutData } from '@/lib/game/track/index.ts';
import { planBlocks, blockAt, blocksCovered, distanceAhead, nextBlock } from './blocks.ts';
import { samplerFor, stepTrain } from './motion.ts';
import {
  attachTrainContent,
  registerTrainProfilesFromPack,
  resetTrainProfiles,
  resolveTrainProfile,
  trainLengthM,
  trainMassKg,
} from './manifest.ts';
import { RIDE_SECONDS_PER_TICK } from './types.ts';

let failures = 0;
let checks = 0;
function ok(condition, label, detail = '') {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}
function near(actual, expected, tolerance, label) {
  ok(
    Math.abs(actual - expected) <= tolerance,
    label,
    `${Number(actual).toFixed(4)} vs ${Number(expected).toFixed(4)} (±${tolerance})`
  );
}
const section = (name) => console.log(name);

const PACKS = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(
    readFileSync(new URL(`../content/packs/${id}/pack.json`, import.meta.url), 'utf8')
  )
);

function freshRegistry() {
  const registry = new Registry();
  for (const pack of PACKS) registry.registerPack(pack);
  return registry;
}

// ── 1. the block plan ───────────────────────────────────────────────────────────────────────
section('1 · block plan');
{
  // A textbook circuit: station 0-24, lift 38-120, block brake 500-524, brake run 900-930.
  const drives = [
    { kind: 'station', from: 0, to: 24, speed: 0 },
    { kind: 'transport', from: 24, to: 38, speed: 2.5 },
    { kind: 'lift', from: 38, to: 120, speed: 4 },
    { kind: 'block', from: 500, to: 524, speed: 11 },
    { kind: 'brake', from: 900, to: 930, speed: 5 },
  ];
  const plan = planBlocks(drives, 1000, true);
  ok(plan.blocks.length === 4, 'four hold sections make four blocks', `${plan.blocks.length}`);
  ok(plan.station === 0, 'the station is block 0', `${plan.station}`);
  ok(plan.capacity === 3, 'four blocks run three trains', `${plan.capacity}`);
  ok(
    plan.blocks[0].from === 0 && plan.blocks[0].to === 38 && plan.blocks[0].stop === 24,
    'block 0 runs station start → lift start, stopping at the platform end',
    JSON.stringify(plan.blocks[0])
  );
  ok(
    plan.blocks[3].from === 900 && plan.blocks[3].to === 1000,
    'the last block wraps to the station',
    JSON.stringify(plan.blocks[3])
  );
  ok(plan.blocks[2].stop === 524, 'a block brake holds at its own far end');
  // A `transport` and a `launch` are not blocks: neither can hold a train.
  ok(
    !plan.blocks.some((b) => b.kind === 'transport'),
    'a transport section is not a block boundary'
  );

  ok(blockAt(plan, 10) === 0, 'blockAt inside the station');
  ok(blockAt(plan, 300) === 1, 'blockAt on the lift block');
  ok(blockAt(plan, 950) === 3, 'blockAt on the brake block');
  ok(nextBlock(plan, 3) === 0, 'the block after the last is the first, on a circuit');
  ok(nextBlock(planBlocks(drives, 1000, false), 3) === -1, 'an open layout has no block after 3');

  const covered = [];
  blocksCovered(plan, 45, 24, covered);
  ok(
    covered.includes(0) && covered.includes(1) && covered.length === 2,
    'a 24 m train straddling the lift entry occupies both blocks',
    JSON.stringify(covered)
  );
  blocksCovered(plan, 10, 24, covered);
  ok(
    covered.includes(0) && covered.includes(3),
    'a train part-way into the station still occupies the block behind it',
    JSON.stringify(covered)
  );

  near(distanceAhead(plan, 990, 24), 34, 1e-9, 'distance forward across the seam');
  near(distanceAhead(plan, 20, 24), 4, 1e-9, 'distance forward without a wrap');
  near(distanceAhead(plan, 30, 24), 994, 1e-9, 'a stop line just behind is a lap ahead');

  const none = planBlocks([{ kind: 'transport', from: 0, to: 10, speed: 2 }], 100, true);
  ok(none.blocks.length === 0 && none.station === -1, 'a layout with nothing that holds has no plan');
}

// ── 2. the integrator against a closed form ─────────────────────────────────────────────────
section('2 · integrator');
{
  // A 45° ramp, frictionless, no drives: v must reach sqrt(2 g h) after falling h.
  const drop = 40;
  const grade = -Math.SQRT1_2;
  const sampler = {
    length: () => 1000,
    wrap: (s) => Math.min(1000, Math.max(0, s)),
    curvatureAt: () => [0, 0, 0],
    gradeAt: () => grade,
  };
  const ctx = {
    sampler,
    drives: [],
    trainLength: 20,
    massKg: 10000,
    dragArea: 0,
    rollingResistance: 0,
    closed: false,
  };
  const state = { s: 0, v: 0, mode: 'running', timer: 0, laps: 0 };
  const distance = drop / Math.SQRT1_2;
  const scratch = [];
  for (let i = 0; i < 20000 && state.s < distance; i++) {
    stepTrain(state, ctx, null, RIDE_SECONDS_PER_TICK, scratch);
  }
  near(state.v, Math.sqrt(2 * 9.80665 * drop), 0.35, 'a frictionless 40 m drop arrives at √(2gh)');

  // The same ramp uphill from that speed must come back to rest after the same height.
  const up = { ...ctx, sampler: { ...sampler, gradeAt: () => -grade } };
  const climb = { s: 0, v: state.v, mode: 'running', timer: 0, laps: 0 };
  for (let i = 0; i < 20000 && climb.v > 0.4; i++) {
    stepTrain(climb, up, null, RIDE_SECONDS_PER_TICK, scratch);
  }
  near(climb.s * Math.SQRT1_2, drop, 0.6, 'and gives the height back climbing');

  // A chain lift is a clamp, not a force: whatever the gradient, the train runs at chain speed.
  const lift = {
    ...ctx,
    drives: [{ kind: 'lift', from: 0, to: 400, speed: 4 }],
    sampler: { ...sampler, gradeAt: () => Math.sin((28 * Math.PI) / 180) },
  };
  const hauled = { s: 0, v: 0, mode: 'running', timer: 0, laps: 0 };
  for (let i = 0; i < 400; i++) stepTrain(hauled, lift, null, RIDE_SECONDS_PER_TICK, scratch);
  near(hauled.v, 4, 1e-6, 'a chain lift holds the train at chain speed up a 28° gradient');
  near(hauled.s, 4 * 400 * RIDE_SECONDS_PER_TICK, 0.02, 'and advances it at exactly that speed');

  // A block hold brings a train to rest ON the stop line, not past it.
  const held = { s: 0, v: 12, mode: 'running', timer: 0, laps: 0 };
  const holdCtx = { ...ctx, drives: [], closed: false };
  let parked = false;
  for (let i = 0; i < 400 && !parked; i++) {
    const hold = { from: 0, stop: 24, distance: 24 - held.s };
    parked = stepTrain(held, { ...holdCtx, sampler: { ...sampler, gradeAt: () => 0 } }, hold, RIDE_SECONDS_PER_TICK, scratch).parked;
  }
  ok(parked, 'a block hold parks the train');
  near(held.s, 24, 1e-6, 'exactly on the stop line');
  near(held.v, 0, 1e-9, 'at rest');
}

// ── 3. the integrator against `track`'s own validation run ──────────────────────────────────
section('3 · integrator vs simulateTrack');
{
  const registry = freshRegistry();
  attachTrainContent(registry);
  for (const preset of TRACK_LAYOUTS) {
    const data = layoutData(preset);
    const built = buildTrack(data, buildOptionsFor(registry, data));
    const profile = resolveTrainProfile(registry, data);
    const plan = planBlocks(built.drives, built.spline.length(), true);
    const ctx = {
      sampler: samplerFor(built.spline),
      drives: built.drives,
      trainLength: trainLengthM(profile),
      massKg: trainMassKg(profile),
      dragArea: profile.dragArea,
      rollingResistance: profile.rollingResistance,
      closed: true,
    };
    // Dispatch from the platform end, exactly where `simulateTrack` starts its march.
    const state = { s: built.physics.startS, v: 2, mode: 'running', timer: 0, laps: 0 };
    const scratch = [];
    let top = 0;
    let seconds = 0;
    const lap = built.spline.length() - (plan.blocks[plan.station].stop - plan.blocks[plan.station].from);
    let travelled = 0;
    for (let i = 0; i < 20000 && travelled < lap; i++) {
      const before = state.s;
      stepTrain(state, ctx, null, RIDE_SECONDS_PER_TICK, scratch);
      let d = state.s - before;
      if (d < -lap / 2) d += built.spline.length();
      travelled += d;
      seconds += RIDE_SECONDS_PER_TICK;
      if (state.v > top) top = state.v;
    }
    const speedError = Math.abs(top - built.physics.maxSpeed) / built.physics.maxSpeed;
    const timeError =
      Math.abs(seconds - built.physics.rideTimeSeconds) / built.physics.rideTimeSeconds;
    ok(
      travelled >= lap - 1,
      `${preset.name}: the live train completes a lap`,
      `${travelled.toFixed(0)} of ${lap.toFixed(0)} m`
    );
    ok(
      speedError < 0.03,
      `${preset.name}: top speed within 3 % of simulateTrack`,
      `${(top * 3.6).toFixed(1)} vs ${(built.physics.maxSpeed * 3.6).toFixed(1)} km/h (${(speedError * 100).toFixed(1)} %)`
    );
    ok(
      timeError < 0.08,
      `${preset.name}: lap time within 8 % of simulateTrack`,
      `${seconds.toFixed(1)} vs ${built.physics.rideTimeSeconds.toFixed(1)} s (${(timeError * 100).toFixed(1)} %)`
    );
    console.log(
      `    ${preset.name}: ${plan.blocks.length} blocks · ${plan.capacity} trains max · ` +
        `${(top * 3.6).toFixed(0)} km/h live vs ${(built.physics.maxSpeed * 3.6).toFixed(0)} rated · ` +
        `${seconds.toFixed(0)} s live vs ${built.physics.rideTimeSeconds.toFixed(0)} s`
    );
  }
}

// ── 4. content ──────────────────────────────────────────────────────────────────────────────
section('4 · profiles come from content');
{
  resetTrainProfiles();
  const registry = freshRegistry();
  attachTrainContent(registry);
  ok(
    registry.unclaimedPackKeys().every((k) => k.key !== 'trainProfiles'),
    'the trainProfiles category is claimed'
  );

  const hyper = resolveTrainProfile(registry, layoutData(TRACK_LAYOUTS[0]));
  ok(hyper.cars === 7, "cars come from the ride's carsPerTrain", `${hyper.cars}`);
  ok(hyper.seatsPerCar === 4 && hyper.seatsPerRow === 2, 'a four-seat car is two across');
  ok(hyper.restraint === 'shoulder', 'a 5.0 g / −1.8 g ride gets a shoulder harness');
  ok(hyper.nose === 'wedge', 'a steel structure carries a moulded fairing');
  ok(hyper.livery.body === '#f2c230', 'the livery comes from the train style colour');
  near(hyper.massPerCar, 900, 1e-9, 'a 3 m car is 900 kg empty');

  const wood = resolveTrainProfile(registry, layoutData(TRACK_LAYOUTS[1]));
  ok(wood.nose === 'blunt', 'a timber structure carries a classic blunt front');
  near(wood.rollingResistance, 0.024, 1e-9, 'and rides rougher');
  ok(wood.restraint === 'shoulder', 'a −1.5 g woodie still gets a harness');

  const family = resolveTrainProfile(registry, layoutData(TRACK_LAYOUTS[2]));
  ok(family.restraint === 'lap', 'a 3.5 g / −1.0 g family ride gets a lap bar');

  // A pack that ships a `trainProfiles` entry overrides every derived number, and none of this
  // module's code knows the pack exists.
  const extra = {
    id: 'probe-pack',
    version: 1,
    name: { en: 'Probe' },
    requires: [],
    trainStyles: [{ id: 'probe-train', car: { length: 2.4, width: 1.7, height: 1, seats: 6 } }],
    trainProfiles: [
      {
        id: 'probe-train',
        cars: 9,
        seatsPerCar: 6,
        seatsPerRow: 3,
        massPerCar: 555,
        dragArea: 3.3,
        rollingResistance: 0.031,
        restraint: 'vest',
        nose: 'round',
        dwellSeconds: 44,
        livery: { body: '#123456', trim: '#654321', chassis: '#111111', seat: '#222222' },
      },
    ],
  };
  registry.registerPack(extra);
  const probe = resolveTrainProfile(registry, {
    ...layoutData(TRACK_LAYOUTS[0]),
    train: 'probe-pack:probe-train',
  });
  ok(probe.cars === 9, 'a pack sets the car count', `${probe.cars}`);
  ok(probe.seatsPerRow === 3, 'and the seats per row');
  near(probe.massPerCar, 555, 1e-9, 'and the mass');
  near(probe.dragArea, 3.3, 1e-9, 'and the drag area');
  ok(probe.restraint === 'vest' && probe.nose === 'round', 'and the restraint and the nose');
  ok(probe.livery.body === '#123456', 'and the livery');
  ok(probe.dwellSeconds === 44, 'and the dwell');

  let threw = false;
  try {
    registerTrainProfilesFromPack({
      id: 'bad-pack',
      trainProfiles: [{ id: 'x', restraint: 'seatbelt' }],
    });
  } catch {
    threw = true;
  }
  ok(threw, 'an unknown restraint is refused by name, not silently dropped');
  resetTrainProfiles();
}

// ── 5. a fleet, in the real runtime ─────────────────────────────────────────────────────────
section('5 · a fleet in the runtime');

/** A world holding every showcase layout as a `coaster` entity. */
function coasterWorld(seed) {
  const world = createWorld({
    seed,
    name: 'trains-selftest',
    resolution: 16,
    packs: PACKS.map((p) => p.id),
  });
  let n = 0;
  for (const preset of TRACK_LAYOUTS) {
    n += 1;
    const data = layoutData(preset);
    const [pack, item] = preset.ride.split(':');
    world.entities[`coaster-${n}`] = {
      id: `coaster-${n}`,
      kind: 'coaster',
      pack,
      item,
      position: data.origin,
      yaw: data.yaw,
      data,
    };
  }
  return world;
}

const MODULE_IDS = ['core', 'terrain', 'track', 'trains'];

function runtime(seed, ticks) {
  const messages = [];
  const rt = new SimRuntime(GAME_MODULES, (m) => messages.push(m));
  const world = coasterWorld(seed);
  world.clock.speed = 1;
  rt.init({ type: 'init', world, packs: PACKS, modules: MODULE_IDS });
  for (let i = 0; i < ticks; i++) rt.tick(0.05);
  return { rt, messages };
}

{
  const { rt, messages } = runtime(11, 20);
  const errors = messages.filter((m) => m.type === 'error');
  ok(errors.length === 0, 'no sim errors', JSON.stringify(errors.slice(0, 2)));
  const ready = messages.find((m) => m.type === 'ready');
  ok(ready && ready.failed.length === 0, 'no module failed', JSON.stringify(ready?.failed));

  const api = rt.handles.get('trains').api;
  ok(api.ids().length === 3, 'three fleets', JSON.stringify(api.ids()));
  const statuses = api.statuses();
  for (const s of statuses) {
    console.log(
      `    ${s.rideId}: ${s.trains} trains · ${s.blocks} blocks · cycle ${s.cycleSeconds} s · ` +
        `${s.ridersPerHour} riders/h`
    );
  }
  ok(
    statuses.every((s) => s.trains <= s.blocks - 1 && s.trains >= 1),
    'every fleet fits its block plan'
  );
  ok(
    statuses.find((s) => s.blocks === 4)?.trains === 3,
    'the four-block layout runs three trains'
  );
  rt.dispose();
}

{
  // Run long enough for every train to complete a lap, and check the block rule the whole way.
  const { rt, messages } = runtime(11, 16000);
  const api = rt.handles.get('trains').api;
  const errors = messages.filter((m) => m.type === 'error');
  ok(errors.length === 0, 'no sim errors over 800 ride seconds', JSON.stringify(errors.slice(0, 2)));

  for (const id of api.ids()) {
    const status = api.status(id);
    const trains = api.trains(id);
    ok(status.dispatches >= 3, `${id}: the ride keeps dispatching`, `${status.dispatches}`);
    ok(
      trains.every((t) => t.laps > 0),
      `${id}: EVERY train has completed a lap`,
      JSON.stringify(trains.map((t) => t.laps))
    );
    ok(
      trains.some((t) => t.mode === 'running'),
      `${id}: and one is on the circuit at the end of the run`,
      JSON.stringify(trains.map((t) => t.mode))
    );
    ok(
      trains.every((t) => Number.isFinite(t.s) && Number.isFinite(t.v) && t.v >= 0),
      `${id}: every train has a finite, non-negative speed`
    );
    console.log(
      `    ${id}: ${status.dispatches} dispatches · laps ${trains.map((t) => t.laps).join('/')} · ` +
        `modes ${trains.map((t) => t.mode).join('/')}`
    );
  }
  rt.dispose();
}

{
  // The block invariant, checked every tick rather than at the end: no two trains of one ride may
  // ever occupy the same block. This is the property the whole module exists to have.
  const registry = freshRegistry();
  attachTrainContent(registry);
  const rt = new SimRuntime(GAME_MODULES, () => {});
  const world = coasterWorld(5);
  world.clock.speed = 1;
  rt.init({ type: 'init', world, packs: PACKS, modules: MODULE_IDS });
  const trains = rt.handles.get('trains').api;
  const track = rt.handles.get('track').api;
  let violations = 0;
  let minGap = Infinity;
  const covered = [];
  for (let i = 0; i < 8000; i++) {
    rt.tick(0.05);
    for (const id of trains.ids()) {
      const plan = planBlocks(track.drives(id), track.length(id), track.closed(id));
      const profile = trains.profile(id);
      const length = trainLengthM(profile);
      const seen = new Set();
      const list = trains.trains(id);
      for (const t of list) {
        blocksCovered(plan, t.s, length, covered);
        for (const b of covered) {
          if (seen.has(b)) violations += 1;
          seen.add(b);
        }
      }
      // And the physical gap: no two trains nose-to-tail closer than a train length.
      for (let a = 0; a < list.length; a++) {
        for (let b = a + 1; b < list.length; b++) {
          const gap = Math.min(
            distanceAhead(plan, list[a].s, list[b].s),
            distanceAhead(plan, list[b].s, list[a].s)
          );
          if (gap < minGap) minGap = gap;
        }
      }
    }
  }
  ok(violations === 0, 'no two trains ever share a block over 400 ride seconds', `${violations}`);
  ok(minGap > 25, 'and the closest two trains ever come is more than a train length', `${minGap.toFixed(1)} m`);
  console.log(`    closest approach over 8,000 ticks: ${minGap.toFixed(1)} m`);
  rt.dispose();
}

// ── 6. save → load → save ───────────────────────────────────────────────────────────────────
section('6 · state');
{
  const rtA = new SimRuntime(GAME_MODULES, () => {});
  const worldA = coasterWorld(21);
  worldA.clock.speed = 1;
  rtA.init({ type: 'init', world: worldA, packs: PACKS, modules: MODULE_IDS });
  for (let i = 0; i < 1500; i++) rtA.tick(0.05);
  const mid = rtA.serialize();

  const slot = JSON.parse(mid).modules.trains;
  ok(slot && slot.version === 1, 'the module writes its slot');
  const anyFleet = Object.values(slot.fleets)[0];
  ok(
    anyFleet && typeof anyFleet.sinceDispatch === 'number' && typeof anyFleet.dispatches === 'number',
    'the fleet accumulators are serialised',
    JSON.stringify(anyFleet && Object.keys(anyFleet))
  );
  ok(
    anyFleet.trains.every(
      (t) =>
        typeof t.s === 'number' &&
        typeof t.v === 'number' &&
        typeof t.timer === 'number' &&
        typeof t.laps === 'number' &&
        typeof t.mode === 'string'
    ),
    'and so is every field of every train',
    JSON.stringify(anyFleet.trains[0])
  );

  for (let i = 0; i < 1500; i++) rtA.tick(0.05);
  const end1 = rtA.serialize();

  const rtB = new SimRuntime(GAME_MODULES, () => {});
  rtB.init({ type: 'init', world: SimRuntime.parse(mid), packs: PACKS, modules: MODULE_IDS });
  const reloaded = rtB.serialize();
  ok(reloaded === mid, 'save → load → save is byte-identical', diff(mid, reloaded));
  for (let i = 0; i < 1500; i++) rtB.tick(0.05);
  const end2 = rtB.serialize();
  ok(end1 === end2, 'and resuming from a save reproduces the uninterrupted run', diff(end1, end2));
  rtA.dispose();
  rtB.dispose();
}

{
  const a = runtime(3, 900);
  const b = runtime(3, 900);
  const sa = a.rt.serialize();
  const sb = b.rt.serialize();
  ok(sa === sb, 'two runtimes with the same seed serialise identically', diff(sa, sb));
  a.rt.dispose();
  b.rt.dispose();
}

/** The first difference between two serialisations, which is how an unsaved accumulator is found. */
function diff(a, b) {
  if (a === b) return '';
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return `at ${i}: …${a.slice(Math.max(0, i - 60), i + 60)}… vs …${b.slice(Math.max(0, i - 60), i + 60)}…`;
    }
  }
  return 'lengths differ';
}

// ── 7. the frame buffer ─────────────────────────────────────────────────────────────────────
section('7 · the frame buffer');
{
  const { rt } = runtime(9, 600);
  const buffers = {};
  const stats = {};
  const writer = {
    f32(name, length) {
      const view = new Float32Array(length);
      buffers[name] = view;
      return view;
    },
    u8: (name, length) => new Uint8Array(length),
    u16: (name, length) => new Uint16Array(length),
    stat: (name, value) => {
      stats[name] = value;
    },
  };
  rt.handles.get('trains').fill(writer);
  const transform = buffers['trains.transform'];
  ok(!!transform, 'the module writes trains.transform');
  ok(transform.length % 7 === 0, 'seven floats per car (pos3 + quat4)', `${transform.length}`);
  ok(stats['trains.cars'] * 7 === transform.length, 'and the car count matches the buffer');
  ok(stats['trains.count'] > 0, 'and there are trains in it', `${stats['trains.count']}`);
  let bad = 0;
  let unitQuat = 0;
  for (let i = 0; i < transform.length; i += 7) {
    for (let k = 0; k < 7; k++) if (!Number.isFinite(transform[i + k])) bad += 1;
    const n = Math.hypot(transform[i + 3], transform[i + 4], transform[i + 5], transform[i + 6]);
    if (Math.abs(n - 1) > 1e-3) unitQuat += 1;
  }
  ok(bad === 0, 'no non-finite number reaches the buffer', `${bad}`);
  ok(unitQuat === 0, 'every quaternion is a unit quaternion', `${unitQuat}`);
  console.log(
    `    ${stats['trains.count']} trains · ${stats['trains.cars']} cars · ` +
      `${transform.length * 4} bytes a frame`
  );
  rt.dispose();
}

// ── 8. serialisation refuses nothing it should refuse ───────────────────────────────────────
section('8 · the world still serialises');
{
  const { rt } = runtime(4, 400);
  const json = rt.serialize();
  const back = SimRuntime.parse(json);
  ok(serializeWorld(back) === json, 'a world with a running fleet round-trips');
  rt.dispose();
}

console.log(
  failures === 0
    ? `✓ trains selftest: ${checks} checks clean`
    : `✗ trains selftest: ${failures} of ${checks} checks failed`
);
process.exit(failures === 0 ? 0 : 1);
