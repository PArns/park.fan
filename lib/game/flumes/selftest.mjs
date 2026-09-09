/**
 * Everything about this module a screenshot cannot show.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/flumes/selftest.mjs
 *
 * A `.mjs` next to the code rather than a `scripts/test-game-*.mjs`, for the reason `paths`,
 * `track`, `pools`, `rides` and six others give: these checks are about this module's internals and
 * a builder may not edit `package.json`. The line to add is in `docs/game/requests/flumes.md` §1.
 *
 * Nine things are worth testing here and not one of them is visible in a still frame:
 *
 *  1. **The cross-section is continuous.** A flat-floored raft trough and its wall meet with a
 *     common tangent or there is a crease down the middle of every slide in the park.
 *  2. **The wall answers the SPEED**, which is the claim the whole module rests on: the same 9 m
 *     hook taken at 6 m/s and at 12 m/s must be walled differently, on the outside only, and by the
 *     amount `θ = atan(v²/(gR))` predicts rather than by a fudge factor.
 *  3. **Winding.** In this scene a front face's `cross(v1−v0, v2−v0)` points AWAY from the visible
 *     side. Getting it backwards throws nothing and warns about nothing — the trough is in the
 *     scene with the right vertex count and is invisible. It cost the pools module its first
 *     render (4,300 deck triangles facing the ground).
 *  4. **The descents work as rides**: they do not stall, they reach a plausible speed, and their
 *     run-out ends within a metre of the ground the tower stands on. That last one is what puts the
 *     splashdown basin under the exit rather than four metres below it or above it.
 *  5. **Extensibility**, both halves: a pack registered BEFORE `attachFlumeContent` and one
 *     registered AFTER must both land — a listener alone misses the bundled packs and a boot-time
 *     walk alone misses everything a scenario adds later. And a FIFTH slide style, of a kind this
 *     repository does not contain, must build with no code change.
 *  6. **Determinism.** The same entity builds byte-identical geometry, and the module draws from no
 *     random stream at all.
 *  7. **The save round-trips** byte for byte on a world that has been RUN, not a fresh one.
 *  8. **No NaN.** One in a position is a mesh nobody can see; one in a save is a park nobody can
 *     load, and `serializeWorld` throws on it.
 *  9. **The budget.** Triangles per slide and the whole park's total, printed, because a claim
 *     about cost with no number beside it is the failure this project's critics look for first.
 */

import { readFileSync } from 'node:fs';
import { Registry } from '@/lib/game/core/registry.ts';
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { deserializeWorld } from '@/lib/game/core/world.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import {
  attachFlumeContent,
  flumeLayout,
  flumeLayouts,
  flumeStyle,
  flumeStyles,
  flumeTowers,
  resetFlumeContent,
} from './manifest.ts';
import { buildFlume, resolveFlume, riderSpec, ridersPerHour } from './resolve.ts';
import {
  buildRig,
  buildShell,
  buildTower,
  buildWaterSheet,
  quaternionOf,
  riderPose,
  sectionNormal,
  sectionPoint,
  triangleCount,
  wallExtents,
} from './geom.ts';
import { makeFlumeEntity } from './entity.ts';
import { SLIDE_SECONDS_PER_TICK } from './types.ts';

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
const G = 9.80665;

const PACKS = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(readFileSync(new URL(`../content/packs/${id}/pack.json`, import.meta.url), 'utf8'))
);

/**
 * A slide of a kind this repository does not contain: a wide open racing lane with a low kerb, a
 * flat floor, four abreast, on a timber tower. Nothing in `lib/game/flumes/` knows any of these
 * ids, and if any of it needed a code change the extensibility axis is failed.
 */
const LATE_PACK = {
  id: 'flumes-selftest-late',
  version: 1,
  name: { en: 'Selftest, late' },
  requires: [],
  flumes: {
    styles: [
      {
        id: 'torrent',
        name: { en: 'Torrent racer' },
        wrapDeg: 64,
        maxWrapDeg: 118,
        wallResponse: 0.9,
        floorFlat: 0.6,
        thickness: 0.06,
        sectionSamples: 7,
        waterDepth: 0.05,
        waterWrap: 0.85,
        friction: 0.1,
        dragArea: 0.5,
        vehicleMass: 4,
        riderMass: 71,
        dispatchSeconds: 7,
        entrySpeed: 1.8,
        bankFactor: 0.3,
        rig: {
          hull: 'mat',
          hullRadius: 0.55,
          hullTube: 0.08,
          seats: 1,
          riderRadius: 0.22,
          seatSpread: 0,
          colors: ['#ff6b35'],
          wear: ['#0f2a3a'],
        },
        shell: '#f6f1e8',
        trim: '#ff6b35',
      },
      // Deliberately broken: a wrap of 400 degrees. It must be named and skipped, not fatal.
      { id: 'broken', wrapDeg: 400 },
    ],
    layouts: [
      {
        id: 'torrent-lane',
        name: { en: 'Torrent lane' },
        style: 'torrent',
        tower: 'lagoon-timber',
        pieces: [
          { element: 'launch', params: { length: 5, speed: 5 } },
          { element: 'drop', params: { height: 6, angle: 42, crestRadius: 8, pullout: 14 } },
          { element: 'drop', params: { height: 3, angle: 22, crestRadius: 16, pullout: 20 } },
          { element: 'straight', params: { length: 10 } },
        ],
      },
    ],
  },
};

/** The same idea from the other side: registered BEFORE `attachFlumeContent` runs. */
const EARLY_PACK = {
  id: 'flumes-selftest-early',
  version: 1,
  name: { en: 'Selftest, early' },
  requires: [],
  flumes: {
    towers: [
      {
        id: 'concrete-core',
        name: { en: 'Concrete core' },
        footprint: [5.5, 5.5],
        column: 0.5,
        canopy: false,
        steel: '#b6b1a6',
        deck: '#8d8880',
        canopyColor: '#ffffff',
      },
    ],
  },
};

// ── 1. the cross-section ─────────────────────────────────────────────────────────────────────
section('\nCross-section');
{
  const R = 1.2;
  const flat = 0.55;
  const phi = 1.6;
  const atFlat = sectionPoint(flat, R, phi, phi, flat);
  const justPast = sectionPoint(flat + 1e-6, R, phi, phi, flat);
  near(atFlat.x, R * flat, 1e-6, 'the flat floor ends at R·floorFlat');
  near(atFlat.y, 0, 1e-9, 'and it is level');
  near(justPast.x, atFlat.x, 1e-4, 'the wall starts where the floor stops (x)');
  near(justPast.y, atFlat.y, 1e-4, 'the wall starts where the floor stops (y)');

  // The arc's tangent at its start is horizontal, so the floor and the wall meet smoothly.
  const a = sectionPoint(flat + 0.02, R, phi, phi, flat);
  const b = sectionPoint(flat + 0.04, R, phi, phi, flat);
  const slope = (b.y - a.y) / (b.x - a.x);
  ok(Math.abs(slope) < 0.2, 'floor → wall is tangent-continuous', `slope ${slope.toFixed(4)}`);

  // A half-pipe with no flat: the lip of a 104° wall is where the circle says it is.
  const lipPhi = (104 * Math.PI) / 180;
  const lip = sectionPoint(1, 0.5, lipPhi, lipPhi, 0);
  near(lip.y, 0.5 * (1 - Math.cos(lipPhi)), 1e-9, 'a 104° wall is 0.62 m high on a 0.5 m trough');
  near(lip.x, 0.5 * Math.sin(lipPhi), 1e-9, 'and 0.485 m out');

  const n = sectionNormal(0, phi, phi, 0);
  near(n.y, -1, 1e-9, 'the floor faces down on its outside');
  ok(Math.hypot(n.x, n.y) > 0.999, 'section normals are unit length');
}

// ── 2. the wall answers the speed ────────────────────────────────────────────────────────────
section('\nThe wall rule');
{
  const style = { wrap: (62 * Math.PI) / 180, maxWrap: (168 * Math.PI) / 180, wallResponse: 1 };
  const up = [0, 1, 0];
  const right = [1, 0, 0];
  const level = wallExtents({ force: [0, G, 0], up, right, radius: 0.5, riderRadius: 0.25, style });
  near(level.left, style.wrap, 1e-9, 'level and straight: both walls at rest');
  near(level.right, style.wrap, 1e-9, 'both of them');
  near(level.climb, 0, 1e-9, 'and nobody climbs anything');

  // A right-hand turn: κ points to the rider's right, so the resultant does too.
  const R = 9;
  const forceAt = (v) => [(v * v) / R, G, 0];
  const slow = wallExtents({ force: forceAt(6), up, right, radius: 0.5, riderRadius: 0.25, style });
  const fast = wallExtents({
    force: forceAt(12),
    up,
    right,
    radius: 0.5,
    riderRadius: 0.25,
    style,
  });
  near(slow.climb, Math.atan((6 * 6) / (R * G)), 1e-9, 'climb at 6 m/s is atan(v²/gR)');
  near(fast.climb, Math.atan((12 * 12) / (R * G)), 1e-9, 'climb at 12 m/s likewise');
  ok(fast.climb > slow.climb, 'faster throws the rider higher', `${(fast.climb * 57.3).toFixed(1)}° vs ${(slow.climb * 57.3).toFixed(1)}°`); // prettier-ignore
  ok(fast.right > slow.right, 'so the outer wall is taller at speed', `${(fast.right * 57.3).toFixed(1)}° vs ${(slow.right * 57.3).toFixed(1)}°`); // prettier-ignore
  near(slow.left, style.wrap, 1e-9, 'the INNER wall never grows (slow)');
  near(fast.left, style.wrap, 1e-9, 'the inner wall never grows (fast)');
  ok(fast.right <= style.maxWrap + 1e-9, 'and it is capped at maxWrap');

  // Wall height in metres, which is the number a person would check against a photograph.
  const wallM = (phi, r) => r * (1 - Math.cos(phi));
  const h6 = wallM(slow.right, 0.5);
  const h12 = wallM(fast.right, 0.5);
  console.log(`  9 m hook, 0.5 m trough: wall ${(h6 * 100).toFixed(0)} cm at 6 m/s, ${(h12 * 100).toFixed(0)} cm at 12 m/s`); // prettier-ignore
  ok(h12 > h6 + 0.05, 'a real difference and not a rounding one', `${((h12 - h6) * 100).toFixed(1)} cm`); // prettier-ignore

  // A closed pipe declares `wallResponse: 0` and must not change section at all.
  const pipe = { wrap: (170 * Math.PI) / 180, maxWrap: (170 * Math.PI) / 180, wallResponse: 0 };
  const pipeFast = wallExtents({ force: forceAt(14), up, right, radius: 0.6, riderRadius: 0.25, style: pipe }); // prettier-ignore
  near(pipeFast.right, pipe.wrap, 1e-9, 'a closed pipe keeps its section by DATA, not by a branch');

  // Left-hand turn: the other wall grows and only the other wall.
  const leftTurn = wallExtents({ force: [-(12 * 12) / R, G, 0], up, right, radius: 0.5, riderRadius: 0.25, style }); // prettier-ignore
  ok(leftTurn.left > leftTurn.right, 'a left turn walls the left side');
  near(leftTurn.left, fast.right, 1e-9, 'by the same amount, mirrored');
}

// ── 3. content ───────────────────────────────────────────────────────────────────────────────
section('\nContent');
{
  resetFlumeContent();
  const registry = new Registry();
  for (const pack of PACKS) registry.registerPack(pack);
  registry.registerPack(EARLY_PACK);
  const detach = attachFlumeContent(registry);
  ok(flumeStyles().length >= 4, 'the built-in styles registered', `${flumeStyles().length}`);
  ok(
    !!flumeTowers().find((t) => t.id === 'concrete-core'),
    'a pack registered BEFORE attach lands'
  );

  registry.registerPack(LATE_PACK);
  ok(!!flumeStyle('torrent'), 'a pack registered AFTER attach lands too');
  ok(!flumeStyles().find((s) => s.id === 'broken'), 'and its broken entry was skipped, not fatal');
  ok(!!flumeLayout('torrent-lane'), 'with its layout');
  ok(flumeLayout('torrent-lane').style === 'torrent', 'pointing at the style it declared');
  ok(flumeStyle('mat').id === 'mat', '`mat` ships with no pack ride and is still buildable');
  detach();
}

// ── 4. the descents ──────────────────────────────────────────────────────────────────────────
section('\nDescents');
const registry = new Registry();
{
  resetFlumeContent();
  for (const pack of PACKS) registry.registerPack(pack);
  registry.registerPack(LATE_PACK);
  attachFlumeContent(registry);
}

const RIDES = [
  { pack: 'neon-lagoon', item: 'body-slide', layout: 'plunge-drop' },
  { pack: 'neon-lagoon', item: 'tube-slide', layout: 'spiral-tower' },
  { pack: 'neon-lagoon', item: 'raft-slide', layout: 'family-bowl' },
  { pack: 'neon-lagoon', item: 'body-slide', layout: 'mat-straight' },
  { pack: 'neon-lagoon', item: 'body-slide', layout: 'torrent-lane' },
];

let parkTriangles = 0;
const measured = [];
for (const spec of RIDES) {
  const entity = makeFlumeEntity({
    id: `flume-${spec.layout}`,
    pack: spec.pack,
    item: spec.item,
    layout: spec.layout,
    x: 0,
    z: 0,
    y: 0,
    yaw: 0,
  });
  const flume = resolveFlume(registry, entity, 0);
  ok(!!flume, `${spec.layout}: resolves`);
  if (!flume) continue;
  const build = buildFlume(flume);
  const shell = buildShell(build.stations, flume.style, flume.radius);
  const sheet = buildWaterSheet(build.stations, flume.style, flume.radius);
  const tower = buildTower({
    spec: flume.tower,
    centre: [0, flume.towerHeight, -flume.tower.footprint[1] / 2],
    yaw: 0,
    ground: 0,
    deckY: flume.towerHeight,
    chuteWidth: flume.radius * 2,
  });
  const tris = triangleCount(shell) + triangleCount(sheet) + tower.triangles;
  parkTriangles += tris;

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let finite = true;
  for (const st of build.stations) {
    minX = Math.min(minX, st.frame.p[0]);
    maxX = Math.max(maxX, st.frame.p[0]);
    minZ = Math.min(minZ, st.frame.p[2]);
    maxZ = Math.max(maxZ, st.frame.p[2]);
  }
  for (const v of shell.positions) if (!Number.isFinite(v)) finite = false;
  for (const v of sheet.positions) if (!Number.isFinite(v)) finite = false;
  for (const v of sheet.colors) if (!Number.isFinite(v)) finite = false;

  const wallSpread = build.stations.reduce((m, st) => Math.max(m, Math.abs(st.phiR - st.phiL)), 0);
  measured.push({
    layout: spec.layout,
    style: flume.style.id,
    length: build.length,
    drop: build.drop,
    top: build.topSpeed,
    seconds: build.rideSeconds,
    exitY: build.exit[1],
    tower: build.flume.towerHeight,
    arrival: build.physics.stations.at(-1).v,
    span: [maxX - minX, maxZ - minZ],
    tris,
    wallSpread,
    hasTurn: flume.layout.pieces.some((p) => /curve|helix|bend|turn/.test(p.element)),
    perHour: ridersPerHour(flume.style),
  });

  ok(finite, `${spec.layout}: every vertex is finite`);
  const arrival = build.physics.stations.at(-1).v;
  ok(build.physics.minSpeed > 0.9, `${spec.layout}: nobody stalls on the way down`, `min ${build.physics.minSpeed.toFixed(2)} m/s`); // prettier-ignore
  ok(arrival > 2, `${spec.layout}: still moving where it meets the water`, `${arrival.toFixed(1)} m/s`); // prettier-ignore
  ok(build.topSpeed > 6 && build.topSpeed < 22, `${spec.layout}: a plausible top speed`, `${build.topSpeed.toFixed(1)} m/s`); // prettier-ignore
  ok(Math.abs(build.exit[1]) < 1.2, `${spec.layout}: the run-out ends at ground level`, `${build.exit[1].toFixed(2)} m`); // prettier-ignore
  ok(build.warnings.length === 0, `${spec.layout}: builds with no warnings`, build.warnings.join('; ')); // prettier-ignore
}

console.log(
  '\n  layout          style    len    drop   top    time  exitY  tower  span (x×z)   Δwall  tris   /h'
);
for (const m of measured) {
  console.log(
    `  ${m.layout.padEnd(15)} ${m.style.padEnd(8)} ${m.length.toFixed(0).padStart(4)}m ${m.drop.toFixed(1).padStart(5)}m ` +
      `${m.top.toFixed(1).padStart(5)} ${m.seconds.toFixed(0).padStart(4)}s ${m.exitY.toFixed(2).padStart(6)} ` +
      `${m.tower.toFixed(1).padStart(5)}m ${m.span[0].toFixed(0).padStart(3)}×${m.span[1].toFixed(0).padStart(3)}m ` +
      `${((m.wallSpread * 180) / Math.PI).toFixed(0).padStart(5)}° ${String(m.tris).padStart(6)} ${String(m.perHour).padStart(4)}`
  );
}
console.log(`  whole showcase: ${parkTriangles} triangles across ${measured.length} slides`);
ok(parkTriangles < 260000, 'the whole showcase fits a sane triangle budget', `${parkTriangles}`);
// Only where there is a turn to answer, and not on a pipe that declares `wallResponse: 0`.
for (const m of measured) {
  if (!m.hasTurn || m.style === 'tube') continue;
  ok(m.wallSpread > 0.12, `${m.layout}: the wall actually moves`, `${((m.wallSpread * 180) / Math.PI).toFixed(1)}°`); // prettier-ignore
}

// ── 5. winding ───────────────────────────────────────────────────────────────────────────────
section('\nWinding');
{
  const entity = makeFlumeEntity({
    id: 'flume-wind',
    pack: 'neon-lagoon',
    item: 'body-slide',
    layout: 'plunge-drop',
    x: 0,
    z: 0,
    y: 0,
  });
  const flume = resolveFlume(registry, entity, 0);
  const build = buildFlume(flume);
  const shell = buildShell(build.stations, flume.style, flume.radius);
  // The first triangle of the first quad of the first station: on the trough floor, where the
  // shading normal points up into the trough.
  const i0 = shell.indices[0];
  const i1 = shell.indices[1];
  const i2 = shell.indices[2];
  const p = (i) => [shell.positions[i * 3], shell.positions[i * 3 + 1], shell.positions[i * 3 + 2]];
  const n0 = [shell.normals[i0 * 3], shell.normals[i0 * 3 + 1], shell.normals[i0 * 3 + 2]];
  const [a, b, c] = [p(i0), p(i1), p(i2)];
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const g = [
    e1[1] * e2[2] - e1[2] * e2[1],
    e1[2] * e2[0] - e1[0] * e2[2],
    e1[0] * e2[1] - e1[1] * e2[0],
  ];
  const dotGN = g[0] * n0[0] + g[1] * n0[1] + g[2] * n0[2];
  ok(dotGN < 0, 'a front face winds AGAINST its shading normal (FRONT_FACE_SIGN = −1)', dotGN.toFixed(6)); // prettier-ignore
  ok(shell.normals.length === shell.positions.length, 'one normal per position');
  ok(shell.uvs.length === (shell.positions.length / 3) * 2, 'one uv per position');
}

// ── 6. the rider is on the wall ──────────────────────────────────────────────────────────────
section('\nRiders');
{
  const entity = makeFlumeEntity({
    id: 'flume-pose',
    pack: 'neon-lagoon',
    item: 'body-slide',
    layout: 'plunge-drop',
    x: 0,
    z: 0,
    y: 0,
  });
  const flume = resolveFlume(registry, entity, 0);
  const build = buildFlume(flume);
  let hardest = build.stations[0];
  for (const st of build.stations) if (st.climb > hardest.climb) hardest = st;
  const pose = riderPose(hardest, flume.radius, flume.style.floorFlat, 0);
  const f = hardest.frame;
  const across =
    (pose.position[0] - f.p[0]) * f.right[0] +
    (pose.position[1] - f.p[1]) * f.right[1] +
    (pose.position[2] - f.p[2]) * f.right[2];
  const rise =
    (pose.position[0] - f.p[0]) * f.up[0] +
    (pose.position[1] - f.p[1]) * f.up[1] +
    (pose.position[2] - f.p[2]) * f.up[2];
  console.log(`  hardest point: ${(hardest.climb * 57.3).toFixed(1)}° climb at ${hardest.v.toFixed(1)} m/s → rider ${(across * 100).toFixed(0)} cm across, ${(rise * 100).toFixed(0)} cm up`); // prettier-ignore
  ok(hardest.climb > 0.25, 'somewhere on the slide the rider really is thrown up the wall', `${(hardest.climb * 57.3).toFixed(1)}°`); // prettier-ignore
  ok(rise > 0.03, 'and the pose puts them above the floor', `${(rise * 100).toFixed(1)} cm`);
  ok(Math.abs(across) > 0.05, 'and off the centreline', `${(across * 100).toFixed(1)} cm`);
  ok(Math.sign(across) === (hardest.phiR > hardest.phiL ? 1 : -1), 'on the side the wall grew');

  const q = quaternionOf(pose.right, pose.up, pose.forward);
  const len = Math.hypot(q[0], q[1], q[2], q[3]);
  near(len, 1, 1e-6, 'the published quaternion is a unit quaternion');

  const rig = buildRig(flumeStyle('raft').rig);
  ok(rig.seats.length === 5, 'a five-seat raft lays out five seats', `${rig.seats.length}`);
  ok(triangleCount(rig.hull) > 100, 'and has a hull', `${triangleCount(rig.hull)} tris`);
  ok(triangleCount(buildRig(flumeStyle('body').rig).hull) === 0, 'a body slide has no vehicle');
}

// ── 7. determinism ───────────────────────────────────────────────────────────────────────────
section('\nDeterminism');
{
  const make = () => {
    const entity = makeFlumeEntity({
      id: 'flume-det',
      pack: 'neon-lagoon',
      item: 'tube-slide',
      layout: 'spiral-tower',
      x: 12,
      z: -7,
      y: 3,
      yaw: 0.7,
    });
    const flume = resolveFlume(registry, entity, 3);
    const build = buildFlume(flume);
    return buildShell(build.stations, flume.style, flume.radius);
  };
  const a = make();
  const b = make();
  ok(a.positions.length === b.positions.length, 'two builds have the same vertex count');
  let same = true;
  for (let i = 0; i < a.positions.length; i++) if (a.positions[i] !== b.positions[i]) same = false;
  ok(same, 'and byte-identical positions');

  const source = readFileSync(new URL('./sim.ts', import.meta.url), 'utf8');
  ok(!/Math\.random|Date\.now|performance\.now/.test(source), 'the sim draws from no clock and no random stream'); // prettier-ignore
}

// ── 8. the simulation ────────────────────────────────────────────────────────────────────────
section('\nSimulation');
{
  const rt = new SimRuntime(GAME_MODULES, () => {});
  const world = freshWorld();
  const flume = makeFlumeEntity({
    id: 'flume-1',
    pack: 'neon-lagoon',
    item: 'body-slide',
    layout: 'plunge-drop',
    x: 0,
    z: 0,
    y: 0,
    yaw: 0,
  });
  world.entities[flume.id] = flume;
  rt.init({
    type: 'init',
    world,
    packs: PACKS,
    modules: ['core', 'terrain', 'track', 'pools', 'flumes'],
  });
  const api = () => rt.handles.get('flumes').api;
  ok(api().ids().length === 1, 'the slide is in the sim');
  const view0 = api().view('flume-1');
  ok(view0.riders === 0, 'and nobody is on it at tick 0');

  // A dispatch every 11 slide-seconds at 0.05 s a tick: 220 ticks is twenty dispatches' worth.
  const ticks = 2000;
  for (let i = 0; i < ticks; i++) rt.step(1);
  const view = api().view('flume-1');
  console.log(`  after ${ticks} ticks (${(ticks * SLIDE_SECONDS_PER_TICK).toFixed(0)} slide-seconds): ${view.descents} descents, ${view.riders} in the air`); // prettier-ignore
  ok(view.descents > 5, 'people went down it', `${view.descents}`);
  ok(view.riders > 0, 'and some are still on it', `${view.riders}`);
  const expected = Math.floor((ticks * SLIDE_SECONDS_PER_TICK) / 11);
  ok(Math.abs(view.descents + view.riders - expected) <= 1, 'the dispatch interval is honoured', `${view.descents + view.riders} vs ${expected}`); // prettier-ignore

  const stats = api().stats();
  ok(stats.water > 0, 'a running slide costs water', `${stats.water} m³/h`);
  api().setRunning('flume-1', false);
  ok(api().stats().water === 0, 'and a stopped one costs none');
  api().setRunning('flume-1', true);

  const first = rt.serialize();
  ok(!/NaN|null,null/.test(first), 'the save has no NaN in it');
  // Through the real serialiser and back, not a structural clone: `JSON.stringify` turns the
  // heightfield's Float32Array into a plain array, `serializeWorld` then base64s nothing, and the
  // comparison passes or fails on the terrain rather than on this module.
  const reloaded = new SimRuntime(GAME_MODULES, () => {});
  reloaded.init({
    type: 'init',
    world: deserializeWorld(first),
    packs: PACKS,
    modules: ['core', 'terrain', 'track', 'pools', 'flumes'],
  });
  const second = reloaded.serialize();
  ok(first === second, 'save → load → save is byte-identical');
  const back = reloaded.handles.get('flumes').api.view('flume-1');
  ok(back.descents === view.descents, 'the descent counter survived the trip', `${back.descents}`);
  ok(back.riders === 0, 'and the riders in the air did not, deliberately', `${back.riders}`);

  rt.dispose();
  reloaded.dispose();
}

function freshWorld() {
  const size = 256;
  const resolution = 128;
  return {
    meta: { version: 1, seed: 7, name: 'flumes selftest', createdAt: 0, packs: PACKS.map((p) => p.id) }, // prettier-ignore
    clock: { day: 1, minute: 600, speed: 0 },
    terrain: {
      size,
      resolution,
      heights: new Float32Array((resolution + 1) * (resolution + 1)),
      paint: new Uint8Array(resolution * resolution),
      waterLevel: -40,
    },
    entities: {},
    finance: { cash: 100000000, loan: 0, history: [] },
    modules: {},
    log: [],
  };
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
void riderSpec;
void flumeLayouts;
void sectionNormal;
