/**
 * The water surface, as pure arrays.
 *
 * Split out of `water.ts` because that file reaches Babylon for the material and the splash rings,
 * and this half has to be node-runnable: `selftest.mjs` measures how much of a beach-entry lagoon
 * is actually under water, which is the one property of this mesh a screenshot cannot settle.
 */

import { clamp01, depthAtUnit, floorDepth, outlinePoints, smoothstep, mix } from './geom';
import type { PoolDepthSpec, PoolShapeSpec } from './types';

/** Metres one repeat of the ripple normal covers. A pool's chop is short. */
export const RIPPLE_TILE = 3;

export interface WaterMeshData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  /** m² of surface actually drawn — a beach-entry shelf is not water. */
  area: number;
}

/**
 * The water surface for one basin, in the pool's local frame.
 *
 * The same polar grid the floor is built on, so the surface meets the wall on the wall's own
 * column. Quads whose four corners are all dry (the floor has risen above the water line on a
 * zero-entry beach) are dropped, which is what makes the shelf emerge from the water rather than
 * the water lying on top of it.
 */
export function buildWaterMesh(
  shape: PoolShapeSpec,
  size: [number, number],
  maxDepth: number,
  waterY: number,
  tint: [number, number, number],
  rings = 6
): WaterMeshData {
  const outline = outlinePoints(shape, size);
  const n = outline.length / 2;
  const hx = size[0] / 2;
  const hz = size[1] / 2;
  const depth: PoolDepthSpec = { ...shape.depth, max: maxDepth };
  const depthAt = (x: number, z: number): number => floorDepth(depthAtUnit(depth, x / hx, z / hz));
  // The floor is measured from the deck; the surface sits `waterY` below it, so the water over a
  // point is the floor depth minus that drop.
  const over = (x: number, z: number): number => depthAt(x, z) + waterY;

  const rows = rings + 1;
  const positions = new Float32Array(rows * n * 3);
  const normals = new Float32Array(rows * n * 3);
  const uvs = new Float32Array(rows * n * 2);
  const colors = new Float32Array(rows * n * 4);
  // 0.997 keeps the surface a few millimetres clear of the wall it meets, which is the difference
  // between a clean waterline and a shimmering row of z-fighting at every grazing angle.
  const OUTER = 0.997;

  for (let r = 0; r < rows; r++) {
    const t = (r / rings) * OUTER;
    for (let i = 0; i < n; i++) {
      const k = r * n + i;
      const x = outline[i * 2] * t;
      const z = outline[i * 2 + 1] * t;
      const d = over(x, z);
      positions[k * 3] = x;
      positions[k * 3 + 1] = waterY;
      positions[k * 3 + 2] = z;
      normals[k * 3] = 0;
      normals[k * 3 + 1] = 1;
      normals[k * 3 + 2] = 0;
      uvs[k * 2] = x / RIPPLE_TILE;
      uvs[k * 2 + 1] = z / RIPPLE_TILE;
      // Absorption over the depth, and the wall bounce in the last 300 mm.
      const absorb = smoothstep(0.05, 3.2, d);
      const bounce = smoothstep(0.34, 0, d) * 0.45;
      colors[k * 4] = clamp01(mix(0.62, tint[0], absorb) + bounce);
      colors[k * 4 + 1] = clamp01(mix(0.78, tint[1], absorb) + bounce);
      colors[k * 4 + 2] = clamp01(mix(0.86, tint[2], absorb) + bounce);
      // A chlorinated pool is CLEAR. 0.62 at the deep end, not 0.9: past that the tile stops
      // showing through and the basin reads as poured resin, which is the note `terrain/water.ts`
      // wrote about its own first pass over the lake.
      colors[k * 4 + 3] = clamp01(0.08 + 0.44 * absorb);
    }
  }

  const indices: number[] = [];
  let area = 0;
  for (let r = 0; r + 1 < rows; r++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = r * n + i;
      const b = r * n + j;
      const c = (r + 1) * n + j;
      const d = (r + 1) * n + i;
      const wet =
        over(positions[a * 3], positions[a * 3 + 2]) > 0.02 ||
        over(positions[b * 3], positions[b * 3 + 2]) > 0.02 ||
        over(positions[c * 3], positions[c * 3 + 2]) > 0.02 ||
        over(positions[d * 3], positions[d * 3 + 2]) > 0.02;
      if (!wet) continue;
      // Same winding as the floor: seen from above the normal is +Y.
      indices.push(a, d, c, a, c, b);
      area += quadArea(positions, a, b, c, d);
    }
  }
  // The inner fan, at the centre. `r = 0` is a ring of coincident points at the centroid, so the
  // first band is already the fan and no extra vertex is needed.
  return {
    positions,
    normals,
    uvs,
    colors,
    indices: new Uint32Array(indices),
    area,
  };
}

function quadArea(p: Float32Array, a: number, b: number, c: number, d: number): number {
  const tri = (i: number, j: number, k: number): number => {
    const ax = p[j * 3] - p[i * 3];
    const az = p[j * 3 + 2] - p[i * 3 + 2];
    const bx = p[k * 3] - p[i * 3];
    const bz = p[k * 3 + 2] - p[i * 3 + 2];
    return Math.abs(ax * bz - az * bx) / 2;
  };
  return tri(a, b, c) + tri(a, c, d);
}
