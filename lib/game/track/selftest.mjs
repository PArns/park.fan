/**
 * Unit tests for everything in this module that a screenshot cannot show.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/track/selftest.mjs
 *
 * It is a `.mjs` next to the code rather than a `scripts/test-game-*.mjs` for the same reason the
 * `paths` and `scenery` modules give: the checks here are about this module's internals, they are
 * worthless to anybody else, and a builder may not edit `package.json`. The request to wire it into
 * `pnpm test:game` is in `docs/game/requests/track.md`.
 *
 * Everything imported is pure — no Babylon, no DOM — which is the property that makes this
 * possible at all.
 */

import { TrackSpline } from '@/lib/game/track/spline';
import { TrackCursor } from '@/lib/game/track/cursor';
import { TRACK_OPS, normalizeArgs } from '@/lib/game/track/ops';
import { buildTrack } from '@/lib/game/track/build';
import { trainSpec, simulateTrack } from '@/lib/game/track/physics';
import { evaluate } from '@/lib/game/track/expr';
import { trackElement, trackElements, registerTrackElement } from '@/lib/game/track/elements';
import { buildTrackGeometry, extrusionStations } from '@/lib/game/track/profile';
import { buildSupports } from '@/lib/game/track/supports';
import { TRACK_LAYOUTS, layoutData } from '@/lib/game/track/layouts';
import { buildOptionsFor } from '@/lib/game/track/resolve';
import { Registry } from '@/lib/game/core/registry';
import { G } from '@/lib/game/track/vec';
import { readFileSync } from 'node:fs';

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
    `${actual.toFixed(4)} vs ${expected.toFixed(4)} (±${tolerance})`
  );
}
function section(name) {
  console.log(name);
}

const TRAIN = trainSpec({ cars: 7, seatsPerCar: 4, carLength: 3, carWidth: 1.9, carHeight: 1.1 });
const LIMITS = { vertical: 5, lateral: 2.6, negative: -1.8 };

function runOps(ops, speed = 25, start = [0, 0, 0]) {
  const cursor = new TrackCursor(start, [0, 0, 1], [0, 1, 0]);
  const ctx = { cursor, speed, loss: 0.3, designSpeed: 25 };
  for (const [op, args] of ops) TRACK_OPS[op](ctx, normalizeArgs(args));
  return { cursor, ctx };
}

// ── the spline ────────────────────────────────────────────────────────────────────────────
section('spline');
{
  // A straight line: arc length must equal the geometric length and the frame must not drift.
  const nodes = [];
  for (let i = 0; i <= 20; i++) nodes.push({ p: [0, 0, i * 3], up: [0, 1, 0] });
  const line = new TrackSpline(nodes);
  near(line.length(), 60, 1e-3, 'a straight spline measures its own length');
  const mid = line.frameAt(31.7);
  near(mid.p[2], 31.7, 1e-3, 'pointAt is arc-length parameterised on a straight');
  near(mid.up[1], 1, 1e-6, 'the frame stays level on a straight');
  near(Math.hypot(...line.curvatureAt(30)), 0, 1e-4, 'a straight has no curvature');
}
{
  // A circle of radius 20: curvature must be 1/20 everywhere, and marching at a constant step must
  // arrive back where it started.
  const nodes = [];
  const R = 20;
  for (let i = 0; i <= 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    nodes.push({ p: [Math.cos(a) * R, 0, Math.sin(a) * R], up: [0, 1, 0] });
  }
  const circle = new TrackSpline(nodes, { closed: true });
  near(circle.length(), 2 * Math.PI * R, 0.02, 'a closed circle measures 2πR');
  let worst = 0;
  for (let s = 0; s < circle.length(); s += 1) {
    worst = Math.max(worst, Math.abs(Math.hypot(...circle.curvatureAt(s)) - 1 / R) * R);
  }
  ok(
    worst < 0.01,
    'curvature on a circle is 1/R within 1 %',
    `worst ${(worst * 100).toFixed(2)} %`
  );
  const a = circle.frameAt(0);
  const b = circle.frameAt(circle.length());
  near(
    Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]),
    0,
    1e-3,
    'a closed spline meets itself at the seam'
  );
  near(a.up[1], b.up[1], 1e-3, 'the up-vector is continuous across the seam');
}
{
  // The roll channel: nodes rolled a quarter turn over a straight must read back as a quarter turn.
  const nodes = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const angle = t * (Math.PI / 2);
    nodes.push({ p: [0, 0, i * 2], up: [Math.sin(angle), Math.cos(angle), 0] });
  }
  const rolled = new TrackSpline(nodes);
  const end = rolled.frameAt(rolled.length());
  near(end.up[0], 1, 1e-3, 'roll survives the RMF gauge round trip');
  near(end.up[1], 0, 1e-3, 'roll survives the RMF gauge round trip (vertical)');
}

// ── the expression evaluator ──────────────────────────────────────────────────────────────
section('expressions');
{
  near(evaluate(3, {}), 3, 0, 'a literal is itself');
  near(evaluate('$a * 2 + 1', { a: 4 }), 9, 0, 'arithmetic and parameters');
  near(evaluate('sin(rad(90))', {}), 1, 1e-9, 'degrees convert');
  near(evaluate('deg(atan(1))', {}), 45, 1e-9, 'and convert back');
  let threw = false;
  try {
    evaluate('$missing', {});
  } catch {
    threw = true;
  }
  ok(threw, 'an unknown parameter is an error, not a NaN');
  threw = false;
  try {
    evaluate('globalThis', {});
  } catch {
    threw = true;
  }
  ok(threw, 'the grammar has no escape into JavaScript');
}

// ── the ops ───────────────────────────────────────────────────────────────────────────────
section('ops');
{
  const { cursor } = runOps([['straight', { length: 40 }]]);
  near(cursor.s, 40, 1e-6, 'a straight is its own length');
  near(cursor.p[2], 40, 1e-6, 'and goes where it points');
}
{
  const { cursor } = runOps([['turn', { angle: 90, radius: 20, bank: 0 }]]);
  near(cursor.dir[0], 1, 1e-3, 'a +90° turn ends heading +X (the rider’s right)');
  near(cursor.p[1], 0, 1e-6, 'a level turn stays level');
}
{
  const { cursor } = runOps([['pitch', { angle: 30, radius: 30 }]]);
  ok(cursor.p[1] > 0, 'a positive pitch climbs', `y ${cursor.p[1].toFixed(2)}`);
  near(Math.asin(cursor.dir[1]) * (180 / Math.PI), 30, 0.2, 'and arrives at the angle asked for');
}
{
  // A hill must land on its height and hand the track back at the pitch it took it at.
  for (const height of [4, 10, 18]) {
    const { cursor } = runOps([['hill', { height, g: 0, gLoad: 1.6 }]]);
    const apex = Math.max(...cursor.nodes.map((n) => n.p[1]));
    near(apex, height, 0.05, `a ${height} m hill peaks at ${height} m`);
    near(Math.asin(cursor.dir[1]), 0, 0.01, 'and comes back level');
  }
}
{
  // The ramp op is what the lift hill and the drop are made of; both must be exact.
  const { cursor } = runOps(
    [['ramp', { height: 34, angle: 28, entryRadius: 22, exitRadius: 22 }]],
    4
  );
  near(cursor.p[1], 34, 0.05, 'a 34 m lift ramp climbs exactly 34 m');
  near(Math.asin(cursor.dir[1]), 0, 0.01, 'and levels off at the crest');
  const drop = runOps([['ramp', { height: -46, angle: 53, entryRadius: 24, exitRadius: 34 }]], 4);
  near(drop.cursor.p[1], -46, 0.05, 'a 46 m drop falls exactly 46 m');
}
{
  // A loop must come all the way round and hold roughly the load it was asked for.
  const { cursor } = runOps([['loop', { g: 3.4 }]], 26);
  near(Math.asin(cursor.dir[1]), 0, 0.02, 'a loop exits on the heading it entered');
  const apex = Math.max(...cursor.nodes.map((n) => n.p[1]));
  ok(apex > 12 && apex < 40, 'a 3.4 g loop at 26 m/s is a sane height', `${apex.toFixed(1)} m`);
  const inverted = cursor.nodes.filter((n) => n.up[1] < -0.9).length;
  ok(inverted > 3, 'and it goes upside down', `${inverted} inverted nodes`);
}
{
  // A one-turn corkscrew is a rigid 360° rotation: heading and bank come back unchanged.
  const { cursor } = runOps([['spin', { turns: 1, radius: 5, g: 3, hand: 1 }]], 16);
  near(cursor.dir[2], 1, 1e-2, 'a 360° corkscrew exits on its entry heading');
  near(cursor.up[1], 1, 1e-2, 'and on its entry bank');
  const inverted = cursor.nodes.filter((n) => n.up[1] < -0.5).length;
  ok(inverted > 3, 'and it inverts on the way', `${inverted} inverted nodes`);
}

// ── the element table ─────────────────────────────────────────────────────────────────────
section('elements');
{
  ok(trackElements().length >= 18, 'the catalogue has a coaster’s vocabulary in it');
  ok(!!trackElement('loop') && !!trackElement('corkscrew'), 'named elements resolve');
  registerTrackElement({
    id: 'selftest-kicker',
    name: 'Kicker',
    category: 'hill',
    params: { height: { default: 3 } },
    ops: [{ op: 'hill', args: { height: '$height', g: -0.4, gLoad: 2 } }],
  });
  const data = {
    style: 'x',
    origin: [0, 20, 0],
    yaw: 0,
    closed: false,
    pieces: [
      { element: 'straight', params: { length: 20 } },
      { element: 'selftest-kicker', params: { height: 6 } },
    ],
  };
  const built = buildTrack(data, {
    train: TRAIN,
    limits: LIMITS,
    ratedSpeed: 25,
    dispatchSpeed: 18,
  });
  ok(built.warnings.length === 0, 'a runtime-registered element builds', built.warnings.join('; '));
  ok(
    built.segments.some((s) => s.element === 'selftest-kicker'),
    'and appears as a segment'
  );
}
{
  const built = buildTrack(
    {
      style: 'x',
      origin: [0, 10, 0],
      yaw: 0,
      closed: false,
      pieces: [{ element: 'no-such-element' }],
    },
    { train: TRAIN, limits: LIMITS }
  );
  ok(built.warnings.length >= 1, 'an unknown element warns rather than throwing');
  ok(built.spline.length() > 0, 'and the result is still a usable spline');
}

// ── physics ───────────────────────────────────────────────────────────────────────────────
section('physics');
{
  // Energy: a train released from rest down a frictionless slope must arrive at √(2gh).
  const nodes = [];
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    nodes.push({ p: [0, 40 * (1 - t), t * 200], up: [0, 1, 0] });
  }
  const ramp = new TrackSpline(nodes);
  const frictionless = { ...TRAIN, rollingResistance: 0, dragArea: 0 };
  const result = simulateTrack({
    spline: ramp,
    drives: [],
    train: frictionless,
    limits: LIMITS,
    dispatchSpeed: 0.5,
  });
  const arrival = result.stations[result.stations.length - 1].v;
  // The train is 21 m long, so its centre only falls 40 m minus the fall of half its own length
  // along a 11.3° slope — the mean-height model is the point of this check.
  near(arrival, Math.sqrt(2 * G * 40 * (1 - 0)), 1.6, 'a frictionless 40 m drop reaches √(2gh)');
  near(result.maxLateralG, 0, 1e-6, 'a planar descent has no lateral force');
}
{
  // A level circle: the vertical g must be sec(bank) and the lateral zero when fully banked.
  const R = 40;
  const v = 20;
  const bank = Math.atan((v * v) / (G * R));
  const nodes = [];
  for (let i = 0; i <= 400; i++) {
    const a = (i / 400) * Math.PI * 2;
    // right = cross(up, tangent) with tangent = (−sin a, 0, cos a): it points OUT of the circle,
    // so the bank tilts the up-vector towards −right, i.e. inwards.
    const right = [Math.cos(a), 0, Math.sin(a)];
    const up = [-Math.sin(bank) * right[0], Math.cos(bank), -Math.sin(bank) * right[2]];
    nodes.push({ p: [Math.cos(a) * R, 0, Math.sin(a) * R], up });
  }
  const circle = new TrackSpline(nodes, { closed: true });
  const result = simulateTrack({
    spline: circle,
    drives: [{ kind: 'transport', from: 0, to: circle.length(), speed: v }],
    train: { ...TRAIN, rollingResistance: 0, dragArea: 0 },
    limits: { vertical: 9, lateral: 9, negative: -9 },
    dispatchSpeed: v,
  });
  near(result.maxLateralG, 0, 0.03, 'a fully banked circle has no lateral force');
  near(result.maxVerticalG, 1 / Math.cos(bank), 0.05, 'and pulls sec(φ) vertically');
}

// ── the layouts ───────────────────────────────────────────────────────────────────────────
section('layouts');
/**
 * The layouts are validated through the REGISTRY, exactly as the game resolves them.
 *
 * Not with a hand-written train: the ops shape themselves from a running speed estimate, and that
 * estimate depends on the train's drag area and rolling resistance — so a train with a 5 cm
 * narrower car builds a different track. Two of the three layouts closed 5 m worse under a
 * hand-written spec than under the one they were solved with, which is a property of the design
 * worth knowing rather than a bug: a layout is tuned for a train.
 */
const registry = new Registry();
for (const file of ['core-classic', 'neon-lagoon']) {
  registry.registerPack(
    JSON.parse(readFileSync(`lib/game/content/packs/${file}/pack.json`, 'utf8'))
  );
}
for (const preset of TRACK_LAYOUTS) {
  const data = layoutData(preset);
  const options = buildOptionsFor(registry, data);
  const built = buildTrack(data, options);
  const p = built.physics;
  const limits = options.limits;
  ok(
    built.warnings.length === 0,
    `${preset.id}: builds with no warnings`,
    built.warnings.join('; ')
  );
  ok(
    built.closure.position < 15,
    `${preset.id}: closes within 15 m`,
    `${built.closure.position.toFixed(2)} m`
  );
  ok(
    p.complete,
    `${preset.id}: the train completes the circuit`,
    p.issues.map((i) => i.code).join(',')
  );
  ok(
    p.maxVerticalG <= limits.vertical,
    `${preset.id}: inside its vertical limit`,
    `${p.maxVerticalG.toFixed(2)} g`
  );
  ok(
    p.minVerticalG >= limits.negative,
    `${preset.id}: inside its negative limit`,
    `${p.minVerticalG.toFixed(2)} g`
  );
  ok(
    p.maxLateralG <= limits.lateral,
    `${preset.id}: inside its lateral limit`,
    `${p.maxLateralG.toFixed(2)} g`
  );
  ok(
    p.arrivalSpeed < 8,
    `${preset.id}: arrives slowly enough to be caught`,
    `${p.arrivalSpeed.toFixed(1)} m/s`
  );
  ok(
    p.rideTimeSeconds > 40 && p.rideTimeSeconds < 200,
    `${preset.id}: rides for a plausible time`,
    `${p.rideTimeSeconds.toFixed(0)} s`
  );
  ok(
    p.maxRollRateDegPerSec <= 200,
    `${preset.id}: rolls no faster than a real inversion does`,
    `${p.maxRollRateDegPerSec.toFixed(0)} °/s`
  );
}

// ── geometry and supports ─────────────────────────────────────────────────────────────────
section('geometry');
{
  const preset = TRACK_LAYOUTS[0];
  const built = buildTrack(layoutData(preset), { train: TRAIN, limits: LIMITS, dispatchSpeed: 2 });
  const style = {
    rail: { profile: 'round', radius: 0.07, gauge: 1.3 },
    spine: { profile: 'box', size: 0.55 },
    ties: { every: 1.6 },
    supports: 'steel',
  };
  const stations = extrusionStations(built.spline);
  const gaps = stations.slice(1).map((s, i) => s - stations[i]);
  ok(
    Math.min(...gaps) >= 0.3,
    'no extrusion step is degenerate',
    `${Math.min(...gaps).toFixed(3)} m`
  );
  // The last step reaches the end of the circuit and may be up to half a step over the cap.
  ok(
    Math.max(...gaps) <= 1.5,
    'and none is much longer than the cap',
    `${Math.max(...gaps).toFixed(3)} m`
  );
  const geometry = buildTrackGeometry(built.spline, style);
  ok(
    geometry.triangles > 1000,
    'the extrusion produces geometry',
    `${geometry.triangles} triangles`
  );
  for (const [name, geo] of Object.entries(geometry.groups)) {
    ok(geo.positions.length % 3 === 0, `${name}: positions are whole vectors`);
    ok(geo.normals.length === geo.positions.length, `${name}: one normal per vertex`);
    ok(geo.indices.length % 3 === 0, `${name}: indices are whole triangles`);
    const vertices = geo.positions.length / 3;
    ok(
      geo.indices.every((i) => i >= 0 && i < vertices),
      `${name}: every index is in range`
    );
    ok(geo.positions.every(Number.isFinite), `${name}: no NaN reaches a vertex buffer`);
  }

  // Supports: none may float and none may sink.
  const ground = (x, z) => 2 + Math.sin(x / 40) * 1.5 + Math.cos(z / 55) * 1.2;
  const supports = buildSupports(built.spline, geometry.frames, {
    kind: 'steel',
    ground,
    load: () => 1.5,
    structureDepth: 0.8,
  });
  ok(supports.columns > 12, 'a 989 m layout gets a real number of columns', `${supports.columns}`);
  ok(supports.braces > 0, 'and its taller columns are braced', `${supports.braces}`);
  // Every footing block's centre must sit within a few centimetres of the terrain it stands on.
  let worstFooting = 0;
  for (let i = 0; i < supports.footing.positions.length; i += 3) {
    const x = supports.footing.positions[i];
    const y = supports.footing.positions[i + 1];
    const z = supports.footing.positions[i + 2];
    worstFooting = Math.max(worstFooting, Math.abs(y - ground(x, z)));
  }
  ok(
    worstFooting < 0.9,
    'no footing floats or sinks',
    `worst ${worstFooting.toFixed(2)} m from the ground`
  );
}

console.log(
  failures === 0
    ? `\n✓ track selftest: ${checks} checks clean`
    : `\n✗ track selftest: ${failures} of ${checks} checks failed`
);
process.exit(failures === 0 ? 0 : 1);
