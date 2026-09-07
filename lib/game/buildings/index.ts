/**
 * The buildings module: kit-bash architecture and the blueprints made of it.
 *
 * Walls, roofs, windows, doors, columns, canopies and trim are **primitives** in code; the buildings
 * themselves are **content** — a `buildingBlueprints` entry in a pack manifest, read by
 * `manifest.ts`, drawn by `build.ts`, and never switched on by id anywhere. The module's own
 * catalogue ships as a pack of its own (`pack.ts`) rather than as a TypeScript table, which is the
 * same door a third party's content comes through.
 *
 * There is no `sim`. A building is a fact about the world and not a process: it has no state that
 * changes with the clock, nothing to schedule and nothing to serialise beyond the entity core
 * already owns. When one grows an interior a guest can be inside, that is when this file grows a
 * `sim` — and not before, because a sim handle that only exists to have one is a tick nobody needs.
 *
 * Import-safe on the worker: everything that touches Babylon is behind the dynamic imports below.
 * `BuildingsMainApi` is deliberately NOT re-exported — a type re-export keeps a module reference to
 * `main.ts` that a bundler is free to follow into Babylon. Import it from
 * `@/lib/game/buildings/main`.
 *
 * `deps` includes `paths` because a building needs a forecourt to stand on and the showcase paves
 * one; a park without paths still gets its buildings, the ground under them is just terrain.
 */

import type { GameModule } from '../core/types';

export const buildingsModule: GameModule = {
  id: 'buildings',
  deps: ['core', 'terrain', 'paths'],
  kinds: ['building'],
  main: async (ctx) => (await import('./main')).createBuildingsMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageBuildingsShowcase(ctx),
};

export type {
  BayCode,
  BlueprintDef,
  BuildingEntityData,
  BuildingPalette,
  BuildingStyleDef,
  FacadeMap,
  FacadeSide,
  LightSite,
  MassDef,
  ResolvedBuilding,
  RoofDef,
  RoofForm,
  SurfaceName,
  TrimDef,
} from './types';
export { isBayCode, parsePattern, patternForStorey, planBays } from './bays';
export {
  attachBuildingContent,
  buildingBlueprints,
  buildingItems,
  buildingStyles,
  resetBuildingContent,
  resolveBuilding,
  surfaceFromMaterial,
  BLUEPRINT_CATEGORY,
  DEFAULT_STYLE,
  STYLE_CATEGORY,
} from './manifest';
export { buildBuilding, buildKitPiece, seedForBuilding, PIECES } from './build';
export type { BuildingBuild } from './build';
export { ARCHITECTURE_PACK } from './pack';
