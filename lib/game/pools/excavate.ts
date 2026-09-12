/**
 * Digging the hole a pool sits in.
 *
 * A heightfield is a surface, not a solid, so a basin drawn under one is simply not visible: the
 * ground spans the pool's plan at grade and the camera sees turf where the water should be. The
 * basin has to be excavated, and this is the whole of it.
 *
 * ## The measurement that shaped this
 *
 * The park's heightfield samples every **2 m** (512 m over 256 cells), and a bilinear surface
 * between two samples 2 m apart is what the pool's own tile has to stay under. So a hard-edged pit
 * does not work: a point just inside the wall is interpolated from samples up to 2 m away, and any
 * one of those left at grade lifts the ground back through the tiled floor near the edge. Nor does
 * a pit dug 3 m wider than the basin — the rim then lands outside the deck ring and the park gets
 * a visible trench around every pool.
 *
 * What works is a **ramp measured against the deck**: full pit depth out to `RAMP_START` past the
 * wall, then back to grade by the deck's outer edge, so the entire transition is under something
 * opaque. With the default 3.2 m deck the worst interior sample sits about 0.7 m under the
 * shallowest tile, which is the margin this is tuned to.
 *
 * Three properties make it safe to run from either thread:
 *
 *  1. **It only ever lowers.** A sample takes the minimum of what it had and what the pit wants, so
 *     running it twice, or on a save that already has the pit, changes nothing — which is what lets
 *     the renderer dig its own copy at boot and the same command dig the worker's afterwards.
 *  2. **It is pure**: no Babylon, no DOM, no module state. The same function on both copies of the
 *     world is the only way the two can be guaranteed identical.
 *  3. **It leaves the paint alone.** What the ground is made of is the terrain module's business;
 *     the deck covers it anyway.
 *
 * The alternative was a run of circular `terrain.brush` strokes through the terrain module's public
 * API — forty commands for one lagoon, each triggering a chunk rebuild, and a rim made of the union
 * of forty circles. `docs/game/requests/pools.md` asks for a polygon excavation on that API; this is
 * the workaround until it lands.
 */

import type { TerrainData } from '../core/types';
import { outlinePoints, smoothstep, toLocal } from './geom';
import type { ResolvedPool } from './types';

/** Metres past the basin wall that stay at full pit depth. */
const RAMP_START = 1.6;
/** Metres of ground left under the deepest tile. */
const PIT_CLEARANCE = 0.9;
/** Metres the ramp stops short of the deck's outer edge, so it is certainly covered. */
const DECK_INSET = 0.3;

/** Signed distance from a closed polygon, negative inside. Local metres. */
export function signedDistance(points: number[], x: number, z: number): number {
  const n = points.length / 2;
  let best = Infinity;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i * 2];
    const zi = points[i * 2 + 1];
    const xj = points[j * 2];
    const zj = points[j * 2 + 1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    const ex = xj - xi;
    const ez = zj - zi;
    const len = ex * ex + ez * ez;
    const t = len > 0 ? Math.max(0, Math.min(1, ((x - xi) * ex + (z - zi) * ez) / len)) : 0;
    const dx = x - (xi + ex * t);
    const dz = z - (zi + ez * t);
    const d = dx * dx + dz * dz;
    if (d < best) best = d;
  }
  const distance = Math.sqrt(best);
  return inside ? -distance : distance;
}

/** Sample indices `[i0, j0, i1, j1]` of what changed, or null when nothing did. */
export function excavatePool(
  terrain: TerrainData,
  pool: ResolvedPool
): [number, number, number, number] | null {
  const n = terrain.resolution;
  const w = n + 1;
  const cell = terrain.size / n;
  const half = terrain.size / 2;
  const outline = outlinePoints(pool.shape, pool.size);
  const copingOuter = pool.edge.coping === 'none' ? 0 : pool.edge.copingWidth;
  const deckOuter = copingOuter + (pool.edge.deck === 'none' ? 0 : pool.edge.deckWidth);
  const rampEnd = Math.max(RAMP_START + 0.4, deckOuter - DECK_INSET);
  const pitY = pool.position[1] - pool.maxDepth - PIT_CLEARANCE;

  const reach = Math.max(pool.size[0], pool.size[1]) / 2 + rampEnd + cell * 2;
  const i0 = Math.max(0, Math.floor((pool.position[0] - reach + half) / cell));
  const i1 = Math.min(n, Math.ceil((pool.position[0] + reach + half) / cell));
  const j0 = Math.max(0, Math.floor((pool.position[2] - reach + half) / cell));
  const j1 = Math.min(n, Math.ceil((pool.position[2] + reach + half) / cell));
  let touched = false;

  for (let j = j0; j <= j1; j++) {
    const z = -half + j * cell;
    for (let i = i0; i <= i1; i++) {
      const x = -half + i * cell;
      const [lx, lz] = toLocal(x, z, pool.position, pool.yaw);
      const d = signedDistance(outline, lx, lz);
      if (d > rampEnd) continue;
      const at = j * w + i;
      // The ramp is measured against the POOL's own grade, never against whatever the heightfield
      // currently holds. Reading the current height made the cut depend on its own result: running
      // it a second time treated the pit as the new grade and sank the ramp another metre, which
      // the selftest caught as 42 samples moving on an identical second call. Now it is a `min`
      // against a fixed target and is idempotent by construction.
      const grade = pool.position[1];
      const t = smoothstep(RAMP_START, rampEnd, d);
      const target = pitY + (grade - pitY) * t;
      if (target >= terrain.heights[at]) continue;
      terrain.heights[at] = target;
      touched = true;
    }
  }
  return touched ? [i0, j0, i1, j1] : null;
}
