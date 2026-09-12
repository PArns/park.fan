/**
 * Terrain module: heightfield ground with a splat-mapped PBR surface, sculpt/paint, water table.
 *
 * Import-safe on the worker: the renderer half is behind a dynamic import and everything reachable
 * from `sim` (`heightfield`, `noise`, `landscape`) is DOM-free and Babylon-free.
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
// `TerrainMainApi` is deliberately NOT re-exported here: this file is loaded on the worker, and a
// re-export keeps a module reference to `main.ts` that a bundler is free to follow into Babylon.
// Import it from `@/lib/game/terrain/main` where you need the type.
export {
  applyBrush,
  raycast,
  sampleHeight,
  sampleNormal,
  samplePaint,
  sampleSlope,
  CLIFF_SLOPE_FULL,
  CLIFF_SLOPE_START,
  LAYER_CONCRETE,
  LAYER_COUNT,
  LAYER_DIRT,
  LAYER_GRASS,
  LAYER_MEADOW,
  LAYER_NAMES,
  LAYER_ROCK,
  LAYER_SAND,
  LAYER_WOOD,
} from './heightfield';
export type { BrushShape, BrushStroke } from './heightfield';
export { generateShowcaseLandscape } from './landscape';
/**
 * The noise helpers, re-exported so a module that shapes this heightfield does not have to reach
 * into `./noise` past this surface — which `demo-park/landform.ts` was doing, while its own report
 * claimed everything went through public APIs. They are pure and DOM-free, so they cost the worker
 * bundle nothing; the alternative was a fifth copy of value noise in the repo.
 */
export { fbm2, hash2, ridgedFbm, tileableFbm, valueNoise } from './noise';
export {
  attachGroundLayers,
  groundLayer,
  groundLayers,
  parseGroundLayer,
  registerGroundLayer,
  GROUND_LAYER_MANIFEST,
} from './manifest';
export type { GroundLayerRecipe, LayerRgb } from './manifest';
