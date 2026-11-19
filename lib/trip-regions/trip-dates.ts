import { addDays, daysBetween } from '@/lib/utils/park-day';
import {
  MAX_DAYS_AHEAD,
  normalizePlanState,
  type PlanSearchRange,
  type TripPlanState,
} from './plan-query';
import type { TripCalendarDay } from './types';

/**
 * A trip's dates against the region's today (`tripRegionToday`, or the planner's `today`), never
 * the server's or the browser's raw clock: a trip under way or over is caught before any request,
 * since the API answers it with `400 window_in_past`; a search period that has begun searches from
 * today; and the dates step's suggestion of the quietest week ahead. Pure, so
 * `scripts/test-orlando-plan.mjs` pins it. docs/features/orlando-planner.md#honest-states.
 */

/** A trip that began before today: still under way (`started`), or over (`ended`). */
export type PastTrip = 'started' | 'ended';

/** Whether a trip began before `today`, and whether it is over; `null` for a trip ahead. */
export function pastTrip(
  state: Pick<TripPlanState, 'from' | 'to'>,
  today: string
): PastTrip | null {
  if (!state.from || !state.to || state.from >= today) return null;
  return state.to < today ? 'ended' : 'started';
}

/**
 * The rest of a trip under way, from today to its last day, with every other answer kept; pins
 * before today go. A trip that is over or still ahead stays as it is.
 */
export function planFromToday(state: TripPlanState, today: string): TripPlanState {
  if (pastTrip(state, today) !== 'started') return state;
  return normalizePlanState({ ...state, from: today });
}

/** The search the When mode opens on: the next twelve months. */
export function defaultSearchRange(today: string): PlanSearchRange {
  return { from: today, to: addDays(today, MAX_DAYS_AHEAD) };
}

/**
 * A When search as it can still be asked: a period that began before today starts today, and one
 * whose rest is shorter than the trip searches the next twelve months, as a new search does.
 */
export function searchFromToday(
  range: PlanSearchRange,
  days: number,
  today: string
): PlanSearchRange {
  if (range.from >= today) return range;
  if (range.to >= today && daysBetween(today, range.to) + 1 >= days) {
    return { from: today, to: range.to };
  }
  return defaultSearchRange(today);
}

/** The suggested week, arrival and departure included. */
export const QUIET_WEEK_DAYS = 7;

/** How many first days the suggestion weighs, from tomorrow: eight weeks. */
export const QUIET_WEEK_STARTS = 56;

/** The calendar window the suggestion reads: every day of every week it weighs. */
export function quietWeekWindow(today: string): PlanSearchRange {
  const from = addDays(today, 1);
  return { from, to: addDays(from, QUIET_WEEK_STARTS + QUIET_WEEK_DAYS - 2) };
}

/** A day's figure for the suggestion: the mean `headlinerWait` of the parks open that day. */
function dayFigure(day: TripCalendarDay, parks: readonly string[]): number | null {
  const waits = parks
    .map((slug) => day.parks[slug])
    .filter((cell) => cell && cell.status !== 'CLOSED' && cell.headlinerWait !== undefined)
    .map((cell) => cell.headlinerWait as number);
  return waits.length > 0 ? waits.reduce((sum, wait) => sum + wait, 0) / waits.length : null;
}

/**
 * The quietest week ahead for `parks`: of the {@link QUIET_WEEK_DAYS}-day stretches the calendar
 * covers from `from` on, the one whose days have the lowest mean figure, the earliest of equals.
 * A stretch with a day missing or without a figure is not weighed; `null` without any.
 */
export function quietWeek(
  days: readonly TripCalendarDay[],
  parks: readonly string[],
  from: string
): PlanSearchRange | null {
  const figure = new Map<string, number | null>(days.map((d) => [d.date, dayFigure(d, parks)]));
  let best: { range: PlanSearchRange; mean: number } | null = null;
  for (let start = 0; start < QUIET_WEEK_STARTS; start += 1) {
    const first = addDays(from, start);
    let sum = 0;
    let whole = true;
    for (let i = 0; i < QUIET_WEEK_DAYS && whole; i += 1) {
      const value = figure.get(addDays(first, i));
      if (value === undefined || value === null) whole = false;
      else sum += value;
    }
    if (!whole) continue;
    const mean = sum / QUIET_WEEK_DAYS;
    if (!best || mean < best.mean) {
      best = { range: { from: first, to: addDays(first, QUIET_WEEK_DAYS - 1) }, mean };
    }
  }
  return best?.range ?? null;
}
