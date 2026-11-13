import type { NextScheduleItem, ScheduleItem } from '@/lib/api/types';
import { addDays, daysBetween, parkDayOf } from '@/lib/utils/park-day';

/**
 * How many days of a closure have to fall in the park's winter before it counts as the winter
 * break. A week keeps out the weekdays a park stays shut in a short season.
 */
export const WINTER_BREAK_MIN_DAYS = 7;

/**
 * Below this latitude a park has no winter to close for: a closure there is a break between
 * seasons, never a winter break. The Tropic of Cancer and of Capricorn.
 */
const TROPICS_LATITUDE = 23.44;

/**
 * The months a closure counts as winter in, `1` to `12`: the three after the turn of the year,
 * which every winter break spans, up to the Easter openings. December is left out: a park shut
 * into it is mostly waiting for its own Christmas season after its Halloween one, and that gap is
 * no winter break. Mirrored for the southern hemisphere.
 */
const WINTER_MONTHS_NORTH: ReadonlySet<number> = new Set([1, 2, 3]);
const WINTER_MONTHS_SOUTH: ReadonlySet<number> = new Set([7, 8, 9]);

/** A park closed for the winter, and when it opens again. */
export interface WinterBreak {
  /** The park-local day it opens again, `YYYY-MM-DD`. */
  reopensOn: string;
  /** Whole days from today to that day. */
  daysUntil: number;
}

/** The fields of a park the winter break is decided from; the park page and the ride page have them. */
export interface WinterBreakFields {
  timezone: string;
  latitude: number | null;
  hasOperatingSchedule?: boolean;
  schedule?: readonly ScheduleItem[] | null;
  nextSchedule?: NextScheduleItem | null;
}

/**
 * Whether the park is in its winter break on `todayIso`, and until when. Null unless the park is
 * shut today, the schedule names its next opening day, and at least {@link WINTER_BREAK_MIN_DAYS}
 * of the days in between fall in the winter of the park's hemisphere.
 *
 * Decided from the schedule alone, never from the live status: a status reads `CLOSED` every
 * night. The reopening has to be known, because the panel that reads this exists to name it.
 *
 * @param todayIso The PARK-local day, computed on the server, as the ride badges get it.
 */
export function winterBreakOf(
  park: WinterBreakFields | null | undefined,
  todayIso: string | undefined
): WinterBreak | null {
  if (!park || !todayIso || park.hasOperatingSchedule === false) return null;
  if (park.latitude === null || Math.abs(park.latitude) < TROPICS_LATITUDE) return null;

  const today = park.schedule?.find((day) => day.date === todayIso);
  if (today?.scheduleType === 'OPERATING') return null;

  const reopensOn = nextOpeningDay(park.nextSchedule, park.timezone);
  if (!reopensOn) return null;
  const daysUntil = daysBetween(todayIso, reopensOn);
  if (daysUntil < WINTER_BREAK_MIN_DAYS) return null;

  const winter = park.latitude >= 0 ? WINTER_MONTHS_NORTH : WINTER_MONTHS_SOUTH;
  let winterDays = 0;
  for (let day = todayIso; day < reopensOn; day = addDays(day, 1)) {
    if (winter.has(Number(day.slice(5, 7))) && ++winterDays >= WINTER_BREAK_MIN_DAYS) {
      return { reopensOn, daysUntil };
    }
  }
  return null;
}

/** The park-local day of the next opening; the API often sends only the opening instant. */
function nextOpeningDay(next: NextScheduleItem | null | undefined, timezone: string) {
  if (!next || next.scheduleType !== 'OPERATING') return null;
  if (next.date) return next.date;
  if (!next.openingTime) return null;
  const opening = new Date(next.openingTime);
  return Number.isNaN(opening.getTime()) ? null : parkDayOf(opening, timezone);
}
