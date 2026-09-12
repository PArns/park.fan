/**
 * The primitive instruction set every track element is written in.
 *
 * Eight ops. An element is a list of them with its parameters substituted in, so a new element is
 * *data* — see `elements.ts`. Nothing in this file switches on an element id; it switches on an
 * op, which is the instruction set, and an instruction set is allowed to be finite.
 *
 * Everything here is shaped by two rules taken from real track:
 *
 * **Curvature never steps.** Every op that curves ramps its curvature in and out over a clothoid
 * transition — curvature linear in arc length, the Cornu spiral — because a step in curvature is a
 * step in lateral force, which is what a rider calls a jolt and an engineer calls infinite jerk.
 * It is why a modern loop is a teardrop and not a circle, and it is why the transition lengths
 * below are computed from a roll-rate limit rather than typed in.
 *
 * **Speed is an input to the shape, not just an output.** A crest that gives airtime at 30 m/s
 * gives a bruising 1.8 g at 15 m/s, because the shape that produces a given acceleration depends
 * on v². So the ops read a running speed estimate off `OpContext` and shape themselves against it:
 * `crest` solves its radius from the g it was asked for, `loop` from the centripetal load it was
 * asked to hold, `spin` from the lateral load. That estimate is refined by the real physics pass
 * and the banking is then recomputed against it (`bank.ts`), which is the two-pass design a human
 * does by hand.
 */

import { TrackCursor } from './cursor';
import {
  clamp,
  G,
  normalize,
  perpendicular,
  signedAngle,
  smootherstep,
  toRad,
  type V3,
} from './vec';

/** Roll-rate ceiling, radians per metre of track. 0.05 rad/m is 2.9°/m — 72 °/s at 25 m/s. */
export const MAX_ROLL_PER_M = 0.05;
/** No speed estimate is allowed below this; a division by v² has to stay finite. */
const MIN_SPEED = 2.5;
/** Fraction of a crest spent ramping its curvature in and out at each end. */
const CREST_EDGE = 0.2;
/** Tightest a loop may draw itself, 1/m — 3.5 m of radius. */
const MAX_LOOP_CURVATURE = 1 / 3.5;
/**
 * Fraction of a loop spent ramping its curvature in from, and back out to, its neighbours.
 *
 * 0.16, not 0.1: at 28 m/s a 10 % edge takes the rider from 1 g to 4.2 g in a third of a second,
 * which measured 17.7 g/s of jerk — a snap, where the rest of the same layout sits at 3–5.
 */
const LOOP_EDGE = 0.16;
/** Fraction of a roll spent ramping the roll RATE in and out. */
const ROLL_EDGE = 0.25;

export interface OpContext {
  cursor: TrackCursor;
  /** Running speed estimate, m/s. Ops read and update it. */
  speed: number;
  /** Combined rolling + drag deceleration used while shaping, m/s². */
  loss: number;
  /** Design speed the layout was drawn for; the fallback when the estimate is useless. */
  designSpeed: number;
}

export type OpHandler = (ctx: OpContext, args: Record<string, number>) => void;

/** Speed after climbing `dy` over `ds` metres of track, from the running estimate. */
function speedAfter(ctx: OpContext, dy: number, ds: number): number {
  const v2 = ctx.speed * ctx.speed - 2 * G * dy - 2 * ctx.loss * ds;
  return Math.sqrt(Math.max(v2, MIN_SPEED * MIN_SPEED));
}

function finish(ctx: OpContext, y0: number, s0: number): void {
  ctx.speed = speedAfter(ctx, ctx.cursor.p[1] - y0, ctx.cursor.s - s0);
}

/**
 * The clothoid transition length for a turn of radius `radius` banked to `bank` radians.
 *
 * Two limits, whichever is longer: the bank has to arrive at no more than `MAX_ROLL_PER_M`, and
 * the transition should be a decent fraction of the radius so the curvature ramp is gentle. Both
 * are then capped by the arc the turn actually has to spare — a 30° turn on a 12 m radius is only
 * 6.3 m of arc and cannot afford a 20 m transition at each end.
 */
function transitionLength(radius: number, bank: number, arcLength: number, asked: number): number {
  const wanted = asked > 0 ? asked : Math.max(0.35 * radius, Math.abs(bank) / MAX_ROLL_PER_M, 4);
  return Math.min(wanted, arcLength * 0.5);
}

/** Curvature as a fraction of the peak along a clothoid-in / arc / clothoid-out run. */
function clothoid(s: number, total: number, transition: number): number {
  if (transition <= 1e-6) return 1;
  if (s < transition) return s / transition;
  if (s > total - transition) return Math.max(0, (total - s) / transition);
  return 1;
}

/** d(clothoid)/ds — the bank follows the curvature, so it needs the same slope. */
function clothoidSlope(s: number, total: number, transition: number): number {
  if (transition <= 1e-6) return 0;
  if (s < transition) return 1 / transition;
  if (s > total - transition) return -1 / transition;
  return 0;
}

/** A flat-topped window with C² ends; mean value 1 − `edge`. */
function window(u: number, edge: number): number {
  if (u < edge) return smootherstep(u / edge);
  if (u > 1 - edge) return smootherstep((1 - u) / edge);
  return 1;
}

/**
 * The bank the track currently carries relative to level, radians, positive = rolled to the
 * rider's right. Undefined within 11° of vertical, where it returns 0 and the caller holds.
 */
function currentBank(cursor: TrackCursor): number {
  if (Math.abs(cursor.dir[1]) > 0.98) return 0;
  const levelUp = normalize(perpendicular([0, 1, 0], cursor.dir), cursor.up);
  return signedAngle(levelUp, cursor.up, cursor.dir);
}

// ── the ops ───────────────────────────────────────────────────────────────────────────────

const straight: OpHandler = (ctx, args) => {
  const y0 = ctx.cursor.p[1];
  const s0 = ctx.cursor.s;
  ctx.cursor.setBankMode('fixed');
  ctx.cursor.advance(Math.max(0.05, args.length ?? 1));
  finish(ctx, y0, s0);
};

/**
 * A turn about the world vertical, banked.
 *
 * Rotating the frame about world up preserves the vertical component of the tangent, so this same
 * op is also the helix primitive: pitch first, then turn, and the track winds at a constant
 * gradient. The bank written here is a starting geometry only — the second pass replaces it with
 * the angle that cancels lateral force at the speed the train really carries (`bank.ts`).
 */
const turn: OpHandler = (ctx, args) => {
  const angle = args.angle ?? 0;
  const radius = Math.max(3, args.radius ?? 20);
  if (Math.abs(angle) < 1e-4) return;
  const y0 = ctx.cursor.p[1];
  const s0 = ctx.cursor.s;
  const arc = Math.abs(angle) * radius;
  // Full banking cancels the lateral force: tan φ = v² / (g R). `bank` overrides it, `bankFactor`
  // scales it — a wooden coaster is deliberately under-banked, which is where its rattle lives.
  const auto = Math.atan((ctx.speed * ctx.speed) / (G * radius));
  const bank = args.bank !== undefined ? args.bank : auto * (args.bankFactor ?? 1);
  const transition = transitionLength(radius, bank, arc, args.transition ?? 0);
  // A clothoid of length L on radius R turns L/2R, so the pair of them turn one transition's
  // worth between them: the constant-radius arc is `arc − transition` and the element is one
  // transition longer than the pure arc it replaces.
  const length = arc + transition;
  const sign = Math.sign(angle);
  const from = currentBank(ctx.cursor);
  // Positive roll tilts the rider's up toward their right; a LEFT turn (positive angle about +Y)
  // pulls them left, so the bank that cancels it is negative.
  const to = -sign * bank;
  ctx.cursor.setBankMode('auto', 1);
  ctx.cursor.advance(length, (u) => {
    const s = u * length;
    const k = clothoid(s, length, transition);
    return {
      omega: [0, (sign * k) / radius, 0],
      roll: (to - from) * clothoidSlope(s, length, transition),
    };
  });
  finish(ctx, y0, s0);
};

/**
 * Change the vertical angle by `angle` on a radius, about the level axis captured at the start.
 *
 * The axis is captured once and held: recomputing `cross(dir, worldUp)` every substep is undefined
 * at a vertical tangent and flips sign through it, which would tear a lift hill's crest in half on
 * any layout steep enough to need one.
 */
const pitch: OpHandler = (ctx, args) => {
  const angle = args.angle ?? 0;
  // `gLoad` is the change in vertical load the arc is allowed to add, and it is the honest way to
  // size a pull-out: the radius that gives 2.6 extra g at 30 m/s gives 12 g at the same radius on
  // a faster layout. A radius typed in stays typed in; this one follows the train.
  const radius = Math.max(
    4,
    args.gLoad ? (ctx.speed * ctx.speed) / (Math.max(0.1, args.gLoad) * G) : (args.radius ?? 30)
  );
  if (Math.abs(angle) < 1e-4) return;
  const y0 = ctx.cursor.p[1];
  const s0 = ctx.cursor.s;
  const axis = ctx.cursor.pitchAxis();
  const arc = Math.abs(angle) * radius;
  const transition = Math.min(args.transition ?? radius * 0.45, arc * 0.5);
  const length = arc + transition;
  const sign = Math.sign(angle);
  ctx.cursor.setBankMode('fixed');
  ctx.cursor.advance(length, (u) => {
    const rate = (sign * clothoid(u * length, length, transition)) / radius;
    return { omega: [axis[0] * rate, axis[1] * rate, axis[2] * rate] };
  });
  finish(ctx, y0, s0);
};

/** Roll to an absolute bank over `length` metres, holding the current heading. */
const bankTo: OpHandler = (ctx, args) => {
  const target = args.angle ?? 0;
  const y0 = ctx.cursor.p[1];
  const s0 = ctx.cursor.s;
  const delta = target - currentBank(ctx.cursor);
  const length = Math.max(args.length ?? Math.abs(delta) / MAX_ROLL_PER_M, 1);
  ctx.cursor.setBankMode('fixed');
  ctx.cursor.advance(length, (u) => ({ roll: rollRate(delta, length, u) }));
  finish(ctx, y0, s0);
};

/**
 * The roll rate at `u` for a total of `angle` radians over `length` metres.
 *
 * A flat-topped window rather than a raised cosine. Both start and end at zero rate, which is what
 * keeps a roll from snapping at the shoulders — but the cosine's peak is twice its mean, and a
 * 360° roll over 77 m of a zero-g hill came out at 264°/s where the flat top gives 125.
 */
function rollRate(angle: number, length: number, u: number): number {
  return (angle / length / (1 - ROLL_EDGE)) * window(u, ROLL_EDGE);
}

/** A free roll about the direction of travel: the inline twist, and half of a zero-g roll. */
const roll: OpHandler = (ctx, args) => {
  const angle = args.angle ?? 0;
  const length = Math.max(args.length ?? Math.abs(angle) / MAX_ROLL_PER_M, 1);
  const y0 = ctx.cursor.p[1];
  const s0 = ctx.cursor.s;
  ctx.cursor.setBankMode('fixed');
  // Raised cosine so the roll RATE starts and ends at zero: a roll that begins at full rate is a
  // step in angular acceleration and it is felt as a snap at the rider's shoulders.
  ctx.cursor.advance(length, (u) => ({ roll: rollRate(angle, length, u) }));
  finish(ctx, y0, s0);
};

/**
 * A hill or a valley shaped by the g it is meant to deliver.
 *
 * κ = (1 − g)·G / v² is the curvature that leaves the rider at `g` over a crest — `g = 0` is a
 * true airtime hill and the shape that comes out is the parabola a thrown ball follows, because
 * that is literally what the train is doing. A valley is the same formula with `g > 1`. Solving
 * the radius from the force rather than typing one in is what keeps an element honest when the
 * layout around it changes and the train arrives 5 m/s faster.
 *
 * **The speed used is the one at the ENTRY, held for the whole crest.** Feeding back the
 * instantaneous v — which is what "constant g" literally asks for — diverges, and it took a
 * −196 m layout to notice: a crest that tightens as the train slows climbs harder, which slows it
 * further, and at g = 0 that loop has no fixed point, so the shape runs away into a 60 cm radius
 * at the top. Real hills are drawn to a radius and the load is what varies across them; that is
 * what this does, and `physics.ts` reports the load that actually results rather than the one that
 * was asked for.
 */
const crest: OpHandler = (ctx, args) => {
  const gTarget = args.g ?? 0;
  const length = Math.max(2, args.length ?? 30);
  const y0 = ctx.cursor.p[1];
  const s0 = ctx.cursor.s;
  const axis = ctx.cursor.pitchAxis();
  const rollTotal = args.roll ?? 0;
  const v = Math.max(MIN_SPEED, ctx.speed);
  // An explicit radius wins, and `hill` always passes one: it sizes the crest from the speed at
  // the FOOT of the hill, while a crest called after a pitch-up would otherwise re-read a speed
  // that has already dropped a few metres' worth and over-rotate by (v_foot / v_crest)² — 7.6° of
  // residual pitch on a 10 m hill, which is a layout that never comes back to level.
  const kappa =
    args.radius && args.radius > 0
      ? -Math.sign(1 - gTarget) / args.radius
      : (-(1 - gTarget) * G) / (v * v);
  ctx.cursor.setBankMode('fixed');
  ctx.cursor.advance(length, (u) => {
    const rate = kappa * window(u, CREST_EDGE);
    return {
      omega: [axis[0] * rate, axis[1] * rate, axis[2] * rate],
      roll: rollTotal === 0 ? 0 : rollRate(rollTotal, length, u),
    };
  });
  finish(ctx, y0, s0);
};

/**
 * The clothoid vertical loop, generated from the load it is asked to hold.
 *
 * A circular loop entered fast enough to survive the top pulls about 6 g at the bottom; the fix,
 * which Werner Stengel published in 1976 and every looping coaster since has used, is to hold the
 * CENTRIPETAL acceleration constant instead of the radius. That makes the radius track v²: wide
 * where the train is fast at the bottom, tight where it has slowed at the top. The teardrop shape
 * everybody recognises is the consequence, not the goal.
 *
 * So the op integrates κ(s) = a_c / v(s)² with v from energy, about a fixed level axis, until the
 * pitch has come all the way round. `height` bisects on a_c to land the top where the layout wants
 * it; `g` sets a_c directly and lets the height fall out.
 */
const loop: OpHandler = (ctx, args) => {
  const y0 = ctx.cursor.p[1];
  const s0 = ctx.cursor.s;
  const axis = ctx.cursor.pitchAxis();
  const pitch0 = ctx.cursor.pitch();
  const v0 = ctx.speed;

  /**
   * March a candidate loop of length `length` and report how far round it actually got.
   *
   * The curvature is tapered at both ends, because a loop that starts at its full 1/24 m tore a
   * 7.7 g spike out of the spline where a drop's pull-out — which ends at zero curvature — handed
   * over to it. The taper is a fraction of the loop's OWN length, so the length and the taper
   * depend on each other; the loop below is a damped fixed point on that, and it terminates by
   * construction because every pass marches a bounded distance.
   */
  const march = (ac: number, length: number): { theta: number; apex: number } => {
    // 2 cm: the pre-integration and the cursor's own midpoint integration have to agree.
    const step = 0.02;
    const steps = Math.max(4, Math.round(length / step));
    const ds = length / steps;
    let theta = 0;
    let dy = 0;
    let apex = 0;
    for (let i = 0; i < steps; i++) {
      const s = (i + 0.5) * ds;
      const v2 = Math.max(MIN_SPEED * MIN_SPEED, v0 * v0 - 2 * G * dy - 2 * ctx.loss * s);
      const k = Math.min(ac / v2, MAX_LOOP_CURVATURE) * window(s / length, LOOP_EDGE);
      dy += Math.sin(pitch0 + theta + (k * ds) / 2) * ds;
      theta += k * ds;
      if (dy > apex) apex = dy;
    }
    return { theta, apex };
  };

  /** The length at which the loop comes exactly once round. */
  const solveLength = (ac: number): number => {
    // A first guess from the untapered curvature at the entry, then scale by how far short (or
    // long) the tapered march came. Six passes land inside a millimetre.
    let length = (2 * Math.PI * v0 * v0) / Math.max(ac, 1);
    for (let i = 0; i < 6; i++) {
      const { theta } = march(ac, length);
      if (theta < 1e-4) break;
      length *= clamp((Math.PI * 2) / theta, 0.35, 3);
    }
    return length;
  };

  let ac = (args.g ?? 3.2) * G;
  if ((args.height ?? 0) > 0) {
    // Bisection on the centripetal load: a bigger a_c means a tighter loop and a lower apex, so
    // the apex is monotone in a_c and eighteen halvings put it within a millimetre.
    let lo = 1.2 * G;
    let hi = 9 * G;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (march(mid, solveLength(mid)).apex > (args.height as number)) lo = mid;
      else hi = mid;
    }
    ac = (lo + hi) / 2;
  }
  const length = solveLength(ac);
  ctx.cursor.setBankMode('fixed');
  ctx.cursor.advance(length, (u, st) => {
    const v2 = Math.max(
      MIN_SPEED * MIN_SPEED,
      v0 * v0 - 2 * G * (st.p[1] - y0) - 2 * ctx.loss * (st.s - s0)
    );
    // Clamped: a loop the train cannot clear would otherwise draw itself as a 30 cm knot at the
    // top rather than as a loop that fails, and a failure has to be legible.
    const rate = Math.min(ac / v2, MAX_LOOP_CURVATURE) * window(u, LOOP_EDGE);
    return { omega: [axis[0] * rate, axis[1] * rate, axis[2] * rate] };
  });
  finish(ctx, y0, s0);
};

/**
 * A corkscrew: the track winds around a fixed axis while the rider stays on the inside.
 *
 * The whole element is one rigid rotation of the frame about an axis â, which is what makes it
 * come out of a four-line op instead of a page of helix algebra. Two facts do the work. Rotating a
 * frame rigidly about an axis keeps its up-vector pointing at that axis, so the rider stays on the
 * inside of the helix for free. And integrating a rigidly precessing tangent gives a helix, so the
 * path is right without ever being written down. Exactly 360° of rotation is the identity, so a
 * one-turn corkscrew exits on the heading and the bank it entered with — which is why real ones
 * come in whole turns.
 *
 * â sits at the helix angle from the entry tangent, in the plane the rider's up is normal to; the
 * radius follows from the rotation rate and the rate follows from the lateral load asked for, so a
 * corkscrew entered slowly comes out tighter rather than gentler. The rate is windowed so the ends
 * blend into what they join instead of starting at full curvature.
 */
const spin: OpHandler = (ctx, args) => {
  const turns = args.turns ?? 1;
  const radius = Math.max(2, args.radius ?? 5);
  const hand = (args.hand ?? 1) >= 0 ? 1 : -1;
  const y0 = ctx.cursor.p[1];
  const s0 = ctx.cursor.s;
  const v = Math.max(MIN_SPEED, ctx.speed);
  const kappa = ((args.g ?? 3) * G) / (v * v);
  const omegaPeak = Math.sqrt(kappa / radius);
  const alpha = Math.asin(clamp(radius * omegaPeak, 0, 0.94));
  const edge = 0.2;
  // The window's mean is 1 − edge, so that is the factor between the peak rate and the average
  // one, and the length has to pay it back to still come round exactly `turns` times.
  const length = (2 * Math.PI * Math.abs(turns)) / (omegaPeak * (1 - edge));
  const dir0 = ctx.cursor.dir;
  const right0 = ctx.cursor.right();
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha) * hand;
  const axis: V3 = normalize([
    ca * dir0[0] + sa * right0[0],
    ca * dir0[1] + sa * right0[1],
    ca * dir0[2] + sa * right0[2],
  ]);
  // `right` is the rider's right and `right × dir = −up`, so the rotation that curves the track
  // TOWARDS the helix axis (which sits one radius along the rider's up) runs against `hand`.
  const sign = -hand * (turns >= 0 ? 1 : -1);
  ctx.cursor.setBankMode('fixed');
  ctx.cursor.advance(length, (u) => {
    const rate = sign * omegaPeak * window(u, edge);
    return { omega: [axis[0] * rate, axis[1] * rate, axis[2] * rate] };
  });
  finish(ctx, y0, s0);
};

/**
 * Climb or fall an EXACT height at a given angle: arc in, straight, arc out.
 *
 * The lift hill and the drop are both this. The obvious closed form for the straight —
 * `(height − (R₁ + R₂)(1 − cos θ)) / sin θ` — is only right for pure circular arcs, and both arcs
 * here carry a clothoid transition that makes them rise further than that: a lift asked for 34 m
 * built 36.5, a drop asked for 33 fell 41, and the 8 m the layout did not know about turned up as
 * 7 g in the loop that followed, because the loop shapes itself from the speed it expects to be
 * entered at.
 *
 * So the straight is measured rather than derived. The rise of the two arcs is whatever it is —
 * one throwaway run of the real ops reports it — and the straight is then exactly the remainder
 * over sin θ. Height is LINEAR in the straight's length, so unlike `hill` this needs no bisection:
 * one probe and one division.
 */
const rampTo: OpHandler = (ctx, args) => {
  const height = args.height ?? 10;
  const magnitude = Math.abs(args.angle ?? 0.5);
  const angle = height >= 0 ? magnitude : -magnitude;
  const entryRadius = Math.max(4, args.entryRadius ?? 20);
  const exitRadius = Math.max(4, args.exitRadius ?? entryRadius);
  const run = (probe: OpContext, straightLength: number) => {
    pitch(probe, { angle, radius: entryRadius });
    if (straightLength > 0.05) straight(probe, { length: straightLength });
    pitch(probe, { angle: -angle, radius: exitRadius });
  };

  const scratch = new TrackCursor(ctx.cursor.p, ctx.cursor.dir, ctx.cursor.up);
  const probe: OpContext = { ...ctx, cursor: scratch };
  const y0 = scratch.p[1];
  run(probe, 0);
  const arcsOnly = scratch.p[1] - y0;
  const sinAngle = Math.sin(Math.abs(angle));
  const remaining = (height - arcsOnly) / (height >= 0 ? sinAngle : -sinAngle);
  run(ctx, Math.max(0, remaining));
};

/**
 * A symmetric hill: up-arc, crest, down-arc, back to the entry pitch.
 *
 * The two radii are solved from forces rather than typed: the valley arcs from `gLoad` (the extra
 * load the pull-up is allowed to add) and the crest from `g` (what the rider gets over the top —
 * 0 for float, negative for ejector airtime).
 *
 * The entry angle is found by **running the element on a throwaway cursor and bisecting**, not
 * from the textbook `(R + r)(1 − cos θ)`. That closed form is only right for pure circular arcs,
 * and every arc here carries a clothoid transition at each end, which makes it rise further than
 * the formula says — a 10 m hill came out at 13.4 m. Measuring the real ops is exact by
 * construction and cannot drift when the ops change; sixteen halvings of a 100 m element cost
 * about thirteen thousand substeps, which is nothing next to being wrong.
 */
const hill: OpHandler = (ctx, args) => {
  const height = Math.max(0.5, args.height ?? 8);
  const gTop = args.g ?? 0;
  const gLoad = Math.max(0.2, args.gLoad ?? 1.6);
  const rollTotal = args.roll ?? 0;
  const v = Math.max(MIN_SPEED, ctx.speed);
  // The crest's radius is solved from the speed AT THE TOP, not at the foot. A hill sized from the
  // foot delivers the g it was asked for only if the train arrives at the crest as fast as it left
  // the valley, which it never does: an 8 m hop asked for −0.35 g and gave +0.18, because v² had
  // dropped by 157 m²/s² on the way up and the radius was still the one for the bottom.
  const vTop2 = Math.max(MIN_SPEED * MIN_SPEED, v * v - 2 * G * height);
  const r = vTop2 / (Math.max(0.15, 1 - gTop) * G);
  const R = (v * v) / (gLoad * G);
  // The crest's curvature is windowed at its ends, so the arc has to be that much longer to still
  // turn the nose through 2θ. Scaling the length rather than the curvature keeps the peak load
  // exactly the `g` that was asked for.
  const crestLength = (theta: number) => (2 * theta * r) / (1 - CREST_EDGE);

  const apexFor = (theta: number): number => {
    const scratch = new TrackCursor(ctx.cursor.p, ctx.cursor.dir, ctx.cursor.up);
    const probe: OpContext = { ...ctx, cursor: scratch };
    pitch(probe, { angle: theta, radius: R });
    crest(probe, { length: crestLength(theta), g: gTop, radius: r });
    let top = -Infinity;
    for (const node of scratch.nodes) if (node.p[1] > top) top = node.p[1];
    return top - ctx.cursor.p[1];
  };

  let lo = 0.01;
  let hi = 1.25;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (apexFor(mid) < height) lo = mid;
    else hi = mid;
  }
  const theta = (lo + hi) / 2;
  /**
   * The roll stays on the CREST, and that is the point of a zero-g roll.
   *
   * Spreading it over the whole hill halves the roll rate — 204 °/s becomes 94 — and it was tried
   * and reverted, because the pull-up and the pull-out are where the vertical load is highest and
   * a rolled frame turns that load sideways: the lateral g went 0.74 → 1.91 on the same layout.
   * An inversion belongs where the rider weighs nothing, which is exactly the arc `crest` draws.
   */
  pitch(ctx, { angle: theta, radius: R });
  crest(ctx, { length: crestLength(theta), g: gTop, radius: r, roll: rollTotal });
  pitch(ctx, { angle: theta, radius: R });
};

export const TRACK_OPS: Record<string, OpHandler> = {
  straight,
  turn,
  pitch,
  bank: bankTo,
  roll,
  crest,
  loop,
  spin,
  hill,
  ramp: rampTo,
};

/** Op arguments a manifest writes in degrees. Everything else is metres, seconds or g. */
export const ANGLE_ARGS = new Set(['angle', 'bank', 'roll']);

export function normalizeArgs(args: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(args))
    out[key] = ANGLE_ARGS.has(key) ? toRad(args[key]) : args[key];
  return out;
}
