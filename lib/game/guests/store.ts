/**
 * The guest store: struct-of-arrays, stable slots, and a save that survives a pack being added.
 *
 * **Slots are stable and the store never compacts.** A swap-remove would be cheaper per despawn
 * and it would break the renderer: the main thread interpolates between the last two frames, and
 * with a compacting store index `i` is a different person in frame N than in frame N-1, so every
 * guest that left the park would drag a stranger across the screen behind it. A dead slot costs
 * 2 bytes of `guests.anim` per frame and the renderer skips it.
 *
 * **Allocation is always the LOWEST free slot**, through a binary min-heap. That is a determinism
 * requirement rather than tidiness: with a plain free LIST the order depends on the order guests
 * happened to leave, which a save cannot reconstruct — so a park saved at 14:00 and reloaded would
 * hand the next arrival a different slot than the uninterrupted run did, and every seeded decision
 * downstream of it would diverge. "Lowest free" is a function of WHICH slots are free and of
 * nothing else, so scanning the state array after a load rebuilds it exactly.
 *
 * **Free slots are zeroed.** The arrays are serialised whole, so a dead slot holding the last
 * guest's coordinates would put the history of the park into the save file and make two identical
 * worlds byte-different.
 *
 * **The save carries the need id list it was written against.** Needs are columns indexed by
 * registration order (`needs.ts`); loading a park saved before `neon-lagoon` was added must not
 * read the old `cash` column as the new `cooling` one. `load()` remaps by id and starts a need the
 * save has never heard of at zero.
 *
 * Pure: no Babylon, no DOM, node-safe.
 */

import { fromBase64, toBase64 } from '../core/world';
import { GuestState } from './types';

/** Grown in steps so a park filling up does not reallocate ten arrays per arrival. */
const GROWTH = 256;

export interface GuestStore {
  capacity: number;
  count: number;
  needCount: number;

  // identity
  id: Int32Array;
  state: Uint8Array;
  style: Uint16Array;
  archetype: Uint8Array;

  // where and how fast
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  heading: Float32Array;
  /** Walk-cycle phase in radians; the renderer reads it quantised to a byte. */
  phase: Float32Array;
  /** Metres per park minute this guest wants to walk at. */
  speed: Float32Array;
  /** What they are managing right now, after crowding. */
  actual: Float32Array;
  /** Signed offset across the path, metres; what stops a crowd walking a single line. */
  lane: Float32Array;

  // navigation
  node: Int32Array;
  wpX: Float32Array;
  wpZ: Float32Array;
  wpNode: Int32Array;
  destX: Float32Array;
  destZ: Float32Array;
  destKind: Uint8Array;
  /** Park minutes of failed routing; past a threshold the guest gives up and heads out. */
  lostFor: Float32Array;
  /** Park minutes spent trying to move and not moving. The soak's `no stuck guests`. */
  stuckFor: Float32Array;
  lastX: Float32Array;
  lastZ: Float32Array;

  // the person
  happiness: Float32Array;
  mood: Float32Array;
  cash: Int32Array;
  spent: Int32Array;
  arrivedAt: Float32Array;
  leaveAt: Float32Array;
  /** Absolute park minute a timed state (idle, sitting, buying) ends. */
  busyUntil: Float32Array;
  /** Park minutes until the next decision; a guest does not re-plan every tick. */
  decideIn: Float32Array;
  group: Int32Array;
  /** Slot of the party's leader, or the guest's own slot. */
  leader: Int32Array;
  thought: Int32Array;
  thoughtAt: Float32Array;

  /** `capacity × needCount`, row-major by slot. */
  /**
   * `capacity × needCount`, row-major by slot. **Float32, not Uint8**, and that is the whole
   * point of the field.
   *
   * A need rises by `decayPerHour × weight × dt/60` per tick. At 20 Hz that is 0.0217 units at
   * speed 1, 0.065 at 3, 0.108 at 5 and 0.217 at 10 — and every one of them rounds to zero in an
   * integer array. Only at 100×, which is the speed the SOAK runs at, does it move at all, so the
   * one test that exercised this module ran at the single speed where the bug is invisible. The
   * symptom in the browser was 934 of 944 guests standing idle with no destination after three
   * park hours, mean hunger 24 against an `urgentAt` of 170. Found by the `shops` builder, which
   * had to explain why nobody was buying anything.
   */
  needs: Float32Array;
}

export interface StoreHandle {
  data: GuestStore;
  alloc(): number;
  free(slot: number): void;
  /** Resize the need columns after a pack added one; existing values keep their column. */
  setNeedColumns(ids: string[]): void;
  needIds(): string[];
  serialize(): unknown;
  load(state: unknown): void;
  clear(): void;
}

const FLOAT_FIELDS = [
  'x',
  'y',
  'z',
  'heading',
  'phase',
  'speed',
  'actual',
  'lane',
  'wpX',
  'wpZ',
  'destX',
  'destZ',
  'lostFor',
  'stuckFor',
  'lastX',
  'lastZ',
  'happiness',
  'mood',
  'arrivedAt',
  'leaveAt',
  'busyUntil',
  'decideIn',
  'thoughtAt',
] as const;
const INT_FIELDS = ['id', 'node', 'wpNode', 'cash', 'spent', 'group', 'leader', 'thought'] as const;
/**
 * The one-byte columns, as a LIST rather than as five hand-written lines in five places.
 *
 * `destKind` used to be declared on `GuestStore` and allocated nowhere: `allocate` builds the
 * object with `as unknown as GuestStore`, so the compiler was told the field existed and never
 * checked, `grow`, `zero`, `serialize` and `load` each named their byte columns by hand and each
 * missed the same one, and the symptom was every guests tick throwing
 * `Cannot read properties of undefined (reading '0')` from a line that reads `d.destKind[slot]`.
 * The module had never been run.
 *
 * A cast that lies is the bug; a list the five sites share is the fix. `needs` stays out of it
 * because it is `capacity × needCount` rather than one entry per slot.
 */
const BYTE_FIELDS = ['state', 'archetype', 'destKind'] as const;

/**
 * The three column lists, as a union, so `GuestStore` cannot declare a column that no list
 * allocates — which is the bug this file shipped with. The compiler now refuses the type itself
 * rather than leaving the runtime guard in `allocate` to catch it, and the guard stays as the
 * second line of defence for the fields that are still hand-written (`id`, `style`, `needs`).
 */
export type GuestColumn =
  (typeof FLOAT_FIELDS)[number] | (typeof INT_FIELDS)[number] | (typeof BYTE_FIELDS)[number];

export function createStore(capacity: number, needIds: string[]): StoreHandle {
  let columns = needIds.slice();
  const data = allocate(capacity, columns.length);
  /** Min-heap of free slots. See the docblock: lowest-free is what makes a load resumable. */
  let heap: number[] = [];
  let nextId = 1;

  function allocate(cap: number, needCount: number): GuestStore {
    const store = {
      capacity: cap,
      count: 0,
      needCount,
      id: new Int32Array(cap),
      style: new Uint16Array(cap),
      needs: new Float32Array(cap * Math.max(1, needCount)),
    } as unknown as GuestStore;
    const raw = store as unknown as Record<string, unknown>;
    for (const f of BYTE_FIELDS) raw[f] = new Uint8Array(cap);
    for (const f of FLOAT_FIELDS) raw[f] = new Float32Array(cap);
    for (const f of INT_FIELDS) {
      if (f === 'id') continue;
      raw[f] = new Int32Array(cap);
    }
    // The guard the cast above removed. It runs once per allocation — three times in a session,
    // not per tick — and turns "a field is declared and never allocated" from a throw deep in the
    // behaviour loop into a named error at the point of the mistake.
    for (const f of [...BYTE_FIELDS, ...FLOAT_FIELDS, ...INT_FIELDS] as string[]) {
      if (!ArrayBuffer.isView(raw[f])) {
        throw new Error(`guest store: column "${f}" is declared but not allocated`);
      }
    }
    return store;
  }

  function heapPush(slot: number): void {
    heap.push(slot);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent] <= heap[i]) break;
      const t = heap[parent];
      heap[parent] = heap[i];
      heap[i] = t;
      i = parent;
    }
  }

  function heapPop(): number {
    if (heap.length === 0) return -1;
    const top = heap[0];
    const last = heap.pop() as number;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let small = i;
        if (l < heap.length && heap[l] < heap[small]) small = l;
        if (r < heap.length && heap[r] < heap[small]) small = r;
        if (small === i) break;
        const t = heap[small];
        heap[small] = heap[i];
        heap[i] = t;
        i = small;
      }
    }
    return top;
  }

  function rebuildHeap(): void {
    heap = [];
    for (let i = 0; i < data.capacity; i++) if (data.state[i] === GuestState.GONE) heapPush(i);
  }

  function grow(to: number): void {
    const next = allocate(to, data.needCount);
    next.id.set(data.id);
    next.style.set(data.style);
    next.needs.set(data.needs);
    for (const f of BYTE_FIELDS) (next[f] as Uint8Array).set(data[f] as Uint8Array);
    for (const f of FLOAT_FIELDS) {
      (next[f] as Float32Array).set(data[f] as Float32Array);
    }
    for (const f of INT_FIELDS) {
      if (f === 'id') continue;
      (next[f] as Int32Array).set(data[f] as Int32Array);
    }
    const oldCapacity = data.capacity;
    const live = data.count;
    Object.assign(data, next);
    data.capacity = to;
    data.count = live;
    for (let i = oldCapacity; i < to; i++) heapPush(i);
  }

  function zero(slot: number): void {
    data.id[slot] = 0;
    data.style[slot] = 0;
    for (const f of BYTE_FIELDS) (data[f] as Uint8Array)[slot] = 0;
    data.state[slot] = GuestState.GONE;
    for (const f of FLOAT_FIELDS) (data[f] as Float32Array)[slot] = 0;
    for (const f of INT_FIELDS) {
      if (f === 'id') continue;
      (data[f] as Int32Array)[slot] = 0;
    }
    const base = slot * data.needCount;
    for (let i = 0; i < data.needCount; i++) data.needs[base + i] = 0;
  }

  rebuildHeap();

  return {
    data,
    alloc() {
      if (heap.length === 0) grow(data.capacity + GROWTH);
      const slot = heapPop();
      if (slot < 0) return -1;
      zero(slot);
      data.id[slot] = nextId++;
      data.state[slot] = GuestState.ARRIVING;
      data.node[slot] = -1;
      data.wpNode[slot] = -1;
      data.thought[slot] = -1;
      data.count++;
      return slot;
    },
    free(slot) {
      if (slot < 0 || slot >= data.capacity) return;
      if (data.state[slot] === GuestState.GONE) return;
      zero(slot);
      data.count--;
      heapPush(slot);
    },
    setNeedColumns(ids) {
      if (ids.length === columns.length && ids.every((id, i) => id === columns[i])) return;
      const next = new Float32Array(data.capacity * Math.max(1, ids.length));
      // Copy by ID, not by position: a pack registered between two boots appends a column, and a
      // pack REMOVED between two boots shifts every column after it.
      for (let c = 0; c < ids.length; c++) {
        const from = columns.indexOf(ids[c]);
        if (from < 0) continue;
        for (let slot = 0; slot < data.capacity; slot++) {
          next[slot * ids.length + c] = data.needs[slot * columns.length + from];
        }
      }
      data.needs = next;
      data.needCount = ids.length;
      columns = ids.slice();
    },
    needIds: () => columns.slice(),
    serialize() {
      return {
        version: 1,
        capacity: data.capacity,
        count: data.count,
        nextId,
        needIds: columns.slice(),
        // Base64 rather than number arrays: 2 000 guests × 31 columns is 250 000 numbers, which is
        // about 1.6 MB of JSON against 330 KB of base64, and the terrain already sets the
        // precedent (`world.ts`). Byte-exact for floats, which a JSON number is not obliged to be.
        u8: Object.fromEntries(BYTE_FIELDS.map((f) => [f, toBase64(data[f] as Uint8Array)])),
        u16: { style: toBase64(bytesOf(data.style)) },
        i32: Object.fromEntries(
          INT_FIELDS.map((f) => [f, toBase64(bytesOf(data[f] as Int32Array))])
        ),
        f32: {
          ...Object.fromEntries(
            FLOAT_FIELDS.map((f) => [f, toBase64(bytesOf(data[f] as Float32Array))])
          ),
          // Moved out of the `u8` block when the column widened. A save written before that still
          // loads: `load` reads `u8.needs` when `f32.needs` is absent and widens it, which costs
          // nothing and is the difference between an old park opening and an old park being an
          // empty one.
          needs: toBase64(bytesOf(data.needs)),
        },
      };
    },
    load(state) {
      const raw = state as {
        capacity?: number;
        count?: number;
        nextId?: number;
        needIds?: string[];
        u8?: Record<string, string>;
        u16?: Record<string, string>;
        i32?: Record<string, string>;
        f32?: Record<string, string>;
      } | null;
      if (!raw || typeof raw !== 'object' || !raw.u8) return;
      const cap = Math.max(GROWTH, Math.floor(raw.capacity ?? GROWTH));
      const savedIds = Array.isArray(raw.needIds) ? raw.needIds.slice() : columns.slice();
      const next = allocate(cap, savedIds.length);
      for (const f of BYTE_FIELDS) readInto(next[f] as Uint8Array, raw.u8[f]);
      if (raw.f32?.needs) {
        readInto(new Uint8Array(next.needs.buffer), raw.f32.needs);
      } else if (raw.u8.needs) {
        // A pre-widening save: one byte per need, read straight across.
        const legacy = new Uint8Array(next.needs.length);
        readInto(legacy, raw.u8.needs);
        for (let i = 0; i < next.needs.length; i++) next.needs[i] = legacy[i]!;
      }
      readInto(new Uint8Array(next.style.buffer), raw.u16?.style);
      for (const f of INT_FIELDS)
        readInto(new Uint8Array((next[f] as Int32Array).buffer), raw.i32?.[f]);
      for (const f of FLOAT_FIELDS) {
        readInto(new Uint8Array((next[f] as Float32Array).buffer), raw.f32?.[f]);
      }
      Object.assign(data, next);
      data.capacity = cap;
      data.needCount = savedIds.length;
      columns = savedIds;
      nextId = Math.max(1, Math.floor(raw.nextId ?? 1));
      let live = 0;
      for (let i = 0; i < cap; i++) if (data.state[i] !== GuestState.GONE) live++;
      data.count = live;
      rebuildHeap();
    },
    clear() {
      for (let i = 0; i < data.capacity; i++) zero(i);
      data.count = 0;
      nextId = 1;
      rebuildHeap();
    },
  };
}

function bytesOf(a: Int32Array | Float32Array | Uint16Array): Uint8Array {
  return new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
}

function readInto(target: Uint8Array, text: string | undefined): void {
  if (!text) return;
  const bytes = fromBase64(text);
  target.set(bytes.subarray(0, Math.min(bytes.length, target.length)));
}
