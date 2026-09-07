/**
 * From a `path` entity to the thing both halves of this module actually work with: a resampled
 * centreline (or a plaza ring), the width the style allows, and the junction regions where this
 * path overlaps another.
 *
 * Pure. The worker builds layouts at 3 m to make graph nodes; the renderer builds them at 1 m to
 * make quads. Same function, same spline, same widths — which is why a guest walks down the middle
 * of the ribbon and not beside it.
 *
 * The junction maths is the part worth reading. Two crossing ribbons overlap in a parallelogram
 * whose four sides are A's two edge lines and B's two edge lines. So the region to remove from A
 * is bounded by B's edges ALONE — A's quads can never cross A's own edges — and cutting there
 * lands exactly on B's kerb line at any angle. The cap is emitted once, by the junction rather
 * than by either path, so the crossing has one surface: no overlap to z-fight, no seam to gap.
 */

import type { Entity } from '../core/types';
import {
  halfPlaneThrough,
  lineIntersection,
  pointInPolygon,
  polygonCentroid,
  signedDistance,
  distanceToSegmentSquared,
  type HalfPlane,
  type Pt,
} from './geom2d';
import { pathStyle, resolveWidth, type PathStyleDef } from './manifest';
import { offsetLeft, resample, stationLength, tessellate, type Station } from './spline';
import { DEFAULT_WIDTH, type PathEntityData, type PathForm } from './types';

/** Metres between graph nodes. One guest stride is about 0.75 m; three metres is four strides. */
export const GRAPH_SPACING = 3;
/** Metres between mesh cross-sections. */
export const MESH_SPACING = 1;
/** How far a path surface floats above the terrain sample, metres. */
export const SURFACE_LIFT = 0.07;

export interface PathLayout {
  id: string;
  form: PathForm;
  style: PathStyleDef;
  width: number;
  halfWidth: number;
  closed: boolean;
  rideId: string | null;
  entrance: boolean;
  /** Splines and queues: the resampled centreline. Empty for a plaza. */
  stations: Station[];
  /** Plazas: the ring, in the order the entity stored it. Empty for a spline. */
  ring: Pt[];
  lengthM: number;
  /** Axis-aligned bounds of the SURFACE (the centreline padded by the half-width). */
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ClipRegion {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Keep the part of a quad on the `>= 0` side of one of these. */
  planes: HalfPlane[];
  /** When set, the authoritative "is this point in the removed region" test. */
  ring: Pt[] | null;
}

export interface Junction {
  a: string;
  b: string;
  x: number;
  z: number;
  /** The overlap parallelogram, wound in ring order. */
  cap: Pt[];
  /**
   * The MATERIAL recipe id the cap is painted with — the wider path's surface, ties broken by
   * entity id. A recipe and not a style id: the mesh builder groups its geometry by material, and
   * handing it a style id made `pathMaterial()` fall through to its default, which quietly built a
   * second concrete material and a twelfth draw call for a surface that already had one.
   */
  capMaterial: string;
  /**
   * The uv frame the cap is drawn in: the owning path's own (across, along), continued through
   * the crossing.
   *
   * Without it the cap took world coordinates like a plaza does, and the slab grid inside a
   * junction ran at a different angle and a different phase from the grid on the path either side
   * of it — a rectangle of mismatched paving in the middle of every crossing. `s` is the owner's
   * arc length AT the crossing, so the pattern continues rather than restarting.
   */
  capFrame: { ox: number; oz: number; tx: number; tz: number; s: number; swap: boolean };
  clipForA: ClipRegion;
  clipForB: ClipRegion;
}

export function readPathData(entity: Entity): PathEntityData | null {
  const data = entity.data as PathEntityData | undefined;
  if (!data || !Array.isArray(data.points) || data.points.length < 4) return null;
  const form: PathForm = data.form === 'plaza' ? 'plaza' : data.form === 'queue' ? 'queue' : 'path';
  if (form === 'plaza' && data.points.length < 6) return null;
  return { ...data, form };
}

export function buildLayout(entity: Entity, spacing: number): PathLayout | null {
  const data = readPathData(entity);
  if (!data) return null;
  const style = pathStyle(data.style);
  const width = data.form === 'plaza' ? 0 : resolveWidth(style, data.width ?? DEFAULT_WIDTH);
  const base: PathLayout = {
    id: entity.id,
    form: data.form,
    style,
    width,
    halfWidth: width / 2,
    closed: data.closed === true,
    rideId: typeof data.rideId === 'string' ? data.rideId : null,
    entrance: data.entrance === true,
    stations: [],
    ring: [],
    lengthM: 0,
    minX: 0,
    maxX: 0,
    minZ: 0,
    maxZ: 0,
  };
  if (data.form === 'plaza') {
    const ring: Pt[] = [];
    for (let i = 0; i + 1 < data.points.length; i += 2) {
      ring.push({ x: data.points[i], z: data.points[i + 1] });
    }
    base.ring = ring;
    let perimeter = 0;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      perimeter += Math.hypot(b.x - a.x, b.z - a.z);
    }
    base.lengthM = perimeter;
    const box = boxOf(ring);
    base.minX = box.minX;
    base.maxX = box.maxX;
    base.minZ = box.minZ;
    base.maxZ = box.maxZ;
    return base;
  }
  base.stations = resample(tessellate(data.points, base.closed), spacing);
  base.lengthM = stationLength(base.stations);
  if (base.stations.length < 2) return null;
  const box = boxOf(base.stations);
  base.minX = box.minX - base.halfWidth;
  base.maxX = box.maxX + base.halfWidth;
  base.minZ = box.minZ - base.halfWidth;
  base.maxZ = box.maxZ + base.halfWidth;
  return base;
}

/**
 * True where this layout's surface covers (x, z). Used to suppress kerbs and to weld the graph.
 *
 * The bounds test in front is not decoration: this is called for every metre of a plaza's kerb
 * against every path in the park, and without it a plaza on one side of the park walks all four
 * hundred stations of a path on the other.
 */
export function layoutContains(layout: PathLayout, x: number, z: number): boolean {
  if (x < layout.minX || x > layout.maxX || z < layout.minZ || z > layout.maxZ) return false;
  if (layout.form === 'plaza') return pointInPolygon(layout.ring, x, z);
  const st = layout.stations;
  const limit = layout.halfWidth * layout.halfWidth;
  for (let i = 0; i + 1 < st.length; i++) {
    if (distanceToSegmentSquared(x, z, st[i].x, st[i].z, st[i + 1].x, st[i + 1].z) <= limit) {
      return true;
    }
  }
  return false;
}

/**
 * Two crossing centrelines are only a junction above about 14 degrees.
 *
 * Below that the "overlap parallelogram" grows without bound (its length along A is
 * `2·halfB / sin θ`), so a near-parallel pair would cut tens of metres out of both paths for what
 * is really a drafting mistake. Under the threshold the two surfaces are simply left overlapping,
 * which reads as one wide path rather than as a hole.
 */
const MIN_CROSS_SINE = 0.25;

export function findJunctions(layouts: readonly PathLayout[]): Junction[] {
  const out: Junction[] = [];
  const splines = layouts.filter((l) => l.form !== 'plaza');
  const plazas = layouts.filter((l) => l.form === 'plaza');

  // One segment index per spline, reused across every pair it takes part in. Without it this is a
  // segment-against-segment walk — ten paths of four hundred stations is 8.7 million tests and
  // measured 41 ms of a 72 ms geometry build, for an answer that is at most a few dozen crossings.
  const indices = new Map<string, SegmentIndex>();
  for (const s of splines) indices.set(s.id, buildSegmentIndex(s));
  for (let i = 0; i < splines.length; i++) {
    for (let j = i + 1; j < splines.length; j++) {
      const a = splines[i];
      const b = splines[j];
      const hits = crossings(a, b, indices.get(b.id) as SegmentIndex);
      for (const hit of hits) out.push(hit);
    }
  }
  for (const plaza of plazas) {
    for (const spline of splines) {
      const clip = plazaClip(plaza, spline);
      if (clip) {
        out.push({
          a: spline.id,
          b: plaza.id,
          x: clip.x,
          z: clip.z,
          cap: [],
          capMaterial: plaza.style.surface,
          capFrame: { ox: 0, oz: 0, tx: 1, tz: 0, s: 0, swap: false },
          clipForA: clip.region,
          // A plaza is never cut by the path that lands on it: the plaza is the surface, the path
          // stops at its kerb line. So B's clip is empty.
          clipForB: emptyClip(),
        });
      }
    }
  }
  return out;
}

function emptyClip(): ClipRegion {
  return { minX: 1, maxX: -1, minZ: 1, maxZ: -1, planes: [], ring: null };
}

/** A uniform grid over one layout's centreline segments. */
interface SegmentIndex {
  cell: number;
  minX: number;
  minZ: number;
  w: number;
  h: number;
  buckets: number[][];
}

const SEGMENT_CELL = 8;

function buildSegmentIndex(layout: PathLayout): SegmentIndex {
  const st = layout.stations;
  const minX = layout.minX - 1;
  const minZ = layout.minZ - 1;
  const w = Math.max(1, Math.ceil((layout.maxX - layout.minX + 2) / SEGMENT_CELL));
  const h = Math.max(1, Math.ceil((layout.maxZ - layout.minZ + 2) / SEGMENT_CELL));
  const buckets: number[][] = Array.from({ length: w * h }, () => []);
  for (let i = 0; i + 1 < st.length; i++) {
    const x0 = Math.min(st[i].x, st[i + 1].x);
    const x1 = Math.max(st[i].x, st[i + 1].x);
    const z0 = Math.min(st[i].z, st[i + 1].z);
    const z1 = Math.max(st[i].z, st[i + 1].z);
    const ci0 = Math.max(0, Math.floor((x0 - minX) / SEGMENT_CELL));
    const ci1 = Math.min(w - 1, Math.floor((x1 - minX) / SEGMENT_CELL));
    const cj0 = Math.max(0, Math.floor((z0 - minZ) / SEGMENT_CELL));
    const cj1 = Math.min(h - 1, Math.floor((z1 - minZ) / SEGMENT_CELL));
    for (let cj = cj0; cj <= cj1; cj++) {
      for (let ci = ci0; ci <= ci1; ci++) buckets[cj * w + ci].push(i);
    }
  }
  return { cell: SEGMENT_CELL, minX, minZ, w, h, buckets };
}

function crossings(a: PathLayout, b: PathLayout, indexB: SegmentIndex): Junction[] {
  const out: Junction[] = [];
  // Coarse reject on the surface bounds before the segment walk.
  if (a.maxX < b.minX || b.maxX < a.minX || a.maxZ < b.minZ || b.maxZ < a.minZ) return out;
  const sa = a.stations;
  const sb = b.stations;
  let lastS = -1e9;
  const seen = new Set<number>();
  for (let i = 0; i + 1 < sa.length; i++) {
    seen.clear();
    const x0 = Math.min(sa[i].x, sa[i + 1].x);
    const x1 = Math.max(sa[i].x, sa[i + 1].x);
    const z0 = Math.min(sa[i].z, sa[i + 1].z);
    const z1 = Math.max(sa[i].z, sa[i + 1].z);
    const ci0 = Math.max(0, Math.floor((x0 - indexB.minX) / indexB.cell));
    const ci1 = Math.min(indexB.w - 1, Math.floor((x1 - indexB.minX) / indexB.cell));
    const cj0 = Math.max(0, Math.floor((z0 - indexB.minZ) / indexB.cell));
    const cj1 = Math.min(indexB.h - 1, Math.floor((z1 - indexB.minZ) / indexB.cell));
    for (let cj = cj0; cj <= cj1; cj++) {
      for (let ci = ci0; ci <= ci1; ci++) {
        for (const k of indexB.buckets[cj * indexB.w + ci]) {
          if (seen.has(k)) continue;
          seen.add(k);
          const hit = intersectSegments(sa[i], sa[i + 1], sb[k], sb[k + 1]);
          if (!hit) continue;
          const sHere = sa[i].s + (sa[i + 1].s - sa[i].s) * hit.t;
          // One junction per crossing, not one per station pair that happens to overlap.
          if (sHere - lastS < Math.max(2, a.halfWidth + b.halfWidth)) continue;
          const ta = tangentAt(sa, i, hit.t);
          const tb = tangentAt(sb, k, hit.u);
          const sine = Math.abs(ta.tx * tb.tz - ta.tz * tb.tx);
          if (sine < MIN_CROSS_SINE) continue;
          const sThere = sb[k].s + (sb[k + 1].s - sb[k].s) * hit.u;
          const junction = buildJunction(a, b, hit.x, hit.z, ta, tb, sHere, sThere);
          if (junction) {
            out.push(junction);
            lastS = sHere;
          }
        }
      }
    }
  }
  return out;
}

/**
 * `PARAM_EPS` is not tidiness, it is the difference between finding a crossing and not.
 *
 * Two paths that cross exactly ON one of the first path's stations — which is what a build tool
 * snapping to a grid produces, and what the straight test case in `selftest.mjs` is — put the
 * intersection at `t = 1` of one segment and `t = 0` of the next, and floating point lands a hair
 * outside both. A strict `[0, 1]` therefore found ZERO junctions for two paths crossing at the
 * origin while an offset crossing a metre away found one: no kerbs stopped, no cap, two surfaces
 * overlapping in the middle of the crossing. Duplicates from the widened band are collapsed by the
 * `lastS` guard in `crossings`, which already had to exist.
 */
const PARAM_EPS = 1e-9;

function intersectSegments(
  a1: Station,
  a2: Station,
  b1: Station,
  b2: Station
): { t: number; u: number; x: number; z: number } | null {
  const rx = a2.x - a1.x;
  const rz = a2.z - a1.z;
  const sx = b2.x - b1.x;
  const sz = b2.z - b1.z;
  const denom = rx * sz - rz * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const qpx = b1.x - a1.x;
  const qpz = b1.z - a1.z;
  let t = (qpx * sz - qpz * sx) / denom;
  let u = (qpx * rz - qpz * rx) / denom;
  if (t < -PARAM_EPS || t > 1 + PARAM_EPS || u < -PARAM_EPS || u > 1 + PARAM_EPS) return null;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  u = u < 0 ? 0 : u > 1 ? 1 : u;
  return { t, u, x: a1.x + rx * t, z: a1.z + rz * t };
}

function tangentAt(st: readonly Station[], i: number, t: number): { tx: number; tz: number } {
  const a = st[i];
  const b = st[Math.min(st.length - 1, i + 1)];
  const tx = a.tx + (b.tx - a.tx) * t;
  const tz = a.tz + (b.tz - a.tz) * t;
  const len = Math.hypot(tx, tz) || 1;
  return { tx: tx / len, tz: tz / len };
}

function buildJunction(
  a: PathLayout,
  b: PathLayout,
  x: number,
  z: number,
  ta: { tx: number; tz: number },
  tb: { tx: number; tz: number },
  sA: number,
  sB: number
): Junction | null {
  // Edge lines: point on the edge + the path's direction.
  const aLeft = { x: x + ta.tz * a.halfWidth, z: z - ta.tx * a.halfWidth };
  const aRight = { x: x - ta.tz * a.halfWidth, z: z + ta.tx * a.halfWidth };
  const bLeft = { x: x + tb.tz * b.halfWidth, z: z - tb.tx * b.halfWidth };
  const bRight = { x: x - tb.tz * b.halfWidth, z: z + tb.tx * b.halfWidth };

  const corners: Array<Pt | null> = [
    lineIntersection(aLeft.x, aLeft.z, ta.tx, ta.tz, bLeft.x, bLeft.z, tb.tx, tb.tz),
    lineIntersection(aLeft.x, aLeft.z, ta.tx, ta.tz, bRight.x, bRight.z, tb.tx, tb.tz),
    lineIntersection(aRight.x, aRight.z, ta.tx, ta.tz, bRight.x, bRight.z, tb.tx, tb.tz),
    lineIntersection(aRight.x, aRight.z, ta.tx, ta.tz, bLeft.x, bLeft.z, tb.tx, tb.tz),
  ];
  if (corners.some((c) => c === null)) return null;
  const cap = (corners as Pt[]).slice();
  // Wind the ring by angle around the crossing point; the four intersections come out in an order
  // that depends on the crossing angle and a bow-tie quad triangulates into two spikes.
  cap.sort((p, q) => Math.atan2(p.z - z, p.x - x) - Math.atan2(q.z - z, q.x - x));

  const centre = { x, z };
  const clipA: ClipRegion = {
    ...boxOf(cap),
    planes: [
      halfPlaneThrough(bLeft, { x: bLeft.x + tb.tx, z: bLeft.z + tb.tz }, centre),
      halfPlaneThrough(bRight, { x: bRight.x + tb.tx, z: bRight.z + tb.tz }, centre),
    ],
    ring: cap,
  };
  const clipB: ClipRegion = {
    ...boxOf(cap),
    planes: [
      halfPlaneThrough(aLeft, { x: aLeft.x + ta.tx, z: aLeft.z + ta.tz }, centre),
      halfPlaneThrough(aRight, { x: aRight.x + ta.tx, z: aRight.z + ta.tz }, centre),
    ],
    ring: cap,
  };
  const aOwns = a.width > b.width || (a.width === b.width && a.id < b.id);
  const owner = aOwns ? a : b;
  const ownerT = aOwns ? ta : tb;
  const capFrame = {
    ox: x,
    oz: z,
    tx: ownerT.tx,
    tz: ownerT.tz,
    s: aOwns ? sA : sB,
    swap: owner.style.crossGrain,
  };
  return {
    a: a.id,
    b: b.id,
    x,
    z,
    cap,
    capMaterial: owner.style.surface,
    capFrame,
    clipForA: clipA,
    clipForB: clipB,
  };
}

function plazaClip(
  plaza: PathLayout,
  spline: PathLayout
): { x: number; z: number; region: ClipRegion } | null {
  const ring = plaza.ring;
  if (ring.length < 3) return null;
  let inside = 0;
  for (const st of spline.stations) if (pointInPolygon(ring, st.x, st.z)) inside++;
  if (inside === 0) return null;
  const centroid = polygonCentroid(ring);
  const planes: HalfPlane[] = [];
  for (let i = 0; i < ring.length; i++) {
    planes.push(halfPlaneThrough(ring[i], ring[(i + 1) % ring.length], centroid));
  }
  return {
    x: centroid.x,
    z: centroid.z,
    region: { ...boxOf(ring), planes, ring },
  };
}

function boxOf(ring: readonly { x: number; z: number }[]): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of ring) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  return { minX, maxX, minZ, maxZ };
}

export function regionContains(clip: ClipRegion, x: number, z: number): boolean {
  if (x < clip.minX || x > clip.maxX || z < clip.minZ || z > clip.maxZ) return false;
  if (clip.ring) return pointInPolygon(clip.ring, x, z);
  if (clip.planes.length === 0) return false;
  for (const p of clip.planes) if (signedDistance(p, x, z) >= 0) return false;
  return true;
}

export { offsetLeft };
