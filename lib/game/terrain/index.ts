/**
 * Terrain module: heightmap ground, sculpt/paint, water table.
 *
 * Import-safe on the worker: the renderer half is behind a dynamic import.
 */

import type { GameModule } from '../core/types';
import { createTerrainSim } from './sim';

export const terrainModule: GameModule = {
  id: 'terrain',
  deps: ['core'],
  sim: createTerrainSim,
  main: async (ctx) => (await import('./main')).createTerrainMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageTerrainShowcase(ctx),
};

export type { TerrainSimApi } from './sim';
export { sampleHeight, sampleNormal, samplePaint, applyBrush } from './heightfield';
