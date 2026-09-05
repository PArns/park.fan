/**
 * Applying a command to the world.
 *
 * The **only** write path into the simulation. Everything the player does arrives here as data,
 * which is what makes three separate features one mechanism: undo is a command's inverse, a
 * blueprint is a recorded command list, and a replay test is that list played back against a seed.
 *
 * A command that cannot be applied is **rejected by sequence number**, never half-applied. The main
 * thread hears about it and can undo its optimistic preview; a half-built ride would be a
 * corruption nobody could reproduce.
 */

import { NO_ENTITY, type EntityId } from '../ids';
import type { Command } from '../protocol';
import { TERRAIN_LAYERS, type RideKind } from '../schema';
import { clamp } from '../units';
import type { SimContext } from './context';

export interface ApplyResult {
  ok: boolean;
  reason?: string;
  /** The entity a `*.place` / `*.build` command created, for the caller's undo record. */
  created?: EntityId;
}

const OK: ApplyResult = { ok: true };
const fail = (reason: string): ApplyResult => ({ ok: false, reason });

export function applyCommand(ctx: SimContext, command: Command): ApplyResult {
  const world = ctx.world;

  switch (command.k) {
    // -----------------------------------------------------------------------
    case 'terrain.sculpt': {
      const terrain = world.state.terrain;
      const size = terrain.size;
      const r = Math.max(0.5, command.radius);
      const minX = Math.max(0, Math.floor(command.at.x - r));
      const maxX = Math.min(size, Math.ceil(command.at.x + r));
      const minZ = Math.max(0, Math.floor(command.at.z - r));
      const maxZ = Math.min(size, Math.ceil(command.at.z + r));
      if (minX > maxX || minZ > maxZ) return fail('brush is outside the map');

      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          const dx = x - command.at.x;
          const dz = z - command.at.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d > r) continue;
          // Smoothstep falloff: a linear brush leaves a visible cone, a gaussian never reaches
          // zero and dirties the whole map's dirty rect.
          const t = 1 - d / r;
          const falloff = t * t * (3 - 2 * t);
          const index = z * (size + 1) + x;
          const current = terrain.heights[index] ?? 0;
          switch (command.mode) {
            case 'raise':
              terrain.heights[index] = current + command.strength * falloff;
              break;
            case 'lower':
              terrain.heights[index] = current - command.strength * falloff;
              break;
            case 'level':
              terrain.heights[index] = current + ((command.levelY ?? current) - current) * falloff;
              break;
            case 'smooth': {
              let sum = 0;
              let n = 0;
              for (let oz = -1; oz <= 1; oz++) {
                for (let ox = -1; ox <= 1; ox++) {
                  const nx = x + ox;
                  const nz = z + oz;
                  if (nx < 0 || nz < 0 || nx > size || nz > size) continue;
                  sum += terrain.heights[nz * (size + 1) + nx] ?? 0;
                  n++;
                }
              }
              terrain.heights[index] = current + (sum / n - current) * falloff * 0.8;
              break;
            }
          }
        }
      }
      growTerrainDirty(ctx, minX, minZ, maxX, maxZ);
      return OK;
    }

    case 'terrain.paint': {
      const terrain = world.state.terrain;
      const size = terrain.size;
      const layer = TERRAIN_LAYERS.indexOf(command.layer);
      if (layer < 0) return fail(`unknown terrain layer ${command.layer}`);
      const r = Math.max(0.5, command.radius);
      const minX = Math.max(0, Math.floor(command.at.x - r));
      const maxX = Math.min(size - 1, Math.ceil(command.at.x + r));
      const minZ = Math.max(0, Math.floor(command.at.z - r));
      const maxZ = Math.min(size - 1, Math.ceil(command.at.z + r));
      const cells = size * size;
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          const dx = x + 0.5 - command.at.x;
          const dz = z + 0.5 - command.at.z;
          if (Math.sqrt(dx * dx + dz * dz) > r) continue;
          const cell = z * size + x;
          const gain = clamp(command.strength * 255, 0, 255);
          // Layers are a partition: adding weight to one takes it from the others in proportion,
          // so the eight bytes always sum to 255 and the shader never needs to normalise.
          let remaining = 255 - gain;
          const before: number[] = [];
          let othersTotal = 0;
          for (let l = 0; l < TERRAIN_LAYERS.length; l++) {
            const value = l === layer ? 0 : (terrain.paint[l * cells + cell] ?? 0);
            before.push(value);
            othersTotal += value;
          }
          for (let l = 0; l < TERRAIN_LAYERS.length; l++) {
            if (l === layer) continue;
            const share = othersTotal > 0 ? before[l]! / othersTotal : 0;
            const value = Math.round(remaining * share);
            terrain.paint[l * cells + cell] = value;
          }
          const existing = terrain.paint[layer * cells + cell] ?? 0;
          terrain.paint[layer * cells + cell] = clamp(Math.round(Math.max(existing, gain)), 0, 255);
        }
      }
      growTerrainDirty(ctx, minX, minZ, maxX, maxZ);
      return OK;
    }

    case 'terrain.water': {
      world.state.terrain.waterLevel = command.level;
      growTerrainDirty(ctx, 0, 0, world.state.terrain.size, world.state.terrain.size);
      return OK;
    }

    // -----------------------------------------------------------------------
    case 'path.place': {
      if (command.nodes.length < 2) return fail('a path needs at least two points');
      const id = world.spawn();
      const first = command.nodes[0]!;
      world.entities.transform[idx(id)] = { x: first.x, y: first.y, z: first.z, rotY: 0 };
      world.entities.path[idx(id)] = {
        nodes: command.nodes.flatMap((n) => [n.x, n.y, n.z]),
        width: command.width,
        styleId: command.styleId,
        kind: command.kind,
        servesRide: command.servesRide ?? NO_ENTITY,
      };
      ctx.dirty.paths.push(id);
      return { ok: true, created: id };
    }

    case 'path.remove':
      if (!world.entities.path[idx(command.id)]) return fail('no such path');
      ctx.destroy(command.id);
      return OK;

    // -----------------------------------------------------------------------
    case 'pool.place': {
      if (command.cells.length === 0) return fail('an empty pool is not a pool');
      if (command.cells.length !== command.depths.length) {
        return fail('pool cells and depths must be the same length');
      }
      const id = world.spawn();
      const size = world.state.terrain.size;
      const firstCell = command.cells[0]!;
      world.entities.transform[idx(id)] = {
        x: firstCell % size,
        y: command.surfaceY,
        z: Math.floor(firstCell / size),
        rotY: 0,
      };
      world.entities.pool[idx(id)] = {
        cells: command.cells.slice(),
        depths: command.depths.slice(),
        surfaceY: command.surfaceY,
        quality: 1,
        price: 0,
      };
      ctx.dirty.pools.push(id);
      return { ok: true, created: id };
    }

    case 'pool.remove':
      if (!world.entities.pool[idx(command.id)]) return fail('no such pool');
      ctx.destroy(command.id);
      return OK;

    // -----------------------------------------------------------------------
    case 'ride.build': {
      const flat = ctx.registry.get('flat-ride', command.defId);
      const coaster = ctx.registry.get('coaster', command.defId);
      const flume = ctx.registry.get('flume', command.defId);
      const definition = flat ?? coaster ?? flume;
      if (!definition) return fail(`unknown ride ${command.defId}`);
      if (!ctx.spend(definition.cost.build, 'construction')) return fail('not enough money');

      const kind: RideKind = flat ? 'flat' : flume ? 'flume' : 'coaster';
      const id = world.spawn();
      world.entities.transform[idx(id)] = { x: command.at.x, y: command.at.y, z: command.at.z, rotY: command.rotY };
      world.entities.ride[idx(id)] = {
        defId: command.defId,
        kind,
        status: kind === 'flat' ? 'closed' : 'building',
        price: 0,
        excitement: flat ? flat.ratings.excitement : 0,
        fear: flat ? flat.ratings.fear : 0,
        nausea: flat ? flat.ratings.nausea : 0,
        throughput: flat ? Math.round((3600 / (flat.cycleSeconds + flat.loadSeconds)) * flat.capacity) : 0,
        reliability: 1,
        ticksSinceInspection: 0,
        totalRiders: 0,
        queue: [],
        assignedMechanic: NO_ENTITY,
      };
      ctx.dirty.rides.push(id);
      return { ok: true, created: id };
    }

    case 'ride.remove': {
      const ride = world.entities.ride[idx(command.id)];
      if (!ride) return fail('no such ride');
      if (ride.queue.length > 0) return fail('guests are still queueing');
      // Trains belong to the ride and would otherwise outlive it — the leak the soak test counts.
      for (const key of Object.keys(world.entities.train)) {
        const train = world.entities.train[Number(key)]!;
        if (train.rideId === command.id) {
          const trainId = handleFor(ctx, Number(key));
          if (trainId) ctx.destroy(trainId);
        }
      }
      ctx.destroy(command.id);
      return OK;
    }

    case 'ride.setStatus': {
      const ride = world.entities.ride[idx(command.id)];
      if (!ride) return fail('no such ride');
      if (ride.status === 'broken') return fail('the ride is broken');
      if (command.status === 'open' && ride.kind !== 'flat') {
        const track = world.entities.track[idx(command.id)];
        if (!track || track.nodes.length < 4) return fail('the track is not finished');
        if (!track.closed) return fail('the circuit is not closed');
      }
      ride.status = command.status;
      ctx.dirty.rides.push(command.id);
      return OK;
    }

    case 'ride.setPrice': {
      const ride = world.entities.ride[idx(command.id)];
      if (!ride) return fail('no such ride');
      ride.price = Math.max(0, Math.round(command.cents));
      return OK;
    }

    case 'ride.setTrains': {
      const track = world.entities.track[idx(command.id)];
      if (!track) return fail('no such track');
      track.trainCount = clamp(Math.round(command.trains), 1, 8);
      track.carsPerTrain = clamp(Math.round(command.carsPerTrain), 1, 12);
      ctx.dirty.rides.push(command.id);
      return OK;
    }

    // -----------------------------------------------------------------------
    case 'track.commit': {
      const ride = world.entities.ride[idx(command.rideId)];
      if (!ride) return fail('no such ride');
      if (command.nodes.length < 4) return fail('a layout needs at least four points');
      let length = 0;
      for (let i = 1; i < command.nodes.length; i++) {
        const a = command.nodes[i - 1]!;
        const b = command.nodes[i]!;
        length += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      }
      const blocks: number[] = [];
      command.nodes.forEach((node, i) => {
        if (node.role === 'station' || node.role === 'blockBrake' || node.role === 'lift') blocks.push(i);
      });
      const existing = world.entities.track[idx(command.rideId)];
      world.entities.track[idx(command.rideId)] = {
        nodes: command.nodes.map((n) => ({ ...n })),
        closed: command.closed,
        lengthM: length,
        blocks,
        trainCount: existing?.trainCount ?? 1,
        carsPerTrain: existing?.carsPerTrain ?? 5,
      };
      if (ride.status === 'building') ride.status = 'closed';
      ctx.dirty.rides.push(command.rideId);
      return OK;
    }

    // -----------------------------------------------------------------------
    case 'scenery.place': {
      const definition = ctx.registry.get('scenery', command.defId);
      if (!definition) return fail(`unknown scenery ${command.defId}`);
      if (!ctx.spend(definition.cost.build, 'construction')) return fail('not enough money');
      const id = world.spawn();
      world.entities.transform[idx(id)] = { x: command.at.x, y: command.at.y, z: command.at.z, rotY: command.rotY };
      world.entities.scenery[idx(id)] = {
        defId: command.defId,
        tint: command.tint,
        scale: command.scale || 1,
      };
      ctx.dirty.scenery.push(id);
      return { ok: true, created: id };
    }

    case 'scenery.remove':
      if (!world.entities.scenery[idx(command.id)]) return fail('no such scenery');
      ctx.destroy(command.id);
      return OK;

    case 'building.place': {
      const id = world.spawn();
      world.entities.transform[idx(id)] = { x: command.at.x, y: command.at.y, z: command.at.z, rotY: command.rotY };
      world.entities.building[idx(id)] = { defId: command.defId, parts: command.parts.map((p) => ({ ...p })) };
      ctx.dirty.buildings.push(id);
      return { ok: true, created: id };
    }

    // -----------------------------------------------------------------------
    case 'shop.place': {
      const definition = ctx.registry.get('shop', command.defId);
      if (!definition) return fail(`unknown shop ${command.defId}`);
      if (!ctx.spend(definition.cost.build, 'construction')) return fail('not enough money');
      const id = world.spawn();
      const price: Record<string, number> = {};
      for (const item of definition.sells) price[item.sku] = item.defaultPrice;
      world.entities.transform[idx(id)] = { x: command.at.x, y: command.at.y, z: command.at.z, rotY: command.rotY };
      world.entities.shop[idx(id)] = { defId: command.defId, price, stock: 500, queue: [], revenue: 0, cleanliness: 1 };
      ctx.dirty.shops.push(id);
      return { ok: true, created: id };
    }

    case 'shop.setPrice': {
      const shop = world.entities.shop[idx(command.id)];
      if (!shop) return fail('no such shop');
      shop.price[command.sku] = Math.max(0, Math.round(command.cents));
      return OK;
    }

    // -----------------------------------------------------------------------
    case 'staff.hire': {
      const wage = STAFF_WAGES[command.role];
      const id = world.spawn();
      world.entities.transform[idx(id)] = { x: command.at.x, y: command.at.y, z: command.at.z, rotY: 0 };
      world.entities.staff[idx(id)] = {
        role: command.role,
        wage,
        zone: [],
        target: NO_ENTITY,
        state: 'idle',
        ticksInState: 0,
        skill: 0.35,
      };
      ctx.dirty.staff.push(id);
      return { ok: true, created: id };
    }

    case 'staff.fire':
      if (!world.entities.staff[idx(command.id)]) return fail('no such staff member');
      ctx.destroy(command.id);
      return OK;

    case 'staff.setZone': {
      const staff = world.entities.staff[idx(command.id)];
      if (!staff) return fail('no such staff member');
      staff.zone = command.zone.slice();
      return OK;
    }

    // -----------------------------------------------------------------------
    case 'economy.setEntryFee':
      world.state.economy.entryFee = Math.max(0, Math.round(command.cents));
      return OK;

    case 'economy.loan': {
      const economy = world.state.economy;
      const next = economy.loan + command.deltaCents;
      if (next < 0) return fail('you do not owe that much');
      if (next > economy.loanLimit) return fail('over the credit limit');
      if (command.deltaCents < 0 && economy.cash < -command.deltaCents) return fail('not enough cash');
      economy.loan = next;
      economy.cash += command.deltaCents;
      return OK;
    }

    case 'economy.marketing': {
      const total = command.spendPerDay * command.days;
      if (!ctx.spend(total, 'marketing')) return fail('not enough money');
      world.state.economy.marketing.push({
        kind: command.kind,
        ticksLeft: command.days * 24 * 60 * 20,
        spendPerDay: command.spendPerDay,
      });
      return OK;
    }

    case 'research.set':
      world.state.research.current = command.defId;
      world.state.research.spendPerDay = Math.max(0, Math.round(command.spendPerDay));
      world.state.research.progress = 0;
      return OK;

    // -----------------------------------------------------------------------
    case 'entity.remove':
      if (!world.isAlive(command.id)) return fail('no such entity');
      ctx.destroy(command.id);
      return OK;

    case 'sim.speed':
    case 'sim.seedPark':
    case 'custom':
      // Handled by the worker shell (speed) or by a module's own listener (custom). Reaching here
      // is not an error; it means nothing in the sim needed to change.
      return OK;
  }
}

const STAFF_WAGES = {
  janitor: 4_200,
  mechanic: 7_400,
  entertainer: 3_800,
  vendor: 4_600,
  lifeguard: 6_200,
} as const;

function idx(id: EntityId): number {
  return id & 0xfffff;
}

function growTerrainDirty(ctx: SimContext, minX: number, minZ: number, maxX: number, maxZ: number): void {
  const current = ctx.dirty.terrain;
  ctx.dirty.terrain = current
    ? {
        minX: Math.min(current.minX, minX),
        minZ: Math.min(current.minZ, minZ),
        maxX: Math.max(current.maxX, maxX),
        maxZ: Math.max(current.maxZ, maxZ),
      }
    : { minX, minZ, maxX, maxZ };
}

function handleFor(ctx: SimContext, index: number): EntityId | null {
  for (let generation = 0; generation < 2048; generation++) {
    const candidate = ((generation << 20) | index) as EntityId;
    if (ctx.world.isAlive(candidate)) return candidate;
  }
  return null;
}
