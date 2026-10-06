import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { isPlannedDay, type PlannerState } from './types';

/**
 * The planner's clock is the park's clock: every planner date and time comes from the park's IANA
 * zone, and the reader's offset is never a substitute for a known zone. `resolveTimeZone` is the
 * one fallback for a zone that has not arrived yet.
 */

/**
 * `YYYY-MM-DD` in the park's own reading. `en-CA` formats exactly that way; an ISO string would
 * give UTC's date.
 */
export function parkToday(timeZone: string, now: number = Date.now()): string {
  return getDateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now));
}

/**
 * Today in the park's reckoning where the zone is known, in the reader's where it is not, because
 * the zone reaches the plan late. The reader's zone is a better wrong answer than UTC. Only for a
 * date, where a day out is recoverable; the now line and the axis take a real zone or nothing.
 */
export function todayInZone(timeZone: string | undefined, now: number = Date.now()): string {
  return parkToday(resolveTimeZone(timeZone), now);
}

/**
 * The park's zone where known, the reader's otherwise, for callers that need a zone string, such
 * as the now line and the grid's clock.
 */
export function resolveTimeZone(timeZone: string | undefined): string {
  return timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

/**
 * Park-local minutes since midnight, through the cached formatter since the now line ticks.
 * `hourCycle: 'h23'`, not `hour12: false`, which yields `24` for midnight in some runtimes.
 */
export function parkMinuteNow(timeZone: string, now: number = Date.now()): number {
  const parts = getDateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(now));

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

/**
 * Minutes since park-local midnight as `10:30`. Takes minutes, never a `Date`, so the reader's zone
 * cannot enter. Past midnight folds back: 25:00 labels as `01:00`.
 */
export function formatGridTime(minute: number): string {
  const wrapped = ((Math.round(minute) % 1440) + 1440) % 1440;
  const hour = Math.floor(wrapped / 60);
  const rest = wrapped % 60;
  return `${String(hour).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/**
 * `Donnerstag, 17. September`: the day a plan is filed under, in the reader's language. Formatted
 * from noon UTC, which no offset can push across a date boundary. Shared, so the wizard and the fit
 * assistant cannot name different days.
 */
export function longDate(date: string, locale: string): string {
  return getDateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00Z`));
}

/** `YYYY-MM-DD` plus `days`, calendar-safe. Dates here are park-local strings. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Whole calendar days from `from` to `to`, negative where `to` is earlier: a count of nights, from
 * noon UTC on both sides (see {@link longDate}), so the difference is whole by construction.
 */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T12:00:00Z`);
  const end = Date.parse(`${to}T12:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

/**
 * Where a planned day sits against the park's own clock. One value rather than a date plus a
 * minute, so a caller cannot set one and forget the other. `future` is the default wherever it is
 * optional, and every rule keyed to it then behaves as if there were no clock.
 */
export type DayClock =
  | { phase: 'past' }
  /** Park-local minutes since midnight, on the day being looked at. */
  | { phase: 'today'; nowMinute: number }
  | { phase: 'future' };

/**
 * The clock for one planned date, read in the park's zone. `now` is a parameter so a test can set
 * the time.
 */
export function dayClock(date: string, timeZone: string, now: number = Date.now()): DayClock {
  const today = parkToday(timeZone, now);
  if (date < today) return { phase: 'past' };
  if (date > today) return { phase: 'future' };
  return { phase: 'today', nowMinute: parkMinuteNow(timeZone, now) };
}

/** The next planned day in the whole plan, and how far off it is. */
export interface NextPlannedDay {
  parkSlug: string;
  /** `YYYY-MM-DD`, in that park's own reading. */
  date: string;
  /** Nights from that park's today to the planned date. Always at least 1. */
  inDays: number;
}

/**
 * Which planned day comes next, across every park in the plan. Each park's days are measured
 * against that park's own today, and the nights between are compared, since two parks can be on
 * different dates at once. Today's day is not the answer, and a past day never is. Ties go by date,
 * then slug, so the answer is stable.
 */
export function nextPlannedDay(
  state: PlannerState,
  now: number = Date.now()
): NextPlannedDay | null {
  let best: NextPlannedDay | null = null;

  for (const park of Object.values(state.parks)) {
    const today = todayInZone(park.timezone, now);

    for (const day of Object.values(park.days)) {
      if (!isPlannedDay(day)) continue;
      const inDays = daysBetween(today, day.date);
      if (inDays < 1) continue;

      if (
        best === null ||
        inDays < best.inDays ||
        (inDays === best.inDays &&
          (day.date < best.date || (day.date === best.date && park.slug < best.parkSlug)))
      ) {
        best = { parkSlug: park.slug, date: day.date, inDays };
      }
    }
  }

  return best;
}

/** The active day, when it is already over: what {@link pastActiveDay} answers. */
export interface PastActiveDay {
  parkSlug: string;
  parkName: string;
  date: string;
}

/**
 * The day the panel would open on, if that day is already over, so the two ways in that name no
 * day (the edge tab and the header button) can ask instead of opening yesterday's plan. Only a day
 * with something in it counts, and "over" is read in the park's zone.
 */
export function pastActiveDay(state: PlannerState, now: number = Date.now()): PastActiveDay | null {
  const { activeParkSlug, activeDate } = state;
  if (!activeParkSlug || !activeDate) return null;
  const park = state.parks[activeParkSlug];
  const day = park?.days[activeDate];
  if (!park || !day || day.entries.length === 0) return null;
  if (activeDate >= todayInZone(park.timezone, now)) return null;
  return { parkSlug: park.slug, parkName: park.name, date: activeDate };
}
