/**
 * The pools module: swimming pools as a placeable, shapeable thing.
 *
 * Basins with a real plan and a real floor, glazed tile with a waterline, coping, a deck with its
 * furniture, steps and handrails, underwater lighting, and the water itself — depth-tinted, with a
 * caustic net on the tile under it. The lake belongs to `terrain`; water slides land in these and
 * belong to `flumes`.
 *
 * Import-safe on the worker: `sim` is a plain function over pure files (`manifest`, `geom`,
 * `resolve`, `excavate`, `types`), and everything that touches Babylon is behind the dynamic
 * imports below. `PoolsMainApi` is deliberately NOT re-exported — the reason terrain, paths, track,
 * rides, camera and trains all give: a type re-export keeps a module reference to `main.ts` that a
 * bundler is free to follow into Babylon. Import it from `@/lib/game/pools/main`.
 *
 * `deps` is `['core', 'terrain']`: a pool is a hole in the ground before it is anything else, and
 * it reads the terrain's height to know where its own rim goes.
 */

import type { GameModule } from '../core/types';
import { createPoolsSim } from './sim';

export const poolsModule: GameModule = {
  id: 'pools',
  deps: ['core', 'terrain'],
  kinds: ['pool'],
  sim: createPoolsSim,
  main: async (ctx) => (await import('./main')).createPoolsMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stagePoolsShowcase(ctx),
};

export type { PoolsSimApi } from './sim';
export type {
  PoolBuild,
  PoolCoping,
  PoolDeckItemSpec,
  PoolDeckShape,
  PoolDeckSurface,
  PoolDepthSpec,
  PoolEdgeSpec,
  PoolEntityData,
  PoolEntry,
  PoolLightSite,
  PoolOutline,
  PoolProfile,
  PoolRole,
  PoolShapeSpec,
  PoolState,
  PoolSurface,
  PoolSurfaceName,
  PoolTilePattern,
  PoolTileSpec,
  PoolsStats,
  ResolvedPool,
} from './types';
export {
  attachPoolContent,
  poolDeckItems,
  poolEdge,
  poolEdges,
  poolShape,
  poolShapes,
  poolTile,
  poolTiles,
  poolsCategorySchema,
  registerPools,
  resetPoolContent,
  BUILTIN_PACK,
  POOL_CATEGORY,
} from './manifest';
export {
  depthAtUnit,
  ensureCcw,
  insidePolygon,
  isStarShaped,
  outlinePoints,
  polygonArea,
  poolVolume,
  profileMaxDepth,
  rimHeight,
  toLocal,
  toWorld,
} from './geom';
export { buildPool } from './build';
export { buildWaterMesh, RIPPLE_TILE } from './water-mesh';
export type { WaterMeshData } from './water-mesh';
export type { PoolBuildInput } from './build';
export { excavatePool, signedDistance } from './excavate';
export { defaultFreeboard, poolRadius, resolvePool } from './resolve';
export { makePoolEntity } from './entity';
export type { PoolPlacement } from './entity';
