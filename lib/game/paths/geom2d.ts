/**
 * Plane geometry in the XZ plane. Pure, DOM-free, no Babylon — the graph builder on the worker and
 * the mesh builder on the main thread both run it, which is the point: a junction the renderer
 * cuts a hole for and a junction the guests walk through are the same intersection, computed once.
 *
 * Everything here works in `(x, z)`. `y` is the terrain's business and is added later.
 */

export interface Pt {
  x: number;
  z: number;
}

/** A half-plane `n·p <= c`, i.e. "inside" is the side the normal points away from. */
export interface HalfPlane {
  nx: number;
  nz: number;
  c: number;
}

export function halfPlaneThrough(a: Pt, b: Pt, inside: Pt): HalfPlane {
  // Normal of the line ab, oriented so that `inside` satisfies n·p <= c.
  let nx = b.z - a.z;
  let nz = -(b.x - a.x);
  const len = Math.hypot(nx, nz) || 1;
  nx /= len;
  nz /= len;
  const c = nx * a.x + nz * a.z;
  if (nx * inside.x + nz * inside.z > c) return { nx: -nx, nz: -nz, c: -c };
  return { nx, nz, c };
}

export function signedDistance(h: HalfPlane, x: number, z: number): number {
  return h.nx * x + h.nz * z - h.c;
}

/**
 * Where segments `a1→a2` and `b1→b2` cross, as the parameters along each, or null.
 *
 * `eps` widens the acceptance band a hair so a path ENDING exactly on another path's centreline
 * still counts as a junction — which is the common case for a spur, and the difference between a
 * kerb that stops and a kerb that runs across the road.
 */
export function segmentIntersection(
  a1: Pt,
  a2: Pt,
  b1: Pt,
  b2: Pt,
  eps = 0
): { t: number; u: number; x: number; z: number } | null {
  const rx = a2.x - a1.x;
  const rz = a2.z - a1.z;
  const sx = b2.x - b1.x;
  const sz = b2.z - b1.z;
  const denom = rx * sz - rz * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const qpx = b1.x - a1.x;
  const qpz = b1.z - a1.z;
  const t = (qpx * sz - qpz * sx) / denom;
  const u = (qpx * rz - qpz * rx) / denom;
  if (t < -eps || t > 1 + eps || u < -eps || u > 1 + eps) return null;
  return { t, u, x: a1.x + rx * t, z: a1.z + rz * t };
}

/** Intersection of two infinite lines given as point + direction. Null when parallel. */
export function lineIntersection(
  px: number,
  pz: number,
  dx: number,
  dz: number,
  qx: number,
  qz: number,
  ex: number,
  ez: number
): Pt | null {
  const denom = dx * ez - dz * ex;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((qx - px) * ez - (qz - pz) * ex) / denom;
  return { x: px + dx * t, z: pz + dz * t };
}

export function pointInPolygon(ring: readonly Pt[], x: number, z: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

export function polygonArea(ring: readonly Pt[]): number {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j].x + ring[i].x) * (ring[j].z - ring[i].z);
  }
  return sum / 2;
}

export function polygonCentroid(ring: readonly Pt[]): Pt {
  let x = 0;
  let z = 0;
  for (const p of ring) {
    x += p.x;
    z += p.z;
  }
  return { x: x / ring.length, z: z / ring.length };
}

/**
 * Ear-clipping triangulation of a simple polygon, counter-clockwise or clockwise.
 *
 * Returns index triples into `ring`. Robust enough for the shapes a plaza tool draws (simple, no
 * holes, no self-intersections) and it degrades to "drop the ear that will not clip" rather than
 * looping forever, which is the failure mode that matters: a plaza with a bad ring should render
 * most of itself, not hang the boot.
 */
export function triangulate(ring: readonly Pt[]): number[] {
  const n = ring.length;
  const out: number[] = [];
  if (n < 3) return out;
  const ccw = polygonArea(ring) > 0;
  const indices: number[] = [];
  for (let i = 0; i < n; i++) indices.push(ccw ? i : n - 1 - i);

  let guard = 0;
  while (indices.length > 3 && guard++ < n * n) {
    let clipped = false;
    for (let i = 0; i < indices.length; i++) {
      const i0 = indices[(i + indices.length - 1) % indices.length];
      const i1 = indices[i];
      const i2 = indices[(i + 1) % indices.length];
      const a = ring[i0];
      const b = ring[i1];
      const c = ring[i2];
      const cross = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
      if (cross <= 1e-12) continue; // reflex or degenerate
      let contains = false;
      for (const k of indices) {
        if (k === i0 || k === i1 || k === i2) continue;
        if (pointInTriangle(ring[k], a, b, c)) {
          contains = true;
          break;
        }
      }
      if (contains) continue;
      out.push(i0, i1, i2);
      indices.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) {
      // A ring we cannot ear-clip (self-intersecting, or duplicated points). Fan it and move on.
      for (let i = 1; i < indices.length - 1; i++) out.push(indices[0], indices[i], indices[i + 1]);
      return out;
    }
  }
  if (indices.length === 3) out.push(indices[0], indices[1], indices[2]);
  return out;
}

function pointInTriangle(p: Pt, a: Pt, b: Pt, c: Pt): boolean {
  const d1 = (p.x - b.x) * (a.z - b.z) - (a.x - b.x) * (p.z - b.z);
  const d2 = (p.x - c.x) * (b.z - c.z) - (b.x - c.x) * (p.z - c.z);
  const d3 = (p.x - a.x) * (c.z - a.z) - (c.x - a.x) * (p.z - a.z);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/**
 * Sutherland–Hodgman against ONE half-plane, keeping the side the plane calls outside.
 *
 * One plane at a time is not a limitation here, it is the whole trick: a path's ribbon is clipped
 * at a junction by the OTHER path's two edge lines, and the parallelogram's remaining two sides
 * are this path's own edges — which its quads never cross, because the quads were built from them.
 * So every boundary quad straddles exactly one line, the clip stays convex, and the cut lands
 * exactly on the other path's kerb line at any crossing angle. Cutting perpendicular to the
 * centreline instead (the obvious thing) leaves a wedge-shaped gap on every oblique junction.
 */
export function clipOutside(poly: readonly Pt[], plane: HalfPlane): Pt[] {
  const out: Pt[] = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const da = signedDistance(plane, a.x, a.z);
    const db = signedDistance(plane, b.x, b.z);
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
    }
  }
  return out;
}

export function distance(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(bx - ax, bz - az);
}

/**
 * Squared distance from (px, pz) to the segment a→b.
 *
 * Squared and without the `{d, t}` object because this is the innermost call of the kerb
 * suppression pass — one per metre of kerb per path in the park — and both the `Math.hypot` and
 * the allocation showed up in the geometry build's profile.
 */
export function distanceToSegmentSquared(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 > 1e-12 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2)) : 0;
  const cx = px - (ax + dx * t);
  const cz = pz - (az + dz * t);
  return cx * cx + cz * cz;
}
