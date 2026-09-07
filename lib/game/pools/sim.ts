/**
 * The worker half: what a pool DOES.
 *
 * Small on purpose. A basin is mostly geometry, and the parts of it that change over a park day are
 * three: how warm the water is, how clear it is, and how many people are in it. All three are
 * integrated in **park minutes** rather than ticks, so a pool behaves identically at speed 1 and at
 * the soak harness's 100×, which is the property that makes a 48-hour soak a valid test rather than
 * a different game.
 *
 * Babylon-free and DOM-free, like every `sim*.ts`: it reaches the manifest and `geom.ts` and
 * nothing else.
 *
 * **The excavation command lives here** and not in the terrain module, because the shape being cut
 * is this module's. `excavatePool` only ever lowers a sample, so the renderer digging its own copy
 * at boot and this applying the same cut afterwards cannot make the two heightfields differ.
 *
 * **What the guests module will need is already the api**: `poolAt`, `depthAt`, `capacity` and
 * `enter`/`leave`. Nothing calls them yet — `guests` has no swimming behaviour — and the report
 * says so rather than claiming a feature out of an interface.
 */

import type {
  Command,
  Entity,
  SimContext,
  SimFrameWriter,
  SimHandle,
  TerrainData,
} from '../core/types';
import { attachPoolContent } from './manifest';
import { excavatePool } from './excavate';
import { resolvePool } from './resolve';
import { depthAtUnit, insidePolygon, outlinePoints, toLocal } from './geom';
import type { PoolDepthSpec, PoolState, PoolsStats, ResolvedPool } from './types';

/**
 * How many bathers a pool takes.
 *
 * The German bathing-water rule of thumb is one bather per 2.7 m² of water shallower than 1.35 m
 * and one per 4.5 m² deeper than that, because a non-swimmer needs to stand and a swimmer needs a
 * lane. Averaged over a basin that shelves, 3.4 m² a head is the number a 25 m pool is actually
 * rated at, so that is what is used and the shallow bonus is folded into it.
 */
const SQUARE_METRES_PER_BATHER = 3.4;

/** °C a heated pool holds. A hotel lagoon runs 28, a whirlpool 36; the role decides. */
function targetTemperature(pool: ResolvedPool, ambientC: number, sunUp: number): number {
  if (pool.role === 'spa') return 36;
  if (pool.heated) return 28;
  // Unheated open water lags the air and gains a couple of degrees from the sun over a still day.
  return ambientC + 2.5 * sunUp;
}

export interface PoolsSimApi {
  /** Every pool the world holds, resolved. */
  list(): ResolvedPool[];
  /** Which pool holds a world point, or null. The water, not the deck. */
  poolAt(x: number, z: number): string | null;
  /** Metres of water over a world point; 0 where there is none. */
  depthAt(x: number, z: number): number;
  /** World Y of the surface at a point, or null. */
  waterYAt(x: number, z: number): number | null;
  /** Rated bathers. */
  capacity(id: string): number;
  /** Live state; `undefined` for a pool the sim has not seen yet. */
  state(id: string): PoolState | undefined;
  /** A guest gets in. Returns false when the pool is full or does not exist. */
  enter(id: string): boolean;
  leave(id: string): void;
  stats(): PoolsStats;
}

export function createPoolsSim(ctx: SimContext): SimHandle {
  attachPoolContent(ctx.registry);
  const pools = new Map<string, ResolvedPool>();
  const outlines = new Map<string, number[]>();
  const state = new Map<string, PoolState>();
  let stats: PoolsStats = { pools: 0, waterM3: 0, waterPerHour: 0, swimmers: 0, capacity: 0 };

  /**
   * The heightfield is the only ground reading available here, and it is already excavated for any
   * pool that has been dug. So the pool's Y comes from the entity when it has one, which every
   * pool created through `PoolsMainApi.create` does.
   */
  function groundAt(x: number, z: number): number {
    const t = ctx.world.terrain;
    if (!t?.heights) return 0;
    const n = t.resolution;
    const cell = t.size / n;
    const i = Math.max(0, Math.min(n, Math.round((x + t.size / 2) / cell)));
    const j = Math.max(0, Math.min(n, Math.round((z + t.size / 2) / cell)));
    return t.heights[j * (n + 1) + i] ?? 0;
  }

  function adopt(entity: Entity): ResolvedPool | null {
    const pool = resolvePool(entity, groundAt(entity.position[0], entity.position[2]));
    if (!pool) return null;
    pools.set(pool.id, pool);
    outlines.set(pool.id, outlinePoints(pool.shape, pool.size));
    if (!state.has(pool.id)) {
      state.set(pool.id, {
        temperatureC: pool.heated ? 28 : 20,
        clarity: 1,
        swimmers: 0,
        levelOffset: 0,
      });
    }
    return pool;
  }

  function rebuild(): void {
    pools.clear();
    outlines.clear();
    const stored = (ctx.world.modules.pools ?? {}) as Record<string, PoolState>;
    for (const id of Object.keys(ctx.world.entities).sort()) {
      const entity = ctx.world.entities[id];
      if (entity.kind !== 'pool') continue;
      const saved = stored[id];
      if (saved) state.set(id, { ...saved });
      adopt(entity);
    }
    for (const id of [...state.keys()]) if (!pools.has(id)) state.delete(id);
    recount();
  }

  function recount(): void {
    let waterM3 = 0;
    let waterPerHour = 0;
    let capacity = 0;
    let swimmers = 0;
    for (const pool of pools.values()) {
      waterM3 += pool.volume;
      waterPerHour += pool.shape.water;
      capacity += Math.max(1, Math.round(pool.area / SQUARE_METRES_PER_BATHER));
      swimmers += state.get(pool.id)?.swimmers ?? 0;
    }
    stats = { pools: pools.size, waterM3, waterPerHour, swimmers, capacity };
  }

  function depthIn(pool: ResolvedPool, x: number, z: number): number {
    const [lx, lz] = toLocal(x, z, pool.position, pool.yaw);
    const hx = pool.size[0] / 2;
    const hz = pool.size[1] / 2;
    if (Math.abs(lx) > hx * 1.5 || Math.abs(lz) > hz * 1.5) return 0;
    const outline = outlines.get(pool.id);
    if (!outline || !insidePolygon(outline, lx, lz)) return 0;
    const depth: PoolDepthSpec = { ...pool.shape.depth, max: pool.maxDepth };
    const floor = pool.position[1] - Math.max(0, depthAtUnit(depth, lx / hx, lz / hz));
    const level = pool.waterY + (state.get(pool.id)?.levelOffset ?? 0);
    return Math.max(0, level - floor);
  }

  const offAdd = ctx.events.on('entity:add', (entity: Entity) => {
    if (entity.kind !== 'pool') return;
    if (adopt(entity)) {
      recount();
      ctx.events.emit('pools:changed', { id: entity.id, type: 'add' });
    }
  });
  const offRemove = ctx.events.on('entity:remove', (entity: Entity) => {
    if (entity.kind !== 'pool') return;
    if (!pools.delete(entity.id)) return;
    outlines.delete(entity.id);
    state.delete(entity.id);
    recount();
    ctx.events.emit('pools:changed', { id: entity.id, type: 'remove' });
  });
  const offUpdate = ctx.events.on('entity:update', (payload: { entity: Entity }) => {
    if (payload.entity.kind !== 'pool') return;
    if (adopt(payload.entity)) {
      recount();
      ctx.events.emit('pools:changed', { id: payload.entity.id, type: 'update' });
    }
  });

  rebuild();

  const api: PoolsSimApi = {
    list: () => [...pools.values()],
    poolAt(x, z) {
      for (const pool of pools.values()) if (depthIn(pool, x, z) > 0) return pool.id;
      return null;
    },
    depthAt(x, z) {
      let best = 0;
      for (const pool of pools.values()) {
        const d = depthIn(pool, x, z);
        if (d > best) best = d;
      }
      return best;
    },
    waterYAt(x, z) {
      for (const pool of pools.values()) {
        if (depthIn(pool, x, z) > 0) return pool.waterY + (state.get(pool.id)?.levelOffset ?? 0);
      }
      return null;
    },
    capacity(id) {
      const pool = pools.get(id);
      return pool ? Math.max(1, Math.round(pool.area / SQUARE_METRES_PER_BATHER)) : 0;
    },
    state: (id) => state.get(id),
    enter(id) {
      const pool = pools.get(id);
      const s = state.get(id);
      if (!pool || !s) return false;
      if (s.swimmers >= api.capacity(id)) return false;
      s.swimmers += 1;
      recount();
      return true;
    },
    leave(id) {
      const s = state.get(id);
      if (!s || s.swimmers <= 0) return;
      s.swimmers -= 1;
      recount();
    },
    stats: () => ({ ...stats }),
  };

  return {
    api,
    tick(dtMinutes: number) {
      if (!pools.size) return;
      const env = ctx.environment();
      const sunUp = Math.max(0, Math.min(1, Math.sin(Math.max(0, env.sunElevation)) * 2.4));
      const hours = dtMinutes / 60;
      for (const pool of pools.values()) {
        const s = state.get(pool.id);
        if (!s) continue;
        // A body of water this size has a time constant of hours, not minutes. 0.55/h brings a
        // cold pool to a heated 28 °C in about six park hours, which is an overnight heat-up.
        const target = targetTemperature(pool, env.temperatureC, sunUp);
        const rate = pool.heated || pool.role === 'spa' ? 0.55 : 0.18;
        s.temperatureC += (target - s.temperatureC) * Math.min(1, rate * hours);
        // Clarity: bathers cloud it, the filter clears it, and the turnover is the pool's own
        // `water` rate against its volume — a big basin with a small plant recovers slowly.
        const turnover = pool.volume > 0 ? pool.shape.water / pool.volume : 0;
        const load = pool.area > 0 ? s.swimmers / (pool.area / SQUARE_METRES_PER_BATHER) : 0;
        s.clarity = Math.max(0, Math.min(1, s.clarity + (turnover * 0.9 - load * 0.35) * hours));
        // Evaporation, and the make-up water that answers it. Both are small and both are real:
        // an open pool loses a few millimetres on a hot day and the level is topped back up.
        const evaporation = 0.0016 * hours * (0.4 + sunUp);
        s.levelOffset = Math.max(-0.06, Math.min(0, s.levelOffset - evaporation + 0.0022 * hours));
      }
      recount();
    },
    command(cmd: Command): boolean {
      if (cmd.type === 'pools:excavate') {
        const { id } = (cmd.payload ?? {}) as { id?: string };
        const entity = id ? ctx.world.entities[id] : undefined;
        if (!entity) return true;
        const pool = pools.get(entity.id) ?? adopt(entity);
        const terrain = ctx.world.terrain as TerrainData | undefined;
        if (pool && terrain?.heights) excavatePool(terrain, pool);
        return true;
      }
      if (cmd.type === 'pools:heat') {
        const { id, heated } = (cmd.payload ?? {}) as { id?: string; heated?: boolean };
        const entity = id ? ctx.world.entities[id] : undefined;
        if (!entity) return true;
        entity.data = { ...(entity.data ?? {}), heated: heated === true };
        adopt(entity);
        ctx.events.emit('pools:changed', { id: entity.id, type: 'update' });
        return true;
      }
      if (cmd.type === 'pools:level') {
        const { id, offset } = (cmd.payload ?? {}) as { id?: string; offset?: number };
        const s = id ? state.get(id) : undefined;
        if (s && typeof offset === 'number' && Number.isFinite(offset)) {
          s.levelOffset = Math.max(-0.5, Math.min(0.5, offset));
        }
        return true;
      }
      return false;
    },
    fill(writer: SimFrameWriter) {
      writer.stat('pools.count', stats.pools);
      writer.stat('pools.waterM3', Math.round(stats.waterM3));
      writer.stat('pools.swimmers', stats.swimmers);
      writer.stat('pools.capacity', stats.capacity);
    },
    serialize() {
      // A plain record keyed by entity id, written in sorted order so the save is byte-stable.
      const out: Record<string, PoolState> = {};
      for (const id of [...state.keys()].sort()) {
        const s = state.get(id);
        if (!s) continue;
        out[id] = {
          temperatureC: round(s.temperatureC, 3),
          clarity: round(s.clarity, 4),
          swimmers: s.swimmers,
          levelOffset: round(s.levelOffset, 4),
        };
      }
      return out;
    },
    rebuild,
    dispose() {
      offAdd();
      offRemove();
      offUpdate();
      pools.clear();
      outlines.clear();
      state.clear();
    },
  };
}

/**
 * Round to a fixed number of decimals before a save.
 *
 * Not tidiness: `serialize(load(serialize(w))) === serialize(w)` is a hard gate, and a temperature
 * integrated by a float multiply produces a number whose last bits differ between a fresh run and a
 * reloaded one. Three decimals is a thousandth of a degree, which is below anything this module can
 * mean, and it makes the round trip exact.
 */
function round(value: number, decimals: number): number {
  const k = 10 ** decimals;
  return Math.round(value * k) / k;
}
