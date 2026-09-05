/**
 * The world: creation, entity lifetime, and the read-only view the main thread gets.
 *
 * The worker holds the one mutable `WorldState`. Everything on the main thread sees `WorldView`,
 * which is the same shape typed `DeepReadonly` — a module that tries to write it fails to compile
 * rather than corrupting a simulation nobody can then reproduce.
 */

import { EntityAllocator, entityIndex, type EntityId } from './ids';
import { RngStream, SIM_STREAMS, type RngState } from './rng';
import {
  ENTITY_TABLE_ORDER,
  emptyEntityTable,
  emptyStats,
  SAVE_VERSION,
  TERRAIN_LAYERS,
  type EntityTable,
  type GuestRecord,
  type TerrainState,
  type WorldState,
} from './schema';

export type DeepReadonly<T> = T extends (infer R)[]
  ? readonly DeepReadonly<R>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export type WorldView = DeepReadonly<WorldState>;

export interface CreateWorldOptions {
  seed: number;
  name?: string;
  scenarioId?: string;
  packIds?: string[];
  /** Terrain cells per side. 256 is ~65 hectares, comfortably above a real regional park. */
  terrainSize?: number;
  /** Starting cash in cents. */
  cash?: number;
}

export function createTerrain(size: number): TerrainState {
  const sampleCount = (size + 1) * (size + 1);
  return {
    size,
    heights: new Array<number>(sampleCount).fill(0),
    // Everything starts as full-weight grass, layer 0.
    paint: (() => {
      const cells = size * size;
      const paint = new Array<number>(cells * TERRAIN_LAYERS.length).fill(0);
      for (let i = 0; i < cells; i++) paint[i] = 255;
      return paint;
    })(),
    waterLevel: -1.5,
    owned: new Array<number>(Math.ceil((size * size) / 32)).fill(0xffffffff),
  };
}

export function createWorld(options: CreateWorldOptions): WorldState {
  const size = options.terrainSize ?? 256;
  const rng: Record<string, RngState> = {};
  for (const name of SIM_STREAMS) rng[name] = RngStream.create(options.seed, name).save();

  return {
    version: SAVE_VERSION,
    seed: options.seed >>> 0,
    tick: 0,
    meta: {
      name: options.name ?? 'park.fan Resort',
      createdAtTick: 0,
      scenarioId: options.scenarioId ?? 'sandbox',
      packIds: options.packIds ?? ['core-classic'],
    },
    terrain: createTerrain(size),
    entities: emptyEntityTable(),
    guests: [],
    economy: {
      cash: options.cash ?? 25_000_00,
      loan: 0,
      loanLimit: 200_000_00,
      interestBp: 500,
      entryFee: 0,
      history: [],
      marketing: [],
    },
    research: { unlocked: ['*'], current: '', progress: 0, spendPerDay: 0 },
    weather: {
      kind: 'clear',
      intensity: 0,
      temperatureC: 21,
      windMs: 2,
      ticksLeft: 0,
      season: 1,
    },
    allocator: new EntityAllocator().toJSON(),
    rng,
    stats: emptyStats(),
  };
}

/**
 * The mutable runtime wrapper the worker uses.
 *
 * It exists so entity lifetime is in one place: `destroy()` walks every table in
 * {@link ENTITY_TABLE_ORDER} and deletes the row, which is the difference between "the entity is
 * gone" and "the entity is gone except for the component the module that owned it forgot about" —
 * i.e. between a clean park and the leak the soak test is looking for.
 */
export class World {
  readonly state: WorldState;
  private allocator: EntityAllocator;
  private streams = new Map<string, RngStream>();

  constructor(state: WorldState) {
    this.state = state;
    this.allocator = EntityAllocator.fromJSON(state.allocator);
    for (const [name, saved] of Object.entries(state.rng)) {
      this.streams.set(name, RngStream.restore(saved));
    }
  }

  static create(options: CreateWorldOptions): World {
    return new World(createWorld(options));
  }

  get tick(): number {
    return this.state.tick;
  }

  get entities(): EntityTable {
    return this.state.entities;
  }

  /** A named stream, created on demand so a new system does not need a schema change. */
  rng(name: string): RngStream {
    let stream = this.streams.get(name);
    if (!stream) {
      stream = RngStream.create(this.state.seed, name);
      this.streams.set(name, stream);
    }
    return stream;
  }

  spawn(): EntityId {
    return this.allocator.allocate();
  }

  isAlive(id: EntityId): boolean {
    return this.allocator.isAlive(id);
  }

  get liveCount(): number {
    return this.allocator.liveCount;
  }

  destroy(id: EntityId): boolean {
    if (!this.allocator.isAlive(id)) return false;
    const index = entityIndex(id);
    const tables = this.state.entities;
    for (const table of ENTITY_TABLE_ORDER) {
      if (table === 'custom') {
        for (const owned of Object.values(tables.custom)) delete owned[index];
        continue;
      }
      delete (tables[table] as Record<number, unknown>)[index];
    }
    return this.allocator.release(id);
  }

  /** Flush allocator + RNG state back into the serializable object. Called before every save. */
  sync(): void {
    this.state.allocator = this.allocator.toJSON();
    const rng: Record<string, RngState> = {};
    // Sorted so the save bytes do not depend on the order streams were first touched in.
    for (const name of [...this.streams.keys()].sort()) {
      rng[name] = this.streams.get(name)!.save();
    }
    this.state.rng = rng;
  }
}

/**
 * Guests, struct-of-arrays.
 *
 * The one place in this codebase where the readable shape loses to the measured one. 2000 guest
 * objects re-touched twenty times a second is a garbage collector running during a coaster launch;
 * typed arrays are not.
 *
 * `count` is a dense prefix: a guest that leaves is swapped with the last live one, so iteration is
 * always `0..count` with no holes and no liveness test in the hot loop. `id[i]` keeps the entity
 * handle so the rest of the world can still address a guest.
 */
export class GuestStore {
  count = 0;
  readonly capacity: number;

  readonly id: Uint32Array;
  readonly x: Float32Array;
  readonly z: Float32Array;
  readonly heading: Float32Array;
  readonly speed: Float32Array;
  readonly state: Uint8Array;
  readonly happiness: Uint8Array;
  readonly energy: Uint8Array;
  readonly wallet: Int32Array;
  readonly spent: Int32Array;
  readonly target: Uint32Array;
  readonly pathNode: Int32Array;
  readonly ticksInState: Uint16Array;
  readonly nameIndex: Uint16Array;
  /** Five taste weights per guest, interleaved. */
  readonly taste: Uint8Array;
  /** `needCount` values per guest, interleaved. The registry decides how many there are. */
  readonly needs: Uint8Array;
  readonly needCount: number;
  /** Per-guest RGB-ish palette indices for the crowd instance buffer: skin, hair, top, bottom, shoe. */
  readonly palette: Uint8Array;

  constructor(capacity: number, needCount: number) {
    this.capacity = capacity;
    this.needCount = needCount;
    this.id = new Uint32Array(capacity);
    this.x = new Float32Array(capacity);
    this.z = new Float32Array(capacity);
    this.heading = new Float32Array(capacity);
    this.speed = new Float32Array(capacity);
    this.state = new Uint8Array(capacity);
    this.happiness = new Uint8Array(capacity);
    this.energy = new Uint8Array(capacity);
    this.wallet = new Int32Array(capacity);
    this.spent = new Int32Array(capacity);
    this.target = new Uint32Array(capacity);
    this.pathNode = new Int32Array(capacity);
    this.ticksInState = new Uint16Array(capacity);
    this.nameIndex = new Uint16Array(capacity);
    this.taste = new Uint8Array(capacity * 5);
    this.needs = new Uint8Array(capacity * needCount);
    this.palette = new Uint8Array(capacity * 5);
  }

  /** Index of the new guest, or -1 when the park is at capacity. */
  add(id: EntityId): number {
    if (this.count >= this.capacity) return -1;
    const i = this.count++;
    this.id[i] = id;
    this.x[i] = 0;
    this.z[i] = 0;
    this.heading[i] = 0;
    this.speed[i] = 0;
    this.state[i] = 0;
    this.happiness[i] = 160;
    this.energy[i] = 200;
    this.wallet[i] = 0;
    this.spent[i] = 0;
    this.target[i] = 0;
    this.pathNode[i] = -1;
    this.ticksInState[i] = 0;
    this.nameIndex[i] = 0;
    return i;
  }

  /** Swap-remove. Returns the index that moved into `i`, or -1 if `i` was last. */
  remove(i: number): number {
    const last = --this.count;
    if (i === last) return -1;
    this.copy(last, i);
    return last;
  }

  private copy(from: number, to: number): void {
    this.id[to] = this.id[from]!;
    this.x[to] = this.x[from]!;
    this.z[to] = this.z[from]!;
    this.heading[to] = this.heading[from]!;
    this.speed[to] = this.speed[from]!;
    this.state[to] = this.state[from]!;
    this.happiness[to] = this.happiness[from]!;
    this.energy[to] = this.energy[from]!;
    this.wallet[to] = this.wallet[from]!;
    this.spent[to] = this.spent[from]!;
    this.target[to] = this.target[from]!;
    this.pathNode[to] = this.pathNode[from]!;
    this.ticksInState[to] = this.ticksInState[from]!;
    this.nameIndex[to] = this.nameIndex[from]!;
    this.taste.copyWithin(to * 5, from * 5, from * 5 + 5);
    this.palette.copyWithin(to * 5, from * 5, from * 5 + 5);
    this.needs.copyWithin(to * this.needCount, from * this.needCount, (from + 1) * this.needCount);
  }

  find(id: EntityId): number {
    for (let i = 0; i < this.count; i++) if (this.id[i] === id) return i;
    return -1;
  }
}

/** Serialize the SoA store into the save's guest records, in index order. */
export function guestsToRecords(store: GuestStore, needNames: readonly string[]): GuestRecord[] {
  const states: GuestRecord['state'][] = [
    'entering',
    'walking',
    'queueing',
    'riding',
    'shopping',
    'swimming',
    'resting',
    'leaving',
  ];
  const out: GuestRecord[] = [];
  for (let i = 0; i < store.count; i++) {
    const needs: Record<string, number> = {};
    for (let n = 0; n < needNames.length; n++) {
      needs[needNames[n]!] = store.needs[i * store.needCount + n]!;
    }
    out.push({
      id: store.id[i] as EntityId,
      x: store.x[i]!,
      z: store.z[i]!,
      heading: store.heading[i]!,
      state: states[store.state[i]!] ?? 'walking',
      needs,
      happiness: store.happiness[i]!,
      energy: store.energy[i]!,
      wallet: store.wallet[i]!,
      spent: store.spent[i]!,
      target: store.target[i] as EntityId,
      pathNode: store.pathNode[i]!,
      ticksInState: store.ticksInState[i]!,
      taste: [
        store.taste[i * 5]!,
        store.taste[i * 5 + 1]!,
        store.taste[i * 5 + 2]!,
        store.taste[i * 5 + 3]!,
        store.taste[i * 5 + 4]!,
      ],
      nameIndex: store.nameIndex[i]!,
    });
  }
  return out;
}

export function recordsToGuests(
  records: readonly GuestRecord[],
  capacity: number,
  needNames: readonly string[]
): GuestStore {
  const store = new GuestStore(capacity, needNames.length);
  const stateIndex: Record<GuestRecord['state'], number> = {
    entering: 0,
    walking: 1,
    queueing: 2,
    riding: 3,
    shopping: 4,
    swimming: 5,
    resting: 6,
    leaving: 7,
  };
  for (const record of records) {
    const i = store.add(record.id);
    if (i < 0) break;
    store.x[i] = record.x;
    store.z[i] = record.z;
    store.heading[i] = record.heading;
    store.state[i] = stateIndex[record.state];
    store.happiness[i] = record.happiness;
    store.energy[i] = record.energy;
    store.wallet[i] = record.wallet;
    store.spent[i] = record.spent;
    store.target[i] = record.target;
    store.pathNode[i] = record.pathNode;
    store.ticksInState[i] = record.ticksInState;
    store.nameIndex[i] = record.nameIndex;
    for (let t = 0; t < 5; t++) store.taste[i * 5 + t] = record.taste[t] ?? 128;
    for (let n = 0; n < needNames.length; n++) {
      store.needs[i * store.needCount + n] = record.needs[needNames[n]!] ?? 0;
    }
  }
  return store;
}
