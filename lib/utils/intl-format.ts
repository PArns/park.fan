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

/** Cached equivalent of `new Date(ms).toLocaleTimeString(locale, options)`. */
export function formatTime(
  value: number | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions
): string {
  return getDateTimeFormat(locale, options).format(value);
}
