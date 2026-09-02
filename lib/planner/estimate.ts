import type { PlanDay, PlanDayRide } from '@/lib/api/types';
import type { PlannerEntry } from './types';

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
   * Why there is no number, when there is none. `outside-hours` and `no-curve`
   * are different things to tell a visitor: one is "not while the park is shut",
   * the other is "we have never measured this ride's day".
   */
  missing: 'none' | 'no-day' | 'no-curve' | 'outside-hours';
}

const UNKNOWN: PlannerEstimate = {
  wait: null,
  uncertaintyMinutes: null,
  missing: 'no-day',
};

function rideOf(day: PlanDay, slug: string): PlanDayRide | undefined {
  return day.rides.find((r) => r.attractionSlug === slug);
}

/** The expected wait for one planned entry. */
export function estimateFor(day: PlanDay | null | undefined, entry: PlannerEntry): PlannerEstimate {
  if (!day) return UNKNOWN;

  const { openHour, closeHour } = day.context;
  if (openHour === null || closeHour === null) {
    return { wait: null, uncertaintyMinutes: null, missing: 'no-day' };
  }
  if (entry.hour < openHour || entry.hour > closeHour) {
    return { wait: null, uncertaintyMinutes: null, missing: 'outside-hours' };
  }

  const ride = rideOf(day, entry.attractionSlug);
  // A ride the API omitted: no measured hourly shape to scale, so it has no
  // curve rather than a flat one. The planner says so instead of drawing a bar.
  if (!ride) return { wait: null, uncertaintyMinutes: null, missing: 'no-curve' };

  const point = ride.hours.find((h) => h.hour === entry.hour);
  if (!point) return { wait: null, uncertaintyMinutes: null, missing: 'no-curve' };

  return {
    wait: point.wait,
    uncertaintyMinutes: ride.uncertaintyMinutes ?? null,
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

  for (const entry of entries) {
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

  return { expectedMinutes, counted, unknown, done, actualMinutes, actualCounted };
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
  return day.tier === 'measured' || typeof day.leadTimeMae === 'number';
}
