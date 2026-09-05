/**
 * Staff.
 *
 * Five roles, one loop: find the nearest job inside your zone, walk to it, do it. What differs per
 * role is only what counts as a job — which is why a new role is a `case` here and a definition in
 * a pack, not a new system.
 *
 * The mechanic is the one with a claim: a broken ride records the mechanic that took the job, so
 * three mechanics do not all walk to the same breakdown and leave the other two unattended.
 */

import type { SimContext, SimSystem } from '../core/sim/context';
import { NO_ENTITY, type EntityId } from '../core/ids';
import { TICKS_PER_GAME_MINUTE, lerpAngle } from '../core/units';

const STAFF_SPEED = 1.45;
/** Ticks a janitor takes to clear one piece of litter, before skill. */
const CLEAN_TICKS = TICKS_PER_GAME_MINUTE * 0.6;
/** Ticks a mechanic takes on a breakdown, before skill. */
const REPAIR_TICKS = TICKS_PER_GAME_MINUTE * 4;

export const staffSystem: SimSystem = {
  id: 'staff',
  tick(ctx) {
    const world = ctx.world;

    for (const key of Object.keys(world.entities.staff)) {
      const staffIndex = Number(key);
      const staff = world.entities.staff[staffIndex]!;
      const transform = world.entities.transform[staffIndex];
      if (!transform) continue;

      staff.ticksInState++;

      // Skill grows slowly with time served and makes the work faster, not the walking.
      if (world.tick % (TICKS_PER_GAME_MINUTE * 60 * 8) === 0) {
        staff.skill = Math.min(1, staff.skill + 0.02);
      }

      if (staff.state === 'working') {
        const done = performWork(ctx, staffIndex, staff, transform);
        if (done) {
          staff.state = 'idle';
          staff.target = NO_ENTITY;
          staff.ticksInState = 0;
        }
        continue;
      }

      if (staff.target === NO_ENTITY) {
        const job = findJob(ctx, staffIndex, staff, transform);
        if (job === null) {
          // Nothing to do: patrol rather than freeze. A motionless janitor reads as a bug.
          if (staff.ticksInState > TICKS_PER_GAME_MINUTE * 2) {
            const rng = ctx.rng('staff');
            transform.rotY = rng.range(0, Math.PI * 2);
            staff.ticksInState = 0;
          }
          const drift = 0.35 * (50 / 1000);
          transform.x += Math.cos(transform.rotY) * drift;
          transform.z += Math.sin(transform.rotY) * drift;
          clampToMap(ctx, transform);
          continue;
        }
        staff.target = job;
        staff.state = 'walking';
        staff.ticksInState = 0;
        if (staff.role === 'mechanic') {
          const ride = world.entities.ride[job & 0xfffff];
          if (ride) ride.assignedMechanic = staffIndex as EntityId;
        }
      }

      const targetTransform = world.entities.transform[staff.target & 0xfffff];
      if (!targetTransform) {
        staff.target = NO_ENTITY;
        staff.state = 'idle';
        continue;
      }

      const dx = targetTransform.x - transform.x;
      const dz = targetTransform.z - transform.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 1.8) {
        staff.state = 'working';
        staff.ticksInState = 0;
        continue;
      }
      const step = (STAFF_SPEED * 50) / 1000;
      transform.x += (dx / distance) * step;
      transform.z += (dz / distance) * step;
      transform.rotY = lerpAngle(transform.rotY, Math.atan2(dz, dx), 0.3);
      ctx.dirty.staff.push(staffIndex as EntityId);
    }
  },

  audit(ctx) {
    let idle = 0;
    for (const staff of Object.values(ctx.world.entities.staff)) if (staff.state === 'idle') idle++;
    return { staffIdle: idle };
  },
};

function findJob(
  ctx: SimContext,
  _selfIndex: number,
  staff: { role: string; zone: number[] },
  from: { x: number; z: number }
): EntityId | null {
  const world = ctx.world;

  switch (staff.role) {
    case 'janitor': {
      let best: number | null = null;
      let bestScore = Infinity;
      for (const key of Object.keys(world.entities.litter)) {
        const index = Number(key);
        const transform = world.entities.transform[index];
        if (!transform) continue;
        if (!inZone(staff.zone, transform.x, transform.z)) continue;
        const item = world.entities.litter[index]!;
        // Vomit first: it costs happiness at four times the rate and does not blow away.
        const priority = item.kind === 'vomit' ? 0 : 40;
        const score = Math.hypot(transform.x - from.x, transform.z - from.z) + priority;
        if (score < bestScore) {
          bestScore = score;
          best = index;
        }
      }
      return best === null ? null : (best as EntityId);
    }

    case 'mechanic': {
      let best: number | null = null;
      let bestDistance = Infinity;
      for (const key of Object.keys(world.entities.ride)) {
        const index = Number(key);
        const ride = world.entities.ride[index]!;
        const needsWork = ride.status === 'broken' || ride.reliability < 0.55;
        if (!needsWork) continue;
        if (ride.status === 'broken' && ride.assignedMechanic !== NO_ENTITY) continue;
        const transform = world.entities.transform[index];
        if (!transform) continue;
        if (!inZone(staff.zone, transform.x, transform.z)) continue;
        const distance = Math.hypot(transform.x - from.x, transform.z - from.z);
        // A broken ride outranks a worn one however far away it is.
        const score = ride.status === 'broken' ? distance : distance + 400;
        if (score < bestDistance) {
          bestDistance = score;
          best = index;
        }
      }
      return best === null ? null : (best as EntityId);
    }

    case 'vendor': {
      for (const key of Object.keys(world.entities.shop)) {
        const index = Number(key);
        const shop = world.entities.shop[index]!;
        if (shop.stock > 100) continue;
        const transform = world.entities.transform[index];
        if (!transform || !inZone(staff.zone, transform.x, transform.z)) continue;
        return index as EntityId;
      }
      return null;
    }

    case 'lifeguard': {
      for (const key of Object.keys(world.entities.pool)) {
        const index = Number(key);
        const transform = world.entities.transform[index];
        if (!transform || !inZone(staff.zone, transform.x, transform.z)) continue;
        return index as EntityId;
      }
      return null;
    }

    default:
      // Entertainers have no job queue: they walk among the guests, which the idle branch does.
      return null;
  }
}

function performWork(
  ctx: SimContext,
  selfIndex: number,
  staff: { role: string; skill: number; target: EntityId; ticksInState: number },
  _from: { x: number; z: number }
): boolean {
  const world = ctx.world;
  const targetIndex = staff.target & 0xfffff;

  switch (staff.role) {
    case 'janitor': {
      if (staff.ticksInState < CLEAN_TICKS * (1.4 - staff.skill * 0.5)) return false;
      const handle = handleFor(ctx, targetIndex);
      if (handle) ctx.destroy(handle);
      return true;
    }

    case 'mechanic': {
      const ride = world.entities.ride[targetIndex];
      if (!ride) return true;
      if (staff.ticksInState < REPAIR_TICKS * (1.4 - staff.skill * 0.6)) return false;
      ride.reliability = Math.min(1, ride.reliability + 0.45 + staff.skill * 0.3);
      ride.ticksSinceInspection = 0;
      ride.assignedMechanic = NO_ENTITY;
      if (ride.status === 'broken') {
        ride.status = 'open';
        ctx.notify({ level: 'info', title: 'Attraktion repariert' });
      }
      ctx.dirty.rides.push(targetIndex as EntityId);
      return true;
    }

    case 'vendor': {
      const shop = world.entities.shop[targetIndex];
      if (!shop) return true;
      if (staff.ticksInState < TICKS_PER_GAME_MINUTE) return false;
      shop.stock = 500;
      shop.cleanliness = Math.min(1, shop.cleanliness + 0.4);
      return true;
    }

    case 'lifeguard': {
      const pool = world.entities.pool[targetIndex];
      if (!pool) return true;
      // Standing watch keeps the water usable; it is a continuous job, not a task.
      pool.quality = Math.min(1, pool.quality + 0.0008);
      return staff.ticksInState > TICKS_PER_GAME_MINUTE * 30;
    }

    default:
      void selfIndex;
      return true;
  }
}

/** An empty zone means the whole park. A polygon is a flat list of x,z pairs. */
function inZone(zone: number[], x: number, z: number): boolean {
  if (zone.length < 6) return true;
  let inside = false;
  for (let i = 0, j = zone.length / 2 - 1; i < zone.length / 2; j = i++) {
    const xi = zone[i * 2]!;
    const zi = zone[i * 2 + 1]!;
    const xj = zone[j * 2]!;
    const zj = zone[j * 2 + 1]!;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

function clampToMap(ctx: SimContext, transform: { x: number; z: number }): void {
  const size = ctx.world.state.terrain.size;
  transform.x = Math.min(size - 1, Math.max(1, transform.x));
  transform.z = Math.min(size - 1, Math.max(1, transform.z));
}

function handleFor(ctx: SimContext, index: number): EntityId | null {
  for (let generation = 0; generation < 2048; generation++) {
    const candidate = ((generation << 20) | index) as EntityId;
    if (ctx.world.isAlive(candidate)) return candidate;
  }
  return null;
}
