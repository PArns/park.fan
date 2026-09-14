/**
 * An entity plus the manifest becomes a `ResolvedPool`. Both halves of the module go through here,
 * so the worker's water bill and the renderer's basin are the same pool.
 *
 * Pure: no Babylon, no DOM. The one thing it cannot know is the ground height, which the caller
 * supplies — a build tool that has not sampled the terrain writes `position[1] = 0`, and 0 is the
 * sea in this park.
 */

import type { Entity } from '../core/types';
import { poolEdge, poolShape, poolTile } from './manifest';
import { outlinePoints, polygonArea, poolVolume, rimHeight } from './geom';
import type { PoolEdgeSpec, PoolEntityData, ResolvedPool } from './types';

/**
 * How far the water sits below the top of the coping, per edge treatment.
 *
 * A skimmer pool runs its water 100-150 mm down so the skimmer mouth is at the surface; a
 * deck-level (overflow) pool runs it level with the paving and lets it spill into the channel,
 * which is exactly what the grate in `deck-level-grate` is for. Getting this wrong is visible from
 * three metres away: water at the brim of a rolled-coping pool reads as a pool about to flood.
 */
export function defaultFreeboard(edge: PoolEdgeSpec): number {
  switch (edge.coping) {
    case 'deck-level':
      return 0.02;
    case 'none':
      return 0.06;
    case 'square':
      return 0.1;
    case 'rolled':
    default:
      return 0.12;
  }
}

export function resolvePool(entity: Entity, groundY: number): ResolvedPool | null {
  if (entity.kind !== 'pool') return null;
  const data = (entity.data ?? {}) as PoolEntityData;
  const shape = poolShape(data.shape ?? entity.item);
  if (!shape) return null;
  const tile = poolTile(data.tile ?? shape.tile);
  const edge = poolEdge(data.edge ?? shape.edge);
  if (!tile || !edge) return null;

  const size: [number, number] = data.size
    ? [Math.max(2, data.size[0]), Math.max(2, data.size[1])]
    : [shape.size[0], shape.size[1]];
  const maxDepth = Math.max(0.15, data.depth ?? shape.depth.max);
  const freeboard = data.freeboard ?? defaultFreeboard(edge);
  const rimY = rimHeight(edge);
  const y = entity.position[1] || groundY;

  const outline = outlinePoints(shape, size);
  return {
    id: entity.id,
    position: [entity.position[0], y, entity.position[2]],
    yaw: entity.yaw,
    shape,
    tile,
    edge,
    size,
    maxDepth,
    freeboard,
    role: data.role ?? shape.role,
    heated: data.heated ?? shape.role === 'spa',
    deckDensity: data.deckDensity ?? shape.deckDensity,
    waterY: y + rimY - freeboard,
    area: polygonArea(outline),
    volume: poolVolume(shape, size, maxDepth),
  };
}

/** The radius a camera needs to stand back by to see the whole thing, deck included. */
export function poolRadius(pool: ResolvedPool): number {
  const deck = pool.edge.deck === 'none' ? 0 : pool.edge.deckWidth;
  return Math.max(pool.size[0], pool.size[1]) / 2 + deck + 2;
}
