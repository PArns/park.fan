import { opensAtMinute } from '@/lib/planner/day-grid';
import { formatGridTime, parkMinuteNow } from '@/lib/planner/park-time';
import { weekdayName } from '@/lib/utils/intl-format';
import type { PlanDay, ScheduleItem } from '@/lib/api/types';

/** What the park page says about one ride that starts after its park. */
export interface RideOpening {
  /** Park-local `HH:mm`, as `formatGridTime` prints it. */
  time: string;
  /** Park-local minutes since midnight. */
  minute: number;
  /** `high` is printed as a fact, everything else as „ca.". */
  firm: boolean;
}

/** The park's early-entry window: minutes only where the API has a value. */
export interface ParkEarlyEntry {
  minutes: number | null;
}

/** Today's plan, cut down to what the park page prints. */
export interface ParkOpenings {
  /** Park-local minute the gates open today, from the schedule. `null` where it is not known. */
  parkOpenMin: number | null;
  earlyEntry: ParkEarlyEntry | null;
  rides: ReadonlyMap<string, RideOpening>;
  /**
   * Rides whose weekday pattern leaves out today, by slug, with the ISO weekdays they do run on.
   * Such a ride is absent from {@link rides}: a later opening on a day it does not run is no
   * opening at all.
   */
  offToday: ReadonlyMap<string, readonly number[]>;
  /** Slugs the plan answered for. For these {@link offToday} has the last word. */
  planned: ReadonlySet<string>;
  /** Today's ISO weekday, `null` where the park is not open today or the date is unknown. */
  weekday: number | null;
}

/** ISO weekday, 1 (Monday) … 7 (Sunday), of a park-local `YYYY-MM-DD`. `null` if unreadable. */
export function isoWeekdayOf(dateIso: string): number | null {
  const ms = Date.parse(`${dateIso}T12:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).getUTCDay() || 7;
}

/**
 * Whether a ride's weekday pattern leaves out `weekday`. Without a pattern, an empty one or one
 * that covers the whole week, nothing is claimed: the API omits the field for a ride that stopped
 * running or has too little history, and that ride keeps the lines it had before.
 */
export function isOffWeekday(
  runsOnWeekdays: readonly number[] | undefined,
  weekday: number
): boolean {
  if (!runsOnWeekdays || runsOnWeekdays.length === 0) return false;
  return !runsOnWeekdays.includes(weekday);
}

/**
 * The weekdays to print under „Heute nicht im Programm" for one ride, or `null` for the lines it
 * had before. A ride that already ran today never gets it, whatever its pattern says (a coaster
 * with `[4, 5, 6, 7]` that ran this Monday): only `notRunToday` says it has not, and the caller
 * draws this under a CLOSED badge only.
 *
 * The plan has the last word for every ride it lists. For the others, before the plan has loaded
 * (it loads last) or after closing (it then leaves the mazes out), the ride's own pattern from the
 * park payload stands in, so the line is there from the first paint and does not jump.
 */
export function offTodayWeekdays(
  openings: ParkOpenings | null | undefined,
  slug: string,
  notRunToday: unknown,
  ownPattern?: readonly number[]
): readonly number[] | null {
  if (!notRunToday || !openings) return null;
  if (openings.planned.has(slug)) return openings.offToday.get(slug) ?? null;
  if (openings.weekday === null || !ownPattern) return null;
  return isOffWeekday(ownPattern, openings.weekday) ? ownPattern : null;
}

/**
 * ISO weekdays as short as they read: three or more in a row as a span („Fr–So"), shorter runs
 * one by one („Sa, So"), a run over the weekend kept whole („Sa–Mo"). `null` for no day or all
 * seven, which say nothing worth printing. The abbreviation's full stop is dropped, since „Fr.–So."
 * reads as two sentences.
 */
export function formatRunWeekdays(days: readonly number[], locale: string): string | null {
  const set = new Set(days.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7));
  if (set.size === 0 || set.size === 7) return null;
  const prev = (d: number) => (d === 1 ? 7 : d - 1);
  const next = (d: number) => (d === 7 ? 1 : d + 1);
  const label = (d: number) => weekdayName(d % 7, locale, 'short').replace(/\.$/, '');
  const starts = [1, 2, 3, 4, 5, 6, 7].filter((d) => set.has(d) && !set.has(prev(d)));
  return starts
    .map((start) => {
      const run = [start];
      while (set.has(next(run[run.length - 1]))) run.push(next(run[run.length - 1]));
      if (run.length >= 3) return `${label(run[0])}–${label(run[run.length - 1])}`;
      return run.map(label).join(', ');
    })
    .join(', ');
}

/**
 * Park-local minute the gates open on `todayIso`, from the park's own schedule. Not
 * `context.openHour`, which is the hour the opening falls in: against it a park opening at 10:30
 * would call every ride with `opensAt` 10:30 a late starter. `null` without an operating entry.
 */
export function parkOpenMinute(
  schedule: readonly ScheduleItem[] | null | undefined,
  todayIso: string,
  timezone: string
): number | null {
  const today = schedule?.find((s) => s.date === todayIso && s.scheduleType === 'OPERATING');
  if (!today?.openingTime) return null;
  const ms = Date.parse(today.openingTime);
  return Number.isNaN(ms) ? null : parkMinuteNow(timezone, ms);
}

/**
 * The rides of a plan that start after the park, by slug, the rides not running today, and the
 * park's early entry. A ride without `opensAt` is absent from the map: the API sends it only where
 * it knows, so a missing value is „unknown", never „opens with the park". Needs the park's
 * opening, so without it both maps are empty rather than guessed; a ride is only „not on today's
 * programme" in a park that is open today.
 */
export function parkOpeningsFromPlan(
  plan: PlanDay | null | undefined,
  parkOpenMin: number | null,
  todayIso?: string
): ParkOpenings {
  const rides = new Map<string, RideOpening>();
  const offToday = new Map<string, readonly number[]>();
  const planned = new Set<string>();
  const weekday = todayIso && parkOpenMin !== null ? isoWeekdayOf(todayIso) : null;
  if (plan && parkOpenMin !== null) {
    for (const ride of plan.rides) {
      planned.add(ride.attractionSlug);
      if (weekday !== null && ride.runsOnWeekdays && isOffWeekday(ride.runsOnWeekdays, weekday)) {
        offToday.set(ride.attractionSlug, ride.runsOnWeekdays);
        continue;
      }
      const minute = opensAtMinute(ride.opensAt);
      if (minute === null || minute <= parkOpenMin) continue;
      rides.set(ride.attractionSlug, {
        time: formatGridTime(minute),
        minute,
        firm: ride.opensAtConfidence === 'high',
      });
    }
  }
  const ctx = plan?.context;
  return {
    parkOpenMin,
    earlyEntry:
      ctx?.hasEarlyEntry === true
        ? {
            minutes:
              typeof ctx.earlyEntryMinutesPeak === 'number' && ctx.earlyEntryMinutesPeak > 0
                ? ctx.earlyEntryMinutesPeak
                : null,
          }
        : null,
    rides,
    offToday,
    planned,
    weekday,
  };
}

/**
 * Whether the line „öffnet ca. HH:mm" still tells the truth: only before that minute. After it, a
 * ride that still reads CLOSED is shut for some other reason, and the line would promise an
 * opening that has already passed.
 */
export function isOpeningAhead(opening: RideOpening, nowMinute: number): boolean {
  return nowMinute < opening.minute;
}
