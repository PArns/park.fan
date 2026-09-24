import type { PlanDay } from '@/lib/api/types';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { canRideAtHeight } from '@/lib/utils/rider-height';
import { unfoldedCloseHour } from './day-grid';
import { DETOUR_MAX, WALK_PARK_M_PER_MIN } from './leg';

/**
 * "What now?" for a visitor who is standing in a park without a plan (PAR-419).
 *
 * The shortest queue is not the answer. A ride at 5 minutes that stays at 5 all
 * afternoon can wait; the one to walk to now is the ride whose queue is short NOW
 * and is forecast to be long SOON. So every suggestion is a measured difference
 * between two numbers the page already has: the live wait and the day's hourly
 * forecast (`/plan/day`, the planner's own curve) for the next two hours. The
 * same idea as `fitLevers`: a reason is a difference between two readings, never
 * advice.
 *
 * Pure: no clock, no storage, no fetch. The caller passes the park-local minute.
 */

/** How far ahead "later" reaches. */
export const NEXT_RIDE_LOOKAHEAD_MIN = 120;

/**
 * The smallest gap worth a suggestion. Forecast hours are rounded to 5 and live
 * waits are posted in 5s, so a 5-minute gap is one rounding step and says nothing.
 */
export const NEXT_RIDE_MIN_SAVING_MIN = 10;

export const NEXT_RIDE_LIMIT = 3;

/** The fields of a nearby row this rule reads (`AttractionWithDistance`). */
export interface NextRideCandidate {
  slug: string;
  name: string;
  /** Metres from the visitor. */
  distance: number | null;
  waitTime: number | null;
  status: string;
  isCurrentlyInSeason?: boolean | null;
}

export interface NextRideInput {
  rides: readonly NextRideCandidate[];
  /** Today's `/plan/day`. Absent or empty means no forecast, and then no suggestion. */
  day: Pick<PlanDay, 'rides' | 'context'> | null | undefined;
  /** Park-local minutes since midnight. */
  nowMinute: number;
  /** The shortest rider, from the planner's prefs for today. Absent means nobody was asked. */
  riderHeightCm?: number;
}

export interface NextRideSuggestion {
  slug: string;
  name: string;
  /** Live wait, raw. Round only where it is displayed. */
  waitNow: number;
  /** Park-local hour of the forecast peak inside the look-ahead. */
  laterHour: number;
  /** Forecast wait at {@link laterHour}, raw. */
  laterWait: number;
  /** `laterWait - waitNow`, raw. Always ≥ {@link NEXT_RIDE_MIN_SAVING_MIN}. */
  saving: number;
  /** Walking-time ceiling from the visitor, the planner's model (`leg.ts`). */
  walkMin: number;
}

/**
 * Walking time from the visitor to a ride: the planner's ceiling, never a floor.
 * A straight line is shorter than any path, so it is stretched by the detour
 * factor and walked at park pace.
 */
export function walkMinutesFrom(distanceM: number | null): number {
  if (distanceM == null || !Number.isFinite(distanceM) || distanceM <= 0) return 0;
  return Math.ceil((distanceM * DETOUR_MAX) / WALK_PARK_M_PER_MIN);
}

export function suggestNextRides(input: NextRideInput): NextRideSuggestion[] {
  const { rides, day, nowMinute, riderHeightCm } = input;
  if (!day || !hasReadableWaitTimes(day.context)) return [];
  const forecastBySlug = new Map(day.rides.map((r) => [r.attractionSlug, r]));
  if (forecastBySlug.size === 0) return [];
  // `closeHour` is the hour the closing time falls in, so that hour is not a
  // whole open hour: a queue there is one the visitor may not get into.
  // A day that runs past midnight (16:00–01:00) is unfolded onto one axis first,
  // the same way `day-grid.ts` does it: hours and the clock after midnight move
  // to 24+, or every evening hour would compare as later than a 1 o'clock close.
  const { openHour, closeHour: rawCloseHour } = day.context;
  const wrapAt =
    openHour != null && rawCloseHour != null && rawCloseHour < openHour ? openHour : null;
  const unfold = (hour: number) => (wrapAt != null && hour < wrapAt ? hour + 24 : hour);
  const closeHour =
    openHour != null && rawCloseHour != null
      ? unfoldedCloseHour(openHour, rawCloseHour)
      : rawCloseHour;
  const now = wrapAt != null && nowMinute < wrapAt * 60 ? nowMinute + 24 * 60 : nowMinute;
  const horizon = now + NEXT_RIDE_LOOKAHEAD_MIN;

  const out: (NextRideSuggestion & { peakAxis: number })[] = [];
  for (const ride of rides) {
    if (ride.status !== 'OPERATING') continue;
    if (ride.isCurrentlyInSeason === false) continue;
    if (typeof ride.waitTime !== 'number' || !Number.isFinite(ride.waitTime)) continue;
    const forecast = forecastBySlug.get(ride.slug);
    if (!forecast) continue;
    if (riderHeightCm != null && !canRideAtHeight(forecast, riderHeightCm)) continue;

    const walkMin = walkMinutesFrom(ride.distance);
    // "Later" starts once the visitor could be there; an hour that has begun
    // before they arrive is the hour they would queue in, not an alternative.
    const arrival = now + walkMin;
    let peak: { hour: number; wait: number } | null = null;
    let peakAxis = 0;
    for (const h of forecast.hours) {
      const axis = unfold(h.hour);
      const start = axis * 60;
      if (start < arrival || start > horizon) continue;
      if (closeHour != null && axis >= closeHour) continue;
      if (!peak || h.wait > peak.wait) {
        peak = h;
        peakAxis = axis;
      }
    }
    if (!peak) continue;

    const saving = peak.wait - ride.waitTime;
    if (saving < NEXT_RIDE_MIN_SAVING_MIN) continue;
    out.push({
      slug: ride.slug,
      name: ride.name,
      waitNow: ride.waitTime,
      laterHour: peak.hour,
      laterWait: peak.wait,
      saving,
      walkMin,
      peakAxis,
    });
  }

  // Biggest measured gap first; between equal gaps the shorter walk, then the
  // earlier peak (the more urgent one), then the name for a stable order.
  out.sort(
    (a, b) =>
      b.saving - a.saving ||
      a.walkMin - b.walkMin ||
      a.peakAxis - b.peakAxis ||
      a.name.localeCompare(b.name)
  );
  return out.slice(0, NEXT_RIDE_LIMIT).map(({ peakAxis: _axis, ...s }) => s);
}
