/**
 * Pieces → geometry: run the element ops, close the circuit, spline it, and bank it against the
 * speeds the train really carries.
 *
 * **Banking is a second pass, and that is the whole point.** A turn's bank cannot be known when
 * the turn is drawn, because it depends on how fast the train arrives, which depends on everything
 * before it — including turns whose bank has not been decided yet. So the first pass builds the
 * geometry with a running energy estimate and a nominal bank, the physics runs over that, and the
 * second pass replaces every auto-banked node's up-vector with the direction of the RESULTANT
 * specific force at the speed the train is actually doing there. That is the rule real designers
 * work to — bank follows the resultant acceleration vector, not the curve radius — and it falls out
 * of one line: `up = normalise(v²κ⃗ + g⃗)`. It even ramps itself, because the clothoid transition
 * takes κ from zero, so the bank comes on exactly as the curve does with nothing to interpolate.
 *
 * **A circuit is closed by blending, not by hoping.** A layout typed by hand comes back to the
 * station a few metres out, and a coaster that does not meet its own station is not a coaster. The
 * residual heading is unwound and the residual offset taken up over the last quarter of the
 * layout, weighted by a C² step so nothing kinks — and the UNCORRECTED residual is reported, so
 * the number the layout author has to fix is visible instead of hidden by the fix.
 */

import { TrackCursor, type NodeBank } from './cursor';
import { resolveParams, trackElement } from './elements';
import { evaluate } from './expr';
import { MAX_ROLL_PER_M, normalizeArgs, TRACK_OPS, type OpContext } from './ops';
import {
  simulateTrack,
  speedAt,
  trainMass,
  type ComfortLimits,
  type TrackPhysics,
  type TrainSpec,
} from './physics';
import { TrackSpline, type TrackNode } from './spline';
import type { DriveKind, DriveSection, TrackData } from './types';
import {
  clamp,
  cross,
  dot,
  G,
  normalize,
  perpendicular,
  rotateAbout,
  smootherstep,
  type V3,
} from './vec';

export interface TrackSegment {
  element: string;
  from: number;
  to: number;
}

export interface ClosureReport {
  /** Distance between the last node and the first, BEFORE the blend, metres. */
  position: number;
  /** Heading mismatch before the blend, degrees. */
  heading: number;
  /** Pitch mismatch, degrees. The blend does not correct this one. */
  pitch: number;
  /** Bank mismatch, degrees. */
  roll: number;
}

export interface BuildOptions {
  train: TrainSpec;
  limits: ComfortLimits;
  dispatchSpeed?: number;
  ratedSpeed?: number;
  /** Skip the banking pass — for a live drag preview, where one pass is the budget. */
  quick?: boolean;
}

export interface BuiltTrack {
  data: TrackData;
  spline: TrackSpline;
  drives: DriveSection[];
  segments: TrackSegment[];
  physics: TrackPhysics;
  closure: ClosureReport;
  warnings: string[];
  /** Total mass used for the physics, kg — reported so a stats panel is not guessing. */
  trainMassKg: number;
}

/** How much of the tail absorbs a circuit's closing error. */
const CLOSE_BLEND_FRACTION = 0.25;
const CLOSE_BLEND_MAX = 140;

export function buildTrack(data: TrackData, options: BuildOptions): BuiltTrack {
  const warnings: string[] = [];
  const generated = generate(data, options, warnings);
  const closure = data.closed
    ? closeCircuit(generated.nodes, generated.arc)
    : { position: 0, heading: 0, pitch: 0, roll: 0 };

  let spline = new TrackSpline(generated.nodes, { closed: data.closed });
  let physics = simulateTrack({
    spline,
    drives: generated.drives,
    train: options.train,
    limits: options.limits,
    dispatchSpeed: options.dispatchSpeed,
    ratedSpeed: options.ratedSpeed,
  });

  if (!options.quick && generated.banks.some((b) => b.mode === 'auto')) {
    const rebanked = applyResultantBanking(generated.nodes, generated.banks, spline, physics);
    if (rebanked) {
      spline = new TrackSpline(generated.nodes, { closed: data.closed });
      physics = simulateTrack({
        spline,
        drives: generated.drives,
        train: options.train,
        limits: options.limits,
        dispatchSpeed: options.dispatchSpeed,
        ratedSpeed: options.ratedSpeed,
      });
    }
  }

  return {
    data,
    spline,
    drives: generated.drives,
    segments: generated.segments,
    physics,
    closure,
    warnings,
    trainMassKg: trainMass(options.train),
  };
}

interface Generated {
  nodes: TrackNode[];
  banks: NodeBank[];
  arc: number[];
  drives: DriveSection[];
  segments: TrackSegment[];
}

function generate(data: TrackData, options: BuildOptions, warnings: string[]): Generated {
  const dir: V3 = [Math.sin(data.yaw), 0, Math.cos(data.yaw)];
  const cursor = new TrackCursor(data.origin as V3, dir, [0, 1, 0]);
  // The shaping estimate needs SOME loss model or a loop entered at the lift's speed comes out
  // impossible; this is the rolling + drag deceleration at the design speed, held constant.
  const design = options.ratedSpeed ?? 25;
  const mass = trainMass(options.train);
  const loss =
    options.train.rollingResistance * G +
    (0.5 * 1.225 * options.train.dragArea * design * design) / mass;
  const ctx: OpContext = {
    cursor,
    speed: Math.max(options.dispatchSpeed ?? 2, 1),
    loss,
    designSpeed: design,
  };

  const drives: DriveSection[] = [];
  const segments: TrackSegment[] = [];
  for (const piece of data.pieces) {
    const def = trackElement(piece.element);
    if (!def) {
      warnings.push(`unknown track element "${piece.element}" — skipped`);
      continue;
    }
    const params = resolveParams(def, piece.params);
    const from = cursor.s;
    for (const step of def.ops) {
      const handler = TRACK_OPS[step.op];
      if (!handler) {
        warnings.push(`element "${def.id}" uses unknown op "${step.op}" — skipped`);
        continue;
      }
      const args: Record<string, number> = {};
      for (const key of Object.keys(step.args)) args[key] = evaluate(step.args[key], params);
      handler(ctx, normalizeArgs(args));
    }
    const to = cursor.s;
    segments.push({ element: def.id, from, to });
    if (def.drive && to > from) {
      const speed = def.drive.speed === undefined ? 0 : evaluate(def.drive.speed, params);
      drives.push({ kind: def.drive.kind, from, to, speed });
      // The shaping estimate has to know what a drive did, or every element after a lift is drawn
      // for a train doing 2.5 m/s. That was not academic: the estimate came off the lift at its
      // clamped floor, the drop under-read by 5 m/s, and the loop it fed sized itself for a train
      // 8 m/s slower than the one that arrives — a 12 m entry radius and 7 g where 3.4 was asked
      // for. A launch would have been wrong by a factor of ten.
      ctx.speed = driveSpeed(def.drive.kind, ctx.speed, speed, options.dispatchSpeed ?? 2);
    }
  }
  cursor.emit(true);
  if (cursor.nodes.length < 2) {
    // A layout of nothing but unknown elements produces one node, and a spline of one node is not
    // a spline. A metre of straight keeps every consumer — the mesh, the physics, the supports —
    // on its normal path, and the warnings say what actually went wrong.
    warnings.push('the layout produced no geometry; a 1 m stub was substituted');
    cursor.advance(1);
  }
  return { nodes: cursor.nodes, banks: cursor.banks, arc: cursor.arc, drives, segments };
}

/**
 * Unwind the residual heading and take up the residual offset over the tail of a circuit.
 *
 * The rotation goes first and the translation is measured after it, because rotating the tail
 * moves its end: doing both from one measurement leaves an error of the same order as the one
 * being corrected.
 */
function closeCircuit(nodes: TrackNode[], arc: number[]): ClosureReport {
  const n = nodes.length;
  if (n < 6) return { position: 0, heading: 0, pitch: 0, roll: 0 };
  const startDir = normalize(sub3(nodes[1].p, nodes[0].p));
  const endDir = normalize(sub3(nodes[n - 1].p, nodes[n - 2].p));
  const report: ClosureReport = {
    position: Math.hypot(
      nodes[0].p[0] - nodes[n - 1].p[0],
      nodes[0].p[1] - nodes[n - 1].p[1],
      nodes[0].p[2] - nodes[n - 1].p[2]
    ),
    heading: deg(Math.atan2(startDir[0], startDir[2]) - Math.atan2(endDir[0], endDir[2])),
    pitch: deg(Math.asin(clamp(startDir[1], -1, 1)) - Math.asin(clamp(endDir[1], -1, 1))),
    roll: deg(signedAngleAbout(nodes[n - 1].up, nodes[0].up, endDir)),
  };

  const total = arc[n - 1];
  const blend = Math.min(total * CLOSE_BLEND_FRACTION, CLOSE_BLEND_MAX);
  const from = total - blend;
  const pivotIndex = arc.findIndex((s) => s >= from);
  const pivot = nodes[Math.max(0, pivotIndex)].p;
  const dPsi = wrapPi((report.heading * Math.PI) / 180);

  const weight = (i: number) => smootherstep((arc[i] - from) / Math.max(1e-6, blend));

  for (let i = 0; i < n; i++) {
    if (arc[i] <= from) continue;
    const w = weight(i);
    const rel = sub3(nodes[i].p, pivot);
    const turned = rotateAbout(rel, [0, 1, 0], dPsi * w);
    nodes[i].p = [pivot[0] + turned[0], pivot[1] + turned[1], pivot[2] + turned[2]];
    nodes[i].up = rotateAbout(nodes[i].up, [0, 1, 0], dPsi * w);
  }

  const offset: V3 = [
    nodes[0].p[0] - nodes[n - 1].p[0],
    nodes[0].p[1] - nodes[n - 1].p[1],
    nodes[0].p[2] - nodes[n - 1].p[2],
  ];
  for (let i = 0; i < n; i++) {
    if (arc[i] <= from) continue;
    const w = weight(i);
    nodes[i].p = [
      nodes[i].p[0] + offset[0] * w,
      nodes[i].p[1] + offset[1] * w,
      nodes[i].p[2] + offset[2] * w,
    ];
  }
  // The last node now sits on the first; make it exactly so, and hand it the first node's bank so
  // the seam has nothing left to interpolate.
  nodes[n - 1] = { p: [...nodes[0].p] as V3, up: [...nodes[0].up] as V3 };
  return report;
}

/**
 * Replace every auto-banked node's up-vector with the direction of the resultant specific force,
 * then hold the whole thing to a roll-rate limit.
 *
 * `f = v²κ⃗ + g⃗` is what a plumb line in the car hangs along; putting the rider's up there is the
 * definition of "fully banked", and it makes the lateral g zero by construction. Track that is
 * nearly straight has κ ≈ 0 and f ≈ g⃗, so the same expression leaves it level.
 *
 * **The limiter is not tidying, it is the second half of the rule.** The ideal bank is `atan(v²κ/g)`
 * and `atan` is steepest at zero, so a clothoid that ramps κ linearly ramps the BANK fastest at the
 * start of the transition: a 30 m turnaround at 26 m/s came out at 147 °/s where the linear ramp the
 * transition was sized for is 74. A forward and a backward pass hold `|dφ/ds|` to `MAX_ROLL_PER_M`,
 * which is what turns the ideal into something a body can take; whatever lateral force is left over
 * at the ends of the transition is real, and `physics.ts` reports it rather than hiding it.
 *
 * Two guards. A node whose tangent is within 26° of vertical keeps what it had, because "level" is
 * meaningless there and the generator that produced it (a loop, a corkscrew) meant its frame
 * literally. And the ideal is only accepted if it stays on the same side as the old one, so a
 * numerical wobble at very low speed cannot flip a turn's banking upside down.
 */
function applyResultantBanking(
  nodes: TrackNode[],
  banks: readonly NodeBank[],
  spline: TrackSpline,
  physics: TrackPhysics
): boolean {
  const n = nodes.length;
  const arc: number[] = new Array(n);
  const tangents: V3[] = new Array(n);
  const roll: number[] = new Array(n);
  const target: number[] = new Array(n);
  const auto: boolean[] = new Array(n);
  let any = false;

  for (let i = 0; i < n; i++) {
    const s = spline.nodeArcLength(i);
    const frame = spline.frameAt(s);
    arc[i] = s;
    tangents[i] = frame.tangent;
    roll[i] = spline.rollAt(s);
    target[i] = roll[i];
    auto[i] = false;
    if (banks[i]?.mode !== 'auto' || Math.abs(frame.tangent[1]) > 0.9) continue;
    const kappa = spline.curvatureAt(s);
    const v = speedAt(physics, s);
    const force: V3 = [kappa[0] * v * v, kappa[1] * v * v + G, kappa[2] * v * v];
    const ideal = normalize(perpendicular(force, frame.tangent), nodes[i].up);
    if (dot(ideal, nodes[i].up) < 0.2) continue;
    const w = clamp(banks[i].weight, 0, 1);
    target[i] = roll[i] + w * signedAngleAbout(nodes[i].up, ideal, frame.tangent);
    auto[i] = true;
    any = true;
  }
  if (!any) return false;

  for (let i = 1; i < n; i++) {
    if (!auto[i]) continue;
    const limit = MAX_ROLL_PER_M * Math.max(1e-3, arc[i] - arc[i - 1]);
    target[i] = clamp(target[i], target[i - 1] - limit, target[i - 1] + limit);
  }
  for (let i = n - 2; i >= 0; i--) {
    if (!auto[i]) continue;
    const limit = MAX_ROLL_PER_M * Math.max(1e-3, arc[i + 1] - arc[i]);
    target[i] = clamp(target[i], target[i + 1] - limit, target[i + 1] + limit);
  }

  for (let i = 0; i < n; i++) {
    if (!auto[i]) continue;
    const delta = target[i] - roll[i];
    if (Math.abs(delta) < 1e-6) continue;
    nodes[i].up = normalize(
      perpendicular(rotateAbout(nodes[i].up, tangents[i], delta), tangents[i]),
      nodes[i].up
    );
  }
  return true;
}

/** What the shaping estimate should read after a drive section of `kind`. */
function driveSpeed(kind: DriveKind, current: number, target: number, dispatch: number): number {
  switch (kind) {
    case 'lift':
    case 'launch':
      return Math.max(target, 0.5);
    case 'transport':
      return Math.max(current, target);
    case 'brake':
    case 'block':
      return Math.min(current, Math.max(target, 0.5));
    case 'station':
      return dispatch;
    default:
      return current;
  }
}

function sub3(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function deg(rad: number): number {
  return (wrapPi(rad) * 180) / Math.PI;
}

function wrapPi(a: number): number {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x <= -Math.PI) x += Math.PI * 2;
  return x;
}

function signedAngleAbout(a: V3, b: V3, axis: V3): number {
  const pa = normalize(perpendicular(a, axis), [1, 0, 0]);
  const pb = normalize(perpendicular(b, axis), [1, 0, 0]);
  return Math.atan2(dot(cross(pa, pb), axis), dot(pa, pb));
}
