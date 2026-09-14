/**
 * The demo park's main handle. It draws nothing of its own.
 *
 * Its whole job is the one part of the park that is not world state: the ambient landscape
 * dressing. `scenery.dress()` is a pure function of the world seed and the terrain — undergrowth,
 * meadow flowers, boulders and background trees, several thousand of them — so it is re-derived on
 * every boot instead of being saved, and this is the module that asks for it.
 *
 * **It has to wait for a frame, and that is not a detail.** `host.boot()` announces the world's
 * existing entities to the main handles only after every `main()` has returned, and `dress()`
 * refuses to grow anything inside a placed prop's clearance. Dressing during `main()` would
 * therefore push undergrowth through the middle of every bench and lamp in the park, and it would
 * do it silently. So the call happens on the first `onRender`, by which point the scenery module
 * has taken the entities and rebuilt its own prop grid.
 *
 * **It is also gated on this module's own world slot** rather than on the park's name. A sandbox
 * world and a save from some other park go through the same module list, and a demo park's
 * landscape dressing appearing in an empty sandbox would be this module writing into somebody
 * else's world.
 */

import type { MainContext, MainHandle } from '../core/types';
import type { DemoParkState } from './build';

interface SceneryApi {
  dress(opts?: {
    bounds?: [number, number, number, number];
    density?: number;
    woodland?: string[];
  }): number;
}

export interface DemoParkApi {
  /** The reserved plots, for the modules that will build on them. */
  plots(): DemoParkState['plots'];
  /** Roles no registered pack could answer — an empty list is the expected case. */
  missingRoles(): string[];
  stats(): { paths: number; props: number; ambient: number; dressed: boolean };
}

export function createDemoParkMain(ctx: MainContext): MainHandle {
  const state = ctx.world.modules['demo-park'] as DemoParkState | undefined;
  let dressed = false;
  let ambient = 0;

  const api: DemoParkApi = {
    plots: () => state?.plots ?? [],
    missingRoles: () => state?.missingRoles ?? [],
    stats: () => ({
      paths: state?.counts.paths ?? 0,
      props: state?.counts.props ?? 0,
      ambient,
      dressed,
    }),
  };

  return {
    api,
    onRender() {
      if (dressed || !state || state.version !== 1) return;
      const scenery = ctx.module<SceneryApi>('scenery');
      if (!scenery?.dress) return;
      dressed = true;
      try {
        ambient = scenery.dress({
          bounds: state.dress.bounds,
          density: state.dress.density,
          woodland: state.dress.woodland,
        });
      } catch (error) {
        console.warn('[game/demo-park] landscape dressing failed', error);
      }
    },
    dispose() {
      // Nothing of ours is in the scene: the props are entities the scenery module owns, and the
      // dressing lives in its batches, which it clears in its own dispose.
    },
  };
}
