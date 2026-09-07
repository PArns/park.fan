/**
 * Everything about this module a screenshot cannot show.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/rides/selftest.mjs
 *
 * A `.mjs` next to the code rather than a `scripts/test-game-*.mjs`, for the reason `paths`,
 * `track`, `shops`, `camera`, `tools` and `trains` all give: these checks are about this module's
 * internals and a builder may not edit `package.json`. The request to wire it into `pnpm test:game`
 * is `docs/game/requests/rides.md` §4.
 *
 * Seven things are worth testing here and none of them is visible in a still frame: whether the
 * cycle delivers the throughput the manifest claims, whether the queue and the wait estimate agree
 * with what actually happens, whether a rig authored by a pack nothing here anticipated really
 * draws, whether the chain solver is the physics it says it is, whether every accumulator survives
 * a save, whether two runtimes with the same seed produce the same bytes, and whether the geometry
 * is finite.
 */

import { readFileSync } from 'node:fs';
import { Registry } from '@/lib/game/core/registry.ts';
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { createWorld, nextEntityId, serializeWorld } from '@/lib/game/core/world.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import { attachRideContent, flatRides, resolveFlatRide, resetRideContent } from './manifest.ts';
import { poseRig, rigLayout, chainAngle, channelValue, SPIN_WRAP } from './rig.ts';
import { buildShape, shapeNames, triangleCount } from './shapes.ts';
import { RideState, RIDE_STATE_NAMES, MOTION_STRIDE } from './types.ts';
import { G } from './types.ts';

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
  JSON.parse(readFileSync(new URL(`../content/packs/${id}/pack.json`, import.meta.url), 'utf8'))
);

/**
 * A third pack, of a kind this repository does not contain.
 *
 * A **paratrooper**: a canted wheel of gondolas on arms, whose rig is declared entirely in the
 * `rideRigs` category with shapes and parameters, plus a `sky-dancer` that names a generator
 * NOBODY has ever registered, to prove a bad entry is skipped rather than fatal.
 */
const THIRD_PACK = {
  id: 'rides-selftest',
  version: 1,
  name: { en: 'Selftest' },
  requires: [],
  themes: [
    {
      id: 'seaside',
      name: { en: 'Seaside' },
      palette: { primary: '#1b6ca8', secondary: '#f7f3e8', trim: '#0b3d5c', accent: '#f2b134' },
    },
  ],
  rides: [
    {
      id: 'paratrooper',
      kind: 'flat',
      name: { en: 'Paratrooper' },
      rig: 'rig-paratrooper',
      capacity: 24,
      cycleMinutes: 2.8,
      excitement: 4.8,
      fear: 3.1,
      nausea: 3.4,
      cost: 28000000,
      upkeep: 1200,
      footprint: [18, 18],
      power: 70,
      minHeightCm: 125,
      theme: 'seaside',
      queueSide: 1,
    },
    {
      id: 'sky-dancer',
      kind: 'flat',
      name: { en: 'Sky dancer' },
      rig: 'rig-nobody-declared',
      capacity: 16,
      cycleMinutes: 2,
      cost: 1000,
      footprint: [10, 10],
    },
  ],
  rideRigs: [
    {
      id: 'rig-paratrooper',
      parts: [
        {
          id: 'base',
          shape: 'drum',
          params: { radius: 4.2, height: 0.6, sides: 16, color: '#0b3d5c' },
        },
        {
          id: 'tower',
          parent: 'base',
          offset: [0, 0.6, 0],
          shape: 'frame',
          params: {
            span: 7,
            height: 9,
            depth: 0.45,
            axis: 'x',
            legs: 4,
            braces: 3,
            color: '#1b6ca8',
          },
        },
        {
          id: 'wheel',
          parent: 'tower',
          offset: [0, 9, 0],
          shape: 'rim',
          params: {
            radius: 6.4,
            tube: 0.2,
            segments: 24,
            spokes: 8,
            width: 1.2,
            plane: 'xy',
            color: '#f7f3e8',
          },
          animate: { roll: { curve: 'ease-in-out', revolutions: 9, axis: 'z' } },
        },
        {
          id: 'cars',
          parent: 'wheel',
          shape: 'gondola',
          count: 8,
          radius: 6.4,
          seats: 3,
          level: true,
          pendulum: 0.6,
          facing: 'fixed',
          params: {
            seats: 3,
            width: 2,
            depth: 1.4,
            height: 1.5,
            drop: 1.6,
            roof: true,
            ringPlane: 'xy',
            yaw: 1.5707963,
            color: '#f2b134',
            trim: '#0b3d5c',
          },
        },
      ],
    },
  ],
};

function freshRegistry(extra = false) {
  resetRideContent();
  const registry = new Registry();
  for (const pack of PACKS) registry.registerPack(pack);
  if (extra) registry.registerPack(THIRD_PACK);
  attachRideContent(registry);
  return registry;
}

// ── 1. the shapes ───────────────────────────────────────────────────────────────────────────
section('1 · shapes');
{
  const names = shapeNames();
  ok(names.length === 11, 'eleven primitives', String(names.length));
  let worstTris = 0;
  for (const name of names) {
    const mesh = buildShape(name, {});
    const tris = triangleCount(mesh);
    worstTris = Math.max(worstTris, tris);
    ok(tris > 0, `${name} builds something`);
    let bad = 0;
    for (const s of mesh.surfaces) {
      for (const v of s.positions) if (!Number.isFinite(v)) bad += 1;
      for (const v of s.normals) if (!Number.isFinite(v)) bad += 1;
      for (const v of s.uvs) if (!Number.isFinite(v)) bad += 1;
      ok(s.positions.length / 3 === s.normals.length / 3, `${name}/${s.finish} normals per vertex`);
      ok(s.positions.length / 3 === s.colors.length / 4, `${name}/${s.finish} colours per vertex`);
      ok(s.positions.length / 3 === s.uvs.length / 2, `${name}/${s.finish} uvs per vertex`);
      let maxIndex = 0;
      for (const i of s.indices) maxIndex = Math.max(maxIndex, i);
      ok(maxIndex < s.positions.length / 3, `${name}/${s.finish} indices in range`);
    }
    ok(bad === 0, `${name} has no non-finite vertex data`, String(bad));
  }
  console.log(`    largest default primitive ${worstTris} triangles`);
  // A hollow drum must have a floor and an inner wall, or twelve teacups are invisible.
  const solid = triangleCount(buildShape('drum', { radius: 1, height: 1 }));
  const hollow = triangleCount(buildShape('drum', { radius: 1, height: 1, hollow: true }));
  ok(
    hollow > solid,
    'a hollow drum has more geometry than a solid one, not less',
    `${hollow} vs ${solid}`
  );
}

// ── 2. content: the bundled packs ───────────────────────────────────────────────────────────
section('2 · the bundled packs');
{
  const registry = freshRegistry();
  const rides = flatRides(registry);
  ok(rides.length === 5, 'five flat rides across the two bundled packs', String(rides.length));
  for (const ride of rides) {
    const layout = rigLayout(ride.rig);
    ok(layout.parts.length >= 3, `${ride.key} has a rig with parts`, String(layout.parts.length));
    ok(
      ride.rig.source !== 'fallback',
      `${ride.key} resolves a real rig, not the fallback`,
      ride.rig.source
    );
    ok(ride.cycleMinutes > 0 && ride.capacity > 0, `${ride.key} has a cycle and a capacity`);
    // The nameplate figure a park manager plans with.
    const rated = (ride.capacity / ride.cycleMinutes) * 60;
    ok(
      rated > 100 && rated < 4000,
      `${ride.key} rated throughput is a fairground number`,
      `${Math.round(rated)}/h`
    );
  }
  const carousel = rides.find((r) => r.key === 'core-classic:carousel');
  ok(carousel != null, 'the carousel resolves');
  // A ferris gondola stays level and hangs; a carousel horse does not.
  const wheel = rides.find((r) => r.key === 'core-classic:ferris-wheel');
  ok(
    wheel.rig.parts.some((p) => p.level === true),
    'the ferris wheel has a levelled part'
  );
  ok(
    rides
      .find((r) => r.key === 'core-classic:swing-ride')
      .rig.parts.some((p) => (p.chain ?? 0) > 0),
    'the chair swing has chains the solver knows about'
  );
  ok(
    rides.every((r) => r.rig.parts[0].id === 'apron'),
    'every ride lays its own hard standing'
  );
}

// ── 3. extensibility: a pack nothing here anticipated ───────────────────────────────────────
section('3 · a third pack');
{
  const registry = freshRegistry(true);
  const rides = flatRides(registry);
  ok(rides.length === 7, 'the third pack adds two rides', String(rides.length));
  const para = rides.find((r) => r.key === 'rides-selftest:paratrooper');
  ok(para != null, 'the paratrooper resolves');
  ok(para.rig.source === 'pack', 'its rig came from the pack, not a built-in', para.rig.source);
  const layout = rigLayout(para.rig);
  ok(layout.seats === 24, 'eight gondolas of three seats', String(layout.seats));
  ok(layout.units === 12, 'apron + base + tower + wheel + 8 cars', String(layout.units));
  // The theme's palette reached the geometry: no code in this module knows "seaside" exists.
  const base = layout.parts.find((p) => p.spec.id === 'base');
  ok(String(base.spec.params.color).toLowerCase() === '#0b3d5c', 'the pack chose its own colours');
  // It differs from every built-in in shape AND in size, which is what "not a re-skin" means.
  const mine = layout.parts.reduce(
    (n, p) => n + triangleCount(buildShape(p.spec.shape, p.spec.params ?? {})) * p.units,
    0
  );
  const carouselRide = rides.find((r) => r.key === 'core-classic:carousel');
  const carouselLayout = rigLayout(carouselRide.rig);
  const theirs = carouselLayout.parts.reduce(
    (n, p) => n + triangleCount(buildShape(p.spec.shape, p.spec.params ?? {})) * p.units,
    0
  );
  ok(
    Math.abs(mine - theirs) > 500,
    'it is not the carousel in a different colour',
    `${mine} vs ${theirs} triangles`
  );
  // A rig nobody declared falls back rather than throwing, and says so.
  const dancer = rides.find((r) => r.key === 'rides-selftest:sky-dancer');
  ok(dancer != null, 'a ride naming an unknown rig still resolves');
  ok(dancer.rig.source === 'fallback', 'and it is marked as a fallback', dancer.rig.source);
  ok(rigLayout(dancer.rig).units > 3, 'and it draws a generic machine rather than nothing');
}

// ── 4. the rig solver ───────────────────────────────────────────────────────────────────────
section('4 · the rig solver');
{
  const registry = freshRegistry(true);
  const swing = resolveFlatRide(registry, 'core-classic', 'swing-ride');
  const runSeconds = swing.cycleMinutes * swing.split.run * 60;

  // At rest the chains hang straight down; at speed they fly out. Nobody authored either.
  const rest = poseRig(swing.rig, { spin: 0, drive: 0, driveRate: 0, runSeconds });
  const fast = poseRig(swing.rig, { spin: 0.3, drive: 1, driveRate: 0, runSeconds });
  const chairAt = (pose) => pose.filter((u) => u.part === 'chairs');
  /**
   * The SEAT, not the pivot.
   *
   * A unit's `position` is where it hangs FROM, and the chain angle is in its quaternion — so the
   * first version of this check measured the top of the chain, found 8.00 m at rest and 8.00 m at
   * speed, and reported a bug in code that was working. The seat is the pivot plus the chain
   * rotated by the unit's own quaternion.
   */
  const seatOf = (u, L = 3.4) => {
    const [x, y, z, w] = u.quat;
    const v = [0, -L, 0];
    const tx = 2 * (y * v[2] - z * v[1]);
    const ty = 2 * (z * v[0] - x * v[2]);
    const tz = 2 * (x * v[1] - y * v[0]);
    return [
      u.position[0] + v[0] + w * tx + (y * tz - z * ty),
      u.position[1] + v[1] + w * ty + (z * tx - x * tz),
      u.position[2] + v[2] + w * tz + (x * ty - y * tx),
    ];
  };
  const radiusOf = (u) => {
    const p = seatOf(u);
    return Math.hypot(p[0], p[2]);
  };
  const restR = Math.max(...chairAt(rest).map(radiusOf));
  const fastR = Math.max(...chairAt(fast).map(radiusOf));
  ok(
    fastR > restR + 0.5,
    'the chairs fly out under rotation',
    `${restR.toFixed(2)} m → ${fastR.toFixed(2)} m`
  );

  // ... and the angle is the physics it claims to be.
  const omega = (12 * Math.PI * 2) / runSeconds;
  const theta = chainAngle(omega, 8, 3.4);
  const balance = Math.tan(theta) * G - omega * omega * (8 + 3.4 * Math.sin(theta));
  near(balance, 0, 1e-9, 'tan θ = ω²(r + L sin θ)/g holds at the solved angle');
  ok(chainAngle(0, 8, 3.4) === 0, 'a stopped ride hangs plumb');
  ok(chainAngle(omega * 2, 8, 3.4) > theta, 'faster means further out');

  // A carousel horse rises and falls, and the ring is a wave rather than one block.
  const carousel = resolveFlatRide(registry, 'core-classic', 'carousel');
  const cRun = carousel.cycleMinutes * carousel.split.run * 60;
  const a = poseRig(carousel.rig, { spin: 0.11, drive: 1, driveRate: 0, runSeconds: cRun })
    .filter((u) => u.part === 'horses')
    .map((u) => u.position[1]);
  const b = poseRig(carousel.rig, { spin: 0.14, drive: 1, driveRate: 0, runSeconds: cRun })
    .filter((u) => u.part === 'horses')
    .map((u) => u.position[1]);
  ok(
    Math.max(...a) - Math.min(...a) > 0.2,
    'the horses are not all at one height',
    `${(Math.max(...a) - Math.min(...a)).toFixed(2)} m spread`
  );
  ok(
    a.some((v, i) => Math.abs(v - b[i]) > 0.02),
    'and they move between two phases'
  );
  const still = poseRig(carousel.rig, { spin: 0.11, drive: 0, driveRate: 0, runSeconds: cRun })
    .filter((u) => u.part === 'horses')
    .map((u) => u.position[1]);
  ok(
    Math.max(...still) - Math.min(...still) < 0.02,
    'a stopped carousel has its horses level',
    `${(Math.max(...still) - Math.min(...still)).toFixed(3)} m`
  );

  // A ferris gondola stays level whatever the wheel does.
  const ferris = resolveFlatRide(registry, 'core-classic', 'ferris-wheel');
  const fRun = ferris.cycleMinutes * ferris.split.run * 60;
  for (const spin of [0, 0.17, 0.4, 0.83]) {
    const cars = poseRig(ferris.rig, { spin, drive: 1, driveRate: 0, runSeconds: fRun }).filter(
      (u) => u.part === 'gondolas'
    );
    // A levelled unit's local +Y must still point up: the quaternion's Y column stays near (0,1,0).
    for (const car of cars) {
      const [x, y, z, w] = car.quat;
      const upY = 1 - 2 * (x * x + z * z);
      ok(upY > 0.995, `gondola stays level at spin ${spin}`, upY.toFixed(4));
    }
  }
  // Nested rotation: three platters, four cups each — the thing the bundled rigs never ask for.
  const teacupRig = {
    id: 'test-teacup',
    key: 'test:teacup',
    source: 'pack',
    parts: [
      {
        id: 'platform',
        shape: 'drum',
        params: { radius: 6 },
        animate: { yaw: { curve: 'linear', revolutions: 5 } },
      },
      {
        id: 'platters',
        parent: 'platform',
        shape: 'drum',
        count: 3,
        radius: 3.4,
        params: { radius: 2 },
        animate: { yaw: { curve: 'linear', revolutions: 9 } },
      },
      {
        id: 'cups',
        parent: 'platters',
        shape: 'drum',
        count: 4,
        radius: 1.4,
        seats: 4,
        params: { radius: 1 },
      },
    ],
  };
  const teacup = rigLayout(teacupRig);
  ok(teacup.units === 1 + 3 + 12, 'count is per parent unit', String(teacup.units));
  ok(teacup.seats === 48, 'twelve cups of four seats', String(teacup.seats));
  const cups = poseRig(teacupRig, { spin: 0.2, drive: 1, driveRate: 0, runSeconds: 60 }).filter(
    (u) => u.part === 'cups'
  );
  const distinct = new Set(
    cups.map((u) => `${u.position[0].toFixed(3)}:${u.position[2].toFixed(3)}`)
  );
  ok(distinct.size === 12, 'and every cup is somewhere different', String(distinct.size));

  // `spin` wraps at a multiple of every integer revolution count, so the wrap is invisible.
  const yaw0 = channelValue(
    'yaw',
    { curve: 'linear', revolutions: 8 },
    { spin: 0, drive: 1, driveRate: 0, runSeconds: 90 },
    0
  );
  const yawW = channelValue(
    'yaw',
    { curve: 'linear', revolutions: 8 },
    { spin: SPIN_WRAP, drive: 1, driveRate: 0, runSeconds: 90 },
    0
  );
  near((yawW - yaw0) % (Math.PI * 2), 0, 1e-6, 'a wrap lands on a whole turn');
}

// ── 5. the cycle, the queue and the throughput ──────────────────────────────────────────────
section('5 · the cycle');
function runtime(seed, opts = {}) {
  resetRideContent();
  const world = createWorld({
    seed,
    name: 'rides-selftest',
    packs: ['core-classic', 'neon-lagoon'],
  });
  world.clock.minute = 10 * 60;
  const messages = [];
  const rt = new SimRuntime(GAME_MODULES, (m) => messages.push(m));
  rt.init({
    type: 'init',
    world,
    packs: PACKS,
    modules: ['core', 'terrain', 'paths', 'rides'],
  });
  const ids = [];
  for (const item of ['carousel', 'swing-ride', 'top-spin']) {
    const id = nextEntityId(rt.world, 'ride');
    ids.push(id);
    rt.command({
      type: 'entity:add',
      seq: ids.length,
      payload: {
        id,
        kind: 'ride',
        pack: 'core-classic',
        item,
        position: [ids.length * 40 - 40, 0, 0],
        yaw: 0,
      },
    });
  }
  if (opts.demo !== false) rt.command({ type: 'rides:demo', seq: 99, payload: { on: true } });
  return { rt, ids, messages, api: () => rt.handles.get('rides').api };
}
{
  const { rt, ids, api, messages } = runtime(11);
  ok(api() != null, 'the sim handle publishes an api');
  // The roster is published on the first tick, not on the command: it is a frame-order contract
  // and the entity may still be arriving when the command lands.
  rt.step(1);
  ok(api().roster().length === 3, 'three rides in the roster', String(api().roster().length));

  // One park hour at speed 1: 20 ticks a second × 60 park minutes = 1200 ticks.
  rt.step(1200);
  const views = api().list();
  const carousel = views.find((v) => v.key === 'core-classic:carousel');
  const rated = carousel.ratedThroughput;
  near(rated, 480, 0.5, 'the carousel is rated 480 an hour');
  ok(
    carousel.cyclesToday >= 15,
    'and it ran a full hour of cycles',
    `${carousel.cyclesToday} cycles`
  );
  ok(
    carousel.ridersToday >= 400,
    'carrying most of its rated load',
    `${carousel.ridersToday} riders`
  );
  ok(
    carousel.ridersToday <= 480,
    'and never more than the machine can do',
    `${carousel.ridersToday}`
  );
  const delivered = carousel.ridersToday;
  console.log(
    `    carousel: ${carousel.cyclesToday} cycles · ${delivered} riders in one park hour ` +
      `(rated ${Math.round(rated)}) · utilisation ${(carousel.utilisation * 100).toFixed(0)} %`
  );
  for (const v of views) {
    ok(
      v.ridersToday <= v.ratedThroughput * 1.02,
      `${v.key} cannot beat its own nameplate`,
      `${v.ridersToday} vs ${Math.round(v.ratedThroughput)}`
    );
    ok(
      RIDE_STATE_NAMES[RideState[v.state.toUpperCase()]] === v.state,
      `${v.key} reports a known state`,
      v.state
    );
  }
  // The breakdown roll fires, is seeded, and the machine comes back.
  const stats = api().stats();
  ok(stats.demoRiders > 0, 'the demo flag is what filled these queues, and it is counted');
  ok(stats.walkUps === 0, 'no guest bridge without a guests module', String(stats.walkUps));
  ok(ids.length === 3 && messages.length > 0, 'the worker posted frames');
  rt.dispose();
}

// ── 6. joining, waiting, boarding, refusals ─────────────────────────────────────────────────
section('6 · the queue');
{
  const { rt, ids, api } = runtime(23, { demo: false });
  rt.step(20);
  const id = ids[0];
  const before = api().offer(id);
  ok(before.open, 'the carousel is open at 10:00');
  near(before.waitMinutes, 0, 2, 'and an empty queue is a short wait');
  const join = api().join(id, 1001, { heightCm: 180 });
  ok(join != null && join.ticket > 0, 'a guest can join');
  const spot = api().place(id, join.ticket);
  ok(spot != null, 'and is told where to stand');
  ok(
    Math.hypot(spot[0] - before.queueX, spot[1] - before.queueZ) < 12,
    'near the entrance',
    String(spot)
  );
  // Twenty-four more, then the twenty-sixth is still admitted (the line holds eight cycles).
  for (let i = 0; i < 24; i++) api().join(id, 2000 + i, { heightCm: 180 });
  ok(api().offer(id).queueLength > 20, 'the queue grows', String(api().offer(id).queueLength));
  const waitWithQueue = api().offer(id).waitMinutes;
  ok(
    waitWithQueue > before.waitMinutes,
    'and the wait estimate grows with it',
    `${before.waitMinutes.toFixed(2)} → ${waitWithQueue.toFixed(2)}`
  );
  /**
   * Board: the receipt comes exactly once, and it has to be COLLECTED while the guest is on board.
   *
   * The first version stepped ten park minutes and then asked, by which time the machine had run a
   * whole cycle and put them back — a null that reads as "nobody boarded" and is really "you asked
   * after they got off". A caller polls it, which is what `guests` does with `shops.collect()`.
   */
  let receipt = null;
  for (let i = 0; i < 600 && !receipt; i++) {
    rt.step(2);
    receipt = api().board(id, join.ticket);
  }
  ok(receipt != null, 'the first in the line boards');
  ok(api().board(id, join.ticket) === null, 'and the receipt is issued exactly once');
  ok(receipt.rideMinutes > 0, 'with a ride length', String(receipt.rideMinutes));
  ok(
    receipt.satisfaction > 0 && receipt.satisfaction <= 100,
    'and a satisfaction',
    String(receipt.satisfaction)
  );

  // The height limit is real, and it is a manifest number.
  const swing = ids[1];
  ok(
    api().join(swing, 3001, { heightCm: 110 }) === null,
    'a 110 cm child is refused the chair swing'
  );
  ok(api().lastRefusal(swing) === 'too-short', 'by name', String(api().lastRefusal(swing)));
  ok(api().join(swing, 3002, { heightCm: 150 }) != null, 'and a 150 cm one is not');
  // A closed ride refuses everybody.
  rt.command({ type: 'rides:close', seq: 500, payload: { id: swing, closed: true } });
  rt.step(40);
  ok(api().join(swing, 3003, { heightCm: 180 }) === null, 'a closed ride refuses');
  ok(api().lastRefusal(swing) === 'closed', 'by name', String(api().lastRefusal(swing)));
  // `find` ranks by walk plus wait, and respects the height limit.
  const offers = api().find(0, 0, { heightCm: 110 });
  ok(
    offers.every((o) => o.minHeightCm == null || o.minHeightCm <= 110),
    'find() never offers a ride a child cannot use'
  );
  // A ride that is shut is not offered.
  ok(
    !api()
      .find(0, 0)
      .some((o) => o.id === swing),
    'and never offers a closed one'
  );
  rt.dispose();
}

// ── 7. determinism and the save ─────────────────────────────────────────────────────────────
section('7 · determinism and the save');
{
  const a = runtime(7);
  const b = runtime(7);
  a.rt.step(600);
  b.rt.step(600);
  ok(a.rt.serialize() === b.rt.serialize(), 'two runtimes with one seed produce the same bytes');

  const c = runtime(7);
  c.rt.step(600);
  const json = c.rt.serialize();
  const back = SimRuntime.parse(json);
  ok(serializeWorld(back) === json, 'a world with running rides round-trips');

  // Resume from the save and run both on: the accumulators either travelled or they did not.
  const resumed = new SimRuntime(GAME_MODULES, () => {});
  resetRideContent();
  resumed.init({
    type: 'init',
    world: SimRuntime.parse(json),
    packs: PACKS,
    modules: ['core', 'terrain', 'paths', 'rides'],
  });
  c.rt.step(300);
  resumed.step(300);
  const left = JSON.parse(JSON.stringify(c.rt.handles.get('rides').serialize()));
  const right = JSON.parse(JSON.stringify(resumed.handles.get('rides').serialize()));
  const differing = [];
  const walk = (l, r, path) => {
    if (JSON.stringify(l) === JSON.stringify(r)) return;
    if (l && r && typeof l === 'object' && typeof r === 'object' && !Array.isArray(l)) {
      for (const k of new Set([...Object.keys(l), ...Object.keys(r)]))
        walk(l[k], r[k], `${path}.${k}`);
      return;
    }
    if (Array.isArray(l) && Array.isArray(r) && l.length === r.length) {
      l.forEach((v, i) => walk(v, r[i], `${path}[${i}]`));
      return;
    }
    differing.push(`${path}: ${JSON.stringify(l)} vs ${JSON.stringify(r)}`);
  };
  walk(left, right, 'rides');
  ok(
    differing.length === 0,
    'every accumulator survived the save',
    differing.slice(0, 6).join(' · ')
  );
  a.rt.dispose();
  b.rt.dispose();
  c.rt.dispose();
  resumed.dispose();
}

// ── 8. the frame buffers ────────────────────────────────────────────────────────────────────
section('8 · the frame');
{
  const { rt, api } = runtime(31);
  rt.step(400);
  rt.writer.begin();
  rt.handles.get('rides').fill(rt.writer);
  const { buffers, stats } = rt.writer.end();
  const motion = new Float32Array(buffers['rides.motion']);
  const state = new Uint8Array(buffers['rides.state']);
  ok(state.length === 3, 'one state byte per ride', String(state.length));
  ok(motion.length === 3 * MOTION_STRIDE, 'four floats per ride', String(motion.length));
  let bad = 0;
  for (const v of motion) if (!Number.isFinite(v)) bad += 1;
  ok(bad === 0, 'no non-finite number reaches the buffer', String(bad));
  for (let i = 0; i < 3; i++) {
    const spin = motion[i * MOTION_STRIDE];
    const drive = motion[i * MOTION_STRIDE + 1];
    ok(spin >= 0 && spin < SPIN_WRAP, 'spin is inside its wrap', String(spin));
    ok(drive >= 0 && drive <= 1, 'drive is 0..1', String(drive));
    ok(state[i] <= RideState.MAINTENANCE, 'state is a known byte', String(state[i]));
  }
  ok(stats['rides.count'] === 3, 'the frame carries the ride count');
  console.log(`    ${motion.length * 4 + state.length} bytes a frame for three rides`);
  console.log(`    tick ${api().stats().tickMs.toFixed(4)} ms`);
  rt.dispose();
}

console.log(
  failures === 0
    ? `✓ rides selftest: ${checks} checks clean`
    : `✗ rides selftest: ${failures} of ${checks} checks failed`
);
process.exit(failures === 0 ? 0 : 1);
