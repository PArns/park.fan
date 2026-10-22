import { fromZonedTime } from 'date-fns-tz';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Turn a day's `HourlyPrediction` series into UTC instants, so each bar can be shown on the park's
 * clock and the past ones told apart.
 *
 * `hour` is a UTC hour of day, while `date` is a calendar day in the PARK's zone, and the two can
 * be a whole day apart (Tokyo's `2026-09-15` begins at `2026-09-14T15:00Z`). So each hour becomes
 * the first instant at that UTC hour at or after the park-local day begins. The day start is taken
 * from midday minus twelve hours, because a zone whose DST jump lands on midnight has no midnight.
 *
 * @param date `YYYY-MM-DD` in park time (`CalendarDay.date`).
 * @param hours the series' `hour` values, in the order the API returned them.
 * @returns one epoch-millisecond instant per entry, in the same order.
 */
export function hourlyPredictionInstants(
  date: string,
  hours: number[],
  timeZone: string
): number[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];

  let dayStart: number;
  try {
    dayStart = fromZonedTime(`${date}T12:00:00`, timeZone).getTime() - 12 * HOUR_MS;
  } catch {
    return [];
  }
  if (Number.isNaN(dayStart)) return [];

  const utcMidnightBefore = Math.floor(dayStart / DAY_MS) * DAY_MS;
  let previous = -Infinity;

  return hours.map((hour) => {
    let candidate = utcMidnightBefore + hour * HOUR_MS;
    if (candidate < dayStart) candidate += DAY_MS;
    // An hour equal to the start hour resolves to the near edge after a smaller one went to the far
    // edge; the API sends entries in time order, so a step backwards is a wrap.
    if (candidate < previous) candidate += DAY_MS;
    previous = candidate;
    return candidate;
  });
}

/**
 * The entries of a day's hourly curve a reader can still act on, each with its bar's instant.
 *
 * The curve is a countdown (the remaining open hours), but the backend lets the CDN cache it
 * until park-local midnight, so by evening a cached copy starts with hours that are over. Expired
 * bars are dropped here; a fully stale response comes back empty and the section hides.
 *
 * @param nowMs the reader's clock, epoch milliseconds.
 * @param timeZone the park's IANA zone: the instants are anchored on the park's own day.
 */
export function upcomingHourlyPredictions<T extends { hour: number }>(
  date: string,
  series: T[],
  nowMs: number,
  timeZone: string
): Array<T & { instant: number }> {
  const instants = hourlyPredictionInstants(
    date,
    series.map((entry) => entry.hour),
    timeZone
  );

  if (instants.length !== series.length) return [];

  return series
    .map((entry, index) => ({ ...entry, instant: instants[index] }))
    .filter(({ instant }) => instant + HOUR_MS > nowMs);
}

/** A `YYYY-MM-DD` that names a real day, as UTC midnight in ms; `null` for anything else. */
function parseCalendarDate(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  return parsed.getTime();
}

/** The longest range the calendar route serves: one month, which is all the grid ever asks for. */
export const MAX_CALENDAR_RANGE_DAYS = 31;

/**
 * Whether the calendar route may answer for `from`–`to`: two real days, in order, at most
 * {@link MAX_CALENDAR_RANGE_DAYS} apart counting both ends. Both land in the CDN cache key, and the
 * backend aggregates per day, so an open range is a slow upstream request per pair a caller makes up.
 */
export function isServableCalendarRange(from: string, to: string): boolean {
  const start = parseCalendarDate(from);
  const end = parseCalendarDate(to);
  if (start === null || end === null || end < start) return false;
  return (end - start) / 86_400_000 + 1 <= MAX_CALENDAR_RANGE_DAYS;
}

/** The longest `stats/hourly` window the backend reads: five years, both ends counted. */
const MAX_HOURLY_PROFILE_RANGE_DAYS = 1830;

/**
 * Whether the hourly-profile route may answer for `from`–`to`: two real days in order, the last no
 * later than the UTC date, and at most {@link MAX_HOURLY_PROFILE_RANGE_DAYS} apart. Both land in the
 * CDN cache key and the backend answers anything else with a 400 the route would turn into a 500.
 * `nowMs` is `null` for a render that must not read a clock; the end-of-window bound is then left to
 * the route.
 */
export function isServableHourlyProfileRange(
  from: string,
  to: string,
  nowMs: number | null
): boolean {
  const start = parseCalendarDate(from);
  const end = parseCalendarDate(to);
  if (start === null || end === null || end < start) return false;
  if (
    nowMs !== null &&
    end > Date.parse(`${new Date(nowMs).toISOString().slice(0, 10)}T00:00:00Z`)
  ) {
    return false;
  }
  return (end - start) / 86_400_000 + 1 <= MAX_HOURLY_PROFILE_RANGE_DAYS;
}

/**
 * Whether the hourly route may answer for `date`: a real calendar day, and one some park could
 * call today or tomorrow, i.e. one day before to two days after the UTC date. The regex alone
 * accepts `2026-99-99`, and every such date would be a fresh CDN key and upstream request.
 * `new Date` rolls an impossible day forward, so the parsed value is formatted back and compared.
 */
export function isServableHourlyDate(date: string, nowMs: number): boolean {
  const parsed = parseCalendarDate(date);
  if (parsed === null) return false;

  const utcToday = Date.parse(`${new Date(nowMs).toISOString().slice(0, 10)}T00:00:00Z`);
  const daysFromUtcToday = Math.round((parsed - utcToday) / 86_400_000);

  return daysFromUtcToday >= -1 && daysFromUtcToday <= 2;
}
