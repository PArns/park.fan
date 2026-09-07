/**
 * Digging the hole a pool sits in.
 *
 * A heightfield is a surface, not a solid, so a basin drawn under it is simply not visible: the
 * ground spans the pool's plan at grade and the camera sees turf where the water should be. The
 * basin therefore has to be excavated, and this is the whole of it.
 *
 * Three properties make it safe to run from either thread:
 *
 *  1. **It is `min`, never `set`.** A sample is lowered to the pit floor or left alone, so running
 *     it twice, or running it on a save that already has the pit, changes nothing. That is what
 *     lets the renderer dig its own copy at boot and the same command dig the worker's afterwards
 *     without the two disagreeing.
 *  2. **The pit's rim is OUTSIDE the basin**, by `RIM_MARGIN` plus the coping, so the cliff the
 *     heightfield makes (2 m cells cannot be vertical) falls under the deck ring and is never
 *     drawn against the sky. A pool whose edge treatment has no deck at all shows it; that is in
 *     the report rather than hidden.
 *  3. **It is pure.** No Babylon, no DOM, no module state — the same function on the render copy
 *     and on the world in the worker, which is the only way the two can be guaranteed identical.
 *
 * The alternative was a run of circular `terrain.brush` strokes through the terrain module's public
 * API — forty commands for one lagoon, each triggering a chunk rebuild, and a rim made of the union
 * of forty circles. `docs/game/requests/pools.md` asks for a polygon excavation on that API instead;
 * this is the workaround until it lands.
 */

import type { TerrainData } from '../core/types';
import { insidePolygon, outlinePoints, toLocal } from './geom';
import type { ResolvedPool } from './types';

/** Metres the pit is dug beyond the basin wall, before the coping is added. */
const RIM_MARGIN = 0.35;
/** Metres of ground left under the deepest tile, so the pit floor never pokes through it. */
const PIT_CLEARANCE = 0.55;

/** Sample indices `[i0, j0, i1, j1]` of what changed, or null when nothing did. */
export function excavatePool(
  terrain: TerrainData,
  pool: ResolvedPool
): [number, number, number, number] | null {
  const n = terrain.resolution;
  const w = n + 1;
  const cell = terrain.size / n;
  const half = terrain.size / 2;
  const margin = RIM_MARGIN + (pool.edge.coping === 'none' ? 0 : pool.edge.copingWidth);
  const grow: [number, number] = [pool.size[0] + margin * 2, pool.size[1] + margin * 2];
  const outline = outlinePoints(pool.shape, grow);
  const pitY = pool.position[1] - pool.maxDepth - PIT_CLEARANCE;

  const reach = Math.max(grow[0], grow[1]) / 2 + cell;
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
      if (!insidePolygon(outline, lx, lz)) continue;
      const at = j * w + i;
      if (terrain.heights[at] <= pitY) continue;
      terrain.heights[at] = pitY;
      touched = true;
    }
  }
  return touched ? [i0, j0, i1, j1] : null;
}
