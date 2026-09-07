/**
 * The trains module: the thing that moves on a coaster.
 *
 * `track` builds and validates layouts; this runs a fleet over one. The block system, the station
 * dwell and the dispatch live in the worker (`sim.ts`), the cars are drawn on the main thread with
 * render interpolation (`fleet.ts`), and every number about a train — cars, seats, mass, drag,
 * restraint, livery — comes out of a content pack (`manifest.ts`).
 *
 * Import-safe on the worker. `sim` is a plain function over pure files (`blocks`, `manifest`,
 * `motion`, `types`); everything that touches Babylon sits behind the dynamic imports below.
 * `TrainsMainApi` is deliberately NOT re-exported here, for the reason terrain, paths, track,
 * guests and camera all give: a type re-export keeps a module reference to `main.ts` that a bundler
 * is free to follow into Babylon. Import it from `@/lib/game/trains/main`.
 */

import type { GameModule } from '../core/types';
import { createTrainsSim } from './sim';

export const trainsModule: GameModule = {
  id: 'trains',
  deps: ['core', 'track'],
  sim: createTrainsSim,
  main: async (ctx) => (await import('./main')).createTrainsMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageTrainsShowcase(ctx),
};

export type { TrainsSimApi } from './sim';
export type {
  FleetState,
  FleetStatus,
  NoseKind,
  RestraintKind,
  RosterCar,
  RosterMessage,
  TrainMode,
  TrainProfile,
  TrainState,
  TrainsSlot,
} from './types';
export { MOTION_SUBSTEPS, RIDE_SECONDS_PER_TICK } from './types';
export {
  attachTrainContent,
  registerTrainProfile,
  registerTrainProfilesFromPack,
  resetTrainProfiles,
  resolveTrainProfile,
  trainLengthM,
  trainMassKg,
  trainProfileOverrides,
} from './manifest';
export {
  blockAt,
  blocksCovered,
  distanceAhead,
  nextBlock,
  planBlocks,
  wrapS,
} from './blocks';
export type { BlockPlan, BlockSection } from './blocks';
export { samplerFor, stepTrain, TRAIN_SAMPLES } from './motion';
export type { HoldOrder, MotionContext, SplineLike, TrackSampler } from './motion';
