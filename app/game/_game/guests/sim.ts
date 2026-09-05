/**
 * Guests: needs, decisions, navigation, queueing.
 *
 * Two systems. `queueSystem` moves people between a queue and a vehicle and runs *before*
 * `guestsSystem`, so a guest who was let onto a ride this tick does not also get to make a walking
 * decision in the same tick and end up half in a train.
 *
 * ## Navigation
 *
 * Guests walk a **path graph** that the `paths` module owns. This module does not build it and
 * must not: a park with no paths still has to simulate, and a guest module that reached into path
 * geometry would break the moment paths changed shape. The graph arrives through
 * {@link setNavProvider}; with none installed guests steer straight at their target, which is what
 * an empty sandbox and every unit test look like.
 */

import type { SimContext, SimSystem } from '../core/sim/context';
import { TICKS_PER_GAME_MINUTE, clamp, lerpAngle } from '../core/units';
import { NO_ENTITY, type EntityId } from '../core/ids';

export const GUEST_STATE = {
  entering: 0,
  walking: 1,
  queueing: 2,
  riding: 3,
  shopping: 4,
  swimming: 5,
  resting: 6,
  leaving: 7,
} as const;

/** Metres per second. A relaxed walk, not a commute. */
const WALK_SPEED = 1.25;
/** Ticks a guest waits in a queue before its patience runs out and it leaves, at happiness 0.5. */
const BASE_PATIENCE = TICKS_PER_GAME_MINUTE * 25;

export interface NavProvider {
  /** The next waypoint towards `to`, or null when there is no route. */
  next(fromX: number, fromZ: number, toX: number, toZ: number, node: number): { x: number; z: number; node: number } | null;
  /** True when the two points are connected by walkable path at all. */
  reachable(fromX: number, fromZ: number, toX: number, toZ: number): boolean;
  /** The park entrance, where guests arrive and leave. */
  entrance(): { x: number; z: number };
}

let nav: NavProvider | null = null;

/** Installed by the `paths` module once its graph exists. Passing `null` returns guests to steering. */
export function setNavProvider(provider: NavProvider | null): void {
  nav = provider;
}

export const queueSystem: SimSystem = {
  id: 'queues',
  tick(ctx) {
    const world = ctx.world;
    const guests = ctx.guests;

    for (const key of Object.keys(world.entities.ride)) {
      const rideIndex = Number(key);
      const ride = world.entities.ride[rideIndex]!;
      if (ride.queue.length === 0) continue;

      if (ride.status !== 'open') {
        // A closed ride does not hold people hostage: everyone is released to walk again.
        for (const guestId of ride.queue) {
          const i = guests.find(guestId);
          if (i >= 0) {
            guests.state[i] = GUEST_STATE.walking;
            guests.target[i] = NO_ENTITY;
            guests.ticksInState[i] = 0;
            guests.happiness[i] = Math.max(0, guests.happiness[i]! - 12);
          }
        }
        ride.queue = [];
        continue;
      }

      const definition =
        ctx.registry.get('flat-ride', ride.defId) ??
        ctx.registry.get('coaster', ride.defId) ??
        ctx.registry.get('flume', ride.defId);

      if (ride.kind === 'flat') {
        const capacity = ctx.registry.get('flat-ride', ride.defId)?.capacity ?? 12;
        const cycle = ctx.registry.get('flat-ride', ride.defId)?.cycleSeconds ?? 60;
        const period = Math.round((cycle + (ctx.registry.get('flat-ride', ride.defId)?.loadSeconds ?? 30)) * 20);
        if (world.tick % Math.max(20, period) === 0) {
          board(ctx, rideIndex, ride, Math.min(capacity, ride.queue.length), definition?.cost.build ?? 0);
        }
      } else {
        // A coaster boards whatever train is sitting in its station.
        for (const trainKey of Object.keys(world.entities.train)) {
          const train = world.entities.train[Number(trainKey)]!;
          if ((train.rideId & 0xfffff) !== rideIndex) continue;
          if (train.state !== 'station' || train.riders > 0) continue;
          const seats = train.cars * (ctx.registry.get('coaster', ride.defId)?.car.seatsPerCar ?? 4);
          const taken = board(ctx, rideIndex, ride, Math.min(seats, ride.queue.length), definition?.cost.build ?? 0);
          train.riders = taken;
          break;
        }
      }
    }

    // Riders whose ride has finished with them.
    for (let i = 0; i < guests.count; i++) {
      if (guests.state[i] !== GUEST_STATE.riding) continue;
      guests.ticksInState[i]!;
      const rideIndex = guests.target[i]! & 0xfffff;
      const ride = world.entities.ride[rideIndex];
      if (!ride) {
        guests.state[i] = GUEST_STATE.walking;
        guests.target[i] = NO_ENTITY;
        continue;
      }
      const rideLength =
        ride.kind === 'flat'
          ? Math.round((ctx.registry.get('flat-ride', ride.defId)?.cycleSeconds ?? 60) * 20)
          : TICKS_PER_GAME_MINUTE * 2;
      if (guests.ticksInState[i]! > rideLength) {
        guests.state[i] = GUEST_STATE.walking;
        guests.ticksInState[i] = 0;
        guests.target[i] = NO_ENTITY;
        // The pay-off. Excitement lifts happiness, nausea takes it away, and fear does both
        // depending on what the guest came for — which is what `taste` is.
        const thrillTaste = guests.taste[i * 5]! / 255;
        const delta =
          ride.excitement * 4 * (0.5 + thrillTaste) - ride.nausea * 2.5 - ride.fear * (1 - thrillTaste) * 2;
        guests.happiness[i] = clamp(Math.round(guests.happiness[i]! + delta), 0, 255);
        guests.energy[i] = Math.max(0, guests.energy[i]! - 6);
        bumpNeed(ctx, i, 'boredom', -140);
      }
    }
  },

  audit(ctx) {
    let queued = 0;
    for (const ride of Object.values(ctx.world.entities.ride)) queued += ride.queue.length;
    return { guestsQueued: queued };
  },
};

function board(
  ctx: SimContext,
  rideIndex: number,
  ride: { queue: EntityId[]; price: number; totalRiders: number },
  count: number,
  _buildCost: number
): number {
  const guests = ctx.guests;
  let boarded = 0;
  for (let n = 0; n < count && ride.queue.length > 0; n++) {
    const guestId = ride.queue.shift()!;
    const i = guests.find(guestId);
    if (i < 0) continue;
    if (ride.price > 0) {
      if (guests.wallet[i]! < ride.price) {
        guests.state[i] = GUEST_STATE.walking;
        guests.target[i] = NO_ENTITY;
        guests.happiness[i] = Math.max(0, guests.happiness[i]! - 20);
        continue;
      }
      guests.wallet[i] = guests.wallet[i]! - ride.price;
      guests.spent[i] = guests.spent[i]! + ride.price;
      ctx.earn(ride.price, 'ticketIncome');
    }
    guests.state[i] = GUEST_STATE.riding;
    guests.target[i] = ((rideIndex | (0 << 20)) as EntityId) satisfies EntityId;
    guests.target[i] = rideIndex as EntityId;
    guests.ticksInState[i] = 0;
    ride.totalRiders++;
    boarded++;
  }
  return boarded;
}

export const guestsSystem: SimSystem = {
  id: 'guests',

  init(ctx) {
    // Needs come from the registry, so a pack can add one without a core edit. If a pack added a
    // need after this world was saved, the extra column reads zero, which is the right default.
    ctx.registry.needOrder();
  },

  tick(ctx) {
    const world = ctx.world;
    const guests = ctx.guests;
    const needs = ctx.registry.needOrder();
    const rng = ctx.rng('guests');

    spawnArrivals(ctx);

    const perTickDecay = new Float32Array(needs.length);
    for (let n = 0; n < needs.length; n++) {
      const definition = ctx.registry.get('need', needs[n]!);
      perTickDecay[n] = (definition?.decayPerHour ?? 12) / (TICKS_PER_GAME_MINUTE * 60);
    }

    for (let i = guests.count - 1; i >= 0; i--) {
      guests.ticksInState[i] = Math.min(65535, guests.ticksInState[i]! + 1);

      // Needs rise for everyone, all the time. A queue is not a rest.
      for (let n = 0; n < needs.length; n++) {
        const slot = i * guests.needCount + n;
        const next = guests.needs[slot]! + perTickDecay[n]!;
        guests.needs[slot] = next > 255 ? 255 : next;
      }

      const state = guests.state[i]!;

      if (state === GUEST_STATE.riding || state === GUEST_STATE.shopping) continue;

      if (state === GUEST_STATE.queueing) {
        const patience = BASE_PATIENCE * (0.5 + guests.happiness[i]! / 255);
        if (guests.ticksInState[i]! > patience) {
          leaveQueue(ctx, i);
          guests.happiness[i] = Math.max(0, guests.happiness[i]! - 30);
        }
        continue;
      }

      // Unhappy, broke or exhausted people go home. Checked before a new target is picked so a
      // guest who has decided to leave does not get talked into one more ride.
      if (
        state !== GUEST_STATE.leaving &&
        (guests.happiness[i]! < 40 || guests.energy[i]! < 12 || criticalNeed(ctx, i, needs) === 'exit')
      ) {
        guests.state[i] = GUEST_STATE.leaving;
        guests.target[i] = NO_ENTITY;
        guests.ticksInState[i] = 0;
      }

      if (guests.target[i] === NO_ENTITY) {
        pickTarget(ctx, i, needs);
      }

      walk(ctx, i, rng.next());

      if (state === GUEST_STATE.leaving) {
        const exit = nav?.entrance() ?? { x: world.state.terrain.size / 2, z: 4 };
        if (Math.hypot(guests.x[i]! - exit.x, guests.z[i]! - exit.z) < 3) {
          const id = guests.id[i] as EntityId;
          guests.remove(i);
          ctx.destroy(id);
          continue;
        }
      }

      // Littering: a guest with nowhere to put a wrapper drops it. Rare per tick, common per day.
      if (state === GUEST_STATE.walking && rng.bool(0.00012 * (1 - guests.happiness[i]! / 400))) {
        dropLitter(ctx, guests.x[i]!, guests.z[i]!, 'litter');
      }
    }
  },

  audit(ctx) {
    let leaving = 0;
    let unhappy = 0;
    for (let i = 0; i < ctx.guests.count; i++) {
      if (ctx.guests.state[i] === GUEST_STATE.leaving) leaving++;
      if (ctx.guests.happiness[i]! < 60) unhappy++;
    }
    return { guestsLeaving: leaving, guestsUnhappy: unhappy };
  },
};

/**
 * Arrivals.
 *
 * The rate follows the park's rating, the weather, the hour and any marketing running — in that
 * order of weight. A park with no rating still gets a trickle, because a park nobody ever visits
 * can never earn one.
 */
function spawnArrivals(ctx: SimContext): void {
  if (ctx.world.tick % TICKS_PER_GAME_MINUTE !== 0) return;
  const clock = ctx.clock;
  if (clock.hour < 9 || clock.hour >= 19) return;

  const stats = ctx.world.state.stats;
  const weather = ctx.world.state.weather;
  const rng = ctx.rng('guestSpawn');

  const ratingTerm = 0.2 + (stats.rating / 1000) * 2.6;
  const weatherTerm =
    weather.kind === 'clear' ? 1.15 : weather.kind === 'cloudy' ? 1 : weather.kind === 'storm' ? 0.25 : 0.6;
  // A bell over the day, peaking at 13:00.
  const hourTerm = Math.max(0.15, Math.cos(((clock.hour - 13) / 6) * Math.PI * 0.5));
  const marketingTerm = 1 + ctx.world.state.economy.marketing.length * 0.35;

  const expected = 2.4 * ratingTerm * weatherTerm * hourTerm * marketingTerm;
  const count = Math.floor(expected) + (rng.next() < expected % 1 ? 1 : 0);

  const entrance = nav?.entrance() ?? { x: ctx.world.state.terrain.size / 2, z: 4 };
  const entryFee = ctx.world.state.economy.entryFee;

  for (let n = 0; n < count; n++) {
    if (ctx.guests.count >= ctx.guests.capacity) break;
    const id = ctx.world.spawn();
    const i = ctx.guests.add(id);
    if (i < 0) {
      ctx.world.destroy(id);
      break;
    }
    const wallet = Math.round(rng.range(15_00, 120_00));
    if (entryFee > wallet) {
      // Priced out at the gate. They do not enter and they are not created.
      ctx.guests.remove(i);
      ctx.world.destroy(id);
      continue;
    }
    ctx.guests.x[i] = entrance.x + rng.range(-2, 2);
    ctx.guests.z[i] = entrance.z + rng.range(-2, 2);
    ctx.guests.heading[i] = rng.range(0, Math.PI * 2);
    ctx.guests.state[i] = GUEST_STATE.walking;
    ctx.guests.happiness[i] = Math.round(rng.range(150, 220));
    ctx.guests.energy[i] = Math.round(rng.range(180, 255));
    ctx.guests.wallet[i] = wallet - entryFee;
    ctx.guests.nameIndex[i] = rng.int(0, 4095);
    for (let t = 0; t < 5; t++) ctx.guests.taste[i * 5 + t] = rng.int(20, 255);
    for (let p = 0; p < 5; p++) ctx.guests.palette[i * 5 + p] = rng.int(0, 255);
    if (entryFee > 0) ctx.earn(entryFee, 'entryIncome');
  }
}

function criticalNeed(ctx: SimContext, i: number, needs: readonly string[]): string | null {
  let worst: string | null = null;
  let worstValue = 0;
  for (let n = 0; n < needs.length; n++) {
    const value = ctx.guests.needs[i * ctx.guests.needCount + n]!;
    const definition = ctx.registry.get('need', needs[n]!);
    if (value >= (definition?.urgentAt ?? 180) && value > worstValue) {
      worstValue = value;
      worst = needs[n]!;
    }
  }
  return worst;
}

function bumpNeed(ctx: SimContext, i: number, need: string, delta: number): void {
  const needs = ctx.registry.needOrder();
  const index = needs.indexOf(need);
  if (index < 0) return;
  const slot = i * ctx.guests.needCount + index;
  ctx.guests.needs[slot] = clamp(ctx.guests.needs[slot]! + delta, 0, 255);
}

/**
 * What to do next.
 *
 * An urgent need wins outright — a guest who needs a toilet does not weigh it against a coaster.
 * With nothing urgent the choice is a weighted pick over what is open, scored by the guest's taste
 * against the ride's ratings and discounted by how long the queue already is.
 */
function pickTarget(ctx: SimContext, i: number, needs: readonly string[]): void {
  const guests = ctx.guests;
  const world = ctx.world;
  const rng = ctx.rng('needs');

  const urgent = criticalNeed(ctx, i, needs);
  if (urgent) {
    const shopIndex = findShopFor(ctx, urgent, guests.x[i]!, guests.z[i]!);
    if (shopIndex !== null) {
      guests.target[i] = shopIndex as EntityId;
      guests.state[i] = GUEST_STATE.walking;
      return;
    }
    // Nothing in the park answers this need. That is a park problem, not a guest problem: the
    // guest's happiness falls and it is counted, rather than the guest wandering forever.
    guests.happiness[i] = Math.max(0, guests.happiness[i]! - 1);
  }

  const candidates: number[] = [];
  const weights: number[] = [];
  const thrill = guests.taste[i * 5]! / 255;
  const gentle = guests.taste[i * 5 + 1]! / 255;

  for (const key of Object.keys(world.entities.ride)) {
    const rideIndex = Number(key);
    const ride = world.entities.ride[rideIndex]!;
    if (ride.status !== 'open') continue;
    if (ride.price > guests.wallet[i]!) continue;
    const queuePenalty = 1 / (1 + ride.queue.length / 8);
    const appeal =
      ride.excitement * (0.4 + thrill) + (10 - ride.fear) * gentle * 0.25 - ride.nausea * 0.3;
    const transform = world.entities.transform[rideIndex];
    if (!transform) continue;
    const distance = Math.hypot(transform.x - guests.x[i]!, transform.z - guests.z[i]!);
    const distancePenalty = 1 / (1 + distance / 120);
    const weight = Math.max(0.01, appeal) * queuePenalty * distancePenalty;
    candidates.push(rideIndex);
    weights.push(weight);
  }

  if (candidates.length === 0) {
    // Nothing to do: wander. Deliberately a real destination rather than a random walk, so a
    // guest with nowhere to go still looks like a person and not like a jittering dot.
    const size = world.state.terrain.size;
    guests.pathNode[i] = -1;
    guests.target[i] = NO_ENTITY;
    guests.state[i] = GUEST_STATE.walking;
    guests.heading[i] = rng.range(0, Math.PI * 2);
    void size;
    return;
  }

  guests.target[i] = rng.pickWeighted(candidates, weights) as EntityId;
  guests.state[i] = GUEST_STATE.walking;
  guests.pathNode[i] = -1;
}

function findShopFor(ctx: SimContext, need: string, x: number, z: number): number | null {
  let best: number | null = null;
  let bestScore = -Infinity;
  for (const key of Object.keys(ctx.world.entities.shop)) {
    const shopIndex = Number(key);
    const shop = ctx.world.entities.shop[shopIndex]!;
    const definition = ctx.registry.get('shop', shop.defId);
    if (!definition) continue;
    if (!definition.satisfies.some((entry) => entry.need === need)) continue;
    const transform = ctx.world.entities.transform[shopIndex];
    if (!transform) continue;
    const distance = Math.hypot(transform.x - x, transform.z - z);
    const score = -distance - shop.queue.length * 6;
    if (score > bestScore) {
      bestScore = score;
      best = shopIndex;
    }
  }
  return best;
}

/** One step of walking. Follows the nav graph when there is one, steers when there is not. */
function walk(ctx: SimContext, i: number, jitter: number): void {
  const guests = ctx.guests;
  const world = ctx.world;

  let targetX: number;
  let targetZ: number;

  if (guests.state[i] === GUEST_STATE.leaving) {
    const exit = nav?.entrance() ?? { x: world.state.terrain.size / 2, z: 4 };
    targetX = exit.x;
    targetZ = exit.z;
  } else if (guests.target[i] !== NO_ENTITY) {
    const transform = world.entities.transform[guests.target[i]! & 0xfffff];
    if (!transform) {
      guests.target[i] = NO_ENTITY;
      return;
    }
    targetX = transform.x;
    targetZ = transform.z;
  } else {
    // Wandering: drift on the current heading. `jitter` is the stream's value, so the wander is
    // as reproducible as everything else.
    targetX = guests.x[i]! + Math.cos(guests.heading[i]!) * 12;
    targetZ = guests.z[i]! + Math.sin(guests.heading[i]!) * 12;
    if (jitter < 0.01) guests.heading[i] = guests.heading[i]! + (jitter - 0.005) * 60;
  }

  let stepX = targetX;
  let stepZ = targetZ;
  if (nav) {
    const waypoint = nav.next(guests.x[i]!, guests.z[i]!, targetX, targetZ, guests.pathNode[i]!);
    if (waypoint) {
      stepX = waypoint.x;
      stepZ = waypoint.z;
      guests.pathNode[i] = waypoint.node;
    }
  }

  const dx = stepX - guests.x[i]!;
  const dz = stepZ - guests.z[i]!;
  const distance = Math.hypot(dx, dz);

  if (distance < 2.2 && guests.target[i] !== NO_ENTITY && guests.state[i] === GUEST_STATE.walking) {
    arrive(ctx, i);
    return;
  }

  if (distance < 0.001) {
    guests.speed[i] = 0;
    return;
  }

  const speed = WALK_SPEED * (0.75 + (guests.energy[i]! / 255) * 0.5);
  const step = (speed * 50) / 1000;
  guests.x[i] = guests.x[i]! + (dx / distance) * step;
  guests.z[i] = guests.z[i]! + (dz / distance) * step;
  guests.speed[i] = speed;
  guests.heading[i] = lerpAngle(guests.heading[i]!, Math.atan2(dz, dx), 0.25);
  guests.energy[i] = Math.max(0, guests.energy[i]! - 0.004);
}

function arrive(ctx: SimContext, i: number): void {
  const guests = ctx.guests;
  const index = guests.target[i]! & 0xfffff;
  const ride = ctx.world.entities.ride[index];
  if (ride) {
    if (ride.status !== 'open') {
      guests.target[i] = NO_ENTITY;
      return;
    }
    ride.queue.push(guests.id[i] as EntityId);
    guests.state[i] = GUEST_STATE.queueing;
    guests.ticksInState[i] = 0;
    return;
  }
  const shop = ctx.world.entities.shop[index];
  if (shop) {
    shop.queue.push(guests.id[i] as EntityId);
    guests.state[i] = GUEST_STATE.shopping;
    guests.ticksInState[i] = 0;
    return;
  }
  guests.target[i] = NO_ENTITY;
}

function leaveQueue(ctx: SimContext, i: number): void {
  const guests = ctx.guests;
  const id = guests.id[i] as EntityId;
  for (const ride of Object.values(ctx.world.entities.ride)) {
    const position = ride.queue.indexOf(id);
    if (position >= 0) ride.queue.splice(position, 1);
  }
  guests.state[i] = GUEST_STATE.walking;
  guests.target[i] = NO_ENTITY;
  guests.ticksInState[i] = 0;
}

export function dropLitter(ctx: SimContext, x: number, z: number, kind: 'litter' | 'vomit'): void {
  const id = ctx.world.spawn();
  ctx.world.entities.transform[id & 0xfffff] = { x, y: 0, z, rotY: 0 };
  ctx.world.entities.litter[id & 0xfffff] = { kind, age: 0 };
  ctx.dirty.litter.push(id);
}
