/**
 * Save and load.
 *
 * **`serialize(load(serialize(w)))` must equal `serialize(w)` byte for byte**, and the reason is
 * not tidiness: a save that re-encodes differently cannot be diffed, cannot be deduplicated, and
 * makes "did this change alter the simulation?" unanswerable. `pnpm test:game-save-roundtrip`
 * asserts it on a world that has been run for a few thousand ticks.
 *
 * Two things make it hold, and both are deliberate:
 *
 * 1. **Key order is declared, not observed.** `JSON.stringify` follows insertion order, and
 *    insertion order survives most refactors — until the day somebody moves a field in an
 *    interface, or a value arrives from `structuredClone` of an object built in a different order.
 *    Every object here is written through an explicit key list.
 * 2. **Numbers are normalised.** `-0` encodes as `0`, and a float is written at full precision but
 *    through `Number.prototype.toString`, which is round-trip exact for f64. `NaN` and `Infinity`
 *    are rejected loudly at save time rather than silently becoming `null` — a `NaN` in a save is
 *    the soak test's number-one find and it should not survive to the file.
 */

import { EntityAllocator } from './ids';
import {
  ENTITY_TABLE_ORDER,
  SAVE_VERSION,
  emptyStats,
  type EntityTable,
  type WorldState,
} from './schema';

export class SaveError extends Error {}

const WORLD_KEYS = [
  'version',
  'seed',
  'tick',
  'meta',
  'terrain',
  'entities',
  'guests',
  'economy',
  'research',
  'weather',
  'allocator',
  'rng',
] as const;

/**
 * Deterministic JSON.
 *
 * Objects are written with their keys sorted; arrays keep their order (order is meaning in an
 * array — a track's nodes are in ride order and must never be sorted). Sorting rather than a
 * per-type key list is what makes this safe against a schema change: a new field lands in its
 * sorted position in both the writer and the reader, and no list can go stale.
 */
function stableStringify(value: unknown, path = '$'): string {
  if (value === null) return 'null';
  const type = typeof value;
  if (type === 'number') {
    const n = value as number;
    if (!Number.isFinite(n)) {
      throw new SaveError(`non-finite number at ${path}: ${String(n)}`);
    }
    return Object.is(n, -0) ? '0' : String(n);
  }
  if (type === 'boolean') return value ? 'true' : 'false';
  if (type === 'string') return JSON.stringify(value);
  if (type === 'undefined' || type === 'function' || type === 'symbol') {
    throw new SaveError(`unserializable ${type} at ${path}`);
  }
  if (Array.isArray(value)) {
    const parts = value.map((item, i) => stableStringify(item, `${path}[${i}]`));
    return `[${parts.join(',')}]`;
  }
  if (ArrayBuffer.isView(value)) {
    throw new SaveError(`typed array at ${path} — convert to a plain array before saving`);
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const parts: string[] = [];
  for (const key of keys) {
    const entry = record[key];
    if (entry === undefined) continue;
    parts.push(`${JSON.stringify(key)}:${stableStringify(entry, `${path}.${key}`)}`);
  }
  return `{${parts.join(',')}}`;
}

/**
 * The world as bytes.
 *
 * `stats` is left out on purpose — it is recomputed from the entities every tick, and storing a
 * derived aggregate means keeping two copies of one truth until the day they disagree and nobody
 * can say which is right.
 */
export function serializeWorld(world: WorldState): string {
  const ordered: Record<string, unknown> = {};
  for (const key of WORLD_KEYS) {
    if (key === 'entities') {
      const tables: Record<string, unknown> = {};
      for (const table of ENTITY_TABLE_ORDER) tables[table] = world.entities[table];
      ordered.entities = tables;
      continue;
    }
    ordered[key] = world[key];
  }
  return stableStringify(ordered);
}

export interface LoadResult {
  world: WorldState;
  /** Versions the save was walked through, oldest first. Empty when it was already current. */
  migrations: number[];
}

export function deserializeWorld(json: string): LoadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new SaveError(`save is not JSON: ${(error as Error).message}`);
  }
  if (typeof parsed !== 'object' || parsed === null) throw new SaveError('save is not an object');
  const raw = parsed as Record<string, unknown>;
  const version = typeof raw.version === 'number' ? raw.version : 0;
  if (version > SAVE_VERSION) {
    throw new SaveError(
      `save version ${version} is newer than this build understands (${SAVE_VERSION})`
    );
  }

  const migrations: number[] = [];
  let state = raw;
  for (let v = version; v < SAVE_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) throw new SaveError(`no migration from save version ${v}`);
    state = step(state);
    migrations.push(v + 1);
  }

  const world = state as unknown as WorldState;
  // Tables a future version added are absent from an old save; fill them so nothing reads
  // `undefined[id]`. Doing it here rather than in a migration keeps a migration about *meaning*.
  const entities = (world.entities ?? {}) as Partial<EntityTable>;
  for (const table of ENTITY_TABLE_ORDER) {
    if (!entities[table]) (entities as Record<string, unknown>)[table] = {};
  }
  world.entities = entities as EntityTable;
  world.guests ??= [];
  world.stats = emptyStats();
  world.version = SAVE_VERSION;
  if (!world.allocator) world.allocator = new EntityAllocator().toJSON();
  return { world, migrations };
}

/**
 * One entry per version step: `MIGRATIONS[n]` takes a version-`n` save to version `n+1`.
 *
 * A migration is about *meaning* — a renamed field, a unit change, a default that moved. Adding a
 * table or a field with a safe default needs no entry; `deserializeWorld` fills those.
 */
const MIGRATIONS: Record<number, (save: Record<string, unknown>) => Record<string, unknown>> = {
  // 0 → 1: the pre-release shape had no `meta.packIds`. Nothing shipped at 0, but the slot is
  // here so the first real migration has a worked example to copy rather than an empty object.
  0: (save) => {
    const meta = (save.meta ?? {}) as Record<string, unknown>;
    return { ...save, version: 1, meta: { ...meta, packIds: meta.packIds ?? ['core-classic'] } };
  },
};

/** A save wrapped for export, with enough context to be recognisable in a downloads folder. */
export interface SaveFile {
  format: 'parkfan-coaster-save';
  version: number;
  savedAtIso: string;
  name: string;
  world: string;
}

export function toSaveFile(world: WorldState, savedAtIso: string): SaveFile {
  return {
    format: 'parkfan-coaster-save',
    version: SAVE_VERSION,
    savedAtIso,
    name: world.meta.name,
    world: serializeWorld(world),
  };
}

export function fromSaveFile(file: unknown): LoadResult {
  if (typeof file !== 'object' || file === null) throw new SaveError('not a save file');
  const record = file as Partial<SaveFile>;
  if (record.format !== 'parkfan-coaster-save') throw new SaveError('not a park.fan Coaster save');
  if (typeof record.world !== 'string') throw new SaveError('save file has no world');
  return deserializeWorld(record.world);
}
