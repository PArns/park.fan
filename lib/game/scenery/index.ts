/**
 * Scenery module: procedural props, foliage, path furniture and the landscape scatter.
 *
 * Loaded on the worker, so nothing here reaches Babylon except through `await import('./main')`.
 * `catalog`, `placement`, `scatter` and `noise` are DOM-free and Babylon-free by design: the sim
 * half resolves the same catalogue and evaluates the same scatter field the renderer draws, which
 * is what lets a guest ask "is there a bench here" without a byte crossing the thread boundary.
 */

import type { GameModule } from '../core/types';
import { createScenerySim } from './sim';

export const sceneryModule: GameModule = {
  id: 'scenery',
  deps: ['core', 'terrain'],
  kinds: ['scenery'],
  sim: createScenerySim,
  main: async (ctx) => (await import('./main')).createSceneryMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageSceneryShowcase(ctx),
};

// `SceneryMainApi` is deliberately NOT re-exported: this file is loaded on the worker and a
// re-export keeps a live module reference to `main.ts` that a bundler may follow into Babylon.
// Import it from `@/lib/game/scenery/main` where you need the type.
export type { ScenerySimApi, SceneryRecord, ScenerySlot } from './sim';
export type { PropSpec, PropClass } from './catalog';
export { AMBIENT_SPECS, GENERATORS, buildCatalog, resolveGenerator } from './catalog';
export type { PlacedProp, LineOptions, ScatterOptions } from './placement';
export { placeLine, placeSingle, scatterBrush, variant01, variantSeed } from './placement';
export type { ScatterField, ScatterInstance, ScatterSpecies } from './scatter';
export { defaultSpecies, evaluateScatter, scatterNear, woodlandSpecies } from './scatter';
