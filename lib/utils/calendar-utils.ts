import { fromZonedTime } from 'date-fns-tz';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Turn a day's `HourlyPrediction` series into UTC instants, so a caller can render each bar in the
 * park's own clock and tell which of them are already over.
 *
 * `HourlyPrediction.hour` is an hour of day in **UTC** (see its docstring for the measurement),
 * while the series belongs to `date`, a calendar day in the PARK's timezone. Those two calendars do
 * not line up, and the gap is a whole day rather than a few hours: the park-local day `2026-09-15`
 * in Asia/Tokyo begins at `2026-09-14T15:00Z`, so its hour `20` is on the UTC day BEFORE the one
 * the date names. An earlier version anchored on `${date}T00:00:00Z` and said the slip did not
 * matter because only the hour was ever read back — true then, false as soon as the instant was
 * also compared against the clock, where a day of error is the difference between cutting every
 * bar and cutting none.
 *
 * So the anchor is the park-local day's own UTC span: each hour becomes the first instant at that
 * UTC hour at or after the day begins. Two consequences worth knowing. The window is a fixed 24
 * hours, so the extra hour of a 25-hour DST day falls outside it — the API sends at most five
 * entries, all inside the park's opening hours, so that hour is not one of them. And midnight is
 * not used as the reference, because a zone whose DST jump lands on it has no midnight (📚 G-39):
 * the day's midday is converted and twelve hours subtracted, which exists everywhere.
 *
 * The series crossing midnight UTC needs no special case any more — a park open late answers
 * `… 22 23 0 1`, and the `0` resolves into the next UTC day on its own because the earlier one is
 * before the day began.
 *
 * @param date `YYYY-MM-DD` in park time — `CalendarDay.date`.
 * @param hours the series' `hour` values, in the order the API returned them.
 * @param timeZone the park's IANA timezone.
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
    // The day's own start is not enough on its own: an hour equal to the start hour resolves to
    // the near edge while a smaller one has already been pushed to the far edge, so a series that
    // straddles that hour would come back out of order. The API sends its entries in time order,
    // so a step backwards is a wrap and never a reordering.
    if (candidate < previous) candidate += DAY_MS;
    previous = candidate;
    return candidate;
  });
}

/**
 * The entries of a day's hourly curve that a reader can still act on, each with the instant its
 * bar covers.
 *
 * The filter exists because the curve is a countdown rather than a whole day: measured on
 * 2026-09-14, Phantasialand answered `11 12 13 14 15` at 11:41 UTC and `12 13 14 15` at 12:56 —
 * the remaining open hours, capped at five. A copy of it therefore goes wrong by simply being kept,
 * and it is kept: api.park.fan serves this URL as `s-maxage=36251` expiring at park-local midnight,
 * and Cloudflare answered a `HIT` starting at 11 while a cache-busted fetch of the same URL
 * answered 12. Whoever opens the dialog first in the morning fixes the curve for the rest of the
 * day, and by the evening its first bars are hours that are over.
 *
 * Nothing in this repo can shorten that window — it is the backend's own header — so the bars that
 * have expired are dropped here instead. A fresh response loses nothing (its first hour is the
 * current one, which has not ended), a stale one gets shorter, and one that is stale all the way
 * through comes back empty so the section hides rather than drawing this morning.
 *
 * @param date `YYYY-MM-DD` in park time — `CalendarDay.date`.
 * @param series the day's entries, in the order the API returned them.
 * @param nowMs the reader's clock, epoch milliseconds.
 * @param timeZone the park's IANA timezone — the comparison is absolute, so the instants have to
 *   be anchored on the park's own day rather than on the UTC day of the same name.
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

/**
 * Whether a `date` is one the hourly route may answer at all — a real calendar day, and one close
 * enough to `nowMs` that a park somewhere could call it today or tomorrow.
 *
 * A form check alone is not enough, and the reason is the cache rather than the payload:
 * `/^\d{4}-\d{2}-\d{2}$/` accepts `2026-99-99` and every other well-shaped nonsense, so each one
 * would be a fresh CDN key AND an upstream request for a day the backend has nothing to say about.
 * Four dates is the whole set the route can ever serve: only today and tomorrow carry a curve, and
 * park timezones run from UTC−12 to UTC+14, so a park's own "today" is within a day of the UTC date
 * and its "tomorrow" at most two ahead.
 *
 * `new Date('2026-02-30T00:00:00Z')` does not reject an impossible day, it rolls it forward, so the
 * parsed value is formatted back and compared — that comparison is what turns it into a refusal.
 */
export function isServableHourlyDate(date: string, nowMs: number): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false;

  const utcToday = Date.parse(`${new Date(nowMs).toISOString().slice(0, 10)}T00:00:00Z`);
  const daysFromUtcToday = Math.round((parsed.getTime() - utcToday) / 86_400_000);

  return daysFromUtcToday >= -1 && daysFromUtcToday <= 2;
}
