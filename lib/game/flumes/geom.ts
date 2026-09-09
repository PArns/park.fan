/**
 * The shape of a water slide, as numbers.
 *
 * Pure — it returns vertex arrays and plain vectors, so `selftest.mjs` can measure a trough's wall
 * height against the speed at that point without a GPU, and `sim.ts` can place a rider without
 * Babylon. `main.ts` turns the arrays into meshes and does nothing else with geometry.
 *
 * ## The wall is the ride
 *
 * A coaster banks its track until the rider sits flat in the seat; a water slide deliberately does
 * not. It banks the trough part of the way (`FlumeStyleSpec.bankFactor`) and lets the rider climb
 * the outside of the curve, which is why an open flume's wall is low on the straights and head-high
 * through the hooks. That is not decoration: it is the one detail that separates a slide from a
 * gutter, and it is derived here rather than drawn.
 *
 * The rider is pressed into the trough by the specific force `f = v²·κ⃗ + g⃗` — the same expression
 * `track/build.ts` banks against, and the reason this module asks `track` for the speed rather than
 * guessing it. Resolve `f` in the trough's own frame: `fUp` presses the rider into the floor,
 * `fRight` pushes them sideways. A rider on a circular trough climbs until the wall's normal turns
 * the resultant back along it, which is
 *
 *     θ = atan(|fRight| / fUp)
 *
 * measured from the trough's lowest point — the same angle a motorcycle leans at, for the same
 * reason. The contact point is then `R(1 − cos θ)` above the floor, the vehicle's own half-width
 * needs `halfWidth / R` more of the arc, and a freeboard is added on top. The drawn shell grows to
 * that on the loaded side and never shrinks below its resting wrap on the other.
 *
 * Measured, on a 0.5 m body-slide trough through a 9 m hook: the wall is **27 cm at 6 m/s and
 * 58 cm at 12 m/s**. That is the number the module is for.
 *
 * Two consequences worth stating because they are what make it read: the wall grows on ONE side
 * (the section is asymmetric through every turn, which is what a photograph of a real flume shows),
 * and it grows where the speed is, so the same 9 m radius hook is walled differently at the top of
 * a slide and at the bottom.
 *
 * ## Winding
 *
 * `cross(v1 − v0, v2 − v0)` on a FRONT-facing triangle points AWAY from the visible side in this
 * scene. That is Babylon's right-handed convention and it is the opposite of the intuition; the
 * terrain, paths and track modules all carry the same note, because getting it backwards does not
 * throw and does not warn — the surface is simply culled and the slide renders as nothing at all
 * with the right vertex count in the inspector. `selftest.mjs` asserts it on a real triangle.
 */

import type { TrackFrame } from '../track';
import type { FlumeRig, FlumeStyleSpec, FlumeTowerSpec } from './types';

export type V3 = [number, number, number];

/** Vertex arrays, in `track/profile.ts`'s `Geo` shape so the two can share a mesh builder. */
export interface Geo {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

/** A second UV set and a colour channel — the water sheet needs both, the shell needs neither. */
export interface FlowGeo extends Geo {
  /** Per-vertex RGBA: rgb is the foam tint, a is how fast the sheet runs there. */
  colors: number[];
}

export const G = 9.80665;
const FRONT_FACE_SIGN = -1;
/** Beyond this angle between two section facets the lip is drawn crisp instead of smoothed. */
const COS_CREASE = Math.cos((52 * Math.PI) / 180);
/** Freeboard above the rider's contact arc, radians. 12° is the moulded lip on a real flume. */
const FREEBOARD = (12 * Math.PI) / 180;
/** Below this the rider is not pressed into the trough at all; the wall rule needs a floor. */
const MIN_PRESS = 1.5;

export function emptyGeo(): Geo {
  return { positions: [], normals: [], uvs: [], indices: [] };
}

export function emptyFlowGeo(): FlowGeo {
  return { positions: [], normals: [], uvs: [], indices: [], colors: [] };
}

export function triangleCount(geo: Geo): number {
  return geo.indices.length / 3;
}

// ── small vector helpers ────────────────────────────────────────────────────────────────────
// Deliberately local rather than imported from `track/vec.ts`: that file is not part of the track
// module's public surface (`track/index.ts` exports the spline, the builder and the physics and
// stops), and a five-line dot product is not worth reaching past a module's front door for.

export function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function normalize(a: V3, fallback: V3 = [0, 1, 0]): V3 {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : [...fallback];
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// ── the cross-section ───────────────────────────────────────────────────────────────────────

/** A point on the trough's inner face, in the frame's (right, up) plane. */
export interface Section2 {
  /** Across the trough; positive is the rider's right. */
  x: number;
  /** Above the trough's lowest point. */
  y: number;
}

/**
 * The inner face at parameter `u ∈ [−1, 1]`, for a trough of radius `R`.
 *
 * `floorFlat` is the fraction of the parameter given to a FLAT floor of half-width `R·floorFlat` —
 * 0 draws a half-pipe (a body or tube slide), 0.55 draws the flat-bottomed trough a family raft
 * needs, because a 2.6 m raft rides on its bottom and not in a groove. Past the flat the section
 * is a circular arc of radius `R` whose centre sits directly above the edge of the flat, so the
 * two meet with a common tangent and there is no crease where the floor becomes the wall.
 *
 * `phiL` and `phiR` are the angular extents of the two walls and are normally different: see the
 * file docblock.
 */
export function sectionPoint(
  u: number,
  radius: number,
  phiL: number,
  phiR: number,
  floorFlat: number
): Section2 {
  const flat = clamp(floorFlat, 0, 0.85);
  const w = radius * flat;
  if (Math.abs(u) <= flat) return { x: u * radius, y: 0 };
  const side = u > 0 ? 1 : -1;
  const phi = ((Math.abs(u) - flat) / (1 - flat)) * (side > 0 ? phiR : phiL);
  return { x: side * (w + radius * Math.sin(phi)), y: radius * (1 - Math.cos(phi)) };
}

/** The OUTWARD normal of the inner face at `u`, in the same plane. Unit length. */
export function sectionNormal(u: number, phiL: number, phiR: number, floorFlat: number): Section2 {
  const flat = clamp(floorFlat, 0, 0.85);
  if (Math.abs(u) <= flat) return { x: 0, y: -1 };
  const side = u > 0 ? 1 : -1;
  const phi = ((Math.abs(u) - flat) / (1 - flat)) * (side > 0 ? phiR : phiL);
  return { x: side * Math.sin(phi), y: -Math.cos(phi) };
}

/**
 * How far up the wall the rider goes, and therefore how far up the wall has to be there.
 *
 * `force` is `v²·κ⃗ + g⃗` in world space — the specific force pressing the rider into the trough.
 * The answer is a pair of angular extents in radians, never below the style's resting `wrap` and
 * never above its `maxWrap`, plus the SIGNED climb: positive throws the rider up the right-hand
 * wall, and `riderPose` reads that sign rather than comparing the two extents. It has to, because
 * a closed pipe declares `wallResponse: 0` — its section never changes and its rider still rides
 * up the side.
 *
 * The vehicle's own width is added as an ARC (`halfWidth / radius`) rather than as an `asin`. On a
 * body slide the two agree to a degree or so; on a family raft the hull is wider than the trough's
 * radius and the `asin` is undefined there, which is not a corner case — a 2.6 m raft in a 2.4 m
 * trough is what the whole style is.
 */
export function wallExtents(options: {
  force: V3;
  up: V3;
  right: V3;
  radius: number;
  /** Half-width of the thing that has to stay in the trough: a shoulder, a tube, a raft. */
  riderRadius: number;
  style: Pick<FlumeStyleSpec, 'wrap' | 'maxWrap' | 'wallResponse'>;
}): { left: number; right: number; climb: number } {
  const { force, up, right, radius, riderRadius, style } = options;
  const press = Math.max(MIN_PRESS, dot(force, up));
  const lateral = dot(force, right);
  const climb = Math.atan2(lateral, press);
  const body = clamp(riderRadius / Math.max(radius, 0.05), 0, 1.2);
  const needed = Math.abs(climb) + body + FREEBOARD;
  const grown = clamp(
    style.wrap + style.wallResponse * (needed - style.wrap),
    style.wrap,
    style.maxWrap
  );
  // The loaded side is the one the resultant points at: a force to the rider's right throws them
  // up the right-hand wall.
  return climb >= 0
    ? { left: style.wrap, right: grown, climb }
    : { left: grown, right: style.wrap, climb };
}

// ── sweeping ────────────────────────────────────────────────────────────────────────────────

interface RingEntry {
  p: V3;
  n: V3;
  /** Distance along the section from the start of the loop, metres. */
  u: number;
}

/** Two triangles for a quad whose corners are counter-clockwise seen from `+normal`. */
function quad(geo: Geo, a: number, b: number, c: number, d: number): void {
  if (FRONT_FACE_SIGN < 0) geo.indices.push(a, c, b, a, d, c);
  else geo.indices.push(a, b, c, a, c, d);
}

/**
 * Build one station's closed prism ring: the inner face out to the right lip, across the rim, back
 * along the outer face, across the other rim.
 *
 * A closed loop rather than four separate strips, and that is what makes the winding trivial: walk
 * the loop in one direction and every facet's normal is `T × dSection`, which points into the
 * trough on the floor and out of it underneath — automatically, with no per-surface special case.
 *
 * Each facet contributes both of its endpoints, and a normal is averaged with its neighbour only
 * where the two agree to within `COS_CREASE`. So the arc of the trough is smooth and the moulded
 * lip at the top of the wall is crisp, without a hand-written list of which edges are hard.
 */
function shellRing(
  frame: TrackFrame,
  samples: number,
  radius: number,
  phiL: number,
  phiR: number,
  floorFlat: number,
  thickness: number
): RingEntry[] {
  const m = samples * 2 + 1;
  const loop: Section2[] = [];
  for (let j = 0; j < m; j++) {
    const u = (j / (m - 1)) * 2 - 1;
    loop.push(sectionPoint(u, radius, phiL, phiR, floorFlat));
  }
  for (let j = m - 1; j >= 0; j--) {
    const u = (j / (m - 1)) * 2 - 1;
    const p = loop[j];
    const n = sectionNormal(u, phiL, phiR, floorFlat);
    loop.push({ x: p.x + n.x * thickness, y: p.y + n.y * thickness });
  }

  const count = loop.length;
  const segN: Section2[] = [];
  for (let k = 0; k < count; k++) {
    const a = loop[k];
    const b = loop[(k + 1) % count];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    // n = (−dy, dx) is the left normal of the walk; the walk is inner-face-first, so it points
    // into the trough there and out of the shell underneath.
    segN.push(len > 1e-9 ? { x: -dy / len, y: dx / len } : { x: 0, y: 1 });
  }

  const out: RingEntry[] = [];
  let along = 0;
  for (let k = 0; k < count; k++) {
    const a = loop[k];
    const b = loop[(k + 1) % count];
    const here = segN[k];
    const prev = segN[(k - 1 + count) % count];
    const next = segN[(k + 1) % count];
    const nStart =
      here.x * prev.x + here.y * prev.y > COS_CREASE
        ? { x: here.x + prev.x, y: here.y + prev.y }
        : here;
    const nEnd =
      here.x * next.x + here.y * next.y > COS_CREASE
        ? { x: here.x + next.x, y: here.y + next.y }
        : here;
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    out.push(entry(frame, a, nStart, along));
    out.push(entry(frame, b, nEnd, along + segLen));
    along += segLen;
  }
  return out;
}

function entry(frame: TrackFrame, p: Section2, n: Section2, u: number): RingEntry {
  const r = frame.right;
  const up = frame.up;
  const len = Math.hypot(n.x, n.y) || 1;
  return {
    p: [
      frame.p[0] + r[0] * p.x + up[0] * p.y,
      frame.p[1] + r[1] * p.x + up[1] * p.y,
      frame.p[2] + r[2] * p.x + up[2] * p.y,
    ],
    n: [
      (r[0] * n.x + up[0] * n.y) / len,
      (r[1] * n.x + up[1] * n.y) / len,
      (r[2] * n.x + up[2] * n.y) / len,
    ],
    u,
  };
}

/** One station of the wall rule, resolved. `sim.ts` and the mesh builder both read these. */
export interface FlumeStation {
  s: number;
  frame: TrackFrame;
  /** Speed at this station, m/s. */
  v: number;
  /** Angular extent of the left and right walls, radians. */
  phiL: number;
  phiR: number;
  /** How far up the wall the rider is thrown here, radians. */
  climb: number;
  /** Downhill gradient, `sin(slope)`, 0 on the level. Drives the water's brightness and speed. */
  fall: number;
}

/**
 * The shell: one welded mesh for the whole run.
 *
 * One mesh and never a mesh per station — a 130 m slide at the adaptive step is about 130 rings,
 * and 130 draw calls for one slide against a whole-park budget of 1,200 is the mistake
 * `track/profile.ts` records having avoided.
 */
export function buildShell(
  stations: readonly FlumeStation[],
  style: FlumeStyleSpec,
  radius: number
): Geo {
  const geo = emptyGeo();
  if (stations.length < 2) return geo;
  let previous: RingEntry[] | null = null;
  let previousBase = 0;
  for (const station of stations) {
    const ring = shellRing(
      station.frame,
      style.sectionSamples,
      radius,
      station.phiL,
      station.phiR,
      style.floorFlat,
      style.thickness
    );
    const base = geo.positions.length / 3;
    for (const e of ring) {
      geo.positions.push(e.p[0], e.p[1], e.p[2]);
      geo.normals.push(e.n[0], e.n[1], e.n[2]);
      geo.uvs.push(e.u, station.s);
    }
    if (previous && previous.length === ring.length) {
      for (let k = 0; k + 1 < ring.length; k += 2) {
        quad(geo, previousBase + k, base + k, base + k + 1, previousBase + k + 1);
      }
    }
    previous = ring;
    previousBase = base;
  }
  return geo;
}

/**
 * The sheet of water running down the floor.
 *
 * A separate surface a few centimetres above the shell's inner face rather than a shader on the
 * shell, for two reasons: it stops well short of the lip (water runs in the bottom of the trough,
 * it does not climb the wall with the rider), and it carries its own vertex channel. The alpha of
 * that channel is how fast the sheet runs at that point — `sin(slope)` plus a term from the rider's
 * own speed — and `main.ts` scrolls the normal map by it, so the water visibly accelerates into a
 * plunge and slows on the run-out. The RGB is the foam: white where it is steep, clear where it is
 * flat.
 */
export function buildWaterSheet(
  stations: readonly FlumeStation[],
  style: FlumeStyleSpec,
  radius: number
): FlowGeo {
  const geo = emptyFlowGeo();
  if (stations.length < 2) return geo;
  const samples = Math.max(3, Math.round(style.sectionSamples * 0.8));
  const m = samples * 2 + 1;
  const span = clamp(style.waterWrap, 0.05, 1);
  let previousBase = -1;
  let peak = 0.1;
  for (const st of stations) peak = Math.max(peak, st.v);
  for (const station of stations) {
    const base = geo.positions.length / 3;
    const foam = clamp(station.fall * 1.6 + (station.v / peak) * 0.3, 0, 1);
    const flow = clamp(0.25 + station.fall * 2.2 + (station.v / peak) * 0.5, 0.15, 1.6);
    for (let j = 0; j < m; j++) {
      const u = ((j / (m - 1)) * 2 - 1) * span;
      const p = sectionPoint(u, radius, station.phiL, station.phiR, style.floorFlat);
      const n = sectionNormal(u, station.phiL, station.phiR, style.floorFlat);
      // Thinner as it climbs the side: a sheet is deepest in the middle of the trough.
      const depth = style.waterDepth * (0.35 + 0.65 * (1 - Math.abs(u) / span) ** 0.6);
      const x = p.x - n.x * depth;
      const y = p.y - n.y * depth;
      const f = station.frame;
      geo.positions.push(
        f.p[0] + f.right[0] * x + f.up[0] * y,
        f.p[1] + f.right[1] * x + f.up[1] * y,
        f.p[2] + f.right[2] * x + f.up[2] * y
      );
      geo.normals.push(-n.x * f.right[0] - n.y * f.up[0], -n.x * f.right[1] - n.y * f.up[1], -n.x * f.right[2] - n.y * f.up[2]); // prettier-ignore
      geo.uvs.push(u * radius, station.s);
      /**
       * Foam brightens the edges of the sheet too — that is where it breaks against the wall.
       *
       * The floor of this ramp matters more than the ceiling. The first version started at
       * (0.72, 0.85, 0.94) and a flat run-out came out the same near-white as a 48° plunge: the
       * detail shots read as a chute full of snow. Calm water is a green-blue with the tile under
       * it showing through, and white is what the gradient BUYS, so the floor is a third of the
       * way there and foam takes it the rest.
       */
      const edge = 0.22 * Math.abs(u) ** 2;
      const white = clamp(foam + edge, 0, 1);
      geo.colors.push(0.22 + 0.78 * white, 0.52 + 0.48 * white, 0.7 + 0.3 * white, flow);
    }
    if (previousBase >= 0) {
      for (let j = 0; j + 1 < m; j++) {
        quad(geo, previousBase + j, base + j, base + j + 1, previousBase + j + 1);
      }
    }
    previousBase = base;
  }
  return geo;
}

// ── primitives for the tower ────────────────────────────────────────────────────────────────

/** An axis-aligned box, given its centre and half-extents. */
export function addBox(geo: Geo, c: V3, h: V3, uvScale = 1): void {
  const faces: Array<{ n: V3; a: V3; b: V3 }> = [
    { n: [0, 1, 0], a: [1, 0, 0], b: [0, 0, 1] },
    { n: [0, -1, 0], a: [0, 0, 1], b: [1, 0, 0] },
    { n: [1, 0, 0], a: [0, 0, -1], b: [0, 1, 0] },
    { n: [-1, 0, 0], a: [0, 0, 1], b: [0, 1, 0] },
    { n: [0, 0, 1], a: [1, 0, 0], b: [0, 1, 0] },
    { n: [0, 0, -1], a: [-1, 0, 0], b: [0, 1, 0] },
  ];
  for (const f of faces) {
    const base = geo.positions.length / 3;
    const ex: V3 = [f.a[0] * h[0], f.a[1] * h[1], f.a[2] * h[2]];
    const ey: V3 = [f.b[0] * h[0], f.b[1] * h[1], f.b[2] * h[2]];
    const o: V3 = [c[0] + f.n[0] * h[0], c[1] + f.n[1] * h[1], c[2] + f.n[2] * h[2]];
    const su = Math.hypot(ex[0], ex[1], ex[2]) * 2 * uvScale;
    const sv = Math.hypot(ey[0], ey[1], ey[2]) * 2 * uvScale;
    const corners: Array<[number, number]> = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];
    for (const [i, j] of corners) {
      geo.positions.push(o[0] + ex[0] * i + ey[0] * j, o[1] + ex[1] * i + ey[1] * j, o[2] + ex[2] * i + ey[2] * j); // prettier-ignore
      geo.normals.push(f.n[0], f.n[1], f.n[2]);
      geo.uvs.push(((i + 1) / 2) * su, ((j + 1) / 2) * sv);
    }
    quad(geo, base, base + 1, base + 2, base + 3);
  }
}

/** A capped cylinder from `a` to `b`. Used for every column, rail and handrail in the tower. */
export function addTube(geo: Geo, a: V3, b: V3, radius: number, sides = 8): void {
  const axis: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(axis[0], axis[1], axis[2]);
  if (len < 1e-6) return;
  const t = normalize(axis);
  const seed: V3 = Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = normalize(cross(t, seed));
  const e2 = normalize(cross(t, e1));
  const base = geo.positions.length / 3;
  for (let ring = 0; ring < 2; ring++) {
    const o = ring === 0 ? a : b;
    for (let i = 0; i <= sides; i++) {
      const ang = (i / sides) * Math.PI * 2;
      const nx = e1[0] * Math.cos(ang) + e2[0] * Math.sin(ang);
      const ny = e1[1] * Math.cos(ang) + e2[1] * Math.sin(ang);
      const nz = e1[2] * Math.cos(ang) + e2[2] * Math.sin(ang);
      geo.positions.push(o[0] + nx * radius, o[1] + ny * radius, o[2] + nz * radius);
      geo.normals.push(nx, ny, nz);
      geo.uvs.push((i / sides) * radius * Math.PI * 2, ring * len);
    }
  }
  const stride = sides + 1;
  for (let i = 0; i < sides; i++) {
    quad(geo, base + i, base + stride + i, base + stride + i + 1, base + i + 1);
  }
  // Caps, flat-shaded, so a column end reads as cut steel rather than as an open pipe.
  for (let ring = 0; ring < 2; ring++) {
    const o = ring === 0 ? a : b;
    const n: V3 = ring === 0 ? [-t[0], -t[1], -t[2]] : t;
    const centre = geo.positions.length / 3;
    geo.positions.push(o[0], o[1], o[2]);
    geo.normals.push(n[0], n[1], n[2]);
    geo.uvs.push(0.5, 0.5);
    for (let i = 0; i <= sides; i++) {
      const ang = (i / sides) * Math.PI * 2;
      const nx = e1[0] * Math.cos(ang) + e2[0] * Math.sin(ang);
      const ny = e1[1] * Math.cos(ang) + e2[1] * Math.sin(ang);
      const nz = e1[2] * Math.cos(ang) + e2[2] * Math.sin(ang);
      geo.positions.push(o[0] + nx * radius, o[1] + ny * radius, o[2] + nz * radius);
      geo.normals.push(n[0], n[1], n[2]);
      geo.uvs.push(0.5 + Math.cos(ang) * 0.5, 0.5 + Math.sin(ang) * 0.5);
    }
    for (let i = 0; i < sides; i++) {
      const a0 = centre + 1 + i;
      const b0 = centre + 2 + i;
      if (ring === 0) geo.indices.push(centre, a0, b0);
      else geo.indices.push(centre, b0, a0);
    }
  }
}

// ── the tower ───────────────────────────────────────────────────────────────────────────────

export interface TowerBuild {
  steel: Geo;
  deck: Geo;
  canopy: Geo;
  /** Where the stair starts on the ground, for the report and for a path request. */
  entry: V3;
  triangles: number;
}

/**
 * The structure the slide leaves from: columns, a deck, a switchback stair and a canopy.
 *
 * A slide that emerges from thin air reads as programmer art from any distance, and from the
 * `overview` preset the tower IS the slide — 130 m of 1 m trough is two pixels wide at 400 m and
 * an 18 m tower is a silhouette. So this is deliberately the tallest thing the module draws.
 *
 * The stair is a switchback because a straight flight to a 17 m deck is 50 m long and would run
 * out of the plot; real slide towers zig-zag inside their own footprint, and the landings are what
 * make the tower read as something a person climbs rather than as a mast. Treads are boxes; at
 * 0.28 m going they are two pixels at `overview` and a real step at `ground`, which is the range
 * this has to work over.
 */
export function buildTower(options: {
  spec: FlumeTowerSpec;
  /** Deck centre, world metres. */
  centre: V3;
  yaw: number;
  /** Ground height under the deck. */
  ground: number;
  /** Top of the deck boards. */
  deckY: number;
  /** How wide the chute leaving the deck is, so the deck is cut around it. */
  chuteWidth: number;
}): TowerBuild {
  const { spec, centre, yaw, ground, deckY, chuteWidth } = options;
  const steel = emptyGeo();
  const deck = emptyGeo();
  const canopy = emptyGeo();
  const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
  const [rx, rz] = [Math.cos(yaw), -Math.sin(yaw)];
  const hx = spec.footprint[0] / 2;
  const hz = spec.footprint[1] / 2;
  const at = (a: number, b: number, y: number): V3 => [
    centre[0] + rx * a + fx * b,
    y,
    centre[2] + rz * a + fz * b,
  ];

  const height = Math.max(1, deckY - ground);
  const deckThickness = 0.18;

  // Four corner columns plus a mid column per long side once the tower is tall enough to want one.
  const posts: Array<[number, number]> = [
    [-hx, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx, hz],
  ];
  if (height > 9) posts.push([-hx, 0], [hx, 0]);
  for (const [a, b] of posts) {
    addTube(steel, at(a, b, ground - 0.25), at(a, b, deckY), spec.column / 2, 8);
    // A pad footing, so the column meets the ground rather than disappearing into it.
    addBox(deck, at(a, b, ground + 0.06), [spec.column * 1.5, 0.12, spec.column * 1.5]);
  }
  // Cross-bracing between the corner columns, one X per storey.
  const storeys = Math.max(1, Math.round(height / 3.4));
  for (let s = 0; s < storeys; s++) {
    const y0 = ground + (height * s) / storeys;
    const y1 = ground + (height * (s + 1)) / storeys;
    for (let e = 0; e < 4; e++) {
      const p0 = posts[e];
      const p1 = posts[(e + 1) % 4];
      addTube(steel, at(p0[0], p0[1], y0), at(p1[0], p1[1], y1), spec.column * 0.3, 6);
      addTube(steel, at(p1[0], p1[1], y0), at(p0[0], p0[1], y1), spec.column * 0.3, 6);
      addTube(steel, at(p0[0], p0[1], y1), at(p1[0], p1[1], y1), spec.column * 0.35, 6);
    }
  }

  // The deck: two boards either side of the chute, so the flume leaves through a real gap.
  const gap = Math.max(0.5, chuteWidth / 2 + 0.12);
  const dTop = deckY - deckThickness / 2;
  addBox(
    deck,
    at(-(hx + gap) / 2 - gap / 2, 0, dTop),
    [(hx - gap) / 2, deckThickness / 2, hz],
    1.4
  );
  addBox(deck, at((hx + gap) / 2 + gap / 2, 0, dTop), [(hx - gap) / 2, deckThickness / 2, hz], 1.4);
  addBox(deck, at(0, -hz + 0.5, dTop), [gap, deckThickness / 2, 0.5], 1.4);

  // Handrail round three sides; the fourth is where the chute goes.
  const railY = deckY + spec.rail;
  const railRun: Array<[number, number, number, number]> = [
    [-hx, -hz, hx, -hz],
    [-hx, -hz, -hx, hz],
    [hx, -hz, hx, hz],
  ];
  for (const [a0, b0, a1, b1] of railRun) {
    addTube(steel, at(a0, b0, railY), at(a1, b1, railY), 0.035, 6);
    addTube(steel, at(a0, b0, railY - spec.rail * 0.45), at(a1, b1, railY - spec.rail * 0.45), 0.026, 6); // prettier-ignore
  }
  for (const [a, b] of posts) addTube(steel, at(a, b, deckY), at(a, b, railY), 0.04, 6);

  /**
   * The switchback stair, in its own shaft behind the tower.
   *
   * Two flights side by side in a band of `2 × stairWidth`, climbing in opposite directions with a
   * landing at each turn — which is how a real tower fits seventeen metres of climb into five
   * metres of plan, and what makes it read as something a person walks up.
   *
   * The first version mirrored the whole run instead of reversing along it (`at(a0, -b, y)`), and
   * `stairB` is negative, so every other flight was thrown out to the FAR side of the tower: the
   * screenshot showed a lattice wall, a landing floating in mid-air with nothing under it, and no
   * stair at all. Reversing along the band is the fix; mirroring is not the same operation.
   */
  const flights = Math.max(1, Math.round(height / spec.flightRise));
  const rise = height / flights;
  const steps = Math.max(2, Math.round(rise / spec.riser));
  const run = steps * spec.going;
  const bHi = -hz - 0.4;
  const bLo = bHi - run;
  const half = spec.stairWidth / 2;
  for (let f = 0; f < flights; f++) {
    // Even flights climb towards the tower, odd ones away from it, on the other half of the shaft.
    const towards = f % 2 === 0;
    const a0 = towards ? -half : half;
    const y0 = ground + rise * f;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const b = towards ? bLo + (bHi - bLo) * t : bHi - (bHi - bLo) * t;
      const y = y0 + rise * ((i + 1) / steps);
      addBox(deck, at(a0, b, y - spec.riser / 2), [half, spec.riser / 2, spec.going / 2], 1.6);
    }
    // Stringer and handrail along the open side of the flight.
    const bStart = towards ? bLo : bHi;
    const bEnd = towards ? bHi : bLo;
    const outer = a0 + (towards ? -half : half);
    addTube(steel, at(outer, bStart, y0 - 0.12), at(outer, bEnd, y0 + rise - 0.12), 0.055, 6);
    addTube(steel, at(outer, bStart, y0 + 0.98), at(outer, bEnd, y0 + rise + 0.98), 0.032, 6);
    // The landing at the head of the flight, spanning both halves of the shaft.
    const landY = y0 + rise;
    addBox(deck, at(0, bEnd + (towards ? 0.45 : -0.45), landY - 0.09), [spec.stairWidth, 0.09, 0.5], 1.4); // prettier-ignore
  }
  // The shaft's own four posts, so the stair stands on something.
  for (const [a, b] of [
    [-spec.stairWidth, bLo - 0.4],
    [spec.stairWidth, bLo - 0.4],
    [-spec.stairWidth, bHi + 0.4],
    [spec.stairWidth, bHi + 0.4],
  ] as Array<[number, number]>) {
    addTube(steel, at(a, b, ground - 0.25), at(a, b, deckY + 0.4), spec.column * 0.42, 7);
  }

  if (spec.canopy) {
    const postY = railY + 0.9;
    for (const [a, b] of [
      [-hx, -hz],
      [hx, -hz],
      [hx, hz],
      [-hx, hz],
    ] as Array<[number, number]>) {
      addTube(steel, at(a, b, railY), at(a, b, postY), 0.05, 6);
    }
    addBox(canopy, at(0, 0, postY + 0.12), [hx + 0.55, 0.09, hz + 0.55], 0.9);
    addBox(canopy, at(0, 0, postY + 0.34), [hx * 0.6, 0.14, hz * 0.6], 0.9);
  }

  return {
    steel,
    deck,
    canopy,
    entry: at(0, bLo - 0.9, ground),
    triangles: triangleCount(steel) + triangleCount(deck) + triangleCount(canopy),
  };
}

// ── the vehicles ────────────────────────────────────────────────────────────────────────────

export interface RigBuild {
  hull: Geo;
  rider: Geo;
  /** Seat offsets in the vehicle's own frame: across, along. */
  seats: Array<[number, number]>;
}

/**
 * The vehicle and one rider, in the vehicle's own frame (+x right, +y up, +z forward).
 *
 * Two meshes, thin-instanced per rider by `main.ts` — one instance of the hull per vehicle and one
 * of the rider per seat — so a park with twenty-five people in the air costs two draw calls per
 * style rather than fifty. Which mesh gets drawn is `FlumeRig.hull`, and `none` is a real answer:
 * a body slide has no vehicle and its rider mesh is the whole thing.
 */
export function buildRig(rig: FlumeRig): RigBuild {
  const hull = emptyGeo();
  const rider = emptyGeo();
  const r = rig.hullRadius;

  if (rig.hull === 'ring') {
    // A torus, drawn as a swept ring: the inflated tube a rider sits in.
    const major = 18;
    const minor = 7;
    const base = hull.positions.length / 3;
    for (let i = 0; i <= major; i++) {
      const a = (i / major) * Math.PI * 2;
      const cx = Math.cos(a) * (r - rig.hullTube);
      const cz = Math.sin(a) * (r - rig.hullTube);
      for (let j = 0; j <= minor; j++) {
        const b = (j / minor) * Math.PI * 2;
        const nr = Math.cos(b);
        const ny = Math.sin(b);
        hull.positions.push(
          cx + Math.cos(a) * nr * rig.hullTube,
          ny * rig.hullTube,
          cz + Math.sin(a) * nr * rig.hullTube
        );
        hull.normals.push(Math.cos(a) * nr, ny, Math.sin(a) * nr);
        hull.uvs.push((i / major) * r * 4, (j / minor) * rig.hullTube * 4);
      }
    }
    for (let i = 0; i < major; i++) {
      for (let j = 0; j < minor; j++) {
        const a0 = base + i * (minor + 1) + j;
        quad(hull, a0, a0 + minor + 1, a0 + minor + 2, a0 + 1);
      }
    }
  } else if (rig.hull === 'raft') {
    // A round raft: a flat floor with an inflated rim round it.
    const sides = 16;
    const floorBase = hull.positions.length / 3;
    hull.positions.push(0, 0, 0);
    hull.normals.push(0, 1, 0);
    hull.uvs.push(0.5, 0.5);
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      hull.positions.push(Math.cos(a) * (r - rig.hullTube), 0, Math.sin(a) * (r - rig.hullTube));
      hull.normals.push(0, 1, 0);
      hull.uvs.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
    }
    for (let i = 0; i < sides; i++) {
      hull.indices.push(floorBase, floorBase + 2 + i, floorBase + 1 + i);
    }
    const rimBase = hull.positions.length / 3;
    const minor = 6;
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const cx = Math.cos(a) * (r - rig.hullTube);
      const cz = Math.sin(a) * (r - rig.hullTube);
      for (let j = 0; j <= minor; j++) {
        const b = (j / minor) * Math.PI * 2;
        const nr = Math.cos(b);
        const ny = Math.sin(b);
        hull.positions.push(
          cx + Math.cos(a) * nr * rig.hullTube,
          rig.hullTube * 0.4 + ny * rig.hullTube,
          cz + Math.sin(a) * nr * rig.hullTube
        );
        hull.normals.push(Math.cos(a) * nr, ny, Math.sin(a) * nr);
        hull.uvs.push((i / sides) * r * 3, (j / minor) * rig.hullTube * 3);
      }
    }
    for (let i = 0; i < sides; i++) {
      for (let j = 0; j < minor; j++) {
        const a0 = rimBase + i * (minor + 1) + j;
        quad(hull, a0, a0 + minor + 1, a0 + minor + 2, a0 + 1);
      }
    }
  } else if (rig.hull === 'mat') {
    addBox(hull, [0, rig.hullTube / 2, 0], [r * 0.42, rig.hullTube / 2, r]);
  }

  // The rider: a torso, a head and two arms. Deliberately blunt — this is a person seen from ten
  // metres through moving water, and the `guests` module owns what a person looks like up close.
  const rr = rig.riderRadius;
  const seatY = rig.hull === 'none' ? rr * 0.75 : rig.hullTube * 0.9 + rr * 0.5;
  addTube(rider, [0, seatY, -rr * 1.5], [0, seatY + rr * 0.9, rr * 0.5], rr, 8);
  addTube(
    rider,
    [0, seatY + rr * 0.85, rr * 0.35],
    [0, seatY + rr * 1.75, rr * 0.55],
    rr * 0.62,
    8
  );
  addTube(rider, [-rr * 0.95, seatY + rr * 0.5, rr * 0.1], [-rr * 1.15, seatY - rr * 0.2, -rr * 0.9], rr * 0.3, 6); // prettier-ignore
  addTube(rider, [rr * 0.95, seatY + rr * 0.5, rr * 0.1], [rr * 1.15, seatY - rr * 0.2, -rr * 0.9], rr * 0.3, 6); // prettier-ignore

  const seats: Array<[number, number]> = [];
  if (rig.seats <= 1) seats.push([0, 0]);
  else {
    for (let i = 0; i < rig.seats; i++) {
      const a = (i / rig.seats) * Math.PI * 2;
      seats.push([Math.sin(a) * rig.seatSpread, Math.cos(a) * rig.seatSpread]);
    }
  }
  return { hull, rider, seats };
}

/**
 * Where a rider sits, and which way up they are.
 *
 * The rider is not on the centreline: they are wherever the wall rule says the resultant has
 * thrown them, which is what makes a slide look like a slide from the `close` camera. The returned
 * frame is the vehicle's — `right` is across the trough, `up` is out of it — and both are tilted
 * by the climb angle, so a raft in a hook leans against the wall instead of sliding through it
 * level.
 */
export function riderPose(
  station: FlumeStation,
  radius: number,
  floorFlat: number,
  vehicleRadius: number
): { position: V3; right: V3; up: V3; forward: V3 } {
  const f = station.frame;
  // The SIGNED climb, straight off the wall rule: positive is up the right-hand wall. Never
  // derived by comparing the two extents — a closed pipe's section does not change and its rider
  // still leans.
  const theta = clamp(station.climb, -1.35, 1.35);
  const flat = clamp(floorFlat, 0, 0.85);
  const w = radius * flat;
  // Ride up the arc; a flat-floored trough slides across its flat first.
  const across = Math.sign(theta) * (w * Math.min(1, Math.abs(theta) / 0.5)) + Math.sin(theta) * (radius - vehicleRadius); // prettier-ignore
  const rise = (radius - vehicleRadius) * (1 - Math.cos(theta)) + vehicleRadius * 0.06;
  const up: V3 = normalize([
    f.up[0] * Math.cos(theta) + f.right[0] * Math.sin(theta),
    f.up[1] * Math.cos(theta) + f.right[1] * Math.sin(theta),
    f.up[2] * Math.cos(theta) + f.right[2] * Math.sin(theta),
  ]);
  const right: V3 = normalize([
    f.right[0] * Math.cos(theta) - f.up[0] * Math.sin(theta),
    f.right[1] * Math.cos(theta) - f.up[1] * Math.sin(theta),
    f.right[2] * Math.cos(theta) - f.up[2] * Math.sin(theta),
  ]);
  return {
    position: [
      f.p[0] + f.right[0] * across + f.up[0] * rise,
      f.p[1] + f.right[1] * across + f.up[1] * rise,
      f.p[2] + f.right[2] * across + f.up[2] * rise,
    ],
    right,
    up,
    forward: [f.tangent[0], f.tangent[1], f.tangent[2]],
  };
}

/** An orthonormal basis as a quaternion, so the frame survives the transfer buffer in four floats. */
export function quaternionOf(right: V3, up: V3, forward: V3): [number, number, number, number] {
  const m00 = right[0];
  const m10 = right[1];
  const m20 = right[2];
  const m01 = up[0];
  const m11 = up[1];
  const m21 = up[2];
  const m02 = forward[0];
  const m12 = forward[1];
  const m22 = forward[2];
  const trace = m00 + m11 + m22;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    return [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4];
  }
  if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    return [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s];
  }
  if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    return [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s];
  }
  const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
  return [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s];
}

/** sRGB hex → linear RGB, the space every PBR colour in this project is set in. */
export function hexToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  const to = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return [to((n >> 16) & 255), to((n >> 8) & 255), to(n & 255)];
}
