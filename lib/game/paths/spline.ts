/**
 * Centripetal Catmull-Rom over the control points, resampled at a fixed arc length.
 *
 * Centripetal (alpha = 0.5) rather than uniform: the uniform variant loops back on itself when two
 * control points sit close together, which for a path tool means a hairpin the player did not draw
 * and a graph edge that goes backwards. The cost is one `Math.pow` per segment at build time.
 *
 * Pure and DOM-free — the graph builder and the mesh builder both call it, which is what keeps a
 * guest walking down the middle of the ribbon that was drawn.
 */

import type { Pt } from './geom2d';

export interface Station {
  /** Arc length from the start, metres. */
  s: number;
  x: number;
  z: number;
  /** Unit tangent. */
  tx: number;
  tz: number;
}

function pointsFrom(flat: readonly number[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: flat[i], z: flat[i + 1] });
  return out;
}

/** Drops control points that repeat, which otherwise make the knot spacing zero. */
function dedupe(points: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && Math.hypot(p.x - last.x, p.z - last.z) < 1e-4) continue;
    out.push(p);
  }
  return out;
}

function knot(t: number, a: Pt, b: Pt): number {
  return t + Math.pow(Math.hypot(b.x - a.x, b.z - a.z), 0.5);
}

/** One centripetal Catmull-Rom span between p1 and p2, sampled at `u` in [0, 1]. */
function evaluate(p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt {
  const t0 = 0;
  const t1 = knot(t0, p0, p1);
  const t2 = knot(t1, p1, p2);
  const t3 = knot(t2, p2, p3);
  const t = t1 + (t2 - t1) * u;
  const a1 = lerpT(p0, p1, t0, t1, t);
  const a2 = lerpT(p1, p2, t1, t2, t);
  const a3 = lerpT(p2, p3, t2, t3, t);
  const b1 = lerpT(a1, a2, t0, t2, t);
  const b2 = lerpT(a2, a3, t1, t3, t);
  return lerpT(b1, b2, t1, t2, t);
}

function lerpT(a: Pt, b: Pt, ta: number, tb: number, t: number): Pt {
  const span = tb - ta;
  if (Math.abs(span) < 1e-9) return { x: a.x, z: a.z };
  const k = (t - ta) / span;
  return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k };
}

/**
 * The dense polyline through the control points. `subdivisions` is per span; the result is then
 * resampled by `resample`, so this only has to be fine enough not to cut a corner.
 */
export function tessellate(flat: readonly number[], closed: boolean, subdivisions = 12): Pt[] {
  const points = dedupe(pointsFrom(flat));
  if (points.length === 0) return [];
  if (points.length === 1) return points;
  if (points.length === 2) {
    const out: Pt[] = [];
    for (let i = 0; i <= subdivisions; i++) {
      const u = i / subdivisions;
      out.push({
        x: points[0].x + (points[1].x - points[0].x) * u,
        z: points[0].z + (points[1].z - points[0].z) * u,
      });
    }
    return out;
  }
  const n = points.length;
  const at = (i: number): Pt => {
    if (closed) return points[((i % n) + n) % n];
    return points[Math.max(0, Math.min(n - 1, i))];
  };
  const spans = closed ? n : n - 1;
  const out: Pt[] = [];
  for (let i = 0; i < spans; i++) {
    for (let k = 0; k < subdivisions; k++) {
      out.push(evaluate(at(i - 1), at(i), at(i + 1), at(i + 2), k / subdivisions));
    }
  }
  out.push(closed ? { ...out[0] } : { ...points[n - 1] });
  return out;
}

/**
 * Resample a polyline at a fixed spacing and hand back stations with tangents.
 *
 * The spacing is adjusted so an exact number of steps fits the length — a trailing stub shorter
 * than the spacing would make the last graph edge a different cost from all the others, and the
 * last quad of a ribbon a different length from all the others, which shows up as one stretched
 * texture tile at the end of every path.
 */
export function resample(polyline: readonly Pt[], spacing: number): Station[] {
  if (polyline.length === 0) return [];
  if (polyline.length === 1) {
    return [{ s: 0, x: polyline[0].x, z: polyline[0].z, tx: 1, tz: 0 }];
  }
  const cum: number[] = [0];
  for (let i = 1; i < polyline.length; i++) {
    cum.push(
      cum[i - 1] + Math.hypot(polyline[i].x - polyline[i - 1].x, polyline[i].z - polyline[i - 1].z)
    );
  }
  const total = cum[cum.length - 1];
  if (total < 1e-6) return [{ s: 0, x: polyline[0].x, z: polyline[0].z, tx: 1, tz: 0 }];
  const steps = Math.max(1, Math.round(total / spacing));
  const step = total / steps;

  const out: Station[] = [];
  let seg = 0;
  for (let i = 0; i <= steps; i++) {
    const s = Math.min(total, i * step);
    while (seg < cum.length - 2 && cum[seg + 1] < s) seg++;
    const spanLen = cum[seg + 1] - cum[seg];
    const u = spanLen > 1e-9 ? (s - cum[seg]) / spanLen : 0;
    const a = polyline[seg];
    const b = polyline[seg + 1];
    out.push({ s, x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, tx: 0, tz: 0 });
  }
  // Tangents from central differences over the resampled points, so a station's normal matches the
  // one its neighbours use and the ribbon has no crease at a control point.
  for (let i = 0; i < out.length; i++) {
    const a = out[Math.max(0, i - 1)];
    const b = out[Math.min(out.length - 1, i + 1)];
    let tx = b.x - a.x;
    let tz = b.z - a.z;
    const len = Math.hypot(tx, tz);
    if (len < 1e-9) {
      tx = 1;
      tz = 0;
    } else {
      tx /= len;
      tz /= len;
    }
    out[i].tx = tx;
    out[i].tz = tz;
  }
  return out;
}

/**
 * The left-hand offset of a station, `d` metres out.
 *
 * "Left" is `(tz, -tx)`: a rotation of the tangent by +90° about +Y in a right-handed frame. Which
 * of the two it is does not matter to the geometry as long as every file agrees — the mesh builder
 * decides face winding from the geometric normal rather than from this convention, precisely so a
 * sign error here cannot turn a path into a hole in the ground.
 */
export function offsetLeft(st: Station, d: number): Pt {
  return { x: st.x + st.tz * d, z: st.z - st.tx * d };
}

export function stationLength(stations: readonly Station[]): number {
  return stations.length ? stations[stations.length - 1].s : 0;
}
