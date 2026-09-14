/**
 * The track spline: control nodes → a C² centreline with a roll channel, parameterised by ARC
 * LENGTH so a train at 18 m/s advances 18 metres of track per second.
 *
 * Four decisions in here are load-bearing.
 *
 * **C², not Catmull-Rom.** Curvature is what a rider feels, so a curve whose curvature jumps at a
 * control point is a jolt at that point. Catmull-Rom (and every other local interpolant) is C¹:
 * position and tangent match across a knot, the second derivative does not. This solves the
 * classical tridiagonal system for the second derivatives instead, which is C² by construction —
 * the same maths a draughtsman's spline weight does, and the reason the clothoid transitions the
 * generators emit survive being interpolated.
 *
 * **A closed circuit is splined through wrapped ghost nodes, not with a cyclic solver.** The
 * influence of a boundary condition on a natural cubic spline decays by a factor of about
 * 2 − √3 ≈ 0.268 per knot, so ten wrapped nodes at each end put the seam error at ~3 × 10⁻⁶ of a
 * node spacing — below the millimetre the mesh is drawn at. That buys exact C² continuity across
 * the station without a cyclic Thomas solver and, more importantly, without a second code path
 * that only closed tracks ever take and only closed tracks can break.
 *
 * **Roll travels in the rotation-minimising gauge.** The generators emit an explicit up-vector per
 * node (they integrate a frame; they never think in bank angles), and this file converts that to a
 * roll measured against a rotation-minimising frame computed by double reflection. The obvious
 * alternative — measuring bank against a "level" frame built from world up — has a singularity
 * exactly where a coaster spends its most interesting seconds: `cross(tangent, up)` vanishes at a
 * vertical tangent and flips sign through it, so a loop would tear its own banking in half at the
 * top. The RMF has no such point, so nothing needs a special case for going upside down.
 *
 * **Arc length is a table, not a formula.** There is no closed form for the arc length of a cubic,
 * so the constructor walks the curve at a fixed parameter step, accumulates chord length, and
 * `locate(s)` binary-searches that table and refines with one Newton step against |dP/dt|. The
 * error after the Newton step is below 10⁻⁴ m for the spacings used here, asserted by
 * `selftest.mjs` (a constant-speed march must land within a millimetre of the measured length).
 */

import {
  add,
  addScaled,
  cross,
  distance,
  dot,
  normalize,
  perpendicular,
  rotateAbout,
  scale,
  signedAngle,
  sub,
  type V3,
} from './vec';

/** One control node: a point on the centreline and the rider's up-vector there. */
export interface TrackNode {
  p: V3;
  /** Unit, and perpendicular to the local tangent to within the generator's step. */
  up: V3;
}

/** The full moving frame at an arc-length station. */
export interface TrackFrame {
  s: number;
  p: V3;
  /** Unit tangent, direction of travel. */
  tangent: V3;
  /** Rider up after roll. */
  up: V3;
  /** `cross(up, tangent)`. Points to the rider's right. */
  right: V3;
}

export interface SplineOptions {
  closed?: boolean;
  /** Parameter step for the arc-length table, in metres of chord. Default 0.2. */
  sampleStep?: number;
}

/** How many wrapped nodes are glued to each end of a closed circuit. See the file docblock. */
const WRAP = 10;

interface Axis {
  /** Second derivatives at the knots (the classical spline `M`). */
  m: Float64Array;
  y: Float64Array;
}

export class TrackSpline {
  readonly closed: boolean;
  /** The nodes as given, without the wrap. */
  readonly nodes: readonly TrackNode[];

  private knots: Float64Array = new Float64Array(0);
  private axes: Axis[] = [];
  private rollAxis: Axis = { m: new Float64Array(0), y: new Float64Array(0) };
  /** Cumulative arc length at each sample. */
  private sTable: Float64Array = new Float64Array(0);
  /** Curve parameter at each sample. */
  private tTable: Float64Array = new Float64Array(0);
  /** Rotation-minimising up-vector at each sample, flattened xyz. */
  private rmf: Float64Array = new Float64Array(0);
  /** Arc length at the first and last usable knot (the domain, excluding the wrap). */
  private s0 = 0;
  private s1 = 0;
  private total = 0;

  constructor(nodes: readonly TrackNode[], options: SplineOptions = {}) {
    this.closed = options.closed ?? false;
    this.nodes = nodes;
    const step = options.sampleStep ?? 0.2;
    const extended = this.closed ? wrapNodes(nodes) : nodes.slice();
    this.build(extended, step);
  }

  /** Length of one lap (closed) or of the whole run (open), metres. */
  length(): number {
    return this.total;
  }

  /** Arc length of the node at `index` of the ORIGINAL node array. */
  nodeArcLength(index: number): number {
    const offset = this.closed ? WRAP : 0;
    const k = index + offset;
    return this.sAtKnot(k) - this.s0;
  }

  pointAt(s: number): V3 {
    const { i, u, h } = this.locate(s);
    return [
      this.evalAxis(this.axes[0], i, u, h),
      this.evalAxis(this.axes[1], i, u, h),
      this.evalAxis(this.axes[2], i, u, h),
    ];
  }

  /** Unit tangent. */
  tangentAt(s: number): V3 {
    const { i, u, h } = this.locate(s);
    return normalize([
      this.derivAxis(this.axes[0], i, u, h),
      this.derivAxis(this.axes[1], i, u, h),
      this.derivAxis(this.axes[2], i, u, h),
    ]);
  }

  /**
   * The curvature VECTOR, 1/m, perpendicular to the tangent and pointing to the centre of the
   * osculating circle. Its magnitude is 1/radius; the physics reads it directly as `v² κ⃗`.
   */
  curvatureAt(s: number): V3 {
    const { i, u, h } = this.locate(s);
    const d: V3 = [
      this.derivAxis(this.axes[0], i, u, h),
      this.derivAxis(this.axes[1], i, u, h),
      this.derivAxis(this.axes[2], i, u, h),
    ];
    const dd: V3 = [
      this.secondAxis(this.axes[0], i, u),
      this.secondAxis(this.axes[1], i, u),
      this.secondAxis(this.axes[2], i, u),
    ];
    const speed2 = dot(d, d);
    if (speed2 < 1e-12) return [0, 0, 0];
    const t = scale(d, 1 / Math.sqrt(speed2));
    // κ⃗ = (P'' − (P''·T̂)T̂) / |P'|²
    return scale(perpendicular(dd, t), 1 / speed2);
  }

  /** Roll about the tangent, radians, in the rotation-minimising gauge. */
  rollAt(s: number): number {
    const { i, u, h } = this.locate(s);
    return this.evalAxis(this.rollAxis, i, u, h);
  }

  frameAt(s: number): TrackFrame {
    const { i, u, h, index, frac } = this.locate(s);
    const p: V3 = [
      this.evalAxis(this.axes[0], i, u, h),
      this.evalAxis(this.axes[1], i, u, h),
      this.evalAxis(this.axes[2], i, u, h),
    ];
    const tangent = normalize([
      this.derivAxis(this.axes[0], i, u, h),
      this.derivAxis(this.axes[1], i, u, h),
      this.derivAxis(this.axes[2], i, u, h),
    ]);
    const base = this.rmfAt(index, frac, tangent);
    const roll = this.evalAxis(this.rollAxis, i, u, h);
    const up = normalize(rotateAbout(base, tangent, roll), [0, 1, 0]);
    return { s, p, tangent, up, right: normalize(cross(up, tangent)) };
  }

  /** Every frame from `0` to `length()` at `step` metres, endpoint included. */
  march(step: number): TrackFrame[] {
    const n = Math.max(1, Math.round(this.total / step));
    const out: TrackFrame[] = [];
    for (let i = 0; i <= n; i++) out.push(this.frameAt((i / n) * this.total));
    return out;
  }

  // ── construction ────────────────────────────────────────────────────────────────────────
  private build(nodes: readonly TrackNode[], sampleStep: number): void {
    const n = nodes.length;
    if (n < 2) throw new Error('TrackSpline needs at least two nodes');
    // Chord-length knots. Uniform knots would make a long straight span between two nodes bulge
    // against a short one next to it; chord length is the cheap approximation to arc length that
    // keeps the parameter close to metres, which is what makes one Newton step enough below.
    const knots = new Float64Array(n);
    for (let i = 1; i < n; i++) {
      knots[i] = knots[i - 1] + Math.max(1e-4, distance(nodes[i - 1].p, nodes[i].p));
    }
    this.knots = knots;
    this.axes = [0, 1, 2].map((axis) =>
      solveNatural(
        knots,
        Float64Array.from(nodes, (nd) => nd.p[axis])
      )
    );

    // Arc length + the rotation-minimising frame, in one walk.
    const spans = n - 1;
    const sT: number[] = [];
    const tT: number[] = [];
    const rmf: number[] = [];
    let s = 0;
    let prevP = this.evalPoint(0, 0);
    let prevT = this.evalTangent(0, 0);
    // Seed the RMF with the first node's own up, made perpendicular to the tangent. Any seed
    // works — the roll channel absorbs the choice — but seeding from the node keeps the roll
    // numbers near zero for an untwisted track, which is what makes them readable in a debugger.
    let ref = normalize(perpendicular(nodes[0].up, prevT), [0, 1, 0]);
    sT.push(0);
    tT.push(0);
    rmf.push(ref[0], ref[1], ref[2]);
    for (let i = 0; i < spans; i++) {
      const h = knots[i + 1] - knots[i];
      const sub = Math.max(2, Math.ceil(h / sampleStep));
      for (let k = 1; k <= sub; k++) {
        const u = k / sub;
        const t = knots[i] + h * u;
        const p = this.evalPoint(i, u);
        const tan = this.evalTangent(i, u);
        s += distance(prevP, p);
        ref = doubleReflection(prevP, prevT, ref, p, tan);
        sT.push(s);
        tT.push(t);
        rmf.push(ref[0], ref[1], ref[2]);
        prevP = p;
        prevT = tan;
      }
    }
    this.sTable = Float64Array.from(sT);
    this.tTable = Float64Array.from(tT);
    this.rmf = Float64Array.from(rmf);

    const first = this.closed ? WRAP : 0;
    const last = this.closed ? n - 1 - WRAP : n - 1;
    this.s0 = this.sAtKnot(first);
    this.s1 = this.sAtKnot(last);
    this.total = this.s1 - this.s0;

    // Roll per node: the signed angle from the RMF reference to the node's own up, unwrapped so
    // the roll channel is a continuous function and not a saw-tooth at ±π.
    const rolls = new Float64Array(n);
    let previous = 0;
    for (let i = 0; i < n; i++) {
      const sNode = this.sAtKnot(i);
      const sample = this.sampleIndexFor(sNode);
      const tangent = this.tangentAtSample(sample);
      const base: V3 = [this.rmf[sample * 3], this.rmf[sample * 3 + 1], this.rmf[sample * 3 + 2]];
      const raw = signedAngle(base, nodes[i].up, tangent);
      const unwrapped = previous + wrapPi(raw - previous);
      rolls[i] = unwrapped;
      previous = unwrapped;
    }
    this.rollAxis = solveNatural(knots, rolls);
  }

  // ── evaluation helpers ──────────────────────────────────────────────────────────────────
  private evalPoint(i: number, u: number): V3 {
    const h = this.knots[i + 1] - this.knots[i];
    return [
      this.evalAxis(this.axes[0], i, u, h),
      this.evalAxis(this.axes[1], i, u, h),
      this.evalAxis(this.axes[2], i, u, h),
    ];
  }

  private evalTangent(i: number, u: number): V3 {
    const h = this.knots[i + 1] - this.knots[i];
    return normalize([
      this.derivAxis(this.axes[0], i, u, h),
      this.derivAxis(this.axes[1], i, u, h),
      this.derivAxis(this.axes[2], i, u, h),
    ]);
  }

  private evalAxis(axis: Axis, i: number, u: number, h: number): number {
    const a = 1 - u;
    const b = u;
    return (
      a * axis.y[i] +
      b * axis.y[i + 1] +
      (((a * a * a - a) * axis.m[i] + (b * b * b - b) * axis.m[i + 1]) * h * h) / 6
    );
  }

  /** d/dt of the span. */
  private derivAxis(axis: Axis, i: number, u: number, h: number): number {
    const a = 1 - u;
    const b = u;
    return (
      (axis.y[i + 1] - axis.y[i]) / h +
      (((3 * b * b - 1) * axis.m[i + 1] - (3 * a * a - 1) * axis.m[i]) * h) / 6
    );
  }

  /** d²/dt² of the span — linear in u, which is what makes the whole curve C². */
  private secondAxis(axis: Axis, i: number, u: number): number {
    return (1 - u) * axis.m[i] + u * axis.m[i + 1];
  }

  private sAtKnot(k: number): number {
    const t = this.knots[k];
    // The sample table starts every span exactly on its knot, so a search for the parameter is
    // exact rather than interpolated.
    let lo = 0;
    let hi = this.tTable.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.tTable[mid] < t - 1e-9) lo = mid + 1;
      else hi = mid;
    }
    return this.sTable[lo];
  }

  private sampleIndexFor(s: number): number {
    let lo = 0;
    let hi = this.sTable.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sTable[mid] < s) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  private tangentAtSample(index: number): V3 {
    const t = this.tTable[Math.min(index, this.tTable.length - 1)];
    const i = this.spanOf(t);
    const h = this.knots[i + 1] - this.knots[i];
    const u = (t - this.knots[i]) / h;
    return this.evalTangent(i, u);
  }

  private spanOf(t: number): number {
    let lo = 0;
    let hi = this.knots.length - 2;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.knots[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  /**
   * Arc length → span index, local parameter, span width, plus where in the sample table we
   * landed (the frame interpolation needs that and re-searching would double the cost).
   */
  private locate(sIn: number): { i: number; u: number; h: number; index: number; frac: number } {
    let s = sIn;
    if (this.closed) {
      const l = this.total;
      s = ((s % l) + l) % l;
    } else {
      s = s < 0 ? 0 : s > this.total ? this.total : s;
    }
    const target = s + this.s0;
    const table = this.sTable;
    let lo = 0;
    let hi = table.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (table[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const index = Math.max(1, lo);
    const sA = table[index - 1];
    const sB = table[index];
    const frac = sB - sA > 1e-12 ? (target - sA) / (sB - sA) : 0;
    let t = this.tTable[index - 1] + (this.tTable[index] - this.tTable[index - 1]) * frac;
    // One Newton step against |dP/dt|: the linear guess above is exact for a straight and off by
    // the sagitta of the sample step on a curve, which at 0.2 m samples is sub-millimetre already
    // — the step is what makes it sub-micron and costs one evaluation.
    let i = this.spanOf(t);
    let h = this.knots[i + 1] - this.knots[i];
    let u = (t - this.knots[i]) / h;
    const speed = Math.hypot(
      this.derivAxis(this.axes[0], i, u, h),
      this.derivAxis(this.axes[1], i, u, h),
      this.derivAxis(this.axes[2], i, u, h)
    );
    if (speed > 1e-9) {
      const measured = sA + (sB - sA) * frac;
      t += (target - measured) / speed;
      t = Math.min(this.knots[this.knots.length - 1], Math.max(this.knots[0], t));
      i = this.spanOf(t);
      h = this.knots[i + 1] - this.knots[i];
      u = (t - this.knots[i]) / h;
    }
    return { i, u: Math.min(1, Math.max(0, u)), h, index, frac };
  }

  private rmfAt(index: number, frac: number, tangent: V3): V3 {
    const a = index - 1;
    const b = Math.min(index, this.sTable.length - 1);
    const va: V3 = [this.rmf[a * 3], this.rmf[a * 3 + 1], this.rmf[a * 3 + 2]];
    const vb: V3 = [this.rmf[b * 3], this.rmf[b * 3 + 1], this.rmf[b * 3 + 2]];
    const mixed = add(scale(va, 1 - frac), scale(vb, frac));
    return normalize(perpendicular(mixed, tangent), [0, 1, 0]);
  }
}

/** Wrap `WRAP` nodes from each end onto the other, for the ghost-node closure. */
function wrapNodes(nodes: readonly TrackNode[]): TrackNode[] {
  const n = nodes.length;
  if (n < 4) throw new Error('a closed track needs at least four nodes');
  // The last node of a closed run repeats the first; drop it so the wrap does not double it.
  const core = distance(nodes[0].p, nodes[n - 1].p) < 1e-6 ? nodes.slice(0, n - 1) : nodes.slice();
  const m = core.length;
  const wrap = Math.min(WRAP, m - 1);
  const out: TrackNode[] = [];
  for (let i = m - wrap; i < m; i++) out.push(core[i]);
  for (const node of core) out.push(node);
  for (let i = 0; i <= wrap; i++) out.push(core[i % m]);
  return out;
}

/**
 * The classical natural-cubic-spline solve: a symmetric tridiagonal system for the second
 * derivatives, run through the Thomas algorithm. O(n) and unconditionally stable — the matrix is
 * diagonally dominant for any strictly increasing knot vector, which chord length guarantees.
 */
function solveNatural(knots: Float64Array, y: Float64Array): Axis {
  const n = y.length;
  const m = new Float64Array(n);
  if (n < 3) return { m, y };
  const a = new Float64Array(n);
  const b = new Float64Array(n);
  const c = new Float64Array(n);
  const d = new Float64Array(n);
  b[0] = 1;
  b[n - 1] = 1;
  for (let i = 1; i < n - 1; i++) {
    const h0 = knots[i] - knots[i - 1];
    const h1 = knots[i + 1] - knots[i];
    a[i] = h0;
    b[i] = 2 * (h0 + h1);
    c[i] = h1;
    d[i] = 6 * ((y[i + 1] - y[i]) / h1 - (y[i] - y[i - 1]) / h0);
  }
  for (let i = 1; i < n; i++) {
    const w = a[i] / b[i - 1];
    b[i] -= w * c[i - 1];
    d[i] -= w * d[i - 1];
  }
  m[n - 1] = d[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; i--) m[i] = (d[i] - c[i] * m[i + 1]) / b[i];
  return { m, y };
}

/**
 * One step of the double-reflection rotation-minimising frame (Wang, Jüttler, Zheng, Liu 2008).
 *
 * Two reflections carry the reference vector from one sample to the next with no twist about the
 * tangent — which is what "rotation-minimising" means. The naive alternative, projecting the
 * previous up onto the new normal plane, accumulates a torsion error that shows up as a slow
 * corkscrew on a long track; the Frenet frame is worse still, because it flips through every
 * inflection point and is undefined on a straight.
 */
function doubleReflection(p0: V3, t0: V3, r0: V3, p1: V3, t1: V3): V3 {
  const v1 = sub(p1, p0);
  const c1 = dot(v1, v1);
  if (c1 < 1e-16) return r0;
  const rL = addScaled(r0, v1, (-2 / c1) * dot(v1, r0));
  const tL = addScaled(t0, v1, (-2 / c1) * dot(v1, t0));
  const v2 = sub(t1, tL);
  const c2 = dot(v2, v2);
  if (c2 < 1e-16) return normalize(perpendicular(rL, t1), r0);
  const r1 = addScaled(rL, v2, (-2 / c2) * dot(v2, rL));
  return normalize(perpendicular(r1, t1), r0);
}

/** Fold an angle into (−π, π]. */
function wrapPi(a: number): number {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x <= -Math.PI) x += Math.PI * 2;
  return x;
}
