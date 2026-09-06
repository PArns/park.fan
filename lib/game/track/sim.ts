/**
 * The worker half: the same splines and the same physics, on the authoritative side.
 *
 * The `trains` module runs in the worker and needs the exact curve the renderer drew, or a train
 * interpolated onto the main thread would leave the rails. Both sides therefore build from the
 * same `TrackData` with the same pure code (`build.ts` → `spline.ts`), which is the whole reason
 * every file from `vec.ts` to `supports.ts` is Babylon-free.
 *
 * It owns no persistent state. A layout lives in its entity's `data`, so `world.modules.track`
 * stays empty and a save is the piece list — a few hundred bytes per coaster instead of a baked
 * spline. Everything here is derived, and `rebuild()` is what derives it.
 */

import type { Command, Entity, SimContext, SimHandle } from '../core/types';
import { attachTrackElements } from './elements';
import { buildTrack, type BuiltTrack } from './build';
import type { TrackPhysics } from './physics';
import { buildOptionsFor } from './resolve';
import type { TrackFrame, TrackSpline } from './spline';
import type { DriveSection, TrackData } from './types';

/** What `trains` reads. Everything on it is a function of the geometry — nothing is mutable. */
export interface TrackSimApi {
  ids(): string[];
  spline(id: string): TrackSpline | undefined;
  frameAt(id: string, s: number): TrackFrame | undefined;
  /** Length of one lap (a circuit) or of the run (a shuttle), metres. */
  length(id: string): number;
  drives(id: string): readonly DriveSection[];
  physics(id: string): TrackPhysics | undefined;
  /** True when the layout is a closed circuit. */
  closed(id: string): boolean;
  /** Build and simulate a layout without keeping it. */
  validate(data: TrackData): TrackPhysics;
}

export function createTrackSim(ctx: SimContext): SimHandle {
  // Claim `trackElements` and read it off every pack. Done on the SIM side because the element
  // table is pure and both halves of the module read it; `main.ts` does the same, and the second
  // call is a no-op on a map that already holds the entry.
  const detachElements = attachTrackElements(ctx.registry);
  const tracks = new Map<string, BuiltTrack>();

  function dataOf(entity: Entity): TrackData | null {
    const data = entity.data as unknown as TrackData | undefined;
    if (!data || !Array.isArray(data.pieces) || data.pieces.length === 0) return null;
    return { ...data, origin: entity.position, yaw: entity.yaw };
  }

  function build(id: string, data: TrackData): void {
    try {
      tracks.set(id, buildTrack(data, buildOptionsFor(ctx.registry, data)));
      ctx.events.emit('track:changed', { rideId: id });
    } catch (error) {
      // A layout that will not build must not take the tick down with it: the coaster becomes an
      // entity with no track, `trains` finds no spline and dispatches nothing.
      tracks.delete(id);
      console.error(`[game/track] could not build ${id}`, error);
    }
  }

  function rebuild(): void {
    tracks.clear();
    for (const id of Object.keys(ctx.world.entities).sort()) {
      const entity = ctx.world.entities[id];
      if (entity.kind !== 'coaster') continue;
      const data = dataOf(entity);
      if (data) build(id, data);
    }
  }

  const offAdd = ctx.events.on('entity:add', (entity: Entity) => {
    if (entity.kind !== 'coaster') return;
    const data = dataOf(entity);
    if (data) build(entity.id, data);
  });
  const offUpdate = ctx.events.on('entity:update', (payload: { entity: Entity }) => {
    if (payload.entity.kind !== 'coaster') return;
    const data = dataOf(payload.entity);
    if (data) build(payload.entity.id, data);
  });
  const offRemove = ctx.events.on('entity:remove', (entity: Entity) => {
    if (entity.kind !== 'coaster') return;
    if (tracks.delete(entity.id)) ctx.events.emit('track:changed', { rideId: entity.id });
  });

  const api: TrackSimApi = {
    ids: () => [...tracks.keys()],
    spline: (id) => tracks.get(id)?.spline,
    frameAt: (id, s) => tracks.get(id)?.spline.frameAt(s),
    length: (id) => tracks.get(id)?.spline.length() ?? 0,
    drives: (id) => tracks.get(id)?.drives ?? [],
    physics: (id) => tracks.get(id)?.physics,
    closed: (id) => tracks.get(id)?.spline.closed ?? false,
    validate: (data) => buildTrack(data, buildOptionsFor(ctx.registry, data)).physics,
  };

  return {
    api,
    tick() {
      // A track does not move. Trains do, and they are a different module.
    },
    command(cmd: Command): boolean {
      if (cmd.type !== 'track:rebuild') return false;
      rebuild();
      return true;
    },
    rebuild,
    dispose() {
      offAdd();
      offUpdate();
      offRemove();
      detachElements();
      tracks.clear();
    },
  };
}
