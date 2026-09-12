/**
 * Demo park: "park.fan Resort" — the world `/game` opens with, and the scene every other builder
 * and every critic looks at.
 *
 * It owns no entity kind and no world slot but its own: everything it makes is built out of the
 * four modules that exist — `terrain` shapes it, `paths` draws the network, `scenery` plants it,
 * `environment` lights it — through their public APIs, so a park that looks wrong is a module that
 * looks wrong, and there is nowhere for this module to hide a special case.
 *
 * Import-safe on the worker and in node: `scripts/game-soak.mjs` imports `buildWorld` from here
 * directly, and the renderer half sits behind a dynamic import.
 */

import type { GameModule, MainContext, World } from '../core/types';
import type { Registry } from '../core/registry';
import { buildWorld } from './build';

export const demoParkModule: GameModule & {
  buildWorld: (seed: number, registry: Registry) => World;
} = {
  id: 'demo-park',
  // `paths` and `scenery` are dependencies of the MAIN handle rather than of the world factory:
  // the factory needs only their pure halves, but the handle asks the scenery module to dress the
  // landscape and must therefore be created after it.
  deps: ['core', 'terrain', 'paths', 'scenery'],
  buildWorld,
  main: async (ctx: MainContext) => (await import('./main')).createDemoParkMain(ctx),
};

export { buildWorld };
export type { DemoParkState } from './build';
export {
  ENTRANCE_PLAZA,
  FOUNTAIN_SQUARE,
  LAKE,
  MARKET_SQUARE,
  PADS,
  PARK_SIZE,
  PATHS,
  WATER_LEVEL,
} from './plan';
export type { Pad, PathPlan, Terrace } from './plan';
