import type { PlanDay, PlanDayRide } from '@/lib/api/types';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { type DayGrid, SNAP_MIN_FINE, rideFloor } from './day-grid';
import { estimateFor, occupiedMinutes } from './estimate';
import { transferBetween } from './leg';
import { partyFlags } from './party';
import type { PlannerDayPrefs, PlannerEntry } from './types';

/**
 * Ordering a day so it costs the least queueing.
 *
 * Everything here is pure and everything here is a decision somebody could
 * argue with, so each one is written down rather than buried in a weight.
 *
 * ## What is being minimised
 *
 * Three things, lexicographically, and the order between them is the whole
 * design:
 *
 * 1. **Rides that do not fit before the park closes.** A plan with one ride
 *    fewer that actually happens beats a plan with one more that does not.
 * 2. **Total minutes queued.** This is what a visitor feels and what they asked
 *    for.
 * 3. **The clock at which the last queue is joined.** Between two plans that
 *    cost the same, the one that leaves the evening free wins.
 *
 * There is no tunable weight anywhere in that, on purpose: a λ balancing "queue
 * minutes" against "hanging about" would be a number nobody could defend, and
 * the first person to disagree with it would be right.
 *
 * ## The schedule is contiguous, and that is what makes the search finite
 *
 * A ride starts as soon as the previous one lets go of you: its own start, plus
 * what the block occupies, plus the walk. So the only free variable is the
 * ORDER — the clock follows from it — and the search is over permutations
 * rather than over (permutation × start times).
 *
 * The one exception is a deliberate delay, and it needs no weight either.
 * Idling for `d` minutes and then queueing `w(t+d)` costs `w(t+d)` queued
 * minutes and leaves the visitor free at `t + d + w(t+d)`, so a delay trades
 * the second thing on that list against the third — and the list is what
 * settles it, rather than a second rule invented for the occasion.
 *
 * Which is why {@link placementsFor} hands back the PARETO FRONT over (queued
 * minutes, the clock) among the delay candidates rather than one winner. It
 * used to return the option that left the visitor free soonest, i.e. the third
 * criterion standing in for the second, and the two disagree: a ride costing 90
 * minutes before 11:00 and 20 after it was queued for at 09:45 because that
 * finished at 11:25 against 11:20. The plan a visitor would actually make —
 * fill the gap, ride it at 11:00, 70 minutes cheaper and five minutes later —
 * did not exist anywhere in the search space, so no amount of reordering could
 * reach it and the brute-force test could not see it missing either.
 *
 * The front is at most nine options wide ({@link MAX_DELAY_MIN} over 15-minute
 * steps) and is usually one or two: an equal wait later is dominated, so only a
 * FALLING queue buys an entry. `scheduleOrder` walks those fronts with a small
 * forward pass and keeps the completions that are not dominated, which is what
 * makes the choice of delay part of the plan rather than a fact about it.
 *
 * ## Rope drop is not a special case
 *
 * Nothing here knows the phrase. A headliner's curve is at its lowest in the
 * park's first hour and its floor (`rideFloor`) is the earliest somebody could
 * be queueing for it, so "the biggest ride first, at opening" is what
 * minimising the sum produces on a park where that is true — and is NOT what it
 * produces on a park where it is not. Taron's day is flat (60/60/54/53/59 by
 * hour) and Chiapas climbs 22 minutes; a hard-coded rope-drop rule would give
 * both the same advice.
 *
 * ## What it may not touch
 *
 * A ticked-off entry happened, and a free block is a decision — a lunch at 13:00
 * is not a queue to be shuffled. Both are FIXED: they keep their minute and the
 * rides are scheduled around them. Only undone ride entries move.
 *
 * ## Where it refuses
 *
 * A park with no readable wait times aggregates to nothing, so there is no
 * ordering to prefer and {@link canOptimize} says so. Offering the button there
 * would be a promise that pressing it changes something.
 */

/**
 * How long the optimiser may leave somebody standing about to let a queue fall.
 *
 * Two hours, and the reason for it changed with the rule above. While a delay
 * had to pay for itself on the CLOCK, anything longer than the longest queue
 * this app has ever seen could not: `d + w(t+d) < w(t)` was arithmetic with a
 * known answer past 120 minutes, and the extra candidates were free to leave
 * out. Weighed on queued minutes a longer delay can keep buying, so the ceiling
 * is now a judgement about the visitor rather than about the arithmetic — two
 * hours of standing about is the most this will ever propose, and past that it
 * stops being a plan somebody would follow.
 */
export const MAX_DELAY_MIN = 120;

/**
 * How many partial plans the search carries forward at each step.
 *
 * A beam rather than an exact enumeration because the cost is time-dependent —
 * what a ride costs depends on when the rides before it finished — so the
 * subproblems Held–Karp needs do not exist.
 *
 * Measured against the truth rather than argued, on an instance that is now in
 * the repo instead of in a sentence: eight rides across four lands with six
 * different turning points (`benchRides(8)` in
 * `scripts/test-planner-optimize.mjs`, §16). Enumerating all 40,320 orders
 * through {@link scoreOrder} takes **2.3–2.6 s** and settles on 244 queued
 * minutes finishing at 16:02. The beam plus the local search below reach the
 * same 244 and the same 16:02 in **2–6 ms**. That comparison runs on every
 * pass; the five- and seven-ride ones above it do too.
 *
 * At the sizes this is actually asked for it stays inside a click: median of
 * five runs, 5 ms at ten stops, 12 at fourteen, 24 at eighteen and 48 at the
 * {@link MAX_STOPS} cap of twenty-four (`BENCH=1 pnpm test:planner-optimize`
 * prints the table). Europa-Park has thirteen headliners. Branching over the
 * delay fronts rather than over one placement per ride cost about a tenth of
 * that, and only because the fronts are memoised per (ride, earliest start) —
 * without the cache the local search re-derives the same nine candidates
 * hundreds of thousands of times.
 */
export const BEAM_WIDTH = 192;

/**
 * Labels kept per (visited set, last ride).
 *
 * Two partial plans over the same rides ending on the same ride are only
 * comparable where one is worse at BOTH things that matter — queued minutes and
 * the clock — so the beam keeps a small Pareto front instead of the single best.
 * Dropping to one label costs real plans: a prefix half an hour ahead on the
 * clock is often worth five minutes more queueing, and it is the one that fits
 * the last headliner in before closing.
 */
const LABELS_PER_KEY = 4;

/**
 * Stops past this are dropped. No park has this many headliners.
 *
 * Not raisable on its own: `search` keeps the visited set in a bitmask, so
 * `1 << index` runs out of signed 32-bit room at 31 candidates, while the
 * `placed * 64` in its map key stops being injective at 63. A larger cap needs
 * both of those changed in the same edit.
 */
export const MAX_STOPS = 24;

/** How many improvement passes the local search may run before it gives up. */
const MAX_IMPROVE_PASSES = 40;

export interface OptimizeStop {
  /** The entry this stop is, or `null` for a ride the optimiser is adding. */
  entryId: string | null;
  attractionSlug: string;
  attractionName: string;
  startMinute: number;
  /** The wait the schedule was built on. `null` where the day has no figure. */
  waitMinutes: number | null;
  /** Whether this stop starts and ends inside the park's own hours. */
  fits: boolean;
}

export interface OptimizedPlan {
  stops: OptimizeStop[];
  /** Minutes queued across every stop that has a figure. */
  totalWaitMinutes: number;
  /** When the last queue is left, in park-local minutes. */
  endMinute: number;
  /** Stops that do not fit before the park closes. */
  overflow: number;
  /**
   * Rides that never reached the search because {@link MAX_STOPS} was full.
   *
   * Reported rather than swallowed: the cut used to happen inside a `slice` and
   * the bar above still counted what had been ASKED for, so eight headliners on
   * a twenty-ride day were announced as added and four of them were not there.
   */
  capped: number;
  /** False where the plan is the one that was already there. */
  changed: boolean;
}

export interface OptimizeInput {
  day: PlanDay | null | undefined;
  grid: DayGrid;
  entries: readonly PlannerEntry[];
  /** Rides to add on top of what the day already holds. */
  add?: readonly PlanDayRide[];
}

/**
 * Whether ordering this day could mean anything.
 *
 * Three ways it cannot, and they are different: no payload at all, no axis to
 * place anything on, and a park whose wait times nobody can read — where every
 * ride costs the same assumed nothing and any order is as good as any other.
 */
export function canOptimize(day: PlanDay | null | undefined, grid: DayGrid | null): boolean {
  if (!day || !grid) return false;
  if (!hasReadableWaitTimes(day.context)) return false;
  return day.rides.length > 0;
}

/**
 * The park's headliners that this day does not have and this party can ride.
 *
 * The CURATED `isHeadliner`, never the day's tallest bars: `dayPeak` says what
 * is busy, and a headliner having a quiet Tuesday is still the ride somebody
 * travelled for — the same rule `PlannerMissingHeadliners` states.
 *
 * The party filter DOES remove rides here, which is the one place in this app
 * where it may: everywhere else `partyFlags` flags and never hides, because the
 * visitor is the one who knows whether grandma is holding the bags. Here they
 * have pressed a button that says "plan the headliners for us", so a ride the
 * four-year-old cannot board is not one of them — and it stays one search away.
 */
export function headlinersToAdd(
  day: PlanDay | null | undefined,
  entries: readonly PlannerEntry[],
  prefs: PlannerDayPrefs | undefined
): PlanDayRide[] {
  if (!day) return [];
  const planned = new Set(
    entries.map((entry) => entry.attractionSlug).filter((slug): slug is string => Boolean(slug))
  );
  return day.rides.filter((ride) => {
    if (!ride.isHeadliner) return false;
    if (planned.has(ride.attractionSlug)) return false;
    const flags = partyFlags(ride, prefs);
    return !flags.tooShort && !flags.wet;
  });
}

/** Headliners this party cannot ride, so a caller can say how many were skipped. */
export function headlinersSkipped(
  day: PlanDay | null | undefined,
  entries: readonly PlannerEntry[],
  prefs: PlannerDayPrefs | undefined
): number {
  if (!day) return 0;
  const planned = new Set(
    entries.map((entry) => entry.attractionSlug).filter((slug): slug is string => Boolean(slug))
  );
  return day.rides.filter((ride) => {
    if (!ride.isHeadliner || planned.has(ride.attractionSlug)) return false;
    const flags = partyFlags(ride, prefs);
    return flags.tooShort || flags.wet;
  }).length;
}

// ── The model ───────────────────────────────────────────────────────────────

/** A minute range the optimiser may not schedule over. */
interface FixedBlock {
  from: number;
  to: number;
}

interface Candidate {
  entryId: string | null;
  slug: string;
  name: string;
  ride: PlanDayRide | null;
  /** Where a block for this ride may be filed — `rideFloor().softMin`. */
  floorMin: number;
  /** Expected wait per park-local hour, `null` where the day has no figure. */
  waitByHour: (number | null)[];
  /** What the block occupies at that hour — wait plus the model's own spread. */
  occupiedByHour: number[];
}

interface Context {
  grid: DayGrid;
  candidates: Candidate[];
  fixed: FixedBlock[];
  /** `transfer[i][j]` — minutes from candidate i to candidate j, ceiling. */
  transfer: number[][];
  /** Rides {@link MAX_STOPS} had no room for. Reported, never swallowed. */
  capped: number;
  /**
   * Placement fronts, keyed by candidate and earliest start.
   *
   * A front depends on nothing but those two — the delay loop reads the same
   * table for the same window every time — and the local search re-schedules
   * the same orders thousands of times, so this is the difference between the
   * front costing something and costing nothing. Per call, so it can never go
   * stale: a `Context` is built for one press and thrown away.
   */
  fronts: Map<number, Placement[]>;
}

/**
 * The cache key is `candidate * this + first`, so it is injective for as long as
 * `first` stays under it — which it does by a wide margin: a stop filed past
 * closing carries the sequence with it, and {@link MAX_STOPS} spans of the
 * longest queue this app has seen do not reach a day and a half. A `first`
 * beyond it skips the cache rather than sharing a key with another ride, so a
 * payload nobody has seen yet costs a recomputation instead of a wrong plan.
 */
const FRONT_KEY_STRIDE = 1 << 16;

function snapUp(minute: number, step: number): number {
  return Math.ceil(minute / step) * step;
}

/**
 * Every hour's answer, once, before the search starts.
 *
 * The search asks "what does this ride cost at that hour" hundreds of thousands
 * of times, and `estimateFor` walks `day.rides` to answer — forty entries per
 * call. Precomputed it is a table lookup, and the table is built by calling the
 * app's OWN estimator rather than a second copy of its rules, so the minutes the
 * optimiser reckons with are the minutes the block will draw.
 */
function tabulate(day: PlanDay, slug: string): Pick<Candidate, 'waitByHour' | 'occupiedByHour'> {
  const waitByHour: (number | null)[] = [];
  const occupiedByHour: number[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const probe: PlannerEntry = { id: '', attractionSlug: slug, startMinute: hour * 60 };
    waitByHour.push(estimateFor(day, probe).wait);
    occupiedByHour.push(Math.max(occupiedMinutes(day, probe), SNAP_MIN_FINE));
  }
  return { waitByHour, occupiedByHour };
}

/**
 * Push a start past every fixed block it would run into.
 *
 * It takes the span as a FUNCTION of the minute rather than as a number, and
 * that is the whole fix: a push lands in another hour, where the same ride can
 * occupy a different amount of time, and the caller used to re-read the span
 * afterwards without ever asking again whether the longer block still cleared
 * everything. A ride worth 20 minutes at 13:00 and 90 from 14:00, pushed out of
 * a 13:00 lunch, came back 90 minutes long and lay straight across the 15:00
 * parade — the one thing this file promises not to do.
 *
 * So the span is re-read at the top of every pass, and the loop exits only on a
 * pass that moved nothing, which is a pass that checked the FINAL span against
 * every block. It terminates because `at` only ever moves forward and only ever
 * to the far side of a block it overlapped, so no block can be jumped twice.
 */
function clearFixed(
  start: number,
  spanAt: (minute: number) => number,
  fixed: readonly FixedBlock[]
): number {
  let at = start;
  for (let pass = 0; pass < fixed.length + 1; pass++) {
    const span = spanAt(at);
    let moved = false;
    for (const block of fixed) {
      if (at < block.to && at + span > block.from) {
        at = snapUp(block.to, SNAP_MIN_FINE);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return at;
}

interface Placement {
  startMinute: number;
  waitMinutes: number | null;
  freeAt: number;
  fits: boolean;
}

/**
 * Every placement of one ride worth considering, given when the visitor is free.
 *
 * The delay loop from the module docstring, kept whole instead of collapsed to
 * a winner: among the starts from the earliest feasible one up to
 * {@link MAX_DELAY_MIN} later, the ones that are not beaten on BOTH queued
 * minutes and the clock. Sorted by the clock, so the front reads as a staircase
 * — later and cheaper, later and cheaper — and the first entry is always the
 * option that goes now.
 *
 * The alternative that was there before, "take the start that leaves you free
 * soonest, and let the queue decide ties", is a smaller thing than it looks: it
 * makes the third criterion outrank the second, and it does so INSIDE the
 * scheduler, where neither the beam nor the local search nor the brute-force
 * test can see it. See the module docstring for the case it got wrong.
 */
function placementsFrom(ctx: Context, candidate: Candidate, first: number): Placement[] {
  const { grid } = ctx;
  const spanAt = (minute: number) =>
    candidate.occupiedByHour[Math.min(Math.floor(minute / 60), 23)] ?? SNAP_MIN_FINE;

  const options: Placement[] = [];
  for (let delay = 0; delay <= MAX_DELAY_MIN; delay += SNAP_MIN_FINE) {
    const raw = first + delay;
    // Waiting into a closed park is never the better option, so the delay loop
    // stops at the gate. Arriving there is a different matter — see below.
    if (raw >= grid.closeMin) break;
    const start = clearFixed(raw, spanAt, ctx.fixed);
    if (start >= grid.closeMin) break;
    // The push past a fixed block can land in another hour, and `clearFixed`
    // has already taken that into account; this reads the settled figures off
    // the minute it actually chose.
    const hour = Math.min(Math.floor(start / 60), 23);
    const freeAt = start + spanAt(start);
    options.push({
      startMinute: start,
      waitMinutes: candidate.waitByHour[hour] ?? null,
      freeAt,
      fits: freeAt <= grid.closeMin,
    });
  }

  if (options.length === 0) {
    // Nothing fits before closing. The stop is still PLACED — the caller asked
    // for these rides and a silently dropped one is worse than a visible
    // overflow — and it is placed where the sequence would actually put it,
    // PAST the gate, rather than all of them parked on the park's last minute.
    // `growGridForSpans` widens the canvas to hold them and the minutes out
    // there are hatched, so the plan reads as "and these two do not fit"
    // instead of as two blocks stacked in lanes at 18:45 for no reason a
    // visitor could see.
    const start = Math.max(first, grid.closeMin);
    const hour = Math.min(Math.floor(start / 60), 23);
    return [
      {
        startMinute: start,
        // No figure out here, and that is `estimateFor`'s own answer: a queue
        // joined after closing is `outside-hours`, not a wait of zero.
        waitMinutes: candidate.waitByHour[hour] ?? null,
        freeAt: start + (candidate.occupiedByHour[hour] ?? SNAP_MIN_FINE),
        fits: false,
      },
    ];
  }

  // `fits` needs no dimension of its own: it is `freeAt <= closeMin`, so an
  // option that beats another on the clock already fits at least as well.
  options.sort(
    (a, b) => a.freeAt - b.freeAt || waitCost(a) - waitCost(b) || a.startMinute - b.startMinute
  );
  const front: Placement[] = [];
  let cheapest = Infinity;
  for (const option of options) {
    const wait = waitCost(option);
    if (wait >= cheapest) continue;
    cheapest = wait;
    front.push(option);
  }
  return front;
}

/**
 * What a stop costs the queue total, which is what `null` has to mean here.
 *
 * `scheduleOrder` adds nothing for a stop with no figure, so the front has to
 * rank it the same way or the two would disagree about which option is cheaper.
 */
function waitCost(placement: Placement): number {
  return placement.waitMinutes ?? 0;
}

/** {@link placementsFrom}, addressed by the state the search is actually in. */
function placementsFor(
  ctx: Context,
  index: number,
  freeBefore: number | null,
  transferMinutes: number
): Placement[] {
  const candidate = ctx.candidates[index];
  const earliest = freeBefore === null ? ctx.grid.openMin : freeBefore + transferMinutes;
  const first = snapUp(Math.max(earliest, candidate.floorMin), SNAP_MIN_FINE);

  if (first >= FRONT_KEY_STRIDE) return placementsFrom(ctx, candidate, first);

  const key = index * FRONT_KEY_STRIDE + first;
  const cached = ctx.fronts.get(key);
  if (cached) return cached;
  const front = placementsFrom(ctx, candidate, first);
  ctx.fronts.set(key, front);
  return front;
}

interface Scored {
  stops: OptimizeStop[];
  totalWaitMinutes: number;
  endMinute: number;
  overflow: number;
}

/**
 * How many part-built schedules the fixed-order pass carries between stops.
 *
 * Four, the same as {@link LABELS_PER_KEY} and for the same reason: the states
 * kept are the ones no other state beats on all three counts at once, and past
 * a handful of those the extra ones are variations on a plan that is already
 * losing. It is a beam and not an exact DP because a delay is bounded relative
 * to when the visitor gets free, so arriving earlier does not strictly dominate
 * arriving later — it moves the whole two-hour window with it.
 */
const SCHEDULE_STATES = 4;

/** One order, part-scheduled: the delays chosen so far and what they cost. */
interface PartialSchedule {
  stops: OptimizeStop[];
  totalWaitMinutes: number;
  overflow: number;
  /** When the visitor is free after the last stop. `null` before the first. */
  freeAt: number | null;
}

function comparePartials(a: PartialSchedule, b: PartialSchedule): number {
  if (a.overflow !== b.overflow) return a.overflow - b.overflow;
  if (a.totalWaitMinutes !== b.totalWaitMinutes) return a.totalWaitMinutes - b.totalWaitMinutes;
  const aFree = a.freeAt ?? 0;
  const bFree = b.freeAt ?? 0;
  if (aFree !== bFree) return aFree - bFree;
  // Two schedules that cost the same and end at the same minute are still two
  // different plans, and which of them is printed may not depend on the order
  // the states happened to be built in.
  return (a.stops.at(-1)?.startMinute ?? 0) - (b.stops.at(-1)?.startMinute ?? 0);
}

function partialDominates(a: PartialSchedule, b: PartialSchedule): boolean {
  const aFree = a.freeAt ?? 0;
  const bFree = b.freeAt ?? 0;
  return (
    a.overflow <= b.overflow &&
    a.totalWaitMinutes <= b.totalWaitMinutes &&
    aFree <= bFree &&
    (a.overflow < b.overflow || a.totalWaitMinutes < b.totalWaitMinutes || aFree < bFree)
  );
}

/**
 * The clock, the queue total and the overflow that one ORDER produces.
 *
 * A forward pass rather than a single sweep, because an order no longer settles
 * a plan: each stop offers a front of delays (see {@link placementsFrom}) and
 * the cheapest completion is not made of the cheapest steps — waiting an hour
 * for a queue to fall is only worth it if what follows still fits. So the pass
 * carries the part-built schedules that nothing else beats outright and picks
 * the best finished one under the very ordering {@link better} uses, which is
 * what stops the scheduler from having an objective of its own.
 */
function scheduleOrder(ctx: Context, order: readonly number[]): Scored {
  let states: PartialSchedule[] = [{ stops: [], totalWaitMinutes: 0, overflow: 0, freeAt: null }];
  let previous = -1;

  for (const index of order) {
    const candidate = ctx.candidates[index];
    const transfer = previous < 0 ? 0 : ctx.transfer[previous][index];
    const grown: PartialSchedule[] = [];
    for (const state of states) {
      for (const placement of placementsFor(ctx, index, state.freeAt, transfer)) {
        grown.push({
          stops: [
            ...state.stops,
            {
              entryId: candidate.entryId,
              attractionSlug: candidate.slug,
              attractionName: candidate.name,
              startMinute: placement.startMinute,
              waitMinutes: placement.waitMinutes,
              fits: placement.fits,
            },
          ],
          totalWaitMinutes: state.totalWaitMinutes + (placement.waitMinutes ?? 0),
          overflow: state.overflow + (placement.fits ? 0 : 1),
          freeAt: placement.freeAt,
        });
      }
    }

    // Sorted first, so a state can only ever be dropped by one already kept —
    // nothing later in this order can dominate anything earlier in it.
    grown.sort(comparePartials);
    const kept: PartialSchedule[] = [];
    for (const state of grown) {
      if (kept.some((other) => partialDominates(other, state))) continue;
      kept.push(state);
      if (kept.length === SCHEDULE_STATES) break;
    }
    states = kept;
    previous = index;
  }

  const best = states[0];
  if (!best) return { stops: [], totalWaitMinutes: 0, endMinute: ctx.grid.openMin, overflow: 0 };
  return {
    stops: best.stops,
    totalWaitMinutes: best.totalWaitMinutes,
    endMinute: best.freeAt ?? ctx.grid.openMin,
    overflow: best.overflow,
  };
}

/** Lexicographic: fits first, then queued minutes, then the clock. */
function better(a: Scored, b: Scored): boolean {
  if (a.overflow !== b.overflow) return a.overflow < b.overflow;
  if (a.totalWaitMinutes !== b.totalWaitMinutes) return a.totalWaitMinutes < b.totalWaitMinutes;
  return a.endMinute < b.endMinute;
}

interface Label {
  placed: number;
  last: number;
  order: number[];
  freeAt: number;
  totalWait: number;
  overflow: number;
}

function dominates(a: Label, b: Label): boolean {
  return (
    a.overflow <= b.overflow &&
    a.totalWait <= b.totalWait &&
    a.freeAt <= b.freeAt &&
    (a.overflow < b.overflow || a.totalWait < b.totalWait || a.freeAt < b.freeAt)
  );
}

/**
 * The order search.
 *
 * A beam over prefixes with a small Pareto front per (visited set, last ride).
 * Deterministic end to end — the tie-breaks below run down to the candidate's
 * own index — because a button that reshuffles a plan differently every time it
 * is pressed is not an optimiser, it is a dice roll.
 */
function search(ctx: Context, beamWidth: number): number[] {
  const n = ctx.candidates.length;
  if (n === 0) return [];

  let beam: Label[] = [{ placed: 0, last: -1, order: [], freeAt: 0, totalWait: 0, overflow: 0 }];

  for (let step = 0; step < n; step++) {
    const grown: Label[] = [];
    for (const label of beam) {
      for (let index = 0; index < n; index++) {
        if (label.placed & (1 << index)) continue;
        const transfer = label.last < 0 ? 0 : ctx.transfer[label.last][index];
        // Every worthwhile delay for this ride is a branch of its own, so the
        // beam chooses when to queue as well as in which order.
        for (const placement of placementsFor(
          ctx,
          index,
          label.last < 0 ? null : label.freeAt,
          transfer
        )) {
          grown.push({
            placed: label.placed | (1 << index),
            last: index,
            order: [...label.order, index],
            freeAt: placement.freeAt,
            totalWait: label.totalWait + (placement.waitMinutes ?? 0),
            overflow: label.overflow + (placement.fits ? 0 : 1),
          });
        }
      }
    }

    // Pareto front per state, capped — see LABELS_PER_KEY.
    const byKey = new Map<number, Label[]>();
    for (const label of grown) {
      const key = label.placed * 64 + (label.last + 1);
      const kept = byKey.get(key);
      if (!kept) {
        byKey.set(key, [label]);
        continue;
      }
      if (kept.some((other) => dominates(other, label))) continue;
      const survivors = kept.filter((other) => !dominates(label, other));
      survivors.push(label);
      survivors.sort(compareLabels);
      byKey.set(key, survivors.slice(0, LABELS_PER_KEY));
    }

    beam = [...byKey.values()].flat().sort(compareLabels).slice(0, beamWidth);
  }

  return beam[0]?.order ?? [];
}

function compareLabels(a: Label, b: Label): number {
  if (a.overflow !== b.overflow) return a.overflow - b.overflow;
  if (a.totalWait !== b.totalWait) return a.totalWait - b.totalWait;
  if (a.freeAt !== b.freeAt) return a.freeAt - b.freeAt;
  // The last tie-break is the order itself, so two runs cannot disagree.
  for (let i = 0; i < Math.min(a.order.length, b.order.length); i++) {
    if (a.order[i] !== b.order[i]) return a.order[i] - b.order[i];
  }
  return a.order.length - b.order.length;
}

/**
 * Or-opt and 2-opt until nothing improves.
 *
 * The beam is good at prefixes and blind to a swap two thirds of the way along,
 * which is exactly what a local search fixes. It accepts only a STRICT
 * improvement under {@link better}, so it terminates, and it sweeps in a fixed
 * order, so it terminates at the same place every time.
 */
function improve(ctx: Context, order: readonly number[]): number[] {
  let best = [...order];
  let bestScore = scheduleOrder(ctx, best);

  for (let pass = 0; pass < MAX_IMPROVE_PASSES; pass++) {
    let moved = false;

    // Or-opt: take one stop out and put it back somewhere else.
    for (let from = 0; from < best.length && !moved; from++) {
      for (let to = 0; to < best.length && !moved; to++) {
        if (from === to) continue;
        const next = [...best];
        const [stop] = next.splice(from, 1);
        next.splice(to, 0, stop);
        const score = scheduleOrder(ctx, next);
        if (better(score, bestScore)) {
          best = next;
          bestScore = score;
          moved = true;
        }
      }
    }

    // 2-opt: reverse a run, which is what untangles a route that crosses itself.
    for (let i = 0; i < best.length - 1 && !moved; i++) {
      for (let j = i + 1; j < best.length && !moved; j++) {
        const next = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
        const score = scheduleOrder(ctx, next);
        if (better(score, bestScore)) {
          best = next;
          bestScore = score;
          moved = true;
        }
      }
    }

    if (!moved) break;
  }

  return best;
}

/** Everything the search needs, precomputed once. */
function buildContext(input: OptimizeInput): Context | null {
  const { day, grid, entries, add = [] } = input;
  if (!canOptimize(day, grid) || !day) return null;

  // Fixed: a ticked-off entry happened, and a free block is a decision.
  const fixed: FixedBlock[] = entries
    .filter((entry) => entry.done || entry.custom)
    .map((entry) => ({
      from: entry.startMinute,
      to: entry.startMinute + Math.max(occupiedMinutes(day, entry), SNAP_MIN_FINE),
    }))
    .sort((a, b) => a.from - b.from);

  const movable = entries.filter((entry) => !entry.done && !entry.custom && entry.attractionSlug);

  const rideOf = (slug: string) => day.rides.find((r) => r.attractionSlug === slug) ?? null;

  /**
   * The {@link MAX_STOPS} budget, split BEFORE the cut rather than by it.
   *
   * `[...movable, ...add].slice(0, MAX_STOPS)` made the same split silently and
   * made the caller unable to see it: twenty planned rides plus eight
   * headliners kept four of the eight while the bar underneath announced all
   * eight, and the "minutes saved" it printed compared a before-figure over
   * every entry against an after-figure over twenty-four of them.
   *
   * Existing entries are still served first, and that is not seniority. A
   * movable entry left out of the search does not politely stand aside:
   * `applyPlan` never removes anything, so it keeps its old minute while the
   * new plan is laid over it, in lanes, with a conflict ring. A headliner that
   * misses the cut is merely not added, and is one press away. Serving `add`
   * first — the obvious alternative, since the visitor just asked for it —
   * buys the eight headliners by orphaning four rides the visitor already had.
   */
  const movableKept = movable.slice(0, MAX_STOPS);
  const addKept = add.slice(0, MAX_STOPS - movableKept.length);
  const capped = movable.length - movableKept.length + (add.length - addKept.length);

  const candidates: Candidate[] = [
    ...movableKept.map((entry) => {
      const slug = entry.attractionSlug as string;
      const ride = rideOf(slug);
      return {
        entryId: entry.id,
        slug,
        name: entry.attractionName ?? ride?.attractionName ?? slug,
        ride,
        floorMin: rideFloor(grid, ride).softMin,
        ...tabulate(day, slug),
      };
    }),
    ...addKept.map((ride) => ({
      entryId: null,
      slug: ride.attractionSlug,
      name: ride.attractionName,
      ride,
      floorMin: rideFloor(grid, ride).softMin,
      ...tabulate(day, ride.attractionSlug),
    })),
  ];

  // One candidate is a real question and used to be refused as though it were
  // not: "plan every headliner" on a day missing exactly one asked for one ride
  // to be placed, and the button answered "already in the right order" without
  // adding it. There is only one order, but there is still a floor, a fixed
  // block to clear and a delay worth considering.
  if (candidates.length === 0) return null;

  const transfer = candidates.map((from) =>
    candidates.map((to) => transferBetween(from.ride, to.ride).ceilingMinutes)
  );

  return { grid, candidates, fixed, transfer, capped, fronts: new Map() };
}

/**
 * The plan.
 *
 * Returns `null` where there is nothing to order — no day, no axis, no readable
 * wait times, not one ride to arrange, or a day that is already as good as this
 * can make it.
 */
export function optimizeDay(input: OptimizeInput): OptimizedPlan | null {
  const ctx = buildContext(input);
  if (!ctx) return null;
  const add = input.add ?? [];

  const found = improve(ctx, search(ctx, BEAM_WIDTH));
  const scored = scheduleOrder(ctx, found);

  /**
   * What the new plan has to beat, and both obvious answers are wrong.
   *
   * Scoring the current SEQUENCE through `scheduleOrder` asks "is this the best
   * order" when the button says "plan for the least time": a day whose three
   * rides sit at 10:00, 13:00 and 16:00 in the right sequence has two hours of
   * nothing in it and came out already optimal, so the button did nothing on
   * exactly the plan that most needed it. `check:planner` found that by pressing
   * it on a seeded day and getting the same three minutes back.
   *
   * Scoring the day where the blocks actually ARE has the opposite fault: five
   * 150-minute queues filed thirty minutes apart score better than any real
   * schedule, because nobody can stand in two queues at once. An impossible day
   * is not an incumbent.
   *
   * So the incumbent is the day as it stands AND only where it is executable —
   * every consecutive pair leaving, after the block itself, at least the
   * transfer's certifiable floor, which is the one claim in `leg.ts`'s model
   * that is provable rather than assumed. A day that fails it is not a plan to
   * be compared against; it is the thing being fixed. What "after the block"
   * means is {@link isExecutable}'s own paragraph, and it is not the same thing
   * as the queue ending.
   *
   * Pressing twice is still a no-op, and now for the right reason: after the
   * first press the day IS the schedule, so the two scores agree.
   *
   * Only with nothing being ADDED. A day gaining eight headliners is longer by
   * construction and has no incumbent to beat.
   */
  let changed = true;
  if (add.length === 0 && isExecutable(input, ctx)) {
    const current = scoreCurrent(input);
    if (current && !better(scored, current)) changed = false;
  }

  if (!changed) return null;

  return {
    stops: scored.stops,
    totalWaitMinutes: scored.totalWaitMinutes,
    endMinute: scored.endMinute,
    overflow: scored.overflow,
    capped: ctx.capped,
    changed: true,
  };
}

/**
 * Whether the day as it stands could actually be walked.
 *
 * The gap between one block ending and the next one starting has to cover the
 * transfer's FLOOR — out of the station, the ride itself, and the straight-line
 * distance at a brisk pace. That floor is a lower bound and nothing more, which
 * is exactly why it is the right test here: it is the one verdict `leg.ts`
 * calls certifiable, so a day this rejects is impossible rather than merely
 * uncomfortable.
 *
 * A block over a fixed one — a ride laid across the lunch break — fails for the
 * same reason: you cannot be in both.
 *
 * What a block ENDS is `occupiedMinutes`, not the queue: the wait plus the
 * model's own spread, which is the height the block is drawn at and the span
 * `place` reserves for every stop it files. Measuring the incumbent against the
 * bare wait instead measured it against something nothing in this app ever
 * draws — two blocks 40 minutes apart, each 55 minutes tall, overlapped by a
 * quarter of an hour on the axis and passed as executable, so the bar answered
 * "already in the right order" in precisely the case it exists for. It is no
 * longer `legBetween`'s `broken` rule to the letter, and that is deliberate:
 * the incumbent has to be judged by what the optimiser would have to produce to
 * replace it.
 */
function isExecutable(input: OptimizeInput, ctx: Context): boolean {
  const { day } = input;
  if (!day) return false;

  const stops = input.entries
    .filter((entry) => !entry.done && !entry.custom && entry.attractionSlug)
    .sort((a, b) => a.startMinute - b.startMinute);

  for (let i = 0; i < stops.length; i++) {
    const entry = stops[i];
    const span = Math.max(occupiedMinutes(day, entry), SNAP_MIN_FINE);
    for (const block of ctx.fixed) {
      if (entry.startMinute < block.to && entry.startMinute + span > block.from) return false;
    }
    if (i === 0) continue;
    const previous = stops[i - 1];
    const from = ctx.candidates.find((c) => c.entryId === previous.id);
    const to = ctx.candidates.find((c) => c.entryId === entry.id);
    const occupied = Math.max(occupiedMinutes(day, previous), SNAP_MIN_FINE);
    const floor = transferBetween(from?.ride ?? null, to?.ride ?? null).floorMinutes;
    if (entry.startMinute - (previous.startMinute + occupied) < floor) return false;
  }

  return true;
}

/**
 * What one named sequence would cost, scheduled by the same rules.
 *
 * The optimiser's own scorer, addressable from outside: `optimizeDay` answers
 * "which order is best" and this answers "what would THIS order cost", which is
 * a different question and the one a check has to ask. It is what
 * `scripts/test-planner-optimize.mjs` brute-forces every permutation through —
 * a comparison against a plan produced by the search itself would be the search
 * marking its own homework.
 */
export function scoreOrder(
  input: OptimizeInput,
  slugs: readonly string[]
): { totalWaitMinutes: number; endMinute: number; overflow: number } | null {
  const ctx = buildContext(input);
  if (!ctx) return null;
  const order: number[] = [];
  for (const slug of slugs) {
    const index = ctx.candidates.findIndex(
      (candidate) => candidate.slug === slug && !order.includes(ctx.candidates.indexOf(candidate))
    );
    if (index < 0) return null;
    order.push(index);
  }
  const scored = scheduleOrder(ctx, order);
  return {
    totalWaitMinutes: scored.totalWaitMinutes,
    endMinute: scored.endMinute,
    overflow: scored.overflow,
  };
}

/**
 * The same day scored as it stands, for a before-and-after a caller can print.
 *
 * Not the sum of the blocks' own figures: those come from where the entries
 * ARE, which is the same thing, and going through the scorer means the two
 * numbers a visitor is shown were produced by one function rather than two.
 */
export function scoreCurrent(input: OptimizeInput): Scored | null {
  const { day, grid, entries } = input;
  if (!canOptimize(day, grid) || !day) return null;

  const movable = entries
    .filter((entry) => !entry.done && !entry.custom && entry.attractionSlug)
    .sort((a, b) => a.startMinute - b.startMinute);
  if (movable.length === 0) return null;

  let totalWaitMinutes = 0;
  let overflow = 0;
  let endMinute = grid.openMin;
  const stops: OptimizeStop[] = [];

  for (const entry of movable) {
    const estimate = estimateFor(day, entry);
    const span = Math.max(occupiedMinutes(day, entry), SNAP_MIN_FINE);
    const freeAt = entry.startMinute + span;
    if (estimate.wait !== null) totalWaitMinutes += estimate.wait;
    if (freeAt > grid.closeMin) overflow++;
    endMinute = Math.max(endMinute, freeAt);
    stops.push({
      entryId: entry.id,
      attractionSlug: entry.attractionSlug as string,
      attractionName: entry.attractionName ?? (entry.attractionSlug as string),
      startMinute: entry.startMinute,
      waitMinutes: estimate.wait,
      fits: freeAt <= grid.closeMin,
    });
  }

  return { stops, totalWaitMinutes, endMinute, overflow };
}
