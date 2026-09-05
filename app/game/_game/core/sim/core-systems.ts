/**
 * The two systems core owns outright: litter decay and the stats roll-up.
 *
 * Everything else lives in the module that owns the behaviour. These two do not: litter is
 * produced by guests and consumed by staff and belongs to neither, and stats is a read model of
 * the whole world.
 */

import { entityIndex, type EntityId } from '../ids';
import { TICKS_PER_GAME_MINUTE } from '../units';
import type { SimContext, SimSystem } from './context';

/** Ticks a piece of litter survives untouched before it fades. ~40 game minutes. */
const LITTER_LIFETIME = TICKS_PER_GAME_MINUTE * 40;

export const litterSystem: SimSystem = {
  id: 'litter',
  tick(ctx) {
    const table = ctx.world.entities.litter;
    // Iterating a snapshot of the keys because the loop deletes from the table it walks.
    for (const key of Object.keys(table)) {
      const index = Number(key);
      const item = table[index]!;
      item.age += 1;
      if (item.age > LITTER_LIFETIME) {
        // Vomit does not evaporate; a janitor has to clear it. Litter blows away.
        if (item.kind === 'litter') {
          const id = findEntityByIndex(ctx, index);
          if (id !== null) ctx.destroy(id);
        }
      }
    }
  },
  audit(ctx) {
    return { count: Object.keys(ctx.world.entities.litter).length };
  },
};

/**
 * The reverse lookup from a component-table index back to a live handle.
 *
 * Component tables are keyed by *index* while the rest of the world speaks in *handles* (index +
 * generation). Rather than store the generation twice — a second copy of one truth, which is the
 * thing this codebase keeps finding — the handle is rebuilt from the allocator, which is the one
 * place the generation lives.
 */
function findEntityByIndex(ctx: SimContext, index: number): EntityId | null {
  for (let generation = 0; generation < 2048; generation++) {
    const candidate = ((generation << 20) | index) as EntityId;
    if (ctx.world.isAlive(candidate)) return candidate;
  }
  return null;
}

export const statsSystem: SimSystem = {
  id: 'stats',
  tick(ctx) {
    const world = ctx.world;
    const stats = world.state.stats;
    const guests = ctx.guests;

    let happinessSum = 0;
    let queueing = 0;
    for (let i = 0; i < guests.count; i++) {
      happinessSum += guests.happiness[i]!;
      if (guests.state[i] === 2) queueing++;
    }

    stats.guests = guests.count;
    stats.happiness = guests.count > 0 ? happinessSum / guests.count / 255 : 0;
    stats.queueTotal = queueing;

    let ridesOpen = 0;
    let ridesTotal = 0;
    let powerDemand = 0;
    for (const ride of Object.values(world.entities.ride)) {
      ridesTotal++;
      if (ride.status === 'open') {
        ridesOpen++;
        // A ride only draws its running power while it is actually open.
        powerDemand += ride.throughput > 0 ? 40 : 20;
      }
    }
    stats.ridesOpen = ridesOpen;
    stats.ridesTotal = ridesTotal;
    stats.staffCount = Object.keys(world.entities.staff).length;
    stats.litter = Object.keys(world.entities.litter).length;
    stats.powerDemandKw = powerDemand;

    /**
     * Park rating, 0–1000.
     *
     * Four terms, weighted the way a visitor would weight them: how happy the people already here
     * are, whether there is anything to ride, whether the place is clean, and whether the queues
     * are moving. It is deliberately *not* a function of money — a park can be rich and awful, and
     * a rating that rewarded cash would make the economy the game instead of the park.
     */
    const varietyTerm = Math.min(1, ridesOpen / 12);
    const litterPerGuest = guests.count > 0 ? stats.litter / guests.count : 0;
    const cleanTerm = Math.max(0, 1 - litterPerGuest * 4);
    const queueTerm = guests.count > 0 ? 1 - Math.min(1, queueing / guests.count / 0.55) : 1;
    stats.rating = Math.round(
      1000 * (0.45 * stats.happiness + 0.25 * varietyTerm + 0.18 * cleanTerm + 0.12 * queueTerm)
    );
  },
  audit(ctx) {
    const world = ctx.world;
    // The leak signature: a live handle with no component in any table.
    let orphans = 0;
    const tables = world.entities;
    const indices = new Set<number>();
    for (const table of [
      tables.transform,
      tables.ride,
      tables.track,
      tables.train,
      tables.staff,
      tables.shop,
      tables.scenery,
      tables.building,
      tables.path,
      tables.pool,
      tables.litter,
    ]) {
      for (const key of Object.keys(table)) indices.add(Number(key));
    }
    for (let i = 0; i < ctx.guests.count; i++) indices.add(entityIndex(ctx.guests.id[i] as EntityId));
    orphans = Math.max(0, world.liveCount - indices.size);
    return { orphanEntities: orphans, rating: world.state.stats.rating };
  },
};
