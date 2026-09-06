/**
 * The track module: an arclength spline with a roll channel, a data-driven element grammar, the
 * extruded rails and their supports, and an energy model that says whether a layout works.
 *
 * Import-safe on the worker. `sim` is a plain function over pure files (`build`, `spline`,
 * `cursor`, `ops`, `elements`, `expr`, `physics`, `resolve`, `types`, `vec`); everything that
 * touches Babylon sits behind the dynamic imports below. `TrackMainApi` is deliberately NOT
 * re-exported here, for the reason the terrain and paths modules both give: a type re-export keeps
 * a module reference to `main.ts` that a bundler is free to follow into Babylon. Import it from
 * `@/lib/game/track/main`.
 */

import type { GameModule } from '../core/types';
import { createTrackSim } from './sim';

export const trackModule: GameModule = {
  id: 'track',
  deps: ['core', 'terrain'],
  kinds: ['coaster'],
  sim: createTrackSim,
  main: async (ctx) => (await import('./main')).createTrackMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageTrackShowcase(ctx),
};

export type { TrackSimApi } from './sim';
export type { TrackData, TrackPiece, DriveSection, DriveKind } from './types';
export { HEARTLINE_HEIGHT, DEFAULT_LIMITS } from './types';
export { TrackSpline } from './spline';
export type { TrackNode, TrackFrame } from './spline';
export { buildTrack } from './build';
export type { BuiltTrack, BuildOptions, ClosureReport, TrackSegment } from './build';
export {
  registerTrackElement,
  registerTrackElementsFromPack,
  trackElement,
  trackElements,
} from './elements';
export type { TrackElementDef, ElementCategory, ElementParamDef } from './elements';
export { TRACK_OPS, MAX_ROLL_PER_M } from './ops';
export { simulateTrack, speedAt, trainSpec, trainMass } from './physics';
export type {
  TrackPhysics,
  PhysicsStation,
  TrackIssue,
  IssueCode,
  TrainSpec,
  ComfortLimits,
} from './physics';
export { buildTrackGeometry, extrusionStations } from './profile';
export type { TrackGeometry, TrackStyleShape, Geo } from './profile';
export { buildSupports } from './supports';
export type { SupportBuild, SupportOptions } from './supports';
export { resolveStyle, resolveTrain, resolveLimits, buildOptionsFor, trackStyles } from './resolve';
export { TRACK_LAYOUTS, layoutData } from './layouts';
export type { LayoutPreset } from './layouts';
