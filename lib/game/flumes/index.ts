/**
 * The flumes module: water slides on the track core, with the water on them.
 *
 * A trough extruded along `track`'s arclength spline, walled by the speed the rider really carries
 * there; a sheet of moving water down its floor; a steel tower with a stair somebody climbs; the
 * columns that hold the run up; the vehicles — a body, a tube, a raft, a mat — and the splash at
 * the bottom, drawn on a `pools` basin through that module's own `splash()` contract.
 *
 * Import-safe on the worker: `sim` is a plain function over pure files (`manifest`, `resolve`,
 * `geom`, `entity`, `types`) plus the `track` module's pure half, and everything that touches
 * Babylon sits behind the dynamic imports below. `FlumesMainApi` is deliberately NOT re-exported —
 * the reason terrain, paths, track, rides, pools, camera and trains all give: a type re-export keeps
 * a module reference to `main.ts` that a bundler is free to follow into Babylon. Import it from
 * `@/lib/game/flumes/main`.
 *
 * `deps` is `['core', 'track', 'pools']`: the spline and its physics come from `track`, and the
 * landing is a `pools` basin. `terrain` arrives through both of them, which is what grounds the
 * tower.
 */

import type { GameModule } from '../core/types';
import { createFlumesSim } from './sim';

export const flumesModule: GameModule = {
  id: 'flumes',
  deps: ['core', 'track', 'pools'],
  kinds: ['flume'],
  sim: createFlumesSim,
  main: async (ctx) => (await import('./main')).createFlumesMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageFlumesShowcase(ctx),
};

export type { FlumesSimApi } from './sim';
export type {
  FlumeEntityData,
  FlumeHull,
  FlumeLayoutSpec,
  FlumeNightRig,
  FlumePiece,
  FlumeRider,
  FlumeRig,
  FlumeState,
  FlumeStyleSpec,
  FlumeTowerSpec,
  FlumeView,
  FlumesStats,
  ResolvedFlume,
} from './types';
export { MAX_RIDERS, RIDER_STRIDE, SLIDE_SECONDS_PER_TICK } from './types';
export {
  attachFlumeContent,
  defaultLayoutFor,
  flumeLayout,
  flumeLayouts,
  flumeStyle,
  flumeStyles,
  flumeTower,
  flumeTowers,
  flumesCategorySchema,
  registerFlumes,
  resetFlumeContent,
  BUILTIN_PACK,
  FLUME_CATEGORY,
} from './manifest';
export { buildFlume, resolveFlume, riderSpec, ridersPerHour, trackDataFor, CRADLE_DEPTH } from './resolve'; // prettier-ignore
export type { FlumeBuild } from './resolve';
export {
  buildRig,
  buildShell,
  buildTower,
  buildWaterSheet,
  hexToLinear,
  quaternionOf,
  riderPose,
  sectionNormal,
  sectionPoint,
  triangleCount,
  wallExtents,
} from './geom';
export type { FlumeStation, FlowGeo, RigBuild, TowerBuild } from './geom';
export { makeFlumeEntity } from './entity';
export type { FlumePlacement } from './entity';
