/**
 * The integrator: one train, one tick, along an arc-length spline.
 *
 * **This is a Δt march and `track/physics.ts` is a Δs march, and they answer different questions.**
 * `simulateTrack` exists to decide whether a layout WORKS — whether the train crests the hill —
 * and at a crest the train is slow, so a fixed Δt puts its fewest samples exactly where the answer
 * is decided; that file marches in arc length for that reason and says so. A live train cannot: it
 * is a state machine that stops, waits for a block and starts again, and a Δs march cannot
 * represent a train at rest (`track/reports/track.md` names that as the cost of its own choice).
 * So this file integrates in time, at 0.05 ride seconds a tick with four sub-steps, and uses
 * **the same force model term for term** so the two agree about the same layout. `selftest.mjs`
 * measures that agreement rather than asserting it: over `Nordwind` the live train's top speed is
 * within 1 % of `physics.maxSpeed` and its lap within 2 % of `physics.rideTimeSeconds`.
 *
 * The three terms, in the order they matter:
 *
 * - **Gravity along the track**, `−g · dh/ds`, where `dh/ds` is the mean of the tangent's Y over
 *   five points spread along the train's own length. That mean is the whole reason a long train
 *   crests a hill a short one stalls on, and it is why the last car is thrown over a crest faster
 *   than the first. `track/physics.ts` uses the mean HEIGHT of the same five points; the mean of
 *   the tangent is its derivative, which is the form a Δt march wants.
 * - **Drives.** A chain lift is a kinematic constraint, not a force — the dogs hold the train at
 *   chain speed whatever the gradient — so it clamps rather than accelerates. A launch and a brake
 *   solve `(v² − target²) / 2s` over the distance they have left, capped at 1.2 g.
 * - **Losses follow the normal force, not the distance**: rolling resistance is `µ·N` and `N` in a
 *   4 g loop is four times what it is on a straight, so a loop costs about four times the energy
 *   per metre that the straight before it does. Air drag is the usual `½ρ·C_dA·v²/m`.
 *
 * Pure: no Babylon, no DOM, no clock, no RNG. Everything it needs about the geometry arrives
 * through `TrackSampler`, which `sim.ts` builds over the track module's spline and `selftest.mjs`
 * builds over an analytic curve.
 */

import type { DriveSection } from '../track';
import {
  G,
  MAX_DRIVE_ACCEL,
  MOTION_SUBSTEPS,
  RHO,
  STALL_SPEED,
  type TrainState,
} from './types';

/** Samples spread along the train for the mean-gradient term. */
export const TRAIN_SAMPLES = 5;

/** What the integrator needs to know about the curve. */
export interface TrackSampler {
  /** Mean of the tangent's Y component over a train whose FRONT is at `s`, i.e. `dh/ds`. */
  gradeAt(s: number, trainLength: number): number;
  /** Curvature magnitude at `s`, 1/m. */
  curvatureAt(s: number): number;
  /** Wrap or clamp an arc length onto the layout. */
  wrap(s: number): number;
  length(): number;
}

/** Everything about the train and the layout that does not change during a tick. */
export interface MotionContext {
  sampler: TrackSampler;
  drives: readonly DriveSection[];
  /** Metres over couplers. */
  trainLength: number;
  /** Full train, riders included, kg. */
  massKg: number;
  /** C_d · A, m². */
  dragArea: number;
  rollingResistance: number;
  closed: boolean;
}

/**
 * A block hold in force this tick: the train must be at rest by `stop`, and the brakes that do it
 * only exist between `from` and `stop`.
 */
export interface HoldOrder {
  from: number;
  stop: number;
  /** Distance from the train's front to `stop`, along the direction of travel. */
  distance: number;
}

export interface StepResult {
  /** Metres travelled this step. */
  advanced: number;
  /** True when the train came to rest on its hold. */
  parked: boolean;
  /** True when the train ran out of energy on an upgrade with no drive to help it. */
  stalled: boolean;
}

/** Every drive section covering `s`, honouring the wrap on a circuit. */
function drivesAt(ctx: MotionContext, s: number, out: DriveSection[]): void {
  out.length = 0;
  const total = ctx.sampler.length();
  for (const d of ctx.drives) {
    if (s >= d.from && s < d.to) out.push(d);
    else if (ctx.closed && s + total >= d.from && s + total < d.to) out.push(d);
  }
}

/**
 * Advance one train by `dt` ride seconds.
 *
 * Mutates `state`. Sub-stepped so a 40 m/s train moves at most 0.5 m between force evaluations,
 * which is the same spacing `track/physics.ts` marches at and is what keeps the two agreeing
 * through a pull-out.
 */
export function stepTrain(
  state: TrainState,
  ctx: MotionContext,
  hold: HoldOrder | null,
  dt: number,
  scratch: DriveSection[]
): StepResult {
  const sub = dt / MOTION_SUBSTEPS;
  const dragK = (0.5 * RHO * ctx.dragArea) / ctx.massKg;
  const start = state.s;
  let parked = false;
  let stalled = false;
  let remaining = hold ? hold.distance : Infinity;

  for (let step = 0; step < MOTION_SUBSTEPS; step++) {
    const s = state.s;
    drivesAt(ctx, s, scratch);

    let driveAccel = 0;
    let clampTo: number | null = null;
    let floorTo: number | null = null;
    let braking = false;
    for (const d of scratch) {
      const ahead = Math.max(1, d.to - s);
      if (d.kind === 'lift') {
        clampTo = clampTo === null ? d.speed : Math.min(clampTo, d.speed);
        floorTo = floorTo === null ? d.speed : Math.max(floorTo, d.speed);
      } else if (d.kind === 'transport') {
        floorTo = floorTo === null ? d.speed : Math.max(floorTo, d.speed);
      } else if (d.kind === 'launch') {
        const want = (d.speed * d.speed - state.v * state.v) / (2 * ahead);
        driveAccel += Math.min(MAX_DRIVE_ACCEL, Math.max(0, want));
      } else if (d.kind === 'brake' || d.kind === 'block' || d.kind === 'station') {
        braking = true;
        if (state.v > d.speed) {
          const want = (state.v * state.v - d.speed * d.speed) / (2 * ahead);
          driveAccel -= Math.min(MAX_DRIVE_ACCEL, Math.max(0, want));
        }
      }
    }

    // The block hold. It is a brake, so it only acts where there are brakes: inside the hold
    // section. Outside it the train coasts and arrives at the section's brakes at whatever speed
    // the layout gives it, which is what a block brake is sized for.
    if (hold && remaining > 0 && insideHold(ctx, s, hold)) {
      // A chain that is holding a train has stopped, and so have the friction wheels.
      clampTo = null;
      floorTo = null;
      braking = true;
      const need = (state.v * state.v) / (2 * Math.max(0.05, remaining));
      driveAccel = Math.min(driveAccel, -Math.min(MAX_DRIVE_ACCEL, need));
    }

    if (clampTo !== null) state.v = Math.min(state.v, clampTo);
    if (floorTo !== null) state.v = Math.max(state.v, floorTo);

    const kappa = ctx.sampler.curvatureAt(s);
    const grade = ctx.sampler.gradeAt(s, ctx.trainLength);
    // Specific normal force: the centripetal term and gravity, which is what presses the wheels
    // into the rail. `kappa` is a magnitude here; the vertical bias is what makes a straight cost
    // µ·g and a 4 g loop cost four times that.
    const normal = Math.abs(kappa * state.v * state.v) + G;
    const loss =
      state.v > STALL_SPEED ? ctx.rollingResistance * normal + dragK * state.v * state.v : 0;
    const accel = -G * grade + driveAccel - loss;

    let v = state.v + accel * sub;
    if (v < 0) v = 0;
    if (clampTo !== null) v = Math.min(v, clampTo);
    if (floorTo !== null) v = Math.max(v, floorTo);

    // A train that runs out of energy on an upgrade with nothing driving it has stalled. The
    // layout's own validation run (`physics.complete`) is what is supposed to catch that before a
    // train is ever put on it; here it is reported and the train is left creeping, because a
    // dead train blocks its block for ever and takes the whole fleet down with it. A Δt march
    // could roll it backwards instead — the honest simulation — but a rollback meets the
    // anti-rollback dogs on the lift and needs a second state machine to model them.
    if (!braking && v < STALL_SPEED && accel < 0) {
      stalled = true;
      v = STALL_SPEED;
    }

    state.v = v;
    const advance = v * sub;
    state.s = ctx.sampler.wrap(s + advance);
    if (hold) {
      remaining -= advance;
      if (remaining <= 0) {
        state.s = ctx.sampler.wrap(hold.stop);
        state.v = 0;
        parked = true;
        break;
      }
    }
  }

  const total = ctx.sampler.length();
  let advanced = state.s - start;
  if (ctx.closed && advanced < -total / 2) advanced += total;
  return { advanced, parked, stalled };
}

/** True when `s` is inside the hold section `[from, stop]`, honouring the wrap. */
function insideHold(ctx: MotionContext, s: number, hold: HoldOrder): boolean {
  const total = ctx.sampler.length();
  const from = hold.from;
  const stop = hold.stop;
  if (stop >= from) return s >= from && s <= stop;
  // The hold section straddles the seam.
  return ctx.closed && (s >= from || s <= stop);
}

/**
 * A sampler over a `TrackSpline`-shaped object.
 *
 * Typed structurally rather than against `TrackSpline` so `selftest.mjs` can hand it an analytic
 * curve and check the integrator against a closed-form answer — a frictionless drop must arrive at
 * √(2gh), and that is not a claim a screenshot can make.
 */
export interface SplineLike {
  length(): number;
  tangentAt(s: number): readonly [number, number, number];
  curvatureAt(s: number): readonly [number, number, number];
  closed: boolean;
}

export function samplerFor(spline: SplineLike): TrackSampler {
  const total = spline.length();
  const wrap = spline.closed
    ? (s: number) => ((s % total) + total) % total
    : (s: number) => Math.min(total, Math.max(0, s));
  return {
    length: () => total,
    wrap,
    curvatureAt(s) {
      const k = spline.curvatureAt(wrap(s));
      return Math.hypot(k[0], k[1], k[2]);
    },
    gradeAt(s, trainLength) {
      let sum = 0;
      for (let i = 0; i < TRAIN_SAMPLES; i++) {
        const at = wrap(s - trainLength * (1 - i / (TRAIN_SAMPLES - 1)));
        sum += spline.tangentAt(at)[1];
      }
      return sum / TRAIN_SAMPLES;
    },
  };
}
