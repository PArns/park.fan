/**
 * Terrain on the sim side: applies sculpt/paint commands to the authoritative heightmap and
 * answers height queries for the other sim modules through its `api`.
 */

import type { Command, SimContext, SimHandle } from '../core/types';
import {
  applyBrush,
  sampleHeight,
  sampleNormal,
  samplePaint,
  type BrushStroke,
} from './heightfield';

export interface TerrainSimApi {
  height(x: number, z: number): number;
  normal(x: number, z: number): [number, number, number];
  paint(x: number, z: number): number;
  waterLevel(): number;
}

export function createTerrainSim(ctx: SimContext): SimHandle {
  const t = () => ctx.world.terrain;
  const api: TerrainSimApi = {
    height: (x, z) => sampleHeight(t(), x, z),
    normal: (x, z) => sampleNormal(t(), x, z),
    paint: (x, z) => samplePaint(t(), x, z),
    waterLevel: () => t().waterLevel,
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
