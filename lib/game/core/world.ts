/**
 * The world model: factory, byte-stable serialisation, entity helpers.
 *
 * `serializeWorld(deserializeWorld(serializeWorld(w))) === serializeWorld(w)` is asserted by
 * `scripts/test-game-save-roundtrip.mjs`. Keys are written in a fixed order and typed arrays are
 * base64 so the output does not depend on insertion order or on the JS engine.
 */

import type { Command, Entity, EntityId, TerrainData, World } from './types';

export const WORLD_VERSION = 1 as const;
export const DEFAULT_PARK_SIZE = 512;
export const DEFAULT_RESOLUTION = 256;

export interface WorldOptions {
  seed: number;
  name?: string;
  size?: number;
  resolution?: number;
  waterLevel?: number;
  packs?: string[];
  cash?: number;
  createdAt?: number;
}

export function createWorld(opts: WorldOptions): World {
  const size = opts.size ?? DEFAULT_PARK_SIZE;
  const resolution = opts.resolution ?? DEFAULT_RESOLUTION;
  const samples = (resolution + 1) * (resolution + 1);
  return {
    meta: {
      version: WORLD_VERSION,
      seed: opts.seed >>> 0,
      name: opts.name ?? 'New park',
      createdAt: opts.createdAt ?? 0,
      packs: opts.packs ? [...opts.packs] : [],
    },
    clock: { day: 1, minute: 9 * 60, speed: 1 },
    terrain: {
      size,
      resolution,
      heights: new Float32Array(samples),
      paint: new Uint8Array(resolution * resolution),
      waterLevel: opts.waterLevel ?? -2,
    },
    entities: {},
    finance: { cash: opts.cash ?? 50_000_00, loan: 0, history: [] },
    modules: {},
    log: [],
  };
}

// ── Entities ────────────────────────────────────────────────────────────────────────────────
/**
 * Ids are `<kind>-<seq>`, and the sequence lives in the WORLD (`world.modules.__ids`) and nowhere
 * else.
 *
 * It used to live in a module-level `let idCounter` as well, folded in with a `Math.max`, and that
 * made the counter shared by every world built in one process: the second `buildWorld(seed)` in a
 * run carried on from wherever the first one had stopped, so the same seed produced `path-1…` once
 * and `path-721…` the next time. The docblock on it said "deterministic as long as creation order
 * is", which was true within a world and false across two — the case a "new park" button, a save
 * load and every test that builds twice all hit. Found by the demo-park builder, which builds the
 * same park twice to prove it is reproducible.
 *
 * The `do…while` stays: it is the guard for a world whose `__ids` is behind its entities, which a
 * hand-edited save or a module that minted an id another way can produce.
 */
export function nextEntityId(world: World, kind: string): EntityId {
  let n = (world.modules.__ids as number | undefined) ?? 0;
  let id: EntityId;
  do {
    n += 1;
    id = `${kind}-${n}`;
  } while (world.entities[id]);
  (world.modules as Record<string, unknown>).__ids = n;
  return id;
}

export function entitiesOfKind(world: Readonly<World>, kind: string): Entity[] {
  const out: Entity[] = [];
  for (const id in world.entities) {
    const e = world.entities[id];
    if (e.kind === kind) out.push(e);
  }
  return out;
}

// ── Serialisation ───────────────────────────────────────────────────────────────────────────
export interface SerializedWorld {
  meta: World['meta'];
  clock: World['clock'];
  terrain: Omit<TerrainData, 'heights' | 'paint'> & { heights: string; paint: string };
  entities: Entity[];
  finance: World['finance'];
  modules: Record<string, unknown>;
  log: Command[];
}

export function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(s);
}

export function fromBase64(text: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(text, 'base64'));
  const bin = atob(text);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function f32ToBase64(a: Float32Array): string {
  return toBase64(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
}

function base64ToF32(text: string, expected: number): Float32Array {
  const bytes = fromBase64(text);
  const out = new Float32Array(expected);
  const view = new Float32Array(
    bytes.buffer,
    bytes.byteOffset,
    Math.min(expected, bytes.byteLength >> 2)
  );
  out.set(view);
  return out;
}

/** Stable-key JSON: objects are written with sorted keys so two equal worlds are byte-equal. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    if (typeof v === 'number' && !Number.isFinite(v)) {
      throw new Error('Refusing to save a world containing NaN or Infinity');
    }
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Uint8Array)) {
      const o = v as Record<string, unknown>;
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(o).sort()) sorted[k] = o[k];
      return sorted;
    }
    return v;
  });
}

export function serializeWorld(world: World): string {
  assertFiniteHeights(world.terrain.heights);
  const entities = Object.values(world.entities).sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  );
  const data: SerializedWorld = {
    meta: world.meta,
    clock: world.clock,
    terrain: {
      size: world.terrain.size,
      resolution: world.terrain.resolution,
      waterLevel: world.terrain.waterLevel,
      heights: f32ToBase64(world.terrain.heights),
      paint: toBase64(world.terrain.paint),
    },
    entities,
    finance: world.finance,
    modules: world.modules,
    log: world.log,
  };
  return stableStringify(data);
}

export function deserializeWorld(json: string): World {
  const data = JSON.parse(json) as SerializedWorld;
  if (!data || data.meta?.version !== WORLD_VERSION) {
    throw new Error(`Unsupported world version ${String(data?.meta?.version)}`);
  }
  const resolution = data.terrain.resolution;
  const samples = (resolution + 1) * (resolution + 1);
  const entities: Record<EntityId, Entity> = {};
  for (const e of data.entities) entities[e.id] = e;
  return {
    meta: data.meta,
    clock: data.clock,
    terrain: {
      size: data.terrain.size,
      resolution,
      waterLevel: data.terrain.waterLevel,
      heights: base64ToF32(data.terrain.heights, samples),
      paint: (() => {
        const p = new Uint8Array(resolution * resolution);
        p.set(fromBase64(data.terrain.paint).subarray(0, p.length));
        return p;
      })(),
    },
    entities,
    finance: data.finance,
    modules: data.modules ?? {},
    log: data.log ?? [],
  };
}

/** Deep copy for crossing the worker boundary (structured clone keeps typed arrays). */
export function cloneWorld(world: World): World {
  return {
    ...JSON.parse(JSON.stringify({ ...world, terrain: undefined })),
    terrain: {
      ...world.terrain,
      heights: new Float32Array(world.terrain.heights),
      paint: new Uint8Array(world.terrain.paint),
    },
  };
}

function assertFiniteHeights(heights: Float32Array): void {
  for (let i = 0; i < heights.length; i++) {
    if (!Number.isFinite(heights[i])) throw new Error(`Terrain height ${i} is not finite`);
  }
}
