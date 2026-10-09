import type { PlanDay, PlanDayRide, PlanDayTier } from '@/lib/api/types';
import type { PlannerEntry } from './types';
import {
  DEFAULT_OCCUPIED_MINUTES,
  earlyEntryOpenMin,
  opensEarly,
  unfoldedCloseHour,
} from './day-grid';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { roundWaitDeltaTo5 } from '@/lib/utils/wait-time';

/**
 * What a planned entry is expected to cost, and how much that expectation is worth: the join
 * between a plan and the API's day payload, kept out of the components so its honesty rules can
 * be tested.
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
   * The typical error of this ride's own numbers, in minutes, or `null` where the backend has not
   * measured one. Not {@link uncertaintyMinutes}, the model's spread on this prediction, and never
   * merged with it. A typical error, not a bound, so it may be printed as a `±` but never as an
   * interval claimed to contain the answer.
   */
  expectedError: number | null;
  /**
   * Which regime this hour's figure came from, which is not always the day's: `/plan/day` sets
   * `hours[].source` only where an hour departs from the day's `tier`, as today's composed hours
   * do. The block's lower edge is drawn from this. `null` only where there is no day at all.
   */
  tier: PlanDayTier | null;
  /**
   * Why there is no number, when there is none. `outside-hours` ("not while the park is shut") and
   * `no-curve` ("never measured") are different things to tell a visitor.
   *
   * `assumed` and `early-entry` come with a figure, {@link ASSUMED_WAIT_MIN}, kept as their own
   * states so no surface tints an assumption like a forecast. Read both through
   * {@link isAssumedWait}.
   */
  missing:
    | 'none'
    | 'assumed'
    | 'early-entry'
    | 'no-day'
    | 'no-curve'
    | 'no-source'
    | 'outside-hours'
    | 'custom';
}

/**
 * Whether the figure is an assumption rather than a forecast — `assumed` or
 * `early-entry`. Every surface that withholds a crowd tint or prints a `~` asks
 * this, so a new assumed state cannot be tinted by one of them and not another.
 */
export function isAssumedWait(estimate: Pick<PlannerEstimate, 'missing'>): boolean {
  return estimate.missing === 'assumed' || estimate.missing === 'early-entry';
}

/**
 * What a ride with no curve is taken to cost, so it is not counted as zero in every total.
 *
 * Five because parks post waits in multiples of five, so it is the shortest queue that can be
 * posted, and the rides without a curve are the ones nobody queues for. Always marked where drawn
 * (`missing: 'assumed'`): no crowd tint, and a `~` before the figure.
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
 * A ride with no curve, at the day's own regime: the five minutes are an assumption either way,
 * and the edge still says which kind of day it is standing in.
 */
function assumed(day: PlanDay): PlannerEstimate {
  return {
    wait: ASSUMED_WAIT_MIN,
    // No band and no measured error: there is no model behind this.
    uncertaintyMinutes: null,
    expectedError: null,
    tier: day.tier ?? null,
    missing: 'assumed',
  };
}

/**
 * A park whose wait times nobody can read, at the day's own regime.
 *
 * Same payload shape as a measured ride with no history, opposite meaning: here no number will
 * ever arrive. So the flag is read through `noLiveWaitTimesReason`, never derived. See
 * docs/rules/parks-we-cannot-read.md.
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
  // The API is hourly, so a block carries its hour's figure; interpolating between two points
  // already rounded to five prints figures like 51 and 47. `startMinute` runs past 1440 on a park
  // closing after midnight, so the day's end is unfolded through the grid's own rule, never
  // restated here.
  const hour = Math.floor(entry.startMinute / 60);

  // Before the gates, on an early-entry day, for a ride that opens early: the assumption, marked as
  // such. Asked per hour, so the optimiser's hourly table and a block at :45 carry the same figure.
  if (hour < openHour && !entry.custom) {
    const early = earlyEntryOpenMin(day.context);
    if (
      early !== null &&
      hour >= Math.floor(early / 60) &&
      entry.attractionSlug &&
      opensEarly(rideOf(day, entry.attractionSlug), openHour * 60)
    ) {
      return {
        wait: ASSUMED_WAIT_MIN,
        uncertaintyMinutes: null,
        expectedError: null,
        tier: day.tier ?? null,
        missing: 'early-entry',
      };
    }
  }

  if (hour < openHour || hour > unfoldedCloseHour(openHour, closeHour)) {
    return {
      wait: null,
      uncertaintyMinutes: null,
      expectedError: null,
      tier: day.tier ?? null,
      missing: 'outside-hours',
    };
  }

  // A free block is a duration the visitor wrote down, not a ride: `no-curve` would claim we failed
  // to predict a queue that does not exist.
  if (entry.custom)
    return {
      wait: null,
      uncertaintyMinutes: null,
      expectedError: null,
      tier: day.tier ?? null,
      missing: 'custom',
    };

  const ride = entry.attractionSlug ? rideOf(day, entry.attractionSlug) : undefined;
  // A ride the API omitted, or an hour it has no point for, gets the assumption (see
  // `ASSUMED_WAIT_MIN`), except where the park has no readable source at all. See `noSource`.
  const readable = hasReadableWaitTimes(day.context);

  if (!ride) return readable ? assumed(day) : noSource(day);

  // Past midnight `hours[].hour` carries the unfolded hour (24 is midnight, 25 is 01:00), the axis
  // the grid uses, while `context.closeHour` stays the folded wall-clock hour.
  const point = ride.hours.find((h) => h.hour === hour);
  if (!point) return readable ? assumed(day) : noSource(day);

  // A look back has no spread and no error to print, whatever the ride carries.
  const lookBack = day.tier === 'climatology';
  return {
    wait: point.wait,
    uncertaintyMinutes: lookBack ? null : (ride.uncertaintyMinutes ?? null),
    expectedError: lookBack ? null : (ride.expectedError ?? null),
    // The HOUR's regime where it names one, the day's otherwise. `source` is set
    // only on the exceptions, so an absent one means "the day's tier" and never
    // "unknown".
    tier: point.source ?? day.tier ?? null,
    missing: 'none',
  };
}

/** The day's totals, as {@link totalsFor} sums them. */
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
 * The day's totals. Expected and actual minutes are kept apart: a total mixing predicted and
 * measured minutes would move for two reasons at once, and a visitor could not tell a busier day
 * from a longer plan.
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
    // A free block is neither a ride nor a forecast: not `unknown`, and its minutes are not
    // waiting.
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

/** How a ticked-off entry's queue compared with its forecast. */
export interface PlannerActualDelta {
  /**
   * Measured minus forecast, in minutes, on the five-minute grid. Positive is a
   * queue longer than the forecast, negative is shorter.
   */
  minutes: number;
  /**
   * Which way it went, and `same` where the grid says it did not go anywhere. Its own field rather
   * than the sign of {@link minutes}, so zero cannot print as "0 minutes over".
   */
  direction: 'over' | 'under' | 'same';
}

/**
 * What a ticked-off entry actually cost against what was forecast for its hour.
 *
 * `roundWaitDeltaTo5`, never `roundWaitTo5`: this is a difference, and the wait rule floors
 * everything under 2.5 to zero, which would swallow every queue shorter than forecast (see
 * `lib/utils/wait-time.ts`).
 *
 * `null` where there is nothing to compare: not ticked off or no recorded figure, no forecast for
 * the hour, or a forecast that is only {@link ASSUMED_WAIT_MIN}, since a difference against the
 * app's own floor is not a forecast error. No snapshot is stored, so moving a ticked-off entry to
 * another hour moves the figure it is compared with.
 */
export function actualVsEstimate(
  entry: PlannerEntry,
  estimate: PlannerEstimate
): PlannerActualDelta | null {
  if (!entry.done || typeof entry.actualWait !== 'number' || !Number.isFinite(entry.actualWait)) {
    return null;
  }
  if (estimate.wait === null || estimate.missing !== 'none') return null;

  const minutes = roundWaitDeltaTo5(entry.actualWait - estimate.wait);
  return {
    minutes,
    direction: minutes > 0 ? 'over' : minutes < 0 ? 'under' : 'same',
  };
}

/**
 * Whether the band may carry a figure at this distance.
 *
 * `uncertaintyMinutes` is honest at any tier, but the widening with distance has no figure until
 * the backend reports `leadTimeMae`, and `forecastError` may not be scaled into one (see
 * `RideDayCurve.forecastError` in lib/api/types.ts). So the band widens visually with distance
 * without a number attached.
 */
export function bandCarriesFigure(day: PlanDay | null | undefined): boolean {
  if (!day) return false;
  // An observed day has no band: a measurement has no spread, and the API sends
  // `uncertaintyMinutes: null` for every ride of it.
  if (day.tier === 'observed') return false;
  // A `climatology` day is a look back: no forecast error describes it, so no band carries a figure.
  if (day.tier === 'climatology') return false;
  return day.tier === 'measured' || typeof day.leadTimeMae === 'number';
}

/**
 * The two halves of a block's length, so the two readers below cannot drift.
 *
 * `planned` is what the entry is expected to cost; `band` is the model's own
 * spread on top of it, and it exists only for a forecast — a free block's
 * duration and a ridden entry's measured minutes are facts with no spread.
 */
function spanParts(
  day: PlanDay | null | undefined,
  entry: PlannerEntry,
  fallback: number
): { planned: number; band: number } {
  if (entry.custom) return { planned: entry.custom.durationMinutes, band: 0 };
  if (entry.done) return { planned: entry.actualWait ?? fallback, band: 0 };
  const estimate = estimateFor(day, entry);
  if (estimate.wait === null) return { planned: fallback, band: 0 };
  return { planned: estimate.wait, band: estimate.uncertaintyMinutes ?? 0 };
}

/**
 * How long an entry occupies the visitor, for drawing and for the gestures that work on what is
 * drawn: a free block's duration, a ridden entry's actual minutes, otherwise the forecast plus its
 * band. Shared so the ride search and the panel place a new ride after the same end.
 *
 * Not the grid's `MIN_BLOCK_PX` floor, which is about legibility. The optimiser schedules against
 * {@link plannedMinutes} instead.
 */
export function occupiedMinutes(
  day: PlanDay | null | undefined,
  entry: PlannerEntry,
  fallback = DEFAULT_OCCUPIED_MINUTES
): number {
  const { planned, band } = spanParts(day, entry, fallback);
  return planned + band;
}

/**
 * The same length with the band left off, what a plan is built on.
 *
 * The band is a half-width around the prediction, so scheduling all of it paces the day off the
 * pessimistic end of every queue, while the optimiser's costs read the bare wait. So the expected
 * wait plans the day and the block still draws the band: the next stop may start inside it.
 */
export function plannedMinutes(
  day: PlanDay | null | undefined,
  entry: PlannerEntry,
  fallback = DEFAULT_OCCUPIED_MINUTES
): number {
  return spanParts(day, entry, fallback).planned;
}

/** Where each entry starts and how long it is drawn, for the grid's placement and growth. */
export function spansFor(
  day: PlanDay | null | undefined,
  entries: readonly PlannerEntry[]
): { startMinute: number; spanMinutes: number }[] {
  return entries.map((entry) => ({
    startMinute: entry.startMinute,
    spanMinutes: occupiedMinutes(day, entry),
  }));
}
