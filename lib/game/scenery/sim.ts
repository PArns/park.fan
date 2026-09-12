/**
 * Scenery in the simulation: what stands where.
 *
 * The renderer draws props; this half answers questions about them, for the modules that need to
 * know — a guest looking for a bench to sit on, a bin to use or a lamp to stand under, a path tool
 * asking whether a square metre is free, a staff member routed round a planter.
 *
 * It owns no meshes and no geometry. Placement is an `entity:add` like every other build, so the
 * index here is built from the entity stream rather than from a command of its own: whoever placed
 * the prop — the tools module, the demo park factory, a save being loaded — arrives the same way.
 *
 * DOM-free and Babylon-free; it also runs in node under the soak harness.
 */

import type { Command, Entity, SimContext, SimHandle } from '../core/types';
import { buildCatalog, type PropSpec } from './catalog';
import {
  defaultSpecies,
  evaluateScatter,
  scatterNear,
  woodlandSpecies,
  type ScatterField,
  type ScatterInstance,
} from './scatter';

/** Metres per index cell. A bench query looks at nine of these. */
const CELL = 16;

export interface SceneryRecord {
  id: string;
  key: string;
  x: number;
  z: number;
  y: number;
  yaw: number;
  scale: number;
  spec: PropSpec;
}

/** Persistent state: the dressing settings, not the dressing. */
export interface ScenerySlot {
  /** Species keys the landscape is dressed with; empty means the default temperate mix. */
  woodland: string[];
  /** 0..1, scales every ambient density. */
  density: number;
  /** Whether the landscape is dressed at all. */
  dressed: boolean;
}

export interface ScenerySimApi {
  /** Every placed prop, in insertion order. */
  list(): readonly SceneryRecord[];
  count(): number;
  /** The catalogue, including the module's own ambient species. */
  catalog(): ReadonlyMap<string, PropSpec>;
  /** Placed props whose footprint overlaps a disc. */
  near(x: number, z: number, radius: number): SceneryRecord[];
  /** The nearest prop with this `furniture` value, or null. Guests use it for benches and bins. */
  nearestFurniture(
    furniture: string,
    x: number,
    z: number,
    maxDistance?: number
  ): SceneryRecord | null;
  /** True when a prop or a piece of ambient dressing stands in the way. */
  blocked(x: number, z: number, radius: number): boolean;
  /** The ambient dressing over a rectangle — the same instances the renderer draws. */
  ambient(bounds: [number, number, number, number]): ScatterInstance[];
  settings(): Readonly<ScenerySlot>;
}

const DEFAULT_SLOT: ScenerySlot = { woodland: [], density: 1, dressed: false };

export function createScenerySim(ctx: SimContext): SimHandle {
  const catalog = buildCatalog(ctx.registry);
  const records = new Map<string, SceneryRecord>();
  const grid = new Map<number, SceneryRecord[]>();
  const order: string[] = [];
  let slot: ScenerySlot = { ...DEFAULT_SLOT };

  const cellKey = (x: number, z: number) =>
    (Math.floor(x / CELL) + 8192) * 65536 + (Math.floor(z / CELL) + 8192);

  function index(record: SceneryRecord): void {
    const key = cellKey(record.x, record.z);
    const bucket = grid.get(key);
    if (bucket) bucket.push(record);
    else grid.set(key, [record]);
  }

  function unindex(record: SceneryRecord): void {
    const bucket = grid.get(cellKey(record.x, record.z));
    if (!bucket) return;
    const at = bucket.indexOf(record);
    if (at >= 0) bucket.splice(at, 1);
  }

  function add(entity: Entity): void {
    if (entity.kind !== 'scenery') return;
    const spec = catalog.get(`${entity.pack}:${entity.item}`);
    if (!spec) return;
    const record: SceneryRecord = {
      id: entity.id,
      key: spec.key,
      x: entity.position[0],
      y: entity.position[1],
      z: entity.position[2],
      yaw: entity.yaw,
      scale: entity.scale ?? 1,
      spec,
    };
    const existing = records.get(entity.id);
    if (existing) unindex(existing);
    else order.push(entity.id);
    records.set(entity.id, record);
    index(record);
  }

  function remove(entity: Entity): void {
    const record = records.get(entity.id);
    if (!record) return;
    unindex(record);
    records.delete(entity.id);
    const at = order.indexOf(entity.id);
    if (at >= 0) order.splice(at, 1);
  }

  const offAdd = ctx.events.on('entity:add', (e: unknown) => add(e as Entity));
  const offUpdate = ctx.events.on('entity:update', (p: unknown) =>
    add((p as { entity: Entity }).entity)
  );
  const offRemove = ctx.events.on('entity:remove', (e: unknown) => remove(e as Entity));

  /** The terrain module answers height, paint and slope; without it the field is empty. */
  interface TerrainQuery {
    height(x: number, z: number): number;
    paint(x: number, z: number): number;
    slope(x: number, z: number): number;
    waterLevel(): number;
  }

  function field(bounds: [number, number, number, number]): ScatterField | null {
    if (!slot.dressed) return null;
    const terrain = ctx.module<TerrainQuery>('terrain');
    if (!terrain) return null;
    const species = [
      ...defaultSpecies(catalog),
      ...woodlandSpecies(catalog, slot.woodland.length ? slot.woodland : []),
    ];
    if (!species.length) return null;
    return {
      bounds,
      seed: ctx.world.meta.seed >>> 0,
      species,
      densityScale: slot.density,
      height: (x, z) => terrain.height(x, z),
      paint: (x, z) => terrain.paint(x, z),
      slope: (x, z) => terrain.slope(x, z),
      waterLevel: terrain.waterLevel(),
      excluded: (x, z, radius) => blockedByProp(x, z, radius),
    };
  }

  function blockedByProp(x: number, z: number, radius: number): boolean {
    const cx = Math.floor(x / CELL);
    const cz = Math.floor(z / CELL);
    const reach = Math.max(1, Math.ceil(radius / CELL));
    for (let ox = -reach; ox <= reach; ox++) {
      for (let oz = -reach; oz <= reach; oz++) {
        const bucket = grid.get((cx + ox + 8192) * 65536 + (cz + oz + 8192));
        if (!bucket) continue;
        for (const record of bucket) {
          const need = radius + record.spec.clearance * record.scale;
          const dx = record.x - x;
          const dz = record.z - z;
          if (dx * dx + dz * dz < need * need) return true;
        }
      }
    }
    return false;
  }

  const api: ScenerySimApi = {
    list: () => order.map((id) => records.get(id)!).filter(Boolean),
    count: () => records.size,
    catalog: () => catalog,
    near(x, z, radius) {
      const out: SceneryRecord[] = [];
      const cx = Math.floor(x / CELL);
      const cz = Math.floor(z / CELL);
      const reach = Math.max(1, Math.ceil(radius / CELL));
      for (let ox = -reach; ox <= reach; ox++) {
        for (let oz = -reach; oz <= reach; oz++) {
          const bucket = grid.get((cx + ox + 8192) * 65536 + (cz + oz + 8192));
          if (!bucket) continue;
          for (const record of bucket) {
            const dx = record.x - x;
            const dz = record.z - z;
            if (dx * dx + dz * dz <= radius * radius) out.push(record);
          }
        }
      }
      // Distance order, so a caller that wants "the closest three" can slice.
      out.sort((a, b) => {
        const da = (a.x - x) ** 2 + (a.z - z) ** 2;
        const db = (b.x - x) ** 2 + (b.z - z) ** 2;
        return da - db || (a.id < b.id ? -1 : 1);
      });
      return out;
    },
    nearestFurniture(furniture, x, z, maxDistance = 60) {
      let best: SceneryRecord | null = null;
      let bestDist = maxDistance * maxDistance;
      // Iterated in insertion order rather than over the grid: the result must not depend on
      // Map iteration order over identity keys (architecture §1, rule 4).
      for (const id of order) {
        const record = records.get(id);
        if (!record || record.spec.furniture !== furniture) continue;
        const d = (record.x - x) ** 2 + (record.z - z) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = record;
        }
      }
      return best;
    },
    blocked(x, z, radius) {
      if (blockedByProp(x, z, radius)) return true;
      const f = field([x - radius, z - radius, x + radius, z + radius]);
      return f ? scatterNear(f, x, z, radius) : false;
    },
    ambient(bounds) {
      const f = field(bounds);
      return f ? evaluateScatter(f) : [];
    },
    settings: () => slot,
  };

  return {
    api,
    tick() {
      // Scenery does not move. The index is maintained from the entity stream, so a tick that
      // does nothing is the correct amount of work rather than a placeholder.
    },
    command(cmd: Command): boolean {
      if (cmd.type === 'scenery:dress') {
        const p = (cmd.payload ?? {}) as Partial<ScenerySlot>;
        slot = {
          woodland: Array.isArray(p.woodland) ? [...p.woodland] : slot.woodland,
          density:
            typeof p.density === 'number' ? Math.max(0, Math.min(2, p.density)) : slot.density,
          dressed: p.dressed !== false,
        };
        ctx.events.emit('scenery:dressed', { ...slot });
        return true;
      }
      return false;
    },
    serialize: () => ({
      woodland: [...slot.woodland],
      density: slot.density,
      dressed: slot.dressed,
    }),
    /**
     * Called after a load and after `init`. Core has no `deserialize` hook — the saved slot
     * arrives as `world.modules.scenery` and is read here, which is also where the entity index
     * is rebuilt from the world that just arrived.
     */
    rebuild() {
      const saved = (ctx.world.modules.scenery ?? {}) as Partial<ScenerySlot>;
      slot = {
        woodland: Array.isArray(saved.woodland) ? saved.woodland.map(String) : [],
        density: typeof saved.density === 'number' ? saved.density : 1,
        dressed: saved.dressed === true,
      };
      records.clear();
      grid.clear();
      order.length = 0;
      for (const id in ctx.world.entities) add(ctx.world.entities[id]);
    },
    dispose() {
      offAdd();
      offUpdate();
      offRemove();
    },
  };
}
