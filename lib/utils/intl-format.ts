/**
 * Cached `Intl` formatter factories.
 *
 * Constructing an `Intl.DateTimeFormat` is one of the most expensive things a render can do —
 * it resolves locale data and builds an internal pattern, on the order of tens of microseconds
 * each, far more than the `format()` call it precedes. Several hot paths built a fresh one per
 * item:
 *
 * - `WaitTimeSparklineCard` formats 4 axis ticks per card. A big park mounts ~100 of them, and
 *   they all re-render together on the shared minute clock — ~400 formatter constructions every
 *   single minute.
 * - `DailyWaitTimeChartClient` built one per hourly-forecast entry and per best-visit slot.
 * - `DailyWaitTimeChart` built one per 15-minute slot label (~40 per chart).
 * - The nowcast timeline, hourly weather chart, queue badges and typical-waits table did the
 *   same per label.
 *
 * The set of distinct (locale, options) pairs the app uses is tiny and fixed, so caching them in
 * a module-level Map turns all of that into a map lookup. The cache is unbounded by design —
 * every key comes from a literal options object in the codebase, so it cannot grow with data.
 *
 * Use these instead of `new Intl.DateTimeFormat(...)` / `date.toLocaleTimeString(locale, opts)`
 * anywhere a formatter would be built more than once.
 */

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();

/** Stable cache key — options key order must not produce distinct entries. */
function cacheKey(locale: string | string[] | undefined, options: object | undefined): string {
  const loc = Array.isArray(locale) ? locale.join(',') : (locale ?? '');
  if (!options) return `${loc}|`;
  const entries = Object.entries(options)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `${loc}|${JSON.stringify(entries)}`;
}

/** Cached {@link Intl.DateTimeFormat}. Same arguments → same instance. */
export function getDateTimeFormat(
  locale?: string | string[],
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  const key = cacheKey(locale, options);
  let formatter = dateTimeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateTimeFormatters.set(key, formatter);
  }
  return formatter;
}

/** Cached {@link Intl.NumberFormat}. Same arguments → same instance. */
export function getNumberFormat(
  locale?: string | string[],
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const key = cacheKey(locale, options);
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

const relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>();

/** Cached {@link Intl.RelativeTimeFormat}. Same arguments → same instance. */
export function getRelativeTimeFormat(
  locale?: string | string[],
  options?: Intl.RelativeTimeFormatOptions
): Intl.RelativeTimeFormat {
  const key = cacheKey(locale, options);
  let formatter = relativeTimeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, options);
    relativeTimeFormatters.set(key, formatter);
  }
  return formatter;
}

/** Cached equivalent of `new Date(ms).toLocaleTimeString(locale, options)`. */
export function formatTime(
  value: number | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions
): string {
  return getDateTimeFormat(locale, options).format(value);
}

/**
 * The weekday name for a day index, 0 = Sunday … 6 = Saturday — the convention of the API's
 * `DayOfWeekStat.dayOfWeek` and of `Date#getUTCDay`.
 *
 * Anchored in UTC on both ends: 2023-01-01 was a Sunday, and a UTC midnight formatted in the
 * runtime's own zone is the day before for anyone west of Greenwich. Several copies of this built
 * that date and formatted it without `timeZone`, which only held because the servers run on UTC.
 */
export function weekdayName(
  dayOfWeek: number,
  locale: string,
  width: 'long' | 'short' = 'long'
): string {
  return getDateTimeFormat(locale, { weekday: width, timeZone: 'UTC' }).format(
    Date.UTC(2023, 0, 1 + dayOfWeek)
  );
}

/**
 * Today's hours as short as the locale allows: „09:00–18:00" in German, „9 AM–6 PM" in English.
 *
 * For the homepage hero's hours tile, which is half a phone wide. Written the site's usual way
 * (`hour: '2-digit'`, `minute: '2-digit'`) the English range is „09:00 AM – 06:00 PM", about 130 px.
 * A 12-hour clock drops a `:00` it does not need; a 24-hour one keeps both digits, because „9–18"
 * reads as a date range as easily as a time.
 *
 * Not `formatRange`: two times that fall on different days in the park's zone (a park closing at
 * 01:00) come back from it with both dates written out.
 */
export function formatHoursRange(
  openingIso: string,
  closingIso: string,
  locale: string,
  timeZone: string
): string {
  const twelveHour = ['h11', 'h12'].includes(
    getDateTimeFormat(locale, { hour: 'numeric', timeZone }).resolvedOptions().hourCycle ?? ''
  );
  const format = (iso: string) => {
    const at = new Date(iso);
    if (!twelveHour)
      return formatTime(at, locale, { hour: '2-digit', minute: '2-digit', timeZone });
    // Minutes alone come back unpadded („0"), so the check is numeric.
    const onTheHour = Number(formatTime(at, 'en-GB', { minute: 'numeric', timeZone })) === 0;
    return formatTime(
      at,
      locale,
      onTheHour ? { hour: 'numeric', timeZone } : { hour: 'numeric', minute: '2-digit', timeZone }
    );
  };
  return `${format(openingIso)}–${format(closingIso)}`;
}
