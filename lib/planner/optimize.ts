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
 * The one exception is a deliberate delay, and it needs no weight either. Idling
 * for `d` minutes and then queueing `w(t+d)` is **strictly better** than queueing
 * `w(t)` now whenever `d + w(t+d) < w(t)`: you ride the same ride, you queue
 * less, and you are free EARLIER. That inequality is the whole rule, it is why
 * the optimiser will happily send somebody for a coffee at 14:00 to ride Taron
 * at 15:00, and it can never make the plan longer.
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
 * Two hours is the width of the inequality above rather than a taste: a wait
 * this app has ever seen is under two hours, so a longer delay could never pay
 * for itself under `d + w(t+d) < w(t)` and the extra candidates would be
 * arithmetic with a known answer.
 */
export const MAX_DELAY_MIN = 120;

/**
 * How many partial plans the search carries forward at each step.
 *
 * A beam rather than an exact enumeration because the cost is time-dependent —
 * what a ride costs depends on when the rides before it finished — so the
 * subproblems Held–Karp needs do not exist.
 *
 * Measured against the truth rather than argued: on eight rides across four
 * lands with six different turning points, enumerating all 40,320 orders through
 * {@link scoreOrder} takes 1.66 s and settles on 172 queued minutes finishing at
 * 16:05. The beam plus the local search below reach the same 172 and the same
 * 16:05 in **8.2 ms**. `scripts/test-planner-optimize.mjs` keeps that comparison
 * at five and seven rides, where it is cheap enough for every run.
 *
 * At the sizes this is actually asked for it stays inside a click: 23 ms at ten
 * stops, 26 at fourteen, 32 at eighteen and 56 at the {@link MAX_STOPS} cap of
 * twenty-four. Europa-Park has thirteen headliners.
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

/** Stops past this are appended greedily. No park has this many headliners. */
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
}

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

/** Push a start past every fixed block it would run into. */
function clearFixed(start: number, span: number, fixed: readonly FixedBlock[]): number {
  let at = start;
  // Bounded by the number of fixed blocks: each pass can only move past one, and
  // they are sorted, so a second sweep is enough for the block a push landed in.
  for (let pass = 0; pass < fixed.length + 1; pass++) {
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
 * Where one ride goes, given the moment the visitor is free before it.
 *
 * The delay loop is the rule from the module docstring and nothing more: among
 * the starts from the earliest feasible one up to {@link MAX_DELAY_MIN} later,
 * take the one that leaves you free soonest. Ties go to the shorter queue, then
 * to the earlier start, so the answer does not depend on iteration order.
 */
function place(
  ctx: Context,
  candidate: Candidate,
  freeBefore: number | null,
  transferMinutes: number
): Placement {
  const { grid } = ctx;
  const earliest = freeBefore === null ? grid.openMin : freeBefore + transferMinutes;
  const first = snapUp(Math.max(earliest, candidate.floorMin), SNAP_MIN_FINE);

  let best: Placement | null = null;
  for (let delay = 0; delay <= MAX_DELAY_MIN; delay += SNAP_MIN_FINE) {
    const raw = first + delay;
    // Waiting into a closed park is never the better option, so the delay loop
    // stops at the gate. Arriving there is a different matter — see below.
    if (raw >= grid.closeMin) break;
    const hour = Math.floor(raw / 60);
    const span = candidate.occupiedByHour[Math.min(hour, 23)] ?? SNAP_MIN_FINE;
    const start = clearFixed(raw, span, ctx.fixed);
    if (start >= grid.closeMin) break;
    // The push past a fixed block can land in another hour, so the span is read
    // again rather than reused: a block that jumped lunch is queueing at 14:00.
    const finalHour = Math.min(Math.floor(start / 60), 23);
    const finalSpan = candidate.occupiedByHour[finalHour] ?? SNAP_MIN_FINE;
    const wait = candidate.waitByHour[finalHour] ?? null;
    const freeAt = start + finalSpan;
    const option: Placement = {
      startMinute: start,
      waitMinutes: wait,
      freeAt,
      fits: freeAt <= grid.closeMin,
    };
    if (
      best === null ||
      option.freeAt < best.freeAt ||
      (option.freeAt === best.freeAt &&
        (option.waitMinutes ?? Infinity) < (best.waitMinutes ?? Infinity)) ||
      (option.freeAt === best.freeAt &&
        (option.waitMinutes ?? Infinity) === (best.waitMinutes ?? Infinity) &&
        option.startMinute < best.startMinute)
    ) {
      best = option;
    }
  }

  if (best) return best;

  // Nothing fits before closing. The stop is still PLACED — the caller asked for
  // these rides and a silently dropped one is worse than a visible overflow —
  // and it is placed where the sequence would actually put it, PAST the gate,
  // rather than all of them parked on the park's last minute. `growGridForSpans`
  // widens the canvas to hold them and the minutes out there are hatched, so the
  // plan reads as "and these two do not fit" instead of as two blocks stacked in
  // lanes at 18:45 for no reason a visitor could see.
  const start = Math.max(first, grid.closeMin);
  const hour = Math.min(Math.floor(start / 60), 23);
  return {
    startMinute: start,
    // No figure out here, and that is `estimateFor`'s own answer: a queue joined
    // after closing is `outside-hours`, not a wait of zero.
    waitMinutes: candidate.waitByHour[hour] ?? null,
    freeAt: start + (candidate.occupiedByHour[hour] ?? SNAP_MIN_FINE),
    fits: false,
  };
}

interface Scored {
  stops: OptimizeStop[];
  totalWaitMinutes: number;
  endMinute: number;
  overflow: number;
}

/** The clock, the queue total and the overflow that one ORDER produces. */
function scheduleOrder(ctx: Context, order: readonly number[]): Scored {
  const stops: OptimizeStop[] = [];
  let freeAt: number | null = null;
  let previous = -1;
  let totalWaitMinutes = 0;
  let overflow = 0;

  for (const index of order) {
    const candidate = ctx.candidates[index];
    const transfer = previous < 0 ? 0 : ctx.transfer[previous][index];
    const placement = place(ctx, candidate, freeAt, transfer);
    stops.push({
      entryId: candidate.entryId,
      attractionSlug: candidate.slug,
      attractionName: candidate.name,
      startMinute: placement.startMinute,
      waitMinutes: placement.waitMinutes,
      fits: placement.fits,
    });
    if (placement.waitMinutes !== null) totalWaitMinutes += placement.waitMinutes;
    if (!placement.fits) overflow++;
    freeAt = placement.freeAt;
    previous = index;
  }

  return { stops, totalWaitMinutes, endMinute: freeAt ?? ctx.grid.openMin, overflow };
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
        const placement = place(
          ctx,
          ctx.candidates[index],
          label.last < 0 ? null : label.freeAt,
          transfer
        );
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

  const candidates: Candidate[] = [
    ...movable.map((entry) => {
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
    ...add.map((ride) => ({
      entryId: null,
      slug: ride.attractionSlug,
      name: ride.attractionName,
      ride,
      floorMin: rideFloor(grid, ride).softMin,
      ...tabulate(day, ride.attractionSlug),
    })),
  ].slice(0, MAX_STOPS);

  if (candidates.length < 2) return null;

  const transfer = candidates.map((from) =>
    candidates.map((to) => transferBetween(from.ride, to.ride).ceilingMinutes)
  );

  return { grid, candidates, fixed, transfer };
}

/**
 * The plan.
 *
 * Returns `null` where there is nothing to order — no day, no axis, no readable
 * wait times, fewer than two rides to arrange (one ride has exactly one order),
 * or a day that is already as good as this can make it.
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
   * every consecutive pair leaving at least the transfer's certifiable floor,
   * which is `legBetween`'s own `broken` test and the one claim in that model
   * that is provable rather than assumed. A day that fails it is not a plan to
   * be compared against; it is the thing being fixed.
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
    changed: true,
  };
}

/**
 * Whether the day as it stands could actually be walked.
 *
 * The gap between one ride's queue ending and the next one's starting has to
 * cover the transfer's FLOOR — out of the station, the ride itself, and the
 * straight-line distance at a brisk pace. That floor is a lower bound and
 * nothing more, which is exactly why it is the right test here: it is the one
 * verdict `leg.ts` calls certifiable, so a day this rejects is impossible rather
 * than merely uncomfortable.
 *
 * A block over a fixed one — a ride laid across the lunch break — fails for the
 * same reason: you cannot be in both.
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
    const wait = estimateFor(day, previous).wait ?? 0;
    const floor = transferBetween(from?.ride ?? null, to?.ride ?? null).floorMinutes;
    if (entry.startMinute - (previous.startMinute + wait) < floor) return false;
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
