/**
 * Making a `pool` entity without a renderer.
 *
 * The demo park is a **world factory**: it builds its entities as plain state, in a file that runs
 * under node in the soak harness and has no Babylon anywhere near it. So "place a pool" cannot mean
 * "call the pools module's main-thread api" — it has to mean "write an entity", and this is the one
 * function that knows what a valid one looks like.
 *
 * The id is the caller's, because `demo-park/build.ts` allocates its own ids from a counter it
 * writes back into `world.modules.__ids`: a factory whose output depends on how many worlds the
 * process has already built is not a factory, and that module found it the hard way.
 *
 * Pure. No Babylon, no DOM, no module state beyond the manifest lookup.
 */

import type { Entity } from '../core/types';
import { poolShape } from './manifest';
import type { PoolEntityData, PoolRole } from './types';

export interface PoolPlacement {
  /** Entity id. The caller allocates it. */
  id: string;
  /** Registered shape id (`lagoon`, `lap-pool`, …) or `pack:id`. */
  shape: string;
  /** World metres. */
  x: number;
  z: number;
  /** Ground height at (x, z). Pass it: `0` is the sea in this park. */
  y: number;
  /** Radians about +Y, counter-clockwise from above. */
  yaw?: number;
  tile?: string;
  edge?: string;
  size?: [number, number];
  depth?: number;
  deckDensity?: number;
  heated?: boolean;
  role?: PoolRole;
  splashdownFor?: string;
}

/**
 * Build the entity. Throws when the shape is not registered, because a pool entity naming a shape
 * nothing can draw is a park that loads with a hole in it and no error.
 */
export function makePoolEntity(placement: PoolPlacement): Entity {
  const shape = poolShape(placement.shape);
  if (!shape) {
    throw new Error(
      `[game/pools] no pool shape "${placement.shape}" is registered. ` +
        `Call attachPoolContent(registry) first, then pick one of poolShapes().`
    );
  }
  const data: PoolEntityData = { shape: shape.id };
  if (placement.tile) data.tile = placement.tile;
  if (placement.edge) data.edge = placement.edge;
  if (placement.size) data.size = [placement.size[0], placement.size[1]];
  if (placement.depth !== undefined) data.depth = placement.depth;
  if (placement.deckDensity !== undefined) data.deckDensity = placement.deckDensity;
  if (placement.heated !== undefined) data.heated = placement.heated;
  if (placement.role) data.role = placement.role;
  if (placement.splashdownFor) data.splashdownFor = placement.splashdownFor;

  return {
    id: placement.id,
    kind: 'pool',
    // The built-in catalogue's own pack id. A pool from a content pack carries that pack's id
    // instead, which is what `poolShape()` resolves either way.
    pack: shape.key.slice(0, shape.key.indexOf(':')) || 'pools',
    item: shape.id,
    position: [placement.x, placement.y, placement.z],
    yaw: placement.yaw ?? 0,
    data: data as unknown as Record<string, unknown>,
  };
}
