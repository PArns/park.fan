/**
 * The rig solver: a tree of parts, a phase, and the transform every drawn unit is at.
 *
 * Pure. No Babylon, no clock, no RNG — `selftest.mjs` runs it in node and measures the angles.
 *
 * ## Two clocks, and why the machine does not use the park's
 *
 * The park clock is compressed sixty-fold (one real second is one park minute at speed 1), so a
 * carousel whose cycle is three park minutes would complete its eight revolutions in **three real
 * seconds**. `trains/types.ts` hit the same wall and fixed its integration at `RIDE_SECONDS_PER_TICK
 * = 0.05`, and this module takes the same split but draws the line in a different place, because a
 * flat ride's throughput is a number a park manager plans with and a coaster's lap time is not:
 *
 *  - **the cycle** — load, dispatch, run, unload, the queue, riders an hour — is integrated in
 *    **park minutes** by `sim.ts`, so `capacity / cycleMinutes × 60` is exactly what the machine
 *    delivers at every speed, including 100×.
 *  - **the machine** — what a camera sees — runs on its own clock in **ride seconds**, and this
 *    file is the only thing that reads it.
 *
 * The join between them is `drive`: 0 when the machine is at rest, 1 at full speed, ramped by
 * `sim.ts` when the cycle enters and leaves its run. So a run that the park clock says lasted 1.5
 * park minutes is drawn as a machine that spun up, ran, and spun down — the state machine says
 * WHETHER, the drive envelope says HOW HARD, and nothing has to pretend the two clocks are one.
 *
 * ## What `spin` is
 *
 * `spin` counts **nominal runs**, as a float: it advances by `drive / runSeconds` per ride second,
 * so one unit of spin is one full authored run of every channel at once. A channel with
 * `revolutions: 8` turns eight times per unit of spin and a channel with `revolutions: 24`
 * oscillates twenty-four times, and they stay in step for free. It wraps at 1024, which is a
 * multiple of every integer revolution count, so a wrap is invisible; a rig authored with a
 * fractional `revolutions` pops once every 1024 runs, which is stated rather than hidden.
 *
 * ## Where the physics is
 *
 * Two angles in a fairground are not keyframed and must not be:
 *
 *  - **A chair swing's chains.** `tan θ = ω²(r + L sin θ) / g` is the balance of centripetal force
 *    against gravity, solved here by fixed-point iteration. The chains rise as the ride speeds up
 *    and fall as it slows because ω is read off the drive, not because anybody animated them.
 *  - **A ferris wheel's gondolas.** They hang level whatever the wheel does (`level: true`) and lag
 *    by `atan(a_t / g)` when the wheel starts and stops, where `a_t = r · dω/dt`. On the bundled
 *    wheel that is about one degree, which is what a real gondola does and what a rigid one does
 *    not.
 */

import type { Channel, CurveSpec, ResolvedRig, RigPartSpec } from './types';
import { G } from './types';

export type Quat = [number, number, number, number];
export type Vec = [number, number, number];

/** `spin` wraps here. A multiple of every integer revolution count, so the wrap is invisible. */
export const SPIN_WRAP = 1024;

export interface PoseInput {
  /** Nominal runs completed, float, wrapping at `SPIN_WRAP`. */
  spin: number;
  /** 0..1, how hard the machine is running. */
  drive: number;
  /** d(drive)/d(ride second). Only the pendulum reads it. */
  driveRate: number;
  /** Ride seconds one nominal run takes. */
  runSeconds: number;
}

export interface UnitPose {
  part: string;
  index: number;
  position: Vec;
  quat: Quat;
}

/** A part with its unit count and the order the renderer allocates instances in. */
export interface RigLayout {
  parts: Array<{ spec: RigPartSpec; units: number; depth: number }>;
  /** Total drawn units. */
  units: number;
  /** Seats the rig carries. */
  seats: number;
}

// ── quaternions ─────────────────────────────────────────────────────────────────────────────
export const QI: Quat = [0, 0, 0, 1];

export function qAxis(axis: 'x' | 'y' | 'z', angle: number): Quat {
  const h = angle / 2;
  const s = Math.sin(h);
  return [axis === 'x' ? s : 0, axis === 'y' ? s : 0, axis === 'z' ? s : 0, Math.cos(h)];
}

export function qMul(a: Quat, b: Quat): Quat {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

export function qRotate(q: Quat, v: Vec): Vec {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [
    v[0] + w * tx + (y * tz - z * ty),
    v[1] + w * ty + (z * tx - x * tz),
    v[2] + w * tz + (x * ty - y * tx),
  ];
}

export function qConjugate(q: Quat): Quat {
  return [-q[0], -q[1], -q[2], q[3]];
}

/** Yaw of a quaternion about +Y, radians. Used to keep a levelled unit facing where it was. */
export function qYaw(q: Quat): number {
  const [x, y, z, w] = q;
  return Math.atan2(2 * (w * y + x * z), 1 - 2 * (y * y + z * z));
}

// ── channel evaluation ──────────────────────────────────────────────────────────────────────
const ANGULAR: Record<Channel, boolean> = {
  yaw: true,
  pitch: true,
  roll: true,
  tilt: true,
  x: false,
  y: false,
  z: false,
};

const DEFAULT_AXIS: Record<Channel, 'x' | 'y' | 'z'> = {
  yaw: 'y',
  pitch: 'x',
  roll: 'z',
  tilt: 'x',
  x: 'x',
  y: 'y',
  z: 'z',
};

/**
 * Is this channel a continuous rotation or an oscillation?
 *
 * A rotation that goes round and round (`revolutions` with no amplitude on an angular channel) is a
 * carousel; anything with an `amplitude`, anything on a linear channel and anything the pack marked
 * `sine` is a thing that goes back and forth.
 */
function isOscillator(channel: Channel, spec: CurveSpec): boolean {
  if (!ANGULAR[channel]) return true;
  if (spec.curve === 'sine') return true;
  return spec.amplitude != null;
}

/**
 * The amplitude envelope of an oscillating channel, from the drive.
 *
 * `window` is read as a **drive range**, not as a slice of a timeline: `[0.2, 0.8]` on a wave
 * swinger's tilt means the canopy starts to cant once the machine is a fifth of the way up to speed
 * and is fully canted at full speed. That is what the machine does — the tilt is hydraulic and it
 * follows the rotation — and it is the only reading of a window that survives a cycle whose length
 * the park clock decides. A continuous rotation ignores it.
 */
function envelope(spec: CurveSpec, drive: number): number {
  const w0 = spec.window ? spec.window[0] : 0;
  const span = Math.max(0.05, 1 - w0);
  const t = Math.min(1, Math.max(0, (drive - w0) / span));
  switch (spec.curve) {
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return 1 - (1 - t) * (1 - t);
    case 'linear':
      return t;
    default:
      return t * t * (3 - 2 * t);
  }
}

export function channelValue(
  channel: Channel,
  spec: CurveSpec,
  input: PoseInput,
  unitPhase: number
): number {
  const revolutions = spec.revolutions ?? 1;
  if (isOscillator(channel, spec)) {
    const amplitude = spec.amplitude ?? (ANGULAR[channel] ? 0.15 : 0.3);
    const env = envelope(spec, input.drive);
    return amplitude * env * Math.sin((input.spin * revolutions + unitPhase) * Math.PI * 2);
  }
  return input.spin * revolutions * Math.PI * 2;
}

/**
 * Angular speed of a continuous channel, radians per ride second.
 *
 * The chain solver and the pendulum both need it, and it is exact rather than a finite difference:
 * `spin` advances by `drive / runSeconds` per ride second by construction.
 */
export function channelOmega(spec: CurveSpec, input: PoseInput): number {
  const revolutions = spec.revolutions ?? 1;
  return (revolutions * Math.PI * 2 * input.drive) / Math.max(0.001, input.runSeconds);
}

/**
 * The angle a chair on chains hangs at, radians from vertical.
 *
 * `tan θ = ω² (r + L sin θ) / g`. Fixed-point, five passes: it converges from below in three for
 * every ω a fairground produces, and five is still nothing.
 */
export function chainAngle(omega: number, radius: number, chain: number): number {
  if (!(omega > 0) || chain <= 0) return 0;
  let theta = 0;
  // Fixed point converges linearly, so five passes left a residual of 4e-4 in the balance equation
  // — invisible in a frame and enough to fail an exactness check that is worth keeping exact.
  for (let i = 0; i < 40; i++) {
    const r = radius + chain * Math.sin(theta);
    const next = Math.atan2(omega * omega * r, G);
    if (Math.abs(next - theta) < 1e-13) return next;
    theta = next;
  }
  return theta;
}

// ── layout ──────────────────────────────────────────────────────────────────────────────────
/** Depth-first order with parents before children; a cycle or a missing parent is dropped. */
export function rigLayout(rig: ResolvedRig): RigLayout {
  const byId = new Map(rig.parts.map((p) => [p.id, p]));
  const depth = new Map<string, number>();
  const resolve = (spec: RigPartSpec, guard: Set<string>): number => {
    const known = depth.get(spec.id);
    if (known != null) return known;
    if (!spec.parent) {
      depth.set(spec.id, 0);
      return 0;
    }
    if (guard.has(spec.id)) return -1;
    const parent = byId.get(spec.parent);
    if (!parent) return -1;
    guard.add(spec.id);
    const d = resolve(parent, guard);
    guard.delete(spec.id);
    const out = d < 0 ? -1 : d + 1;
    depth.set(spec.id, out);
    return out;
  };
  const kept: Array<{ spec: RigPartSpec; depth: number }> = [];
  for (const spec of rig.parts) {
    const d = resolve(spec, new Set());
    if (d < 0) continue;
    kept.push({ spec, depth: d });
  }
  kept.sort((a, b) => a.depth - b.depth || rig.parts.indexOf(a.spec) - rig.parts.indexOf(b.spec));
  /**
   * `count` is per PARENT UNIT, not per part.
   *
   * A teacup ride is a turntable carrying three platters carrying six cups each, and a rig format
   * that can only parent to a part rather than to each of its copies cannot express it — the cups
   * would all hang off one platter's origin. So a part whose parent draws three units draws three
   * times its own count, each relative to its own parent unit. Every rig in the bundled packs has
   * `count: 1` parents, so nothing they draw changes.
   */
  const unitsOf = new Map<string, number>();
  const parts: RigLayout['parts'] = [];
  let units = 0;
  let seats = 0;
  for (const { spec, depth } of kept) {
    const own = Math.max(1, Math.round(spec.count ?? 1));
    const parentUnits = spec.parent ? (unitsOf.get(spec.parent) ?? 1) : 1;
    const n = own * parentUnits;
    unitsOf.set(spec.id, n);
    parts.push({ spec, units: n, depth });
    units += n;
    seats += n * (spec.seats ?? 0);
  }
  return { parts, units, seats };
}

// ── the pose ────────────────────────────────────────────────────────────────────────────────
interface Node {
  position: Vec;
  quat: Quat;
  /** Angular speed about the node's own up axis, rad/s, accumulated down the tree. */
  omega: number;
  alpha: number;
}

const RING_AXES: Record<string, [Vec, Vec]> = {
  // [radial at angle 0, radial at angle 90°]
  xz: [
    [1, 0, 0],
    [0, 0, 1],
  ],
  xy: [
    [1, 0, 0],
    [0, 1, 0],
  ],
  yz: [
    [0, 0, 1],
    [0, 1, 0],
  ],
};

function paramNum(spec: RigPartSpec, key: string, fallback: number): number {
  const v = spec.params?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/**
 * Every drawn unit's transform, in the ride's own space.
 *
 * The order is `rigLayout()`'s and is stable, which is what lets the renderer allocate one thin
 * instance per unit once and write matrices into the same slots for the life of the ride.
 *
 * **A part with `count > 1` animates PER UNIT; a part with one copy animates its node.** That is
 * the rule that makes `carousel-horse`'s `y` a wave of sixteen horses on a turning platform and
 * `carousel-platform`'s `yaw` the platform itself, out of two manifest entries that look the same.
 */
export function poseRig(
  rig: ResolvedRig,
  input: PoseInput,
  out: UnitPose[] = [],
  layout: RigLayout = rigLayout(rig)
): UnitPose[] {
  let write = 0;
  /** Every part's per-unit frames, so a child can hang off each copy of its parent. */
  const nodes = new Map<string, Node[]>();
  const root: Node = { position: [0, 0, 0], quat: QI, omega: 0, alpha: 0 };

  for (const { spec } of layout.parts) {
    const parents = (spec.parent ? nodes.get(spec.parent) : undefined) ?? [root];
    const own = Math.max(1, Math.round(spec.count ?? 1));
    const single = own <= 1;
    const mine: Node[] = [];
    const radius = spec.radius ?? 0;
    const spread = spec.spread ?? 1;
    const plane = typeof spec.params?.ringPlane === 'string' ? String(spec.params.ringPlane) : 'xz';
    const [ax0, ax1] = RING_AXES[plane] ?? RING_AXES.xz;
    const ringYaw = paramNum(spec, 'yaw', 0);
    const facing = spec.facing ?? 'tangent';
    const chain = spec.chain ?? 0;
    const pendulum = spec.pendulum ?? 0;
    const offset = spec.offset ?? [0, 0, 0];

    for (const parent of parents) {
      const nodePos = add(parent.position, qRotate(parent.quat, offset));
      let nodeQuat = parent.quat;
      let omega = parent.omega;
      let alpha = parent.alpha;

      // A single-copy part animates its own node, so everything under it inherits the motion.
      if (single && spec.animate) {
        for (const [channel, curve] of entries(spec.animate)) {
          const value = channelValue(channel, curve, input, 0);
          if (ANGULAR[channel]) {
            nodeQuat = qMul(nodeQuat, qAxis(curve.axis ?? DEFAULT_AXIS[channel], value));
            if (!isOscillator(channel, curve)) {
              omega += channelOmega(curve, input);
              alpha +=
                ((curve.revolutions ?? 1) * Math.PI * 2 * input.driveRate) /
                Math.max(0.001, input.runSeconds);
            }
          }
        }
      }
      const node: Node = { position: nodePos, quat: nodeQuat, omega, alpha };

      for (let i = 0; i < own; i++) {
        const t = own === 1 && radius === 0 ? 0 : (i / own) * spread;
        const angle = t * Math.PI * 2 + paramNum(spec, 'ringPhase', 0);
        const local: Vec = [
          ax0[0] * Math.cos(angle) * radius + ax1[0] * Math.sin(angle) * radius,
          ax0[1] * Math.cos(angle) * radius + ax1[1] * Math.sin(angle) * radius,
          ax0[2] * Math.cos(angle) * radius + ax1[2] * Math.sin(angle) * radius,
        ];
        let quat: Quat = nodeQuat;
        /**
         * Which way the unit faces on its ring.
         *
         * Every shape is authored looking along its own **+X**. A yaw of `-angle` maps +X onto the
         * radial direction (`R_y(φ)·x̂ = (cos φ, 0, −sin φ)`, and the ring point at `angle` is
         * `(cos a, 0, sin a)`), so `out` is `-angle` and the tangent — the direction of travel,
         * which is what a carousel horse and a swing chair face — is a further quarter turn.
         *
         * The first version had those two the other way round, and the selftest found it by the
         * side door: the chair swing's seats came out 8.00 m at rest and **5.82 m at speed**, i.e.
         * swinging INWARD, because "outward" in the unit's frame was pointing along the ring.
         */
        if (radius > 0 && facing !== 'fixed') {
          const spin =
            facing === 'out' ? -angle : facing === 'in' ? -angle + Math.PI : -angle - Math.PI / 2;
          quat = qMul(quat, qAxis(plane === 'xz' ? 'y' : plane === 'xy' ? 'z' : 'x', spin));
        }
        if (ringYaw) quat = qMul(quat, qAxis('y', ringYaw));

        let position = add(nodePos, qRotate(nodeQuat, local));

        // A unit that has to stay level cancels every rotation above it and keeps only its yaw.
        if (spec.level) {
          quat = qAxis('y', qYaw(nodeQuat) + ringYaw);
          if (pendulum > 0) {
            const tangential = radius * node.alpha;
            quat = qMul(quat, qAxis('z', -pendulum * Math.atan2(tangential, G)));
          }
        }

        // Chains fly out. Solved, never authored — see the docblock.
        if (chain > 0) {
          const theta = chainAngle(node.omega, radius, chain);
          /**
           * Lean outward about the unit's own X.
           *
           * With `tangent` facing, local +X runs along the direction of travel and local −Z is
           * radially outward; `R_x(θ)·(0,−1,0) = (0, −cos θ, −sin θ)` swings the seat that way. A
           * `fixed`-facing unit leans in its own frame, which is what a rig author asked for by
           * saying `fixed`.
           */
          quat = qMul(quat, qAxis('x', theta));
        }

        // A repeated part animates per unit, with the ring's phase spread across it.
        if (!single && spec.animate) {
          for (const [channel, curve] of entries(spec.animate)) {
            const unitPhase = ((i / own) * (curve.phaseSpread ?? 1)) % 1;
            const value = channelValue(channel, curve, input, unitPhase);
            if (ANGULAR[channel]) {
              quat = qMul(quat, qAxis(curve.axis ?? DEFAULT_AXIS[channel], value));
            } else {
              const axis: Vec =
                channel === 'x' ? [1, 0, 0] : channel === 'y' ? [0, 1, 0] : [0, 0, 1];
              const world = qRotate(nodeQuat, axis);
              position = [
                position[0] + world[0] * value,
                position[1] + world[1] * value,
                position[2] + world[2] * value,
              ];
            }
          }
        }

        // Pooled: the renderer calls this once per ride per frame and a fresh array of objects each
        // time is 150 allocations a frame in a park with five flat rides.
        const slot = out[write];
        if (slot) {
          slot.part = spec.id;
          slot.index = i;
          slot.position = position;
          slot.quat = quat;
        } else {
          out.push({ part: spec.id, index: i, position, quat });
        }
        /**
         * A frame per UNIT, not per part.
         *
         * This is what `count`-per-parent-unit rests on: a teacup's four cups hang off each of
         * three platters, so the platters have to publish three frames and not one. The first
         * version pushed the part's own node once per parent and twelve cups came out as four,
         * stacked in one place.
         */
        mine.push({ position, quat, omega: node.omega, alpha: node.alpha });
        write += 1;
      }
    }
    nodes.set(spec.id, mine);
  }
  if (out.length > write) out.length = write;
  return out;
}

function add(a: Vec, b: Vec): Vec {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function entries(animate: Partial<Record<Channel, CurveSpec>>): Array<[Channel, CurveSpec]> {
  // Declared order, never `Object.keys` over a Set — ARCHITECTURE §1 rule 4. A plain object's
  // string keys are already insertion-ordered, and the rig is parsed from JSON in file order.
  return Object.entries(animate).filter(([, v]) => v != null) as Array<[Channel, CurveSpec]>;
}
