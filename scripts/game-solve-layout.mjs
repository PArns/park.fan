/**
 * park.fan Coaster — close a coaster layout numerically.
 *
 * `lib/game/track/layouts.ts` says of its three bundled circuits that "every number in them was
 * solved, not typed": each was built open, its end-to-start residual measured, and two lengths
 * driven to zero by a two-variable Newton step. That was done by hand, three times, and the tool
 * that did it was never written down — so a fourth layout starts from nothing.
 *
 * This is that tool. Give it a piece list with two free parameters and it drives the circuit's
 * closing error to zero, then prints the solved list ready to paste into `layouts.ts` together
 * with the figures the note line quotes (length, top speed, drop, peak g, ride time) and the
 * planar bounding box, which is the number that decides whether a layout fits a plot.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs \
 *     scripts/game-solve-layout.mjs --design=compact-twister
 *   … --design=<id> --json=.game-render/layout.json
 *
 * **Two free parameters and not three**, for the reason the residual has two components that a
 * length can move: the end point's x and z. Heading, pitch and roll are closed by construction —
 * the turns in a design must already sum to a whole number of laps, and `build.ts` blends the
 * remainder over the last quarter of the track. A design whose headings do not sum is not a
 * circuit and no amount of straight will make it one; this script says so rather than iterating.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Registry } from '@/lib/game/core/registry.ts';
import { buildTrack } from '@/lib/game/track/build.ts';
import { buildOptionsFor } from '@/lib/game/track/resolve.ts';
import { attachTrackElements } from '@/lib/game/track/elements.ts';
import { DESIGNS } from './game-layout-designs.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1'];
  })
);
const designId = args.design ?? 'compact-twister';
const jsonOut = args.json ?? null;
const maxIterations = Number(args.iterations ?? 40);
/** Metres of end-to-start error we call closed. The bundled three sit at 0.85, 1.33 and 2.17. */
const TOLERANCE = Number(args.tolerance ?? 0.25);

const design = DESIGNS[designId];
if (!design) {
  console.error(`no design "${designId}". Known: ${Object.keys(DESIGNS).join(', ')}`);
  process.exit(2);
}

const packs = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(
    readFileSync(new URL(`../lib/game/content/packs/${id}/pack.json`, import.meta.url), 'utf8')
  )
);
const registry = new Registry();
for (const pack of packs) registry.registerPack(pack);
attachTrackElements(registry);

function dataFor(values, closed) {
  return {
    style: design.style,
    train: design.train,
    ride: design.ride,
    origin: [0, 0, 0],
    yaw: 0,
    closed,
    pieces: design.pieces(values),
  };
}

/**
 * Build OPEN while solving, closed only to report.
 *
 * A `TrackSpline` created with `closed: true` wraps, so `frameAt(0)` and `frameAt(length)` are
 * the same point by construction and the residual reads a confident 0.000 on any design at all —
 * which is what the first version of this script printed on its first iteration, and it looks
 * exactly like a design that already closes.
 */
function build(values, closed = false) {
  const data = dataFor(values, closed);
  return { data, built: buildTrack(data, buildOptionsFor(registry, data)) };
}

/**
 * The residual as a 2-vector in the ground plane.
 *
 * `ClosureReport.position` is a scalar distance and cannot say WHICH way the end missed, so the
 * Newton step needs the vector: the last node minus the first, x and z. Y is not in it — a
 * circuit's height closes through its own drops and the blend absorbs centimetres.
 */
function residual(built) {
  const s = built.spline;
  const a = s.frameAt(0).p;
  const b = s.frameAt(s.length()).p;
  return [b[0] - a[0], b[2] - a[2]];
}

const keys = design.free;
let values = { ...design.start };
let last = null;
console.log(`solving "${designId}" for ${keys.join(' and ')}\n`);
for (let i = 0; i < maxIterations; i++) {
  const { built } = build(values);
  const r = residual(built);
  const err = Math.hypot(r[0], r[1]);
  last = { built, r, err };
  console.log(
    `  ${String(i).padStart(2)}  ${keys.map((k) => `${k}=${values[k].toFixed(3)}`).join('  ')}` +
      `  →  dx ${r[0].toFixed(3)}  dz ${r[1].toFixed(3)}  |e| ${err.toFixed(4)}`
  );
  if (err <= TOLERANCE) break;
  // Forward differences: two extra builds per iteration, which is cheap next to writing the
  // Jacobian out by hand for an element table that can change under it.
  const h = 0.05;
  const J = [];
  for (const k of keys) {
    const bumped = { ...values, [k]: values[k] + h };
    const rb = residual(build(bumped).built);
    J.push([(rb[0] - r[0]) / h, (rb[1] - r[1]) / h]);
  }
  const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
  if (!Number.isFinite(det) || Math.abs(det) < 1e-9) {
    console.log('\n  the two free parameters move the end point the same way — pick another pair');
    break;
  }
  const d0 = (-r[0] * J[1][1] + r[1] * J[1][0]) / det;
  const d1 = (-J[0][0] * r[1] + J[0][1] * r[0]) / det;
  const step = [d0, d1];
  // Damped, because an element's own limits clamp a parameter and an undamped Newton step walks
  // straight into the clamp and stops moving.
  const damp = 0.7;
  keys.forEach((k, n) => {
    const bounds = design.bounds?.[k];
    let next = values[k] + step[n] * damp;
    if (bounds) next = Math.min(bounds[1], Math.max(bounds[0], next));
    values[k] = next;
  });
}

const { built } = build(values, true);
const s = built.spline;
const n = 900;
const xs = [];
const ys = [];
const zs = [];
for (let i = 0; i <= n; i++) {
  const p = s.frameAt((i / n) * s.length()).p;
  xs.push(p[0]);
  ys.push(p[1]);
  zs.push(p[2]);
}
const box = {
  x: +(Math.max(...xs) - Math.min(...xs)).toFixed(1),
  y: +(Math.max(...ys) - Math.min(...ys)).toFixed(1),
  z: +(Math.max(...zs) - Math.min(...zs)).toFixed(1),
};
const phys = built.physics;
const peakG = Math.max(Math.abs(phys.maxVerticalG), Math.abs(phys.minVerticalG));
const top = phys.maxSpeed;
const result = {
  design: designId,
  values,
  closure: {
    position: +built.closure.position.toFixed(2),
    heading: +built.closure.heading.toFixed(2),
  },
  residual: { dx: +last.r[0].toFixed(3), dz: +last.r[1].toFixed(3), abs: +last.err.toFixed(3) },
  lengthM: +s.length().toFixed(1),
  box,
  topSpeedKmh: +(top * 3.6).toFixed(1),
  peakG: +peakG.toFixed(2),
  rideSeconds: +phys.rideTimeSeconds.toFixed(1),
  maxDrop: +phys.maxDrop.toFixed(1),
  airtimeSeconds: +phys.airtimeSeconds.toFixed(1),
  arrivalSpeed: +phys.arrivalSpeed.toFixed(2),
  complete: phys.complete,
  warnings: built.warnings,
  issues: phys.issues ?? [],
  pieces: design.pieces(values),
};
console.log(
  `\n  ${result.lengthM} m · ${result.topSpeedKmh} km/h · ${result.maxDrop} m drop · ` +
    `box ${box.x} x ${box.z} m (${box.y} m tall) · ${result.peakG} g peak · ${result.rideSeconds} s` +
    ` · arrives at ${result.arrivalSpeed} m/s · complete ${result.complete}`
);
console.log(`  closure ${result.closure.position} m / ${result.closure.heading}°`);
if (result.warnings.length) console.log(`  warnings: ${result.warnings.join(' · ')}`);
if (result.issues.length) console.log(`  issues: ${JSON.stringify(result.issues)}`);
console.log(`\n${JSON.stringify(result.pieces, null, 2).replace(/"([a-zA-Z]+)":/g, '$1:')}`);

if (jsonOut) {
  await mkdir(path.dirname(jsonOut), { recursive: true });
  await writeFile(jsonOut, JSON.stringify(result, null, 2));
  console.log(`\n→ ${jsonOut}`);
}
