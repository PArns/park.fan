import type { PlanDay, PlanDayRide, PlanDayTier } from '@/lib/api/types';
import type { PlannerEntry } from './types';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';

/**
 * What a planned entry is expected to cost, and how much that expectation is
 * worth.
 *
 * The join between a plan (a ride at an hour) and the API's day payload (a curve
 * per ride). Kept apart from the components because it is where the honesty
 * rules live, and those need testing rather than eyeballing.
 */
export interface PlannerEstimate {
  /** Expected wait in minutes at the planned hour, or null when unknown. */
  wait: number | null;
  /**
   * Half-width of the model's band in minutes. Null means the model reported no
   * spread — NOT a band of width zero, and it must not be drawn as one.
   */
  uncertaintyMinutes: number | null;
  /**
   * The typical error of this ride's own numbers, in minutes, or `null` where
   * the backend has not measured one.
   *
   * A different statement from {@link uncertaintyMinutes}, and the two must not
   * be merged or swapped: that one is the model's own spread on this
   * prediction, this one is how far its predictions have actually landed from
   * the days that then happened. It is a TYPICAL error and not a bound — half
   * the days fall further out — so it may be printed as a `±` beside the figure
   * and never as an interval that is claimed to contain the answer.
   */
  expectedError: number | null;
  /**
   * Which regime THIS hour's figure came from, which is not always the day's.
   *
   * `/plan/day` sets `hours[].source` only where an hour departs from the day's
   * `tier`, and today is exactly that case: 50 of Phantasialand's 254 hourly
   * points on 2026-09-04 are `composed` under a `measured` day, because the
   * 24-hour window the model measures does not cover the whole operating day.
   * The block's lower edge is drawn from this — a hard end for a measurement, a
   * fade for a composition — so reading the day's tier there would have drawn
   * fifty composed hours as if somebody had measured them.
   *
   * `null` only where there is no day at all.
   */
  tier: PlanDayTier | null;
  /**
   * Why there is no number, when there is none. `outside-hours` and `no-curve`
   * are different things to tell a visitor: one is "not while the park is shut",
   * the other is "we have never measured this ride's day".
   *
   * `assumed` is the one value that comes WITH a figure. It is the floor below,
   * carried as a separate state rather than folded into `none` so that every
   * surface can tell an assumption from a forecast — a block tints itself by
   * how busy it is, and a queue nobody measured has no business claiming a
   * colour.
   */
  missing: 'none' | 'assumed' | 'no-day' | 'no-curve' | 'no-source' | 'outside-hours' | 'custom';
}

/**
 * What a ride with no curve is taken to cost.
 *
 * The API omits a ride it has neither an hourly prediction nor a measured shape
 * for, and the planner used to answer that with an outlined box, no figure and
 * the sentence "für diese Bahn liegt keine Stundenkurve vor" — true, and useless
 * to somebody deciding whether the afternoon adds up, because the ride then
 * counted as zero in every total.
 *
 * Five minutes, and the number is not arbitrary: a park posts wait times in
 * multiples of five, so five is the shortest queue that can be posted at all,
 * and the rides this applies to are the ones nobody queues for — the flat rides
 * and walk-throughs the model never had enough observations to shape. It is the
 * smallest claim that is still a claim.
 *
 * It is marked wherever it is drawn (`missing: 'assumed'`): no crowd tint, and
 * the figure carries a `~`. An assumption that renders like a measurement is
 * the one thing this file exists to prevent.
 */
export const ASSUMED_WAIT_MIN = 5;

const UNKNOWN: PlannerEstimate = {
  wait: null,
  uncertaintyMinutes: null,
  expectedError: null,
  tier: null,
  missing: 'no-day',
};

/**
 * A ride with no curve, at the day's own regime.
 *
 * A function rather than a constant because the tier belongs to the day: the
 * five minutes are an assumption either way, and the edge still says which kind
 * of day it is standing in.
 */
function assumed(day: PlanDay): PlannerEstimate {
  return {
    wait: ASSUMED_WAIT_MIN,
    // No band and no measured error, because there is no model behind this to
    // have either.
    uncertaintyMinutes: null,
    expectedError: null,
    tier: day.tier ?? null,
    missing: 'assumed',
  };
}

/**
 * A park whose wait times nobody can read, at the day's own regime.
 *
 * The distinction this draws is the whole point. `assumed` and this land in the
 * same place — a ride the payload has no curve for — and mean opposite things.
 * `ASSUMED_WAIT_MIN` is for a ride with no HISTORY in a park that is measured:
 * five minutes is a placeholder for a queue somebody could in principle count.
 * Here there is no queue to count. Hansa-Park publishes its wait times only in
 * its own app on the park WLAN, so no number will ever arrive — and `/plan/day`
 * answers for it with `rides: []` and a drawn 11–21 axis, which is byte-for-byte
 * what a measured park with no history looks like.
 *
 * So the flag is read rather than derived, through the app's one reader
 * (`noLiveWaitTimesReason`), which treats an absent field as available: this
 * app deploys independently of the API, and a response predating the field must
 * behave exactly as it did before.
 */
function noSource(day: PlanDay): PlannerEstimate {
  return {
    wait: null,
    uncertaintyMinutes: null,
    expectedError: null,
    tier: day.tier ?? null,
    missing: 'no-source',
  };
}

function rideOf(day: PlanDay, slug: string): PlanDayRide | undefined {
  return day.rides.find((r) => r.attractionSlug === slug);
}

/** The expected wait for one planned entry. */
export function estimateFor(day: PlanDay | null | undefined, entry: PlannerEntry): PlannerEstimate {
  if (!day) return UNKNOWN;

  const { openHour, closeHour } = day.context;
  if (openHour === null || closeHour === null) {
    return {
      wait: null,
      uncertaintyMinutes: null,
      expectedError: null,
      tier: day.tier ?? null,
      missing: 'no-day',
    };
  }
  // The grid starts a block at any 15-minute step, and the API is hourly on both
  // tiers, so the figure a block carries is its HOUR's. Interpolating between
  // two points that are themselves already rounded to five is what printed 51,
  // 53 and 47 elsewhere in this app.
  const hour = Math.floor(entry.startMinute / 60);
  if (hour < openHour || hour > closeHour) {
    return {
      wait: null,
      uncertaintyMinutes: null,
      expectedError: null,
      tier: day.tier ?? null,
      missing: 'outside-hours',
    };
  }

  // A free block is not a ride and has no forecast — it is a duration the
  // visitor wrote down. `no-curve` would read as "we could not predict this",
  // which is a claim about a queue that does not exist.
  if (entry.custom)
    return {
      wait: null,
      uncertaintyMinutes: null,
      expectedError: null,
      tier: day.tier ?? null,
      missing: 'custom',
    };

  const ride = entry.attractionSlug ? rideOf(day, entry.attractionSlug) : undefined;
  // A ride the API omitted, or an hour it has no point for: no measured shape to
  // scale, so there is no curve rather than a flat one. Both are answered with
  // the assumption rather than with a shrug — see `ASSUMED_WAIT_MIN` — EXCEPT
  // where the park has no readable source at all, which is a different claim
  // wearing the same shape. See `noSource`.
  const readable = hasReadableWaitTimes(day.context);

  if (!ride) return readable ? assumed(day) : noSource(day);

  const point = ride.hours.find((h) => h.hour === hour);
  if (!point) return readable ? assumed(day) : noSource(day);

  return {
    wait: point.wait,
    uncertaintyMinutes: ride.uncertaintyMinutes ?? null,
    expectedError: ride.expectedError ?? null,
    // The HOUR's regime where it names one, the day's otherwise. `source` is set
    // only on the exceptions, so an absent one means "the day's tier" and never
    // "unknown".
    tier: point.source ?? day.tier ?? null,
    missing: 'none',
  };
}

export interface PlannerTotals {
  /** Minutes queued, summing what is known. */
  expectedMinutes: number;
  /** Entries that contributed a figure — the denominator for "known". */
  counted: number;
  /** Entries with no figure at all, for whatever reason. */
  unknown: number;
  /** Entries ticked off. */
  done: number;
  /**
   * Minutes actually queued, over the ticked-off entries that recorded a figure.
   * Separate from `expectedMinutes` on purpose: mixing a measured total with a
   * predicted one produces a number that is neither.
   */
  actualMinutes: number;
  /** Ticked-off entries that recorded a figure. */
  actualCounted: number;
  /** Free blocks in the day — counted, never predicted. */
  custom: number;
}

/**
 * The day's totals.
 *
 * Expected and actual are kept apart. Once a ride is ticked off its estimate
 * stops being the point, and a single "total wait" mixing predicted and measured
 * minutes would move for two different reasons at once — a visitor could not
 * tell a busier day from a longer plan.
 */
export function totalsFor(
  day: PlanDay | null | undefined,
  entries: readonly PlannerEntry[]
): PlannerTotals {
  let expectedMinutes = 0;
  let counted = 0;
  let unknown = 0;
  let done = 0;
  let actualMinutes = 0;
  let actualCounted = 0;
  let custom = 0;

  for (const entry of entries) {
    // A free block is not a ride and not a forecast. It must not land in
    // `unknown` — which would read as "we could not predict this" about a lunch
    // break nobody asked us to predict — and its minutes are not WAITING, which
    // is what `expectedMinutes` is labelled as.
    if (entry.custom) {
      custom++;
      continue;
    }

    if (entry.done) {
      done++;
      if (typeof entry.actualWait === 'number') {
        actualMinutes += entry.actualWait;
        actualCounted++;
      }
      // A ticked-off ride is not part of the expectation any more: what it cost
      // is known, and adding its estimate on top would count the visit twice.
      continue;
    }

    const estimate = estimateFor(day, entry);
    if (estimate.wait === null) {
      unknown++;
      continue;
    }
    expectedMinutes += estimate.wait;
    counted++;
  }

  return { expectedMinutes, counted, unknown, done, actualMinutes, actualCounted, custom };
}

/**
 * Whether the band may carry a figure at this distance.
 *
 * `uncertaintyMinutes` is the model's spread for the prediction it made, and it
 * is honest at any tier. What is NOT measured is how much worse the model gets
 * with distance: `leadTimeMae` is null until the backend's lead-time archive has
 * run long enough, and `forecastError`'s own docstring forbids fanning a band out
 * with the horizon "which nothing measures".
 *
 * So: show the figure where the model gave one, and widen visually with distance
 * without ever attaching a number to the widening.
 */
export function bandCarriesFigure(day: PlanDay | null | undefined): boolean {
  if (!day) return false;
  // An observed day has no band to carry a figure: the API sends
  // `uncertaintyMinutes: null` on every ride of it, because a measurement has no
  // spread. Saying so here rather than leaning on that keeps the two halves of
  // the statement in one place.
  if (day.tier === 'observed') return false;
  return day.tier === 'measured' || typeof day.leadTimeMae === 'number';
}

/**
 * The default a placement falls back to when nothing measured says otherwise.
 *
 * Not a claim about any ride — the number the grid itself uses for a block whose
 * wait is unknown, kept in one place so the search and the panel agree.
 */
export const DEFAULT_OCCUPIED_MINUTES = 45;

/**
 * How long an entry occupies the visitor, for placement arithmetic.
 *
 * The reason this exists: the ride search filed every existing entry as 45
 * minutes when it looked for the next free slot, so a lunch block dragged out to
 * 85 minutes was read as ending 40 minutes before it does, and the next ride was
 * placed inside it — landing in a second lane with a conflict ring on it, on the
 * very gesture the resize was made for. The panel's own custom-block path had
 * this right and the search did not, which is exactly the kind of disagreement a
 * shared function is for.
 *
 * A free block's duration IS its length; a ridden entry's is what it actually
 * cost; everything else is the forecast plus its own band, because a block is
 * drawn that tall and a placement that ignores the band overlaps what a reader
 * can see. It deliberately does NOT reproduce the grid's `MIN_BLOCK_PX` floor:
 * that floor is about a block staying legible at 1.2 px/min and says nothing
 * about how long somebody is busy.
 */
export function occupiedMinutes(
  day: PlanDay | null | undefined,
  entry: PlannerEntry,
  fallback = DEFAULT_OCCUPIED_MINUTES
): number {
  if (entry.custom) return entry.custom.durationMinutes;
  if (entry.done) return entry.actualWait ?? fallback;
  const estimate = estimateFor(day, entry);
  if (estimate.wait === null) return fallback;
  return estimate.wait + (estimate.uncertaintyMinutes ?? 0);
}
