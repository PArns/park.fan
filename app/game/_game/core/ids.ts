/**
 * Entity identity.
 *
 * An `EntityId` packs an index and a generation into one 32-bit number. The index addresses the
 * component tables; the generation is bumped when a slot is freed, so a stale handle held by some
 * module after a delete resolves to "not alive" instead of silently addressing whatever entity
 * moved into that slot. That is what makes a leaked entity a *detectable* condition rather than a
 * feeling — the soak test counts live slots and asserts the free list is not growing.
 *
 * 20 bits of index (1,048,575 simultaneous entities) against 11 bits of generation. Guests are the
 * population that churns, and 2,048 reuses of one slot is roughly a park-year at the rate a slot
 * turns over, which is long enough that a handle surviving that far is a bug worth catching.
 */

/** A handle to an entity. Branded so a raw number cannot be passed where one is expected. */
export type EntityId = number & { readonly __entity: unique symbol };

const INDEX_BITS = 20;
const INDEX_MASK = (1 << INDEX_BITS) - 1;
const GENERATION_MASK = 0x7ff;

/** The id that means "nothing". Index 0 is never allocated so this is unambiguous. */
export const NO_ENTITY = 0 as EntityId;

export function makeEntityId(index: number, generation: number): EntityId {
  return (((generation & GENERATION_MASK) << INDEX_BITS) | (index & INDEX_MASK)) as EntityId;
}

export function entityIndex(id: EntityId): number {
  return id & INDEX_MASK;
}

export function entityGeneration(id: EntityId): number {
  return (id >>> INDEX_BITS) & GENERATION_MASK;
}

/**
 * Allocator for entity slots.
 *
 * Free slots are reused in FIFO order rather than LIFO, deliberately: a stack hands the next
 * allocation the slot that was just freed, so a delete-then-create in the same tick reuses the
 * index immediately and any handle captured between the two resolves to the wrong entity with a
 * generation that has only moved by one. A queue spreads the reuse out over the whole free list.
 */
export class EntityAllocator {
  /** Generation per index. Index 0 is reserved for {@link NO_ENTITY}. */
  private generations: number[] = [0];
  private alive: boolean[] = [false];
  private free: number[] = [];
  private freeHead = 0;

  get liveCount(): number {
    return this.generations.length - 1 - (this.free.length - this.freeHead);
  }

  get capacity(): number {
    return this.generations.length - 1;
  }

  allocate(): EntityId {
    if (this.freeHead < this.free.length) {
      const index = this.free[this.freeHead]!;
      this.freeHead++;
      // Compact the queue when it is mostly consumed, so it cannot grow without bound.
      if (this.freeHead > 1024 && this.freeHead * 2 > this.free.length) {
        this.free = this.free.slice(this.freeHead);
        this.freeHead = 0;
      }
      this.alive[index] = true;
      return makeEntityId(index, this.generations[index]!);
    }
    const index = this.generations.length;
    this.generations.push(0);
    this.alive.push(true);
    return makeEntityId(index, 0);
  }

  release(id: EntityId): boolean {
    const index = entityIndex(id);
    if (!this.isAlive(id)) return false;
    this.alive[index] = false;
    this.generations[index] = (this.generations[index]! + 1) & GENERATION_MASK;
    this.free.push(index);
    return true;
  }

  isAlive(id: EntityId): boolean {
    const index = entityIndex(id);
    if (index <= 0 || index >= this.generations.length) return false;
    return this.alive[index] === true && this.generations[index] === entityGeneration(id);
  }

  /** Serializable form. Order is stable, which is what the save round-trip rests on. */
  toJSON(): { generations: number[]; alive: number[]; free: number[] } {
    return {
      generations: this.generations.slice(),
      alive: this.alive.map((a) => (a ? 1 : 0)),
      free: this.free.slice(this.freeHead),
    };
  }

  static fromJSON(data: { generations: number[]; alive: number[]; free: number[] }): EntityAllocator {
    const allocator = new EntityAllocator();
    allocator.generations = data.generations.slice();
    allocator.alive = data.alive.map((a) => a === 1);
    allocator.free = data.free.slice();
    allocator.freeHead = 0;
    return allocator;
  }
}
