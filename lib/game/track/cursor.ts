/**
 * The frame integrator every track element is written against.
 *
 * A generator does not compute points. It drives a cursor — a position and an orthonormal frame —
 * forward along the track, handing the integrator an angular rate per metre of arc. Curvature
 * therefore *is* the input, which is the only way to get a coaster's geometry right: every real
 * element is specified as a curvature and a roll programme, and the shape is what falls out.
 * Writing the shape directly and hoping the curvature is smooth is how a track ends up with a jolt
 * where two pieces meet.
 *
 * **The cursor tracks the HEARTLINE, not the rails.** The heartline is the line through the
 * riders' chests, about 1.1 m above the rail plane on a sit-down train, and modern coasters roll
 * the track around it rather than around the rails — a rider in a banked turn stays where they
 * were and the track swings underneath, instead of the rider being thrown out sideways by the
 * banking itself. Modelling it any other way means adding a correction term to every g-force
 * calculation and to every transition; modelling it this way means there is nothing to correct,
 * because the curve the physics integrates is the curve the rider actually travels. The rails are
 * derived in `profile.ts` by stepping down the up-vector.
 *
 * **Integration is midpoint, not Euler.** Rotating the frame is exact (Rodrigues by the exact
 * angle), so the only error is in the position: advancing along the entry tangent lays a polygon
 * on the outside of every curve and makes a 360° loop close short. Half-rotate, step, half-rotate
 * is second-order and costs one extra rotation per substep — over a 10 m loop at a 0.12 m substep
 * it is the difference between a 3 cm closure error and a 40 µm one.
 */

import { addScaled, clamp, cross, normalize, perpendicular, rotateAbout, type V3 } from './vec';
import type { TrackNode } from './spline';

/** Integration substep, metres. Fine enough that a 5 m radius turns 1.4° per step. */
const SUBSTEP = 0.12;

export interface CursorState {
  p: V3;
  dir: V3;
  up: V3;
  s: number;
}

/** What an element asks the integrator for over one substep. */
export interface Rates {
  /** Angular velocity of the frame in WORLD axes, radians per metre of arc. */
  omega?: V3;
  /** Extra roll about the direction of travel, radians per metre of arc. */
  roll?: number;
}

export type RateFn = (u: number, state: Readonly<CursorState>) => Rates;

/**
 * How a node's bank should be treated by the second pass.
 *
 * `fixed` — the generator meant this up-vector literally (a loop, a corkscrew, a roll).
 * `auto`  — the generator wants the bank that cancels lateral force at the speed the train will
 *           actually be doing here, blended in by `weight` so a transition ramps rather than
 *           steps. See `bank.ts`.
 */
export interface NodeBank {
  mode: 'fixed' | 'auto';
  weight: number;
}

export class TrackCursor {
  p: V3;
  dir: V3;
  up: V3;
  s = 0;

  readonly nodes: TrackNode[] = [];
  readonly banks: NodeBank[] = [];
  /** Arc length of each emitted node. */
  readonly arc: number[] = [];

  private lastEmit = -Infinity;
  private bank: NodeBank = { mode: 'fixed', weight: 0 };

  constructor(p: V3, dir: V3, up: V3) {
    this.p = [...p] as V3;
    this.dir = normalize(dir, [0, 0, 1]);
    this.up = normalize(perpendicular(up, this.dir), [0, 1, 0]);
    this.emit(true);
  }

  /**
   * The rider's right hand.
   *
   * `cross(up, dir)`, not `cross(dir, up)` — with (right, up, forward) a right-handed triple,
   * x̂ × ŷ = ẑ, so the right vector is the FIRST argument of the cross product that yields the
   * tangent. Getting it the other way round costs nothing visibly (rails are symmetric about the
   * centreline) and then silently reports every lateral g with the wrong sign.
   */
  right(): V3 {
    return normalize(cross(this.up, this.dir));
  }

  /**
   * The axis a positive rotation pitches the NOSE UP about, taken from the level heading.
   *
   * It is `cross(headingOnTheGround, worldUp)`, i.e. the rider's LEFT, because rotating about the
   * rider's right by a positive angle points the nose down. Every element that pitches captures
   * this once at its start and holds it: recomputing it per substep is undefined at a vertical
   * tangent and flips sign through one, which would tear a lift crest or a loop in half.
   */
  pitchAxis(): V3 {
    const horizontal: V3 = [this.dir[0], 0, this.dir[2]];
    const len = Math.hypot(horizontal[0], horizontal[2]);
    if (len < 1e-6) return normalize(cross(this.dir, this.up));
    return normalize(cross([horizontal[0] / len, 0, horizontal[2] / len], [0, 1, 0]));
  }

  /** Pitch above the horizon, radians. */
  pitch(): number {
    return Math.asin(clamp(this.dir[1], -1, 1));
  }

  state(): Readonly<CursorState> {
    return { p: this.p, dir: this.dir, up: this.up, s: this.s };
  }

  setBankMode(mode: 'fixed' | 'auto', weight = 1): void {
    this.bank = { mode, weight };
  }

  /**
   * Integrate `length` metres, asking `rate` for the angular rates at each substep.
   *
   * Nodes come out at a spacing derived from the curvature and the roll rate: a straight emits
   * every 2 m, a 5 m-radius corkscrew every 0.4 m. Fixed spacing would either drown a long
   * straight in nodes or under-sample the one element where the shape matters.
   */
  advance(length: number, rate: RateFn = () => ({})): void {
    if (!(length > 0)) return;
    const steps = Math.max(1, Math.ceil(length / SUBSTEP));
    const ds = length / steps;
    for (let i = 0; i < steps; i++) {
      const u = (i + 0.5) / steps;
      const r = rate(u, this.state());
      const omega = r.omega ?? [0, 0, 0];
      const rollRate = r.roll ?? 0;
      const omegaMag = Math.hypot(omega[0], omega[1], omega[2]);
      const axis: V3 =
        omegaMag > 1e-12
          ? [omega[0] / omegaMag, omega[1] / omegaMag, omega[2] / omegaMag]
          : [0, 1, 0];
      const half = (omegaMag * ds) / 2;

      if (omegaMag > 1e-12) this.rotate(axis, half);
      this.p = addScaled(this.p, this.dir, ds);
      if (omegaMag > 1e-12) this.rotate(axis, half);
      if (Math.abs(rollRate) > 1e-12) {
        this.up = normalize(
          perpendicular(rotateAbout(this.up, this.dir, rollRate * ds), this.dir),
          this.up
        );
      }
      this.s += ds;

      const spacing = Math.min(
        clamp(1 / (10 * omegaMag + 0.5), 0.4, 2),
        clamp(1 / (10 * Math.abs(rollRate) + 0.5), 0.4, 2)
      );
      if (this.s - this.lastEmit >= spacing) this.emit();
    }
    this.emit(true);
  }

  /** Force a node here. `always` skips the spacing test (op boundaries must be nodes). */
  emit(always = false): void {
    if (!always && this.s - this.lastEmit < 1e-6) return;
    if (this.nodes.length > 0 && this.s - this.lastEmit < 1e-6) return;
    this.nodes.push({ p: [...this.p] as V3, up: [...this.up] as V3 });
    this.banks.push({ ...this.bank });
    this.arc.push(this.s);
    this.lastEmit = this.s;
  }

  private rotate(axis: V3, angle: number): void {
    this.dir = normalize(rotateAbout(this.dir, axis, angle), this.dir);
    this.up = normalize(perpendicular(rotateAbout(this.up, axis, angle), this.dir), this.up);
  }
}
