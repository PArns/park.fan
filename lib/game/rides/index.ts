/**
 * The rides module: flat rides — the fairground half of a park.
 *
 * A carousel, a chair swing, a wave swinger, a top spin, a ferris wheel. Things that stand on a
 * plot, take a load of guests, run a cycle and put them back. Coasters belong to `track` + `trains`
 * and water slides to `flumes`; the `kind` discriminator on a pack's `rides` entry is what routes
 * an item here, and `flat` is the only one this module claims.
 *
 * Import-safe on the worker: `sim` is a plain function over pure files (`manifest`, `rig`, `shapes`,
 * `types`), and everything that touches Babylon is behind the dynamic imports below. `RidesMainApi`
 * is deliberately NOT re-exported — the reason terrain, paths, track, guests, camera and trains all
 * give: a type re-export keeps a module reference to `main.ts` that a bundler is free to follow into
 * Babylon. Import it from `@/lib/game/rides/main`.
 *
 * `deps` is `['core', 'paths']` rather than the scaffold's `['core', 'track']`: a flat ride has no
 * track, and the showcase needs a promenade for the machines to stand on.
 */

import type { GameModule } from '../core/types';
import { createRidesSim } from './sim';

export const ridesModule: GameModule = {
  id: 'rides',
  deps: ['core', 'paths'],
  kinds: ['ride'],
  sim: createRidesSim,
  main: async (ctx) => (await import('./main')).createRidesMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageRidesShowcase(ctx),
};

export type { RidesSimApi } from './sim';
export { PARK_CLOSE, PARK_OPEN, RIDE_SECONDS_PER_TICK } from './sim';
export type {
  Channel,
  CurveSpec,
  CycleSplit,
  Facing,
  Finish,
  FlatRideProfile,
  NightRig,
  RefusalReason,
  ResolvedRig,
  RideBoarding,
  RideJoin,
  RideOffer,
  RideRigSpec,
  RideTicket,
  RideView,
  RidesStats,
  RigPartSpec,
  ShapeName,
} from './types';
export { MOTION_STRIDE, RIDE_STATE_NAMES, RideState, THROUGHPUT_WINDOW } from './types';
export {
  attachRideContent,
  flatRides,
  presetNames,
  resetRideContent,
  resolveFlatRide,
  DEFAULT_SPLIT,
  RIG_CATEGORY,
} from './manifest';
export { buildShape, hexToLinear, isShapeName, shapeNames, triangleCount } from './shapes';
export type { ShapeMesh, Surface } from './shapes';
export { chainAngle, channelValue, poseRig, rigLayout, SPIN_WRAP } from './rig';
export type { PoseInput, RigLayout, UnitPose } from './rig';
