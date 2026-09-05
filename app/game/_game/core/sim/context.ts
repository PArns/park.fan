/**
 * What a simulation system gets, and the interface it implements.
 *
 * Systems live in their **owning module** (`_game/guests/sim.ts`, `_game/trains/sim.ts`, …) and are
 * imported by `core/sim/order.ts` in a **declared** order. Two things follow from that and both are
 * the point: a module still owns its own logic, and the order the systems run in is a diffable list
 * in one file rather than an emergent property of import order.
 */

import type { ContentRegistry } from '../registry';
import type { RngStream } from '../rng';
import type { DirtyList } from '../protocol';
import type { EntityId } from '../ids';
import type { GuestStore, World } from '../world';
import type { GameClock } from '../units';

export interface SimNotice {
  level: 'info' | 'warn' | 'error';
  title: string;
  body?: string;
}

export interface SimContext {
  readonly world: World;
  readonly guests: GuestStore;
  readonly registry: ContentRegistry;
  readonly clock: GameClock;
  /** Ticks elapsed since the previous call — always 1; present so a system reads intent, not a constant. */
  readonly dt: number;
  /** The tick's dirty set. A system that changes something renderable must say so. */
  readonly dirty: DirtyList;
  rng(stream: string): RngStream;
  notify(notice: SimNotice): void;
  /** Destroy an entity and every component it has. Recorded in `dirty.removed`. */
  destroy(id: EntityId): void;
  /** Spend or earn. Returns false when the park cannot afford it, and nothing is spent. */
  spend(cents: number, ledger: keyof LedgerBuckets): boolean;
  earn(cents: number, ledger: keyof LedgerBuckets): void;
}

export interface LedgerBuckets {
  ticketIncome: number;
  shopIncome: number;
  entryIncome: number;
  wages: number;
  upkeep: number;
  marketing: number;
  interest: number;
  construction: number;
}

export interface SimSystem {
  readonly id: string;
  /** Called once when the world is created or loaded, before the first tick. */
  init?(ctx: SimContext): void;
  tick(ctx: SimContext): void;
  /** Extra facts for the soak report. Merged into it under the system's id. */
  audit?(ctx: SimContext): Record<string, number>;
}
