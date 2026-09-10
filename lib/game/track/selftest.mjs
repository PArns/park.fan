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
import { buildStation } from '@/lib/game/track/station';
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

  // ── the boarding station ────────────────────────────────────────────────────────────────
  //
  // Four things, and the second is the one that was wrong for the module's whole existence: it
  // must exist at all. `station` in this module already meant an extrusion sample along the
  // spline, so nothing named the platform and nothing missed it.
  const station = buildStation(built.spline, built.drives, { ground });
  const section = built.drives.find((d) => d.kind === 'station');
  ok(section != null, 'the layout has a station drive section to build on');
  ok(station.deck.indices.length > 0, 'and a deck is built for it');
  ok(station.structure.indices.length > 0, 'with posts and a canopy');
  ok(station.rail.indices.length > 0, 'and a railing along the edge');
  near(station.length, section.to - section.from, 0.001, 'the platform is as long as the section');

  // Nothing may be inside the ground. A deck hangs off the track and the track can be forty metres
  // up, so this is about the LOW end: a post is allowed to be long, never short.
  let sunk = 0;
  for (const geo of [station.deck, station.structure, station.rail]) {
    for (let i = 0; i < geo.positions.length; i += 3) {
      const x = geo.positions[i];
      const y = geo.positions[i + 1];
      const z = geo.positions[i + 2];
      sunk = Math.min(sunk, y - ground(x, z));
    }
  }
  ok(sunk > -0.5, 'no part of the station is buried', `deepest ${sunk.toFixed(2)} m under grade`);

  // The train has to fit through it. Every deck vertex must be clear of the slot the track runs
  // in, measured against the spline's own centre line over the station.
  let closest = Infinity;
  for (let i = 0; i < station.deck.positions.length; i += 3) {
    const x = station.deck.positions[i];
    const z = station.deck.positions[i + 2];
    for (let t = 0; t <= 20; t++) {
      const f = built.spline.frameAt(section.from + ((section.to - section.from) * t) / 20);
      closest = Math.min(closest, Math.hypot(x - f.p[0], z - f.p[2]));
    }
  }
  ok(closest > 1.0, 'the decks leave the train a slot', `closest ${closest.toFixed(2)} m`);

  // Every deck face that IS the walking surface must point UP. This is the one thing a picture
  // of a station cannot settle at a glance and the first version got wrong on both sides: 144 of
  // 144 top normals pointed at the ground, which renders as a black slab lit from below.
  const deckY = Math.max(...deckYs(station.deck));
  let upFaces = 0;
  let downFaces = 0;
  for (let i = 0; i < station.deck.positions.length; i += 3) {
    if (Math.abs(station.deck.positions[i + 1] - deckY) > 0.01) continue;
    const ny = station.deck.normals[i + 1];
    if (ny > 0.9) upFaces += 1;
    else if (ny < -0.9) downFaces += 1;
  }
  ok(
    upFaces > 0 && downFaces === 0,
    'the walking surface faces up',
    `${upFaces} up, ${downFaces} down`
  );

  // The canopy clears a RIDER, not just somebody standing on the platform — the spline is the
  // seat (`trains/types.ts`), and a rider with their arms up reaches about 1.6 m over it. The
  // first version measured 2.6 m off the deck and put the soffit 0.73 m over the heartline.
  let soffit = Infinity;
  for (let i = 1; i < station.structure.positions.length; i += 3) {
    const y = station.structure.positions[i];
    if (y > deckY + 1.9) soffit = Math.min(soffit, y);
  }
  const seatY = built.spline.frameAt((section.from + section.to) / 2).p[1];
  ok(
    soffit - seatY >= 1.6,
    'a rider with their arms up clears the canopy',
    `${(soffit - seatY).toFixed(2)} m over the seat`
  );
  ok(
    soffit - deckY >= 2.4,
    'and somebody standing on the platform clears it too',
    `${(soffit - deckY).toFixed(2)} m over the deck`
  );

  // The winding, which is the check the normal test above CANNOT make and the one this module
  // got wrong. In this scene a front-facing triangle is wound so `cross(v1-v0, v2-v0)` points
  // AWAY from the visible side (`paths/mesh.ts`: FRONT_FACE_SIGN = -1). Emitting the intuitive
  // order back-face culls everything, and every vertex normal is still correct — the canopy
  // showed its own soffit from above and measured 2.3x darker than the same material beside it.
  let wrongWinding = 0;
  let facesChecked = 0;
  for (const geo of [station.deck, station.structure, station.rail]) {
    for (let t = 0; t < geo.indices.length; t += 3) {
      const [i0, i1, i2] = [geo.indices[t], geo.indices[t + 1], geo.indices[t + 2]];
      const P = (i) => [geo.positions[i * 3], geo.positions[i * 3 + 1], geo.positions[i * 3 + 2]];
      const [a, b, c] = [P(i0), P(i1), P(i2)];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const len = Math.hypot(cr[0], cr[1], cr[2]);
      if (len < 1e-9) continue;
      const n = [geo.normals[i0 * 3], geo.normals[i0 * 3 + 1], geo.normals[i0 * 3 + 2]];
      const dot = (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2]) / len;
      facesChecked += 1;
      // FRONT_FACE_SIGN is -1: the cross product must oppose the shading normal.
      if (dot > -0.5) wrongWinding += 1;
    }
  }
  ok(
    facesChecked > 0 && wrongWinding === 0,
    'every face is wound front-out for this scene',
    `${wrongWinding} of ${facesChecked} triangles inverted`
  );

  // The UVs are in metres, which is `materials.ts`'s stated contract and what its `uScale` of
  // 0.8 tiles per metre expects. A 0-to-1 UV per quad reads the albedo, the normal map and the
  // ORM map at one texel across a 20 m slab; the canopy came out a black mirror. Measured as the
  // largest UV span, which must be metres-sized rather than 1.
  let maxUv = 0;
  for (const geo of [station.deck, station.structure, station.rail]) {
    for (const v of geo.uvs) maxUv = Math.max(maxUv, v);
  }
  ok(maxUv > 3, 'the UVs are authored in metres, not per quad', `largest ${maxUv.toFixed(2)}`);

  // The platform is level with the train's floor, not with its wheels: a rider steps ACROSS.
  ok(
    seatY - deckY > 0.4 && seatY - deckY < 1.2,
    'the deck is at boarding height',
    `${(seatY - deckY).toFixed(2)} m under the seat`
  );

  // A layout with no station section draws nothing rather than guessing where one would go.
  const open = buildStation(built.spline, [], { ground });
  ok(
    open.deck.indices.length === 0 && open.length === 0 && open.centre === null,
    'a layout with no station section builds no platform'
  );
}

function deckYs(geo) {
  const out = [];
  for (let i = 1; i < geo.positions.length; i += 3) out.push(geo.positions[i]);
  return out;
}

// ── the pack's layout catalogue against this module's own table ───────────────────────────
//
// Two halves of one thing and neither can see the other: `coasterLayouts` in a pack says what a
// player may put down and how much ground it needs, `layouts.ts` says what the track IS. The
// pieces stay in TypeScript because their reasoning does — every number in them was solved, and
// JSON cannot hold the paragraph that says so — but the ids have to agree and the declared
// footprint has to be the real one, or the build bar offers a ghost the size of a lie.
{
  const pack = JSON.parse(
    readFileSync(new URL('../content/packs/core-classic/pack.json', import.meta.url), 'utf8')
  );
  const declared = pack.coasterLayouts ?? [];
  ok(declared.length > 0, 'the pack declares a coaster layout catalogue', `${declared.length}`);
  const byId = new Map(TRACK_LAYOUTS.map((p) => [p.id, p]));
  for (const entry of declared) {
    const preset = byId.get(entry.id);
    ok(preset != null, `catalogue entry "${entry.id}" resolves to a layout`);
    if (!preset) continue;
    ok(
      preset.ride === `${pack.id}:${entry.ride}`,
      `"${entry.id}" names the ride its layout is drawn for`,
      `${entry.ride} vs ${preset.ride}`
    );
    // The footprint is what the ghost is drawn at, so a wrong one is a lie the player acts on.
    const data = { ...layoutData(preset), origin: [0, 0, 0], yaw: 0 };
    const built = buildTrack(data, buildOptionsFor(registry, data));
    const spline = built.spline;
    const xs = [];
    const ys = [];
    const zs = [];
    for (let i = 0; i <= 600; i++) {
      const p = spline.frameAt((i / 600) * spline.length()).p;
      xs.push(p[0]);
      ys.push(p[1]);
      zs.push(p[2]);
    }
    near(entry.footprint[0], Math.max(...xs) - Math.min(...xs), 1, `"${entry.id}" footprint x`);
    near(entry.footprint[1], Math.max(...zs) - Math.min(...zs), 1, `"${entry.id}" footprint z`);
    near(entry.height, Math.max(...ys) - Math.min(...ys), 1, `"${entry.id}" height`);
    near(entry.lengthM, spline.length(), 2, `"${entry.id}" length`);
  }
  for (const preset of TRACK_LAYOUTS) {
    ok(
      declared.some((e) => e.id === preset.id),
      `layout "${preset.id}" is in the catalogue a player can buy from`
    );
  }
}

console.log(
  failures === 0
    ? `\n✓ track selftest: ${checks} checks clean`
    : `\n✗ track selftest: ${failures} of ${checks} checks failed`
);
process.exit(failures === 0 ? 0 : 1);
