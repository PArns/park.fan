/**
 * Terrain on the sim side: applies sculpt/paint commands to the authoritative heightmap and
 * answers height, slope and ray queries for the other sim modules through its `api`.
 *
 * DOM-free and Babylon-free — this file also runs in node under the soak harness and the tests.
 * It shares `heightfield.ts` with the renderer, so a guest walking a slope and the mesh the player
 * sees are computed from the same function rather than from two copies that agree today.
 */

import type { Command, SimContext, SimHandle } from '../core/types';
import {
  applyBrush,
  raycast,
  sampleHeight,
  sampleNormal,
  samplePaint,
  sampleSlope,
  type BrushStroke,
} from './heightfield';

export interface TerrainSimApi {
  height(x: number, z: number): number;
  normal(x: number, z: number): [number, number, number];
  paint(x: number, z: number): number;
  slope(x: number, z: number): number;
  waterLevel(): number;
  /** True where the heightfield sits at or under the water table. */
  isUnderwater(x: number, z: number): boolean;
  raycast(
    origin: [number, number, number],
    direction: [number, number, number],
    maxDistance?: number
  ): [number, number, number] | null;
}

export function createTerrainSim(ctx: SimContext): SimHandle {
  const t = () => ctx.world.terrain;
  const api: TerrainSimApi = {
    height: (x, z) => sampleHeight(t(), x, z),
    normal: (x, z) => sampleNormal(t(), x, z),
    paint: (x, z) => samplePaint(t(), x, z),
    slope: (x, z) => sampleSlope(t(), x, z),
    waterLevel: () => t().waterLevel,
    isUnderwater: (x, z) => sampleHeight(t(), x, z) <= t().waterLevel,
    raycast: (origin, direction, maxDistance) => raycast(t(), origin, direction, maxDistance),
  };
  return {
    api,
    tick() {},
    command(cmd: Command) {
      if (cmd.type === 'terrain:brush') {
        const rect = applyBrush(t(), cmd.payload as BrushStroke);
        ctx.events.emit('terrain:changed', { rect });
        return true;
      }
      if (cmd.type === 'terrain:water') {
        t().waterLevel = (cmd.payload as { level: number }).level;
        ctx.events.emit('terrain:changed', { rect: null });
        return true;
      }
      return false;
    },
  };
}
