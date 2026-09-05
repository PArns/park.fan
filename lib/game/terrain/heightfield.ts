/**
 * Pure heightfield maths shared by the sim and the renderer. DOM-free.
 *
 * The park is a square of `size` metres centred on the origin; samples are `(resolution + 1)²`
 * on a grid of `size / resolution` metres. `x` runs +X (east), `z` runs +Z (south, towards the
 * viewer in a right-handed +Y-up frame), so sample (i, j) sits at
 * `(-size/2 + i·cell, height, -size/2 + j·cell)`.
 */

import type { TerrainData } from '../core/types';

export function cellSize(t: Pick<TerrainData, 'size' | 'resolution'>): number {
  return t.size / t.resolution;
}

/** Bilinear height at world (x, z); clamps to the edge outside the park. */
export function sampleHeight(t: TerrainData, x: number, z: number): number {
  const n = t.resolution;
  const cell = t.size / n;
  const fx = Math.min(n - 1e-6, Math.max(0, (x + t.size / 2) / cell));
  const fz = Math.min(n - 1e-6, Math.max(0, (z + t.size / 2) / cell));
  const i = Math.floor(fx);
  const j = Math.floor(fz);
  const u = fx - i;
  const v = fz - j;
  const w = n + 1;
  const h = t.heights;
  const h00 = h[j * w + i];
  const h10 = h[j * w + i + 1];
  const h01 = h[(j + 1) * w + i];
  const h11 = h[(j + 1) * w + i + 1];
  return (h00 * (1 - u) + h10 * u) * (1 - v) + (h01 * (1 - u) + h11 * u) * v;
}

/** Surface normal at world (x, z) from central differences. */
export function sampleNormal(t: TerrainData, x: number, z: number): [number, number, number] {
  const d = cellSize(t) * 0.5;
  const hl = sampleHeight(t, x - d, z);
  const hr = sampleHeight(t, x + d, z);
  const hd = sampleHeight(t, x, z - d);
  const hu = sampleHeight(t, x, z + d);
  const nx = hl - hr;
  const nz = hd - hu;
  const ny = 2 * d;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

/**
 * Steepness at world (x, z) as 1 - n.y, i.e. 0 on the flat and 1 on a wall. The renderer paints
 * rock past `CLIFF_SLOPE_START` and the showcase uses the same number, so a cliff in the material
 * and a cliff in the paint layer are the same cliff.
 */
export function sampleSlope(t: TerrainData, x: number, z: number): number {
  return 1 - sampleNormal(t, x, z)[1];
}

/** 1 - cos(26°): where the ground stops being walkable and the rock starts showing through. */
export const CLIFF_SLOPE_START = 0.101;
/** 1 - cos(45°): fully rock. */
export const CLIFF_SLOPE_FULL = 0.293;

export function isInsidePark(t: Pick<TerrainData, 'size'>, x: number, z: number): boolean {
  const half = t.size / 2;
  return x >= -half && x <= half && z >= -half && z <= half;
}

/**
 * The paint layers, in the order the shader's texture array is built. The first five indices are
 * the ones the module shipped with and are kept where they were, because `world.terrain.paint`
 * survives a save: renumbering grass would repaint every existing park.
 */
export const LAYER_GRASS = 0;
export const LAYER_SAND = 1;
export const LAYER_ROCK = 2;
export const LAYER_DIRT = 3;
export const LAYER_MEADOW = 4;
export const LAYER_CONCRETE = 5;
export const LAYER_WOOD = 6;
export const LAYER_COUNT = 7;

export const LAYER_NAMES: readonly string[] = [
  'grass',
  'sand',
  'rock',
  'dirt',
  'meadow',
  'concrete',
  'wood',
];

/** Paint index at world (x, z). See `LAYER_*`. */
export function samplePaint(t: TerrainData, x: number, z: number): number {
  const n = t.resolution;
  const cell = t.size / n;
  const i = Math.min(n - 1, Math.max(0, Math.floor((x + t.size / 2) / cell)));
  const j = Math.min(n - 1, Math.max(0, Math.floor((z + t.size / 2) / cell)));
  return t.paint[j * n + i];
}

export type BrushShape = 'raise' | 'lower' | 'smooth' | 'flatten' | 'paint';

export interface BrushStroke {
  shape: BrushShape;
  x: number;
  z: number;
  radius: number;
  /** Metres for raise/lower, target height for flatten, paint index for paint. */
  strength: number;
  falloff?: number;
}

/** Apply a brush stroke in place; returns the dirty rect in sample indices [i0, j0, i1, j1]. */
export function applyBrush(t: TerrainData, s: BrushStroke): [number, number, number, number] {
  const n = t.resolution;
  const w = n + 1;
  const cell = t.size / n;
  const ci = (s.x + t.size / 2) / cell;
  const cj = (s.z + t.size / 2) / cell;
  const r = s.radius / cell;
  const i0 = Math.max(0, Math.floor(ci - r));
  const i1 = Math.min(n, Math.ceil(ci + r));
  const j0 = Math.max(0, Math.floor(cj - r));
  const j1 = Math.min(n, Math.ceil(cj + r));
  const falloff = s.falloff ?? 0.6;
  const h = t.heights;
  if (s.shape === 'paint') {
    const idx = Math.max(0, Math.min(255, Math.round(s.strength)));
    for (let j = j0; j < Math.min(n, j1 + 1); j++) {
      for (let i = i0; i < Math.min(n, i1 + 1); i++) {
        const d = Math.hypot(i + 0.5 - ci, j + 0.5 - cj) / r;
        if (d <= 1) t.paint[j * n + i] = idx;
      }
    }
    return [i0, j0, i1, j1];
  }
  let target = 0;
  if (s.shape === 'flatten') target = s.strength;
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const d = Math.hypot(i - ci, j - cj) / r;
      if (d > 1) continue;
      const k = d < falloff ? 1 : 1 - smooth((d - falloff) / (1 - falloff));
      const at = j * w + i;
      switch (s.shape) {
        case 'raise':
          h[at] += s.strength * k;
          break;
        case 'lower':
          h[at] -= s.strength * k;
          break;
        case 'flatten':
          h[at] += (target - h[at]) * Math.min(1, k);
          break;
        case 'smooth': {
          let sum = 0;
          let count = 0;
          for (let dj = -1; dj <= 1; dj++) {
            for (let di = -1; di <= 1; di++) {
              const ii = i + di;
              const jj = j + dj;
              if (ii < 0 || jj < 0 || ii > n || jj > n) continue;
              sum += h[jj * w + ii];
              count++;
            }
          }
          h[at] += (sum / count - h[at]) * Math.min(1, k * s.strength);
          break;
        }
      }
    }
  }
  return [i0, j0, i1, j1];
}

function smooth(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}
