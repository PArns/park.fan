/**
 * Making a `flume` entity without a renderer.
 *
 * The demo park is a **world factory**: it builds its entities as plain state, in a file that runs
 * under node in the soak harness with no Babylon anywhere near it. So "place a slide" cannot mean
 * "call the flumes module's main-thread api" — it has to mean "write an entity", and this is the
 * one function that knows what a valid one looks like. Same shape and the same reason as
 * `pools/entity.ts`.
 *
 * The id is the caller's, because `demo-park/build.ts` allocates its own ids from a counter it
 * writes back into `world.modules.__ids`: a factory whose output depends on how many worlds the
 * process has already built is not a factory.
 *
 * Pure. No Babylon, no DOM, no module state beyond the manifest lookup.
 */

import type { Entity } from '../core/types';
import { flumeLayout } from './manifest';
import type { FlumeEntityData } from './types';

export interface FlumePlacement {
  /** Entity id. The caller allocates it. */
  id: string;
  /** The pack the RIDE comes from, e.g. `neon-lagoon`. */
  pack: string;
  /** The ride id in that pack, e.g. `body-slide`. */
  item: string;
  /** World metres — the foot of the tower. */
  x: number;
  z: number;
  /** Ground height at (x, z). Pass it: `0` is the sea in this park. */
  y: number;
  /** Radians about +Y. The slide leaves the tower along this heading. */
  yaw?: number;
  /** Registered layout id. Omitted, the ride's own `flumeStyle` picks the first one drawn for it. */
  layout?: string;
  towerHeight?: number;
  color?: string;
  /** The pool entity the run-out lands in. */
  splashdown?: string;
  running?: boolean;
}

/**
 * Build the entity.
 *
 * Throws when a named layout is not registered, because a flume entity naming a descent nothing can
 * build is a park that loads with a tower and no slide and no error anywhere. An entity that names
 * NO layout is fine and is the common case: the ride's `flumeStyle` resolves one at build time.
 */
export function makeFlumeEntity(placement: FlumePlacement): Entity {
  const data: FlumeEntityData = {};
  if (placement.layout) {
    const layout = flumeLayout(placement.layout);
    if (!layout || layout.id !== placement.layout.split(':').pop()) {
      throw new Error(
        `[game/flumes] no layout "${placement.layout}" is registered. ` +
          `Call attachFlumeContent(registry) first, then pick one of flumeLayouts().`
      );
    }
    data.layout = layout.id;
  }
  if (placement.towerHeight !== undefined) data.towerHeight = placement.towerHeight;
  if (placement.color) data.color = placement.color;
  if (placement.splashdown) data.splashdown = placement.splashdown;
  if (placement.running !== undefined) data.running = placement.running;

  return {
    id: placement.id,
    kind: 'flume',
    pack: placement.pack,
    item: placement.item,
    position: [placement.x, placement.y, placement.z],
    yaw: placement.yaw ?? 0,
    data: data as unknown as Record<string, unknown>,
  };
}
