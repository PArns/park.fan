/**
 * The basin's plan and its floor, as pure arithmetic.
 *
 * Pure and node-runnable — `selftest.mjs` measures a pool's area, its volume and its depth at a
 * point without a GPU, and the worker reads `depthAt` to answer "is this a place a slide can land
 * in" without loading a mesh.
 *
 * ## The one structural decision
 *
 * A basin is drawn as a **polar grid from its own centroid**: `segments` rays out to the outline,
 * `rings` steps along each ray. That gives the floor, the wall, the coping and the deck the same
 * vertex columns, so the four meet exactly and no seam has to be stitched — and the water surface
 * is the same grid again, which is why the waterline lands on a tile edge rather than a millimetre
 * off it.
 *
 * The cost is that the outline must be **star-shaped about its centroid**: every ray may cross it
 * once. Every generator here respects that — a `lobed` outline clamps its lobe depth to 0.45 of the
 * radius, which is a bean and a lagoon but not a horseshoe — and an explicit `polygon` from a pack
 * is checked and warned about rather than silently drawn inside out. A horseshoe pool would want a
 * general triangulator, and this module does not have one; that limit is in the report.
 *
 * ## Depth
 *
 * `depthAt` is evaluated per vertex AND analytically differentiated for the floor normal, so the
 * shading follows the real slope and not the triangulation. The five profiles are the ones a real
 * pool is built to: a `flat` teaching pool, a `slope` from a shallow end to a deep end, a `dish`
 * that falls to a middle drain, a `beach` with a zero-entry shelf, and a `channel` — a lazy river
 * or a run-out lane, deepest along its centreline.
 */

import type { PoolDepthSpec, PoolEdgeSpec, PoolShapeSpec } from './types';

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * Metres a zero-entry shelf stands above the pool's own grade where it meets the wall.
 *
 * Bounded above by the coping: a rolled edge's rim sits about 0.15 m over grade, so a shelf that
 * rose further would stand proud of the coping and read as a step out of the pool rather than into
 * it. 0.12 leaves the apron 30 mm under the coping and about 90 mm over the water line, which on
 * the lagoon's 1:12 ramp is a couple of metres of dry tile — a beach somebody can stand on.
 */
export const BEACH_RISE = 0.12;

/** A floor height, allowing a beach shelf to stand proud of the water and nothing else to. */
export const floorDepth = (d: number): number => (d < -BEACH_RISE ? -BEACH_RISE : d);
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number): number => {
  if (a === b) return x < a ? 0 : 1;
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** sRGB hex to linear RGB. Vertex colours multiply a PBR albedo, which is linear. */
export function hexToLinear(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const parts =
    h.length === 3 ? h.split('').map((c) => c + c) : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
  const out = parts.map((pair) => {
    const s = (parseInt(pair, 16) || 0) / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return [out[0] ?? 0, out[1] ?? 0, out[2] ?? 0];
}

/**
 * A stable hash of two integers and a seed, 0..1.
 *
 * Furniture placement, per-tile tint and the niche spacing all read this rather than an `Rng`,
 * because a stateful generator makes a rebuild depend on how many pools were rebuilt before it.
 * A pure function of (entity, index) gives the same deck whatever order the world announces.
 */
export function hash2(ix: number, iy: number, seed: number): number {
  let h =
    (Math.imul(ix | 0, 374761393) +
      Math.imul(iy | 0, 668265263) +
      Math.imul(seed | 0, 1274126177)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** A string to a 32-bit seed, so an entity id can seed its own deck. */
export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

/**
 * The outline in local metres, counter-clockwise seen from above, closed (last point ≠ first).
 *
 * `size` is the FULL extent, so a 20 × 12 lagoon spans −10..10 by −6..6.
 */
export function outlinePoints(shape: PoolShapeSpec, size: [number, number]): number[] {
  const hx = size[0] / 2;
  const hz = size[1] / 2;
  const n = Math.max(12, Math.min(256, Math.round(shape.segments)));
  const out: number[] = [];

  if (shape.outline === 'polygon' && shape.points.length >= 6) {
    const corners: number[] = [];
    for (let i = 0; i + 1 < shape.points.length; i += 2) {
      corners.push(shape.points[i] * hx, shape.points[i + 1] * hz);
    }
    return ensureCcw(resample(corners, n));
  }

  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    switch (shape.outline) {
      case 'rect': {
        // A rounded rectangle sampled by angle: the corner radius is honoured exactly by walking
        // the four straight runs and four arcs in the parameter, which keeps the samples spread
        // evenly along the perimeter instead of bunching at the corners.
        const r = Math.max(0, Math.min(shape.corner, Math.min(hx, hz) * 0.98));
        out.push(...roundedRectPoint(hx, hz, r, i / n));
        break;
      }
      case 'stadium': {
        const r = Math.min(hx, hz);
        out.push(...roundedRectPoint(hx, hz, r, i / n));
        break;
      }
      case 'lobed': {
        // An ellipse with a few sinusoidal lobes: the free-form lagoon a park actually builds,
        // and the reason the depth is clamped is that a deeper lobe stops being star-shaped.
        const depth = Math.max(0, Math.min(0.45, shape.lobeDepth));
        const k = 1 + depth * Math.sin(a * Math.max(1, Math.round(shape.lobes)) + shape.lobePhase);
        out.push(c * hx * k, s * hz * k);
        break;
      }
      case 'ellipse':
      default:
        out.push(c * hx, s * hz);
        break;
    }
  }
  return ensureCcw(out);
}

/**
 * Subdivide a polygon's edges up to about `target` points, keeping every corner it was authored
 * with.
 *
 * A pack's explicit plan arrives as six or eight points, and six columns of a polar grid is a
 * basin whose floor is interpolated across nine metres — the depth profile stops being a profile
 * and the wall stops being able to hold a waterline. Splitting the long edges fixes both without
 * rounding off a single corner, which is the whole reason a pack chose a polygon.
 */
function resample(points: number[], target: number): number[] {
  const n = points.length / 2;
  if (n >= target) return points;
  let perimeter = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += Math.hypot(points[j * 2] - points[i * 2], points[j * 2 + 1] - points[i * 2 + 1]);
  }
  if (perimeter <= 0) return points;
  const step = perimeter / target;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const x0 = points[i * 2];
    const z0 = points[i * 2 + 1];
    const x1 = points[j * 2];
    const z1 = points[j * 2 + 1];
    const length = Math.hypot(x1 - x0, z1 - z0);
    const pieces = Math.max(1, Math.round(length / step));
    for (let k = 0; k < pieces; k++) {
      const t = k / pieces;
      out.push(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t);
    }
  }
  return out;
}

/** One point on a rounded rectangle at parameter `t` (0..1) of its perimeter. */
function roundedRectPoint(hx: number, hz: number, r: number, t: number): [number, number] {
  const sx = Math.max(0, hx - r);
  const sz = Math.max(0, hz - r);
  const straight = 2 * (2 * sx + 2 * sz);
  const arcs = 2 * Math.PI * r;
  const total = straight + arcs;
  if (total <= 0) return [0, 0];
  let d = t * total;
  // Counter-clockwise from the middle of the +x side.
  const legs: Array<[number, number]> = [
    [sz, 0],
    [r, 1],
    [2 * sx, 2],
    [r, 3],
    [2 * sz, 4],
    [r, 5],
    [2 * sx, 6],
    [r, 7],
    [sz, 8],
  ];
  for (const [len, kind] of legs) {
    const l = kind % 2 === 0 ? len : (Math.PI / 2) * r;
    if (d > l) {
      d -= l;
      continue;
    }
    const u = l > 0 ? d / l : 0;
    switch (kind) {
      case 0:
        return [hx, u * sz];
      case 1:
        return [sx + r * Math.cos(u * (Math.PI / 2)), sz + r * Math.sin(u * (Math.PI / 2))];
      case 2:
        return [sx - u * 2 * sx, hz];
      case 3:
        return [
          -sx + r * Math.cos(Math.PI / 2 + u * (Math.PI / 2)),
          sz + r * Math.sin(Math.PI / 2 + u * (Math.PI / 2)),
        ];
      case 4:
        return [-hx, sz - u * 2 * sz];
      case 5:
        return [
          -sx + r * Math.cos(Math.PI + u * (Math.PI / 2)),
          -sz + r * Math.sin(Math.PI + u * (Math.PI / 2)),
        ];
      case 6:
        return [-sx + u * 2 * sx, -hz];
      case 7:
        return [
          sx + r * Math.cos((3 * Math.PI) / 2 + u * (Math.PI / 2)),
          -sz + r * Math.sin((3 * Math.PI) / 2 + u * (Math.PI / 2)),
        ];
      default:
        return [hx, -sz + u * sz];
    }
  }
  return [hx, 0];
}

/** Reverse a polygon that was authored clockwise, so every consumer sees one winding. */
export function ensureCcw(points: number[]): number[] {
  if (signedArea(points) >= 0) return points;
  const out: number[] = [];
  for (let i = points.length - 2; i >= 0; i -= 2) out.push(points[i], points[i + 1]);
  return out;
}

export function signedArea(points: number[]): number {
  let a = 0;
  const n = points.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += points[i * 2] * points[j * 2 + 1] - points[j * 2] * points[i * 2 + 1];
  }
  return a / 2;
}

export const polygonArea = (points: number[]): number => Math.abs(signedArea(points));

/**
 * Is every ray from the origin crossing this outline exactly once?
 *
 * The polar grid depends on it, and an explicit `polygon` from a pack is the one outline this
 * module did not generate. Cheap test: the angle must advance monotonically around the loop.
 */
export function isStarShaped(points: number[]): boolean {
  const n = points.length / 2;
  if (n < 3) return false;
  let total = 0;
  let previous = Math.atan2(points[1], points[0]);
  for (let i = 1; i <= n; i++) {
    const k = (i % n) * 2;
    const a = Math.atan2(points[k + 1], points[k]);
    let d = a - previous;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    if (d < -1e-9) return false;
    total += d;
    previous = a;
  }
  return Math.abs(Math.abs(total) - Math.PI * 2) < 1e-6;
}

/** Even-odd point-in-polygon, local metres. */
export function insidePolygon(points: number[], x: number, z: number): boolean {
  let inside = false;
  const n = points.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i * 2];
    const zi = points[i * 2 + 1];
    const xj = points[j * 2];
    const zj = points[j * 2 + 1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Water depth in metres at a local point, before the wall is reached.
 *
 * `u` and `v` are the point in unit space (−1..1 over the pool's own extents), so the profile is
 * independent of how big the pool is: a 30 m lap pool and a 12 m one both go from `min` at one end
 * to `max` at the other.
 */
export function depthAtUnit(depth: PoolDepthSpec, u: number, v: number): number {
  const along = depth.axis === 'x' ? u : v;
  const across = depth.axis === 'x' ? v : u;
  switch (depth.profile) {
    case 'flat':
      return depth.max;
    case 'slope': {
      // Real pools do not ramp linearly end to end: there is a shallow shelf, a transition slope
      // and a deep well. Two smoothsteps give exactly that break, which is what you feel underfoot.
      const t = smoothstep(-0.55, 0.62, along);
      return mix(depth.min, depth.max, t);
    }
    case 'dish': {
      const r = Math.min(1, Math.hypot(u, v));
      return mix(depth.max, depth.min, smoothstep(0.25, 1, r));
    }
    case 'beach': {
      // Zero-entry, and the "zero" has to be ABOVE the water or there is no beach — a shelf that
      // stops exactly at nought is 30-100 mm under the surface, because the water sits a freeboard
      // below a coping that itself stands a deck-fall above grade. Measured on the first build: 3 %
      // of a lagoon's plan was dry where a quarter of it should have been. So the shelf starts
      // `BEACH_RISE` PROUD of the pool's own grade and walks down through the water line, which is
      // what a person actually walks down.
      const shelf = clamp01(depth.beach);
      const t = (along + 1) / 2;
      // Three runs, not two: the dry apron, the shallow shelf under it, and then the fall to the
      // deep end. Ramping straight from the apron to `min` over the whole shelf crosses the water
      // line in the first 3 % of the pool and there is no beach to speak of — measured at 3 % of
      // the lagoon's plan dry, against the 12 % it has now.
      const cross = shelf * 0.45;
      if (t < cross) return mix(-BEACH_RISE, 0, cross > 0 ? t / cross : 1);
      if (t < shelf) return mix(0, depth.min, shelf > cross ? (t - cross) / (shelf - cross) : 1);
      return mix(depth.min, depth.max, smoothstep(shelf, 1, t));
    }
    case 'channel': {
      // Deepest along the centreline, shelving up to the banks. A run-out lane and a lazy river.
      const r = Math.min(1, Math.abs(across));
      return mix(depth.max, depth.min, smoothstep(0.45, 1, r));
    }
    default:
      return depth.max;
  }
}

/** The deepest the profile ever gets, for the volume estimate and the camera's framing radius. */
export const profileMaxDepth = (depth: PoolDepthSpec): number => Math.max(depth.min, depth.max);

/**
 * Water volume in m³, by integrating the depth over the plan on a 32 × 32 grid.
 *
 * Measured rather than assumed: `area × maxDepth / 2` is out by a fifth on a beach-entry lagoon,
 * and this number is the water bill the management module charges for.
 */
export function poolVolume(shape: PoolShapeSpec, size: [number, number], maxDepth: number): number {
  const outline = outlinePoints(shape, size);
  const hx = size[0] / 2;
  const hz = size[1] / 2;
  const steps = 32;
  const cell = ((2 * hx) / steps) * ((2 * hz) / steps);
  const depth: PoolDepthSpec = { ...shape.depth, max: maxDepth };
  let total = 0;
  for (let j = 0; j < steps; j++) {
    const z = -hz + ((j + 0.5) / steps) * 2 * hz;
    for (let i = 0; i < steps; i++) {
      const x = -hx + ((i + 0.5) / steps) * 2 * hx;
      if (!insidePolygon(outline, x, z)) continue;
      total += Math.max(0, depthAtUnit(depth, x / hx, z / hz)) * cell;
    }
  }
  return total;
}

/** World point to the pool's local frame. */
export function toLocal(
  x: number,
  z: number,
  position: [number, number, number],
  yaw: number
): [number, number] {
  const dx = x - position[0];
  const dz = z - position[2];
  const c = Math.cos(-yaw);
  const s = Math.sin(-yaw);
  return [dx * c - dz * s, dx * s + dz * c];
}

/** The pool's local frame back to world. */
export function toWorld(
  x: number,
  z: number,
  position: [number, number, number],
  yaw: number
): [number, number] {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [position[0] + x * c - z * s, position[2] + x * s + z * c];
}

/**
 * The height of the pool's rim above the surrounding grade, in metres.
 *
 * One definition, because three files need it and a pool whose water level disagrees with its own
 * coping by 48 mm is a waterline drawn in the wrong place. The deck falls 1.5 % away from the pool
 * and has to arrive at grade, so the rim stands one deck-fall up before the coping's own rise.
 */
export function rimHeight(edge: PoolEdgeSpec): number {
  const deckFall = edge.deck === 'none' ? 0 : 0.015 * Math.max(0, edge.deckWidth);
  const lift = edge.deck === 'none' ? 0 : DECK_LIFT;
  return lift + deckFall + (edge.coping === 'deck-level' ? 0 : edge.copingRise);
}

/** Metres the deck stands above the surrounding grade. See the note in `build.ts`. */
export const DECK_LIFT = 0.05;
