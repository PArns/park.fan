import type { PlanDay, PlanDayRide } from '@/lib/api/types';
import type { DayGrid } from './day-grid';
import { movableEntries, optimizeDay, scoreCurrent, type OptimizeStop } from './optimize';
import type { DayClock } from './park-time';
import type { PlannerBlockIcon, PlannerEntry } from './types';

/**
 * What to give up when the day is too short, measured rather than argued.
 *
 * `optimizeDay` answers "the best plan for these rides"; it does not answer the
 * question a visitor asks the moment that plan comes back one ride short, which
 * is **what would I have to change for it to fit**. It cannot: the engine takes
 * the day's fixed blocks as given (a lunch break is a decision, not a queue) and
 * it never deletes an entry, so from the inside there is nothing left to try.
 *
 * From the outside there is. Every lever in here is the SAME engine run again
 * with one thing taken away, so what the assistant prints is a difference
 * between two plans rather than a rule of thumb:
 *
 *     mit Mittagspause    9 von 10
 *     ohne Mittagspause  10 von 10   → „Ohne Mittagspause passt der Plan"
 *
 * Measured on the day it was reported — Phantasialand, Saturday 2026-09-12,
 * nine hours, ten headliners — that sentence is literally true, and on
 * 2026-10-03 at the same park it is not: eight fit with the break, nine without,
 * so the same code says „Ohne Mittagspause passen 9 von 10" and the visitor
 * still has to give one up. Both readings come out of the same probe, which is
 * the point: nothing here knows in advance which case a day is.
 *
 * ## The day is re-planned from a wish list, and that is a different contract
 *
 * `optimizeDay` parks an entry the visitor already had PAST the gate rather
 * than deleting it (see its `OVERFLOW_STRIDE`), because deleting somebody's own
 * plan behind their back is worse than a block in the hatched hours. The
 * assistant is the one place that rule can be relaxed, and only because it is
 * no longer behind anybody's back: the visitor is looking at the list, the ones
 * that will not make it are marked, and nothing is written until they press.
 *
 * So a ticked wish that the payload has a row for is handed to the engine as
 * something being ADDED, whatever it is today. That buys the thing the tiers
 * were built for and the parked-block fallback cannot give: which of them falls
 * out becomes a DECISION — the visitor's own order, through
 * `OptimizeInput.priority` — instead of whichever the schedule happened to
 * reach last. The entries the wish list does not cover (ticked off, already
 * under way, free blocks) never move.
 *
 * ## Fitted means before closing, and nothing else
 *
 * One rule, read off the stop the engine produced: a wish is fitted when it has
 * a stop that `fits`. An addition that does not fit is absent from the plan
 * entirely; an entry that does not fit is present with `fits: false`. Deriving
 * "did it make it" from the minute instead would be a second copy of
 * `grid.closeMin`'s rule, in a file that has no business owning it.
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
   * The day's own row for this ride, which is what lets it be re-planned.
   *
   * `null` where the payload has no row — a ride that has left the catalogue,
   * or an entry filed before the park's list changed. Such a wish keeps its
   * minute and its entry: there is no curve to plan it against, so the only
   * two answers the assistant can give about it are "leave it" and "take it
   * out of the day".
   */
  ride: PlanDayRide | null;
  /** A curated headliner. Decoration here; the engine reads it off `ride`. */
  headliner: boolean;
}

/** A free block the day holds — the one thing in a plan that is not a queue. */
export interface FitBlock {
  entryId: string;
  label: string;
  icon: PlannerBlockIcon;
  durationMinutes: number;
}

export interface FitInput {
  day: PlanDay;
  grid: DayGrid;
  /** The day exactly as it stands, free blocks and ticked-off entries included. */
  entries: readonly PlannerEntry[];
  /** Everything the visitor is deciding about, in the order they were offered. */
  wishes: readonly FitWish[];
  /** The free blocks the levers below may take away or cut short. */
  blocks: readonly FitBlock[];
  clock?: DayClock;
}

/** The visitor's answers. Everything not named here is planned as offered. */
export interface FitChoice {
  /** Wish keys switched OFF — not planned, and removed where they are entries. */
  dropped: ReadonlySet<string>;
  /** Free blocks taken out of the day. */
  droppedBlocks: ReadonlySet<string>;
  /** Free blocks cut to {@link SHORT_BLOCK_MIN}. */
  shortBlocks: ReadonlySet<string>;
  /**
   * Wish keys, most important first.
   *
   * It decides WHICH wish falls out where they cannot all fit, never the order
   * of the day — that is the schedule's job and it is chosen on queued minutes.
   * Keys missing from the list fall in behind the ones that are named.
   */
  priority: readonly string[];
}

/** What a plan for one {@link FitChoice} comes to. */
export interface FitOutcome {
  /** Wish keys that get a slot before the park closes, in plan order. */
  fitted: string[];
  /** Ticked wishes that still find no minute before closing. */
  missed: string[];
  /** When the last queue that actually happens is left, park-local minutes. */
  endMinute: number;
  totalWaitMinutes: number;
  idleMinutes: number;
  /** The entries the day would keep — what a caller writes before the stops. */
  entries: PlannerEntry[];
  /** The plan to lay over them. */
  stops: OptimizeStop[];
}

/** What a shortened free block is cut to. Half an hour is still a meal. */
export const SHORT_BLOCK_MIN = 30;

/** Which lever a {@link FitLever} pulls. */
export type FitLeverKind = 'drop-block' | 'shorten-block' | 'drop-all-blocks';

/**
 * One thing the visitor could change, and what it would buy.
 *
 * `fits` and `fitsNow` are both counts of the same wish list under the same
 * engine, so the sentence the UI writes out of them ("without the lunch break,
 * ten instead of nine") is a difference between two plans. A lever that buys
 * nothing is not returned at all — an offer that changes no number is worse
 * than silence, because the visitor pulls it and watches nothing happen.
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
 * Everything the visitor is being asked about, in the order it is offered.
 *
 * Their own rides first and the additions after, which is the order the
 * question arrives in: a day is something you already have and the button
 * proposes more. It is also the default priority — what is already planned was
 * planned on purpose — and the list is reorderable, so it is a starting point
 * rather than a claim.
 *
 * Only the MOVABLE entries. A ticked-off ride happened and a slot already under
 * way is being lived through, so neither is a decision anybody can still take;
 * `movableEntries` is the engine's own filter, read here rather than copied,
 * for the reason its docstring gives.
 */
export function fitWishes(
  day: PlanDay,
  entries: readonly PlannerEntry[],
  add: readonly PlanDayRide[],
  clock?: DayClock
): FitWish[] {
  const rideOf = (slug: string) => day.rides.find((ride) => ride.attractionSlug === slug) ?? null;
  const own: FitWish[] = movableEntries(entries, clock).map((entry) => {
    const slug = entry.attractionSlug as string;
    const ride = rideOf(slug);
    return {
      key: entryWishKey(entry.id),
      entryId: entry.id,
      attractionSlug: slug,
      attractionName: entry.attractionName ?? ride?.attractionName ?? slug,
      ride,
      headliner: Boolean(ride?.isHeadliner),
    };
  });
  const planned = new Set(own.map((wish) => wish.attractionSlug));
  const extra: FitWish[] = add
    .filter((ride) => !planned.has(ride.attractionSlug))
    .map((ride) => ({
      key: addWishKey(ride.attractionSlug),
      entryId: null,
      attractionSlug: ride.attractionSlug,
      attractionName: ride.attractionName,
      ride,
      headliner: Boolean(ride.isHeadliner),
    }));
  return [...own, ...extra];
}

/**
 * The free blocks a lever may act on.
 *
 * A block that has been ticked off is a record of an hour that happened, so it
 * is not on offer — the assistant may only propose changes to a day nobody has
 * lived yet.
 */
export function fitBlocks(entries: readonly PlannerEntry[]): FitBlock[] {
  return entries
    .filter((entry): entry is PlannerEntry & { custom: NonNullable<PlannerEntry['custom']> } =>
      Boolean(entry.custom && !entry.done)
    )
    .map((entry) => ({
      entryId: entry.id,
      label: entry.custom.label,
      icon: entry.custom.icon,
      durationMinutes: entry.custom.durationMinutes,
    }));
}

/**
 * Everything ticked, nothing shortened, nothing pinned — how the question opens.
 *
 * It takes no input: every set starts empty, and the order comes from the day
 * rather than from here. `priority` starting EMPTY rather than holding the
 * offered order is what the list means — empty says the visitor has not spoken,
 * so {@link fitOrder} falls through to the order the day offered and the engine
 * ranks the rest by their own expected queues. A pre-filled list would make
 * every ride look pinned, and the first pin would look like it changed nothing.
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
 * The wishes in the order the day is decided in — what the list draws.
 *
 * Pinned first, in the order they were pinned, then everything else as it was
 * offered. It is exported because the assistant renders THIS rather than its
 * own sort: a list whose order differs from the order the engine gives things
 * up in is a list that lies about what is at the bottom.
 */
export function fitOrder(input: FitInput, choice: FitChoice): FitWish[] {
  return ordered(input, choice);
}

/** The wishes in the visitor's order, with anything unranked behind them. */
function ordered(input: FitInput, choice: FitChoice): FitWish[] {
  const byKey = new Map(input.wishes.map((wish) => [wish.key, wish]));
  const out: FitWish[] = [];
  for (const key of choice.priority) {
    const wish = byKey.get(key);
    if (wish) {
      out.push(wish);
      byKey.delete(key);
    }
  }
  for (const wish of input.wishes) if (byKey.has(wish.key)) out.push(wish);
  return out;
}

/**
 * The day as the choice leaves it, before the plan is laid over it.
 *
 * Three kinds of entry and one rule each: a wish the visitor switched off goes,
 * a wish being re-planned goes (it comes back as a stop), and everything else
 * stays — with a shortened block shortened.
 */
function entriesAfter(input: FitInput, choice: FitChoice): PlannerEntry[] {
  const byEntryId = new Map(
    input.wishes.filter((wish) => wish.entryId).map((wish) => [wish.entryId as string, wish])
  );
  const kept: PlannerEntry[] = [];
  for (const entry of input.entries) {
    const wish = byEntryId.get(entry.id);
    if (wish) {
      if (choice.dropped.has(wish.key)) continue;
      // No row in the payload means no curve to plan it against, so it keeps
      // the minute the visitor gave it. See {@link FitWish.ride}.
      if (wish.ride) continue;
      kept.push(entry);
      continue;
    }
    if (!entry.custom) {
      kept.push(entry);
      continue;
    }
    if (choice.droppedBlocks.has(entry.id)) continue;
    if (choice.shortBlocks.has(entry.id) && entry.custom.durationMinutes > SHORT_BLOCK_MIN) {
      kept.push({
        ...entry,
        custom: { ...entry.custom, durationMinutes: SHORT_BLOCK_MIN },
      });
      continue;
    }
    kept.push(entry);
  }
  return kept;
}

/**
 * The plan for one choice, and what it leaves out.
 *
 * `optimizeDay` answers `null` on a day it cannot improve, which is not an
 * absence of an outcome — it means the day as it stands IS the plan — so the
 * fallback scores exactly that day through `scoreCurrent` and reads the same
 * `fits` off it. Without the fallback a visitor who unticks their way down to a
 * list that already fits gets an empty result screen on the press that finally
 * worked.
 */
export function evaluateFit(input: FitInput, choice: FitChoice): FitOutcome {
  const wishes = ordered(input, choice).filter((wish) => !choice.dropped.has(wish.key));
  const entries = entriesAfter(input, choice);
  const replanned = wishes.filter((wish) => wish.ride);
  const optimizeInput = {
    day: input.day,
    grid: input.grid,
    entries,
    add: replanned.map((wish) => wish.ride as PlanDayRide),
    priority: replanned.map((wish) => wish.attractionSlug),
    clock: input.clock,
  };

  const plan = optimizeDay(optimizeInput);
  const scored = plan ?? scoreCurrent(optimizeInput);
  const stops = scored?.stops ?? [];

  // Paired in plan order so a ride the day holds twice matches its two stops
  // rather than counting the first one twice.
  const spare = stops.map((stop) => ({ stop, taken: false }));
  const fitted: string[] = [];
  const missed: string[] = [];
  for (const wish of wishes) {
    const hit = spare.find(
      (slot) =>
        !slot.taken &&
        slot.stop.attractionSlug === wish.attractionSlug &&
        (wish.ride ? slot.stop.entryId === null : slot.stop.entryId === wish.entryId)
    );
    if (hit) hit.taken = true;
    if (hit?.stop.fits) fitted.push(wish.key);
    else missed.push(wish.key);
  }

  return {
    fitted,
    missed,
    endMinute: scored?.endMinute ?? input.grid.openMin,
    totalWaitMinutes: scored?.totalWaitMinutes ?? 0,
    idleMinutes: scored?.idleMinutes ?? 0,
    entries,
    stops: plan ? plan.stops : [],
  };
}

/**
 * The changes worth offering, best first.
 *
 * Every one is the whole engine run again against the choice as it stands, so
 * the levers move as the visitor unticks rides: a break that was the difference
 * between nine and ten stops mattering the moment the tenth is given up, and
 * offering it then would be a button that changes nothing.
 *
 * Cutting a block short is offered before taking it out, and where the short
 * version already makes everything fit the longer answer is not offered at all
 * — nobody skips lunch to buy what half an hour already bought. Both are
 * refused where the block is not long enough for the distinction to mean
 * anything ({@link SHORT_BLOCK_MIN}).
 *
 * Cost: one search per lever, 5–50 ms each, over the one to three free blocks a
 * day actually holds. It runs on a press and again on every tick, which is why
 * the call sites memoise it on the choice.
 */
export function fitLevers(input: FitInput, choice: FitChoice): FitLever[] {
  const wanted = input.wishes.filter((wish) => !choice.dropped.has(wish.key)).length;
  const fitsNow = evaluateFit(input, choice).fitted.length;
  if (fitsNow >= wanted) return [];

  const open = input.blocks.filter((block) => !choice.droppedBlocks.has(block.entryId));
  const levers: FitLever[] = [];

  const probe = (next: FitChoice) => evaluateFit(input, next).fitted.length;
  const withSet = (set: ReadonlySet<string>, id: string) => new Set([...set, id]);
  const withoutSet = (set: ReadonlySet<string>, id: string) =>
    new Set([...set].filter((value) => value !== id));

  for (const block of open) {
    const shortenable =
      block.durationMinutes > SHORT_BLOCK_MIN && !choice.shortBlocks.has(block.entryId);
    const shortFits = shortenable
      ? probe({ ...choice, shortBlocks: withSet(choice.shortBlocks, block.entryId) })
      : fitsNow;
    if (shortenable && shortFits > fitsNow) {
      levers.push({
        kind: 'shorten-block',
        entryId: block.entryId,
        label: block.label,
        icon: block.icon,
        minutes: SHORT_BLOCK_MIN,
        fits: shortFits,
        fitsNow,
        wanted,
        solves: shortFits >= wanted,
      });
      // Half an hour already bought the whole list; giving up the block
      // entirely buys nothing more and is a worse thing to be offered.
      if (shortFits >= wanted) continue;
    }
    const dropFits = probe({
      ...choice,
      droppedBlocks: withSet(choice.droppedBlocks, block.entryId),
      shortBlocks: withoutSet(choice.shortBlocks, block.entryId),
    });
    if (dropFits > Math.max(fitsNow, shortFits)) {
      levers.push({
        kind: 'drop-block',
        entryId: block.entryId,
        label: block.label,
        icon: block.icon,
        fits: dropFits,
        fitsNow,
        wanted,
        solves: dropFits >= wanted,
      });
    }
  }

  // Only where no single block was enough: two half-hours out of one day is a
  // bigger ask than either of them, so it is the last thing offered and only
  // when it is the only thing that works.
  if (open.length > 1 && !levers.some((lever) => lever.solves)) {
    const allFits = probe({
      ...choice,
      droppedBlocks: new Set(open.map((block) => block.entryId)),
    });
    if (allFits > Math.max(fitsNow, ...levers.map((lever) => lever.fits))) {
      levers.push({
        kind: 'drop-all-blocks',
        fits: allFits,
        fitsNow,
        wanted,
        solves: allFits >= wanted,
      });
    }
  }

  return levers.sort(
    (a, b) =>
      Number(b.solves) - Number(a.solves) ||
      b.fits - a.fits ||
      KIND_RANK[a.kind] - KIND_RANK[b.kind]
  );
}

/** A lever's identity, so a caller can hold a set of the ones already pulled. */
export function leverKey(lever: Pick<FitLever, 'kind' | 'entryId'>): string {
  return `${lever.kind}:${lever.entryId ?? '*'}`;
}

/** The levers to draw, and which of them are on. */
export interface FitLeverView {
  levers: FitLever[];
  applied: Set<string>;
}

/**
 * {@link fitLevers}, plus the ones the visitor has already pulled.
 *
 * A lever is only offered while it would still BUY something, which is right
 * for the offer and wrong for the list: a row that disappears the moment it is
 * pressed is a change nobody can take back. So the pulled ones are folded back
 * in, at the end, carrying the counts as they stand — pressing again puts the
 * break back and the numbers move the other way.
 *
 * Both halves live here rather than in the component because both assistants
 * draw this list, and a fold-back written twice is two chances for a lever to
 * vanish under somebody's finger in one of them.
 */
export function fitLeverView(input: FitInput, choice: FitChoice): FitLeverView {
  const levers = fitLevers(input, choice);
  const applied = new Set<string>();
  for (const id of choice.droppedBlocks) applied.add(`drop-block:${id}`);
  for (const id of choice.shortBlocks) applied.add(`shorten-block:${id}`);
  if (
    input.blocks.length > 1 &&
    input.blocks.every((block) => choice.droppedBlocks.has(block.entryId))
  )
    applied.add('drop-all-blocks:*');

  const fits = evaluateFit(input, choice).fitted.length;
  const wanted = input.wishes.filter((wish) => !choice.dropped.has(wish.key)).length;
  const seen = new Set(levers.map(leverKey));
  const back: FitLever[] = [];
  for (const block of input.blocks) {
    const shared = {
      entryId: block.entryId,
      label: block.label,
      icon: block.icon,
      fits,
      fitsNow: fits,
      wanted,
      solves: fits >= wanted,
    };
    if (choice.droppedBlocks.has(block.entryId) && !seen.has(`drop-block:${block.entryId}`))
      back.push({ kind: 'drop-block', ...shared });
    if (choice.shortBlocks.has(block.entryId) && !seen.has(`shorten-block:${block.entryId}`))
      back.push({ kind: 'shorten-block', minutes: SHORT_BLOCK_MIN, ...shared });
  }
  return { levers: [...levers, ...back], applied };
}

/**
 * One lever pressed, as a new choice.
 *
 * Two levers on one block are ALTERNATIVES rather than a stack — a block that
 * is gone is not also a block that is shorter — so taking one sets the other
 * down. Every press is its own inverse, which is what makes the step something
 * to try things in.
 */
export function toggleLever(input: FitInput, choice: FitChoice, lever: FitLever): FitChoice {
  const droppedBlocks = new Set(choice.droppedBlocks);
  const shortBlocks = new Set(choice.shortBlocks);

  if (lever.kind === 'drop-all-blocks') {
    const all = input.blocks.every((block) => droppedBlocks.has(block.entryId));
    for (const block of input.blocks) {
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

/** Cheapest change first, where two levers buy the same thing. */
const KIND_RANK: Record<FitLeverKind, number> = {
  'shorten-block': 0,
  'drop-block': 1,
  'drop-all-blocks': 2,
};

/**
 * Whether this day is worth asking about at all.
 *
 * The question only exists where something the visitor asked for does not fit.
 * A day that holds everything never sees the assistant — that is the common
 * case, and a dialog on the way to a button that would have done the right
 * thing is a dialog people learn to dismiss.
 */
export function needsFitHelp(input: FitInput, choice: FitChoice): boolean {
  const wanted = input.wishes.filter((wish) => !choice.dropped.has(wish.key)).length;
  return evaluateFit(input, choice).fitted.length < wanted;
}
