/**
 * The buildings module: kit-bash architecture and the blueprints made of it.
 *
 * Walls, roofs, windows, doors, columns, canopies and trim are **primitives** in code; the buildings
 * themselves are **content** — a `buildingBlueprints` entry in a pack manifest, read by
 * `manifest.ts`, drawn by `build.ts`, and never switched on by id anywhere. The module's own
 * catalogue ships as a pack of its own (`pack.ts`) rather than as a TypeScript table, which is the
 * same door a third party's content comes through.
 *
 * The `sim` half owns no geometry and its tick does nothing — a building is a fact about the world
 * and not a process. It exists for two reasons. It is where a kind gets an **owner**: the sim
 * runtime skips a module with no `sim` before it reaches `registerKind`, so `building` was an
 * unowned kind there and `pnpm test:game`'s orphan check went red the day the demo park got its
 * first two. And it answers, without a mesh, the questions a guest cannot wait for a mesh to
 * answer — a footprint and a door, both derived from the blueprint.
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
import { createBuildingsSim } from './sim';

export const buildingsModule: GameModule = {
  id: 'buildings',
  deps: ['core', 'terrain', 'paths'],
  kinds: ['building'],
  sim: createBuildingsSim,
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
export type { BuildingRecord, BuildingsSimApi } from './sim';
