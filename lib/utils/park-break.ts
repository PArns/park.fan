import type { NextScheduleItem, ScheduleItem } from '@/lib/api/types';
import { addDays, daysBetween, parkDayOf } from '@/lib/utils/park-day';
import { OFFSEASON_MIN_DAYS } from '@/lib/utils/schedule-utils';

/**
 * How long a break has to last in all, from the day after the last operating day to the day
 * before the reopening, before it gets its panel outside winter.
 */
export const BREAK_MIN_DAYS = 14;

/** How many days of a closure have to fall in the park's winter before it is the winter break. */
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

/**
 * The picture a break is drawn with. Summer has none of its own: a park shut in summer gets the
 * spring one, flowers and all.
 */
export type ParkBreakScene = 'winter' | 'autumn' | 'spring';

/** A park shut between two operating days for long enough to say so, and when it opens again. */
export interface ParkBreak {
  /** The park-local day it opens again, `YYYY-MM-DD`. */
  reopensOn: string;
  /** Whole days from today to that day. */
  daysUntil: number;
  /** The winter break („Winterpause"), rather than a break between two seasons („Saisonpause"). */
  winter: boolean;
  scene: ParkBreakScene;
}

/** The fields of a park a break is decided from; the park page and the ride page have them. */
export interface ParkBreakFields {
  timezone: string;
  latitude: number | null;
  hasOperatingSchedule?: boolean;
  schedule?: readonly ScheduleItem[] | null;
  nextSchedule?: NextScheduleItem | null;
}

/**
 * Today's closure, before the past is asked: shut today by the schedule, the next opening known
 * and at least {@link OFFSEASON_MIN_DAYS} away. That is the line the park cards and „Heute im
 * Park" draw between a park shut for a few days, which they name the weekday of, and one between
 * seasons, so a park open only at weekends never gets this far.
 */
function closureAhead(park: ParkBreakFields | null | undefined, todayIso: string | undefined) {
  if (!park || !todayIso || park.hasOperatingSchedule === false) return null;
  const today = park.schedule?.find((day) => day.date === todayIso);
  if (today?.scheduleType === 'OPERATING') return null;
  const reopensOn = nextOpeningDay(park.nextSchedule, park.timezone);
  if (!reopensOn) return null;
  const daysUntil = daysBetween(todayIso, reopensOn);
  return daysUntil >= OFFSEASON_MIN_DAYS ? { reopensOn, daysUntil } : null;
}

/**
 * The past days to look up before {@link parkBreakOf} can answer, as an inclusive `YYYY-MM-DD`
 * range ending yesterday, or null when none are needed. Only a closure that is ahead and shorter
 * than {@link BREAK_MIN_DAYS} from today needs them: whether it is long enough in all depends on
 * how long the park has been shut already.
 */
export function parkBreakLookback(
  park: ParkBreakFields | null | undefined,
  todayIso: string | undefined
): { from: string; to: string } | null {
  const ahead = closureAhead(park, todayIso);
  if (!ahead || ahead.daysUntil >= BREAK_MIN_DAYS) return null;
  return {
    from: addDays(todayIso!, ahead.daysUntil - BREAK_MIN_DAYS),
    to: addDays(todayIso!, -1),
  };
}

/**
 * How many days in a row the park was shut right before `todayIso`, read from calendar days
 * (`CalendarDay.date` and `.status`). A day missing from the list ends the run, so a gap in the
 * data never lengthens a break.
 */
export function closedDaysBefore(
  days: readonly { date: string; status: string }[] | null | undefined,
  todayIso: string
): number {
  if (!days) return 0;
  const byDate = new Map(days.map((day) => [day.date, day.status]));
  let count = 0;
  for (let day = addDays(todayIso, -1); ; day = addDays(day, -1)) {
    const status = byDate.get(day);
    if (status === undefined || status === 'OPERATING') return count;
    count++;
  }
}

/**
 * Whether the park is in a break on `todayIso` worth its own panel, and until when. Null unless
 * the closure ahead holds (see `parkBreakLookback`) and it is either the winter break, with at
 * least {@link WINTER_BREAK_MIN_DAYS} of it in the park's winter, or at least
 * {@link BREAK_MIN_DAYS} long in all, counting the `closedBefore` days it has already run.
 *
 * Decided from the schedule and the calendar, never from the live status, which reads `CLOSED`
 * every night.
 *
 * @param todayIso The PARK-local day, computed on the server, as the ride badges get it.
 * @param closedBefore Days the park was already shut before today (`closedDaysBefore`); 0 when
 *   `parkBreakLookback` asked for none.
 */
export function parkBreakOf(
  park: ParkBreakFields | null | undefined,
  todayIso: string | undefined,
  closedBefore = 0
): ParkBreak | null {
  const ahead = closureAhead(park, todayIso);
  if (!ahead || !park || !todayIso) return null;
  const winter = isWinterBreak(todayIso, ahead.reopensOn, park.latitude);
  if (!winter && ahead.daysUntil + closedBefore < BREAK_MIN_DAYS) return null;
  const season = seasonOn(todayIso, park.latitude);
  return {
    ...ahead,
    winter,
    // A winter break shows the snow until spring; any other break shows the season it falls in.
    scene: season === 'spring' || season === 'summer' ? 'spring' : winter ? 'winter' : season,
  };
}

/** Whether enough of the days from today to the reopening fall in the park's winter. */
function isWinterBreak(todayIso: string, reopensOn: string, latitude: number | null) {
  if (latitude === null || Math.abs(latitude) < TROPICS_LATITUDE) return false;
  const winter = latitude >= 0 ? WINTER_MONTHS_NORTH : WINTER_MONTHS_SOUTH;
  let winterDays = 0;
  for (let day = todayIso; day < reopensOn; day = addDays(day, 1)) {
    if (winter.has(monthOf(day)) && ++winterDays >= WINTER_BREAK_MIN_DAYS) return true;
  }
  return false;
}

/** The meteorological season of each month in the north, January first. */
const SEASON_BY_MONTH = [
  'winter',
  'winter',
  'spring',
  'spring',
  'spring',
  'summer',
  'summer',
  'summer',
  'autumn',
  'autumn',
  'autumn',
  'winter',
] as const;

/**
 * The meteorological season at the park on a day: December to February is winter in the north and
 * summer in the south. A park in the tropics, or without a latitude, has summer all year.
 */
function seasonOn(isoDay: string, latitude: number | null) {
  if (latitude === null || Math.abs(latitude) < TROPICS_LATITUDE) return 'summer';
  return SEASON_BY_MONTH[(monthOf(isoDay) - 1 + (latitude < 0 ? 6 : 0)) % 12];
}

function monthOf(isoDay: string): number {
  return Number(isoDay.slice(5, 7));
}

/** The park-local day of the next opening; the API often sends only the opening instant. */
function nextOpeningDay(next: NextScheduleItem | null | undefined, timezone: string) {
  if (!next || next.scheduleType !== 'OPERATING') return null;
  if (next.date) return next.date;
  if (!next.openingTime) return null;
  const opening = new Date(next.openingTime);
  return Number.isNaN(opening.getTime()) ? null : parkDayOf(opening, timezone);
}
