import { addDays } from '@/lib/utils/park-day';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { breakRuns, type BreakRun } from './best-time';
import { stormCodeOn, type StormCode } from './date-facts';
import { factDays, isRankable, meanWait } from './hub-data';
import { shownWait } from './plan-week';
import type {
  TripCalendar,
  TripCalendarDay,
  TripRegion,
  TripRegionPark,
  TripWeather,
} from './types';

/**
 * The facts the hub's questions read from a calendar, the hub's 30 days or a month page's month:
 * which weekday is quietest, each big park's usual hours, the school breaks and holidays and what
 * they do to the waits. Free of React, so `scripts/test-orlando-hub.mjs` checks them on a fixture.
 * Every figure is the big rides' wait at their busiest, meaned over the region's headliner parks.
 */

/** A day's mean over the region's headliner parks that have a figure; `null` without one. */
function headlinerMean(day: TripCalendarDay, headliners: readonly TripRegionPark[]): number | null {
  const waits = headliners
    .map((p) => day.parks[p.slug])
    .filter(isRankable)
    .map((p) => shownWait(p)!);
  return waits.length === 0 ? null : waits.reduce((a, b) => a + b, 0) / waits.length;
}

/** One weekday's figure: 1 Monday … 7 Sunday, as ISO counts them. */
export interface WeekdayWait {
  weekday: number;
  minutes: number;
}

/** The quietest and busiest weekdays, or a flat week where every weekday rounds to one figure. */
export interface WeekdayFacts {
  /** Every weekday with enough days, Monday first. */
  waits: WeekdayWait[];
  quiet: WeekdayWait[];
  busy: WeekdayWait[];
  flat: boolean;
  lastYear: boolean;
}

/** A weekday needs this many days behind it before its mean says anything. */
const MIN_DAYS_PER_WEEKDAY = 2;

/** The ISO weekday of a plain date. */
export function isoWeekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
}

/**
 * Each weekday's mean over the headliner parks, rounded to five like every wait the site prints,
 * with the lowest and the highest. `null` with fewer than five weekdays of two days each.
 */
export function weekdayFacts(calendar: TripCalendar, region: TripRegion): WeekdayFacts | null {
  const headliners = region.parks.filter((p) => p.headliner);
  const { days, lastYear } = factDays(calendar);
  const byWeekday = new Map<number, number[]>();
  for (const day of days) {
    const mean = headlinerMean(day, headliners);
    if (mean === null) continue;
    const weekday = isoWeekday(day.date);
    byWeekday.set(weekday, [...(byWeekday.get(weekday) ?? []), mean]);
  }
  const waits = [...byWeekday]
    .filter(([, means]) => means.length >= MIN_DAYS_PER_WEEKDAY)
    .map(([weekday, means]) => ({ weekday, minutes: meanWait(means)! }))
    .sort((a, b) => a.weekday - b.weekday);
  if (waits.length < 5) return null;
  const low = Math.min(...waits.map((w) => w.minutes));
  const high = Math.max(...waits.map((w) => w.minutes));
  return {
    waits,
    quiet: waits.filter((w) => w.minutes === low),
    busy: waits.filter((w) => w.minutes === high),
    flat: low === high,
    lastYear,
  };
}

/** A headliner park's usual day: its most common hours and on how many days it keeps them. */
export interface UsualHours {
  park: TripRegionPark;
  /** Park-local ISO times of one day with these hours, for the clock format. */
  opensAt: string;
  closesAt: string;
  days: number;
  /** The days with published hours. */
  of: number;
}

/**
 * Each headliner park's most common opening hours over the days with published hours, the day
 * guests' close (a party night counts with its early close). A park without published hours is
 * left out.
 */
export function usualHours(calendar: TripCalendar, region: TripRegion): UsualHours[] {
  const { days } = factDays(calendar);
  return region.parks
    .filter((p) => p.headliner)
    .flatMap((park) => {
      const counts = new Map<string, { opensAt: string; closesAt: string; days: number }>();
      let of = 0;
      for (const day of days) {
        const own = day.parks[park.slug];
        if (own?.status !== 'OPERATING' || !own.hoursPublished || !own.opensAt || !own.closesAt) {
          continue;
        }
        of++;
        const key = `${own.opensAt.slice(11, 16)}-${own.closesAt.slice(11, 16)}`;
        const entry = counts.get(key) ?? { opensAt: own.opensAt, closesAt: own.closesAt, days: 0 };
        entry.days++;
        counts.set(key, entry);
      }
      const usual = [...counts.values()].sort((a, b) => b.days - a.days)[0];
      return usual ? [{ park, ...usual, of }] : [];
    });
}

/** The school breaks and public holidays in a calendar, and the waits on them against the rest. */
export interface BreakFacts {
  breaks: BreakRun[];
  /** Public holidays by name, each with its dates. */
  holidays: Array<{ name: string; dates: string[] }>;
  /** Mean over the headliner parks on break and holiday days, and on the others; `null` unknown. */
  onBreak: number | null;
  otherwise: number | null;
  lastYear: boolean;
}

/**
 * The calendar's school breaks as runs (`breakRuns`, the best-time pages' rule) and its public
 * holidays, with the headliner mean on those days against the other days. `null` with neither.
 */
export function breakFacts(calendar: TripCalendar, region: TripRegion): BreakFacts | null {
  // The API names a break day by its break first and a public holiday on it after:
  // ["Winter break (Orange County Public Schools)", "Christmas Day"].
  const breaks = breakRuns(
    calendar.days
      .filter((d) => d.isSchoolVacation)
      .map((d) => ({ date: d.date, name: d.holidays?.[0] ?? '' }))
  );
  const holidays = new Map<string, string[]>();
  for (const day of calendar.days) {
    const names = day.holidays ?? [];
    if (!day.isHoliday || names.length === 0) continue;
    const name = day.isSchoolVacation ? names[1] : names[0];
    if (name) holidays.set(name, [...(holidays.get(name) ?? []), day.date]);
  }
  if (breaks.length === 0 && holidays.size === 0) return null;
  const headliners = region.parks.filter((p) => p.headliner);
  const { days, lastYear } = factDays(calendar);
  const on: number[] = [];
  const off: number[] = [];
  for (const day of days) {
    const mean = headlinerMean(day, headliners);
    if (mean === null) continue;
    (day.isSchoolVacation || day.isHoliday ? on : off).push(mean);
  }
  const enough = on.length >= MIN_DAYS_PER_WEEKDAY && off.length >= MIN_DAYS_PER_WEEKDAY;
  return {
    breaks,
    holidays: [...holidays].map(([name, dates]) => ({ name, dates })),
    onBreak: enough ? roundWaitTo5(on.reduce((a, b) => a + b, 0) / on.length) : null,
    otherwise: enough ? roundWaitTo5(off.reduce((a, b) => a + b, 0) / off.length) : null,
    lastYear,
  };
}

/** A headliner park's mean over the days it has a figure. */
export interface ParkMean {
  park: TripRegionPark;
  minutes: number;
}

/**
 * Each headliner park's mean peak wait over the days it has a figure, quietest first: which park
 * is quieter across the window or the month, beside the calendar's day-by-day picks. A park with
 * fewer than three such days is left out.
 */
export function parkMeans(calendar: TripCalendar, region: TripRegion): ParkMean[] {
  const { days } = factDays(calendar);
  return region.parks
    .filter((p) => p.headliner)
    .flatMap((park) => {
      const waits = days.map((d) => d.parks[park.slug]).filter(isRankable);
      return waits.length >= 3
        ? [{ park, minutes: meanWait(waits.map((w) => shownWait(w)!))! }]
        : [];
    })
    .sort((a, b) => a.minutes - b.minutes);
}

/** A park's closed days in a calendar: as runs where they are few, else only how many. */
export interface ParkClosures {
  park: TripRegionPark;
  runs: Array<{ from: string; to: string }>;
  days: number;
}

/**
 * The parks that are closed on some days of the calendar, in the region's order, by their own
 * `CLOSED` status: a day no source reports is `UNKNOWN` and never counts as closed.
 */
export function parkClosures(calendar: TripCalendar, region: TripRegion): ParkClosures[] {
  return region.parks.flatMap((park) => {
    const runs: Array<{ from: string; to: string }> = [];
    let days = 0;
    let previous: string | null = null;
    for (const day of calendar.days) {
      if (day.parks[park.slug]?.status !== 'CLOSED') {
        previous = null;
        continue;
      }
      days++;
      const last = runs[runs.length - 1];
      if (last && previous) last.to = day.date;
      else runs.push({ from: day.date, to: day.date });
      previous = day.date;
    }
    return days > 0 ? [{ park, runs, days }] : [];
  });
}

/** Words as a reader counts them: "Disney’s", "EPCOT-Festival" and "15." each one. */
export function countWords(text: string): number {
  return (text.match(/[\p{L}\p{N}]+(?:[’'\-.][\p{L}\p{N}]+)*/gu) ?? []).length;
}

/**
 * The storm code a span of days carries, for a week of the best-time strip or a month of its table:
 * the peak where any day is in it, else the season where any day is, by the planner's own
 * `stormCodeOn`, so every calendar marks the same days.
 */
export function stormCodeIn(
  from: string,
  to: string,
  weather: TripWeather | undefined
): StormCode | null {
  let code: StormCode | null = null;
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const on = stormCodeOn(date, weather);
    if (on?.endsWith('_peak')) return on;
    code ??= on;
  }
  return code;
}
