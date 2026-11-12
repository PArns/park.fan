import type { PlanDayRide } from '@/lib/api/types';
import type { PlannerBlockIcon } from './types';

/**
 * What to give up when the day is too short, measured rather than argued. The measuring happens in
 * the API (`requestFit` in `optimize-remote.ts`): every lever there is the same engine run again
 * with one thing taken away. This module holds what the assistant draws and the answers the
 * visitor gives, which change on a tap and must not wait for a request.
 *
 * This is the one place an entry may be removed, and only in front of a list that names it. See
 * docs/rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md.
 */

/** One thing the visitor wants on the day — an entry they have, or a ride to add. */
export interface FitWish {
  /** Stable and unique within one list: `e:<entry id>` or `a:<slug>`. */
  key: string;
  /** The entry this stands for, or `null` where it is a ride being added. */
  entryId: string | null;
  attractionSlug: string;
  attractionName: string;
  /**
   * The day's own row for this ride, joined on in the browser for its photo and peak. `null` where
   * the payload has none.
   */
  ride: PlanDayRide | null;
  /** A curated headliner. Decoration here. */
  headliner: boolean;
  /** Whether the day has a curve for it; a wish without one keeps its minute. */
  replannable: boolean;
}

/** A free block the day holds — the one thing in a plan that is not a queue. */
export interface FitBlock {
  entryId: string;
  label: string;
  icon: PlannerBlockIcon;
  durationMinutes: number;
}

/** The visitor's answers. Everything not named here is planned as offered. */
export interface FitChoice {
  /** Wish keys switched OFF — not planned, and removed where they are entries. */
  dropped: ReadonlySet<string>;
  /** Free blocks taken out of the day. */
  droppedBlocks: ReadonlySet<string>;
  /** Free blocks cut to half an hour. */
  shortBlocks: ReadonlySet<string>;
  /**
   * Wish keys, most important first. It decides which wish falls out where they cannot all fit,
   * never the order of the day. Keys not listed fall in behind the named ones.
   */
  priority: readonly string[];
}

/** Which lever a {@link FitLever} pulls. */
export type FitLeverKind = 'drop-block' | 'shorten-block' | 'drop-all-blocks';

/**
 * One thing the visitor could change, and what it would buy: `fits` and `fitsNow` are counts of the
 * same wish list under the same engine. A lever that buys nothing is not returned.
 */
export interface FitLever {
  kind: FitLeverKind;
  /** The block it acts on. Absent on `drop-all-blocks`. */
  entryId?: string;
  label?: string;
  icon?: PlannerBlockIcon;
  /** What the block would be cut to. `shorten-block` only. */
  minutes?: number;
  /** How many of the ticked wishes fit once it is pulled. */
  fits: number;
  /** How many fit as things stand. */
  fitsNow: number;
  /** How many the visitor is asking for. */
  wanted: number;
  /** Pulling this one alone makes the whole wish list fit. */
  solves: boolean;
}

/** The levers to draw, and which of them are on. */
export interface FitLeverView {
  levers: FitLever[];
  applied: Set<string>;
}

const ENTRY_PREFIX = 'e:';
const ADD_PREFIX = 'a:';

/** The wish key for an entry the visitor already has. */
export function entryWishKey(entryId: string): string {
  return `${ENTRY_PREFIX}${entryId}`;
}

/** The wish key for a ride being added. */
export function addWishKey(slug: string): string {
  return `${ADD_PREFIX}${slug}`;
}

/**
 * Everything ticked, nothing shortened, nothing pinned: how the question opens. `priority` starts
 * empty, meaning the visitor has not spoken, so a pre-filled list does not make every ride look
 * pinned.
 */
export function fitChoiceAll(): FitChoice {
  return {
    dropped: new Set(),
    droppedBlocks: new Set(),
    shortBlocks: new Set(),
    priority: [],
  };
}

/**
 * The wishes in the order the day is decided in, which is what the list draws: pinned first, then
 * the rest as offered, and a second go on a ride behind every first one, because the engine gives a
 * lap up first and "gestrichen wird von unten" has to stay true. The API answers the same order
 * (`order`); this copy lets a pin move a row on the tap rather than on the answer.
 */
export function fitOrder(wishes: readonly FitWish[], choice: FitChoice): FitWish[] {
  const byKey = new Map(wishes.map((wish) => [wish.key, wish]));
  const out: FitWish[] = [];
  for (const key of choice.priority) {
    const wish = byKey.get(key);
    if (wish) {
      out.push(wish);
      byKey.delete(key);
    }
  }
  const seen = new Set(out.map((wish) => wish.attractionSlug));
  const laps: FitWish[] = [];
  for (const wish of wishes) {
    if (!byKey.has(wish.key)) continue;
    if (seen.has(wish.attractionSlug)) {
      laps.push(wish);
      continue;
    }
    seen.add(wish.attractionSlug);
    out.push(wish);
  }
  return [...out, ...laps];
}

/** A lever's identity, so a caller can hold a set of the ones already pulled. */
export function leverKey(lever: Pick<FitLever, 'kind' | 'entryId'>): string {
  return `${lever.kind}:${lever.entryId ?? '*'}`;
}

/**
 * One lever pressed, as a new choice. Two levers on one block are alternatives, so taking one sets
 * the other down, and every press is its own inverse.
 */
export function toggleLever(
  blocks: readonly FitBlock[],
  choice: FitChoice,
  lever: FitLever
): FitChoice {
  const droppedBlocks = new Set(choice.droppedBlocks);
  const shortBlocks = new Set(choice.shortBlocks);

  if (lever.kind === 'drop-all-blocks') {
    const all = blocks.every((block) => droppedBlocks.has(block.entryId));
    for (const block of blocks) {
      if (all) droppedBlocks.delete(block.entryId);
      else droppedBlocks.add(block.entryId);
    }
    return { ...choice, droppedBlocks, shortBlocks };
  }

  const id = lever.entryId as string;
  if (lever.kind === 'drop-block') {
    if (droppedBlocks.has(id)) droppedBlocks.delete(id);
    else {
      droppedBlocks.add(id);
      shortBlocks.delete(id);
    }
  } else {
    if (shortBlocks.has(id)) shortBlocks.delete(id);
    else {
      shortBlocks.add(id);
      droppedBlocks.delete(id);
    }
  }
  return { ...choice, droppedBlocks, shortBlocks };
}

/** One wish ticked or unticked. A ride nobody plans is not a ride anybody pinned. */
export function toggleWish(choice: FitChoice, key: string): FitChoice {
  const dropped = new Set(choice.dropped);
  if (dropped.has(key)) dropped.delete(key);
  else dropped.add(key);
  return {
    ...choice,
    dropped,
    priority: dropped.has(key) ? choice.priority.filter((value) => value !== key) : choice.priority,
  };
}

/** One wish pinned to the top of the order, or unpinned. */
export function togglePin(choice: FitChoice, key: string): FitChoice {
  return {
    ...choice,
    priority: choice.priority.includes(key)
      ? choice.priority.filter((value) => value !== key)
      : [...choice.priority, key],
  };
}
