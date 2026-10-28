/**
 * Cached `Intl` formatter factories. Constructing a formatter costs far more than the `format()`
 * that follows, and hot paths (sparkline axes on every card, re-rendered each minute) built one
 * per item. The distinct (locale, options) pairs are few and come from literals in the code, so an
 * unbounded module-level Map is safe. Use these instead of `new Intl.DateTimeFormat(...)` or
 * `toLocaleTimeString(locale, opts)`. See docs/rules/a-render-redoes-no-work.md.
 */

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();

/** Stable cache key, so options key order does not produce distinct entries. */
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

/**
 * Node 22 (CLDR 47) prints Italian "7580", Chromium "7.580", so a four-digit figure rendered on the
 * server and again in the browser differed and React threw #418 on /it. Grouping is forced on for
 * Italian until both engines agree.
 */
function pinnedNumberOptions(
  locale: string | string[] | undefined,
  options: Intl.NumberFormatOptions | undefined
): Intl.NumberFormatOptions | undefined {
  const first = Array.isArray(locale) ? locale[0] : locale;
  if (!first?.startsWith('it') || options?.useGrouping !== undefined) return options;
  return { ...options, useGrouping: 'always' };
}

/** Cached {@link Intl.NumberFormat}. Same arguments → same instance. */
export function getNumberFormat(
  locale?: string | string[],
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const key = cacheKey(locale, options);
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, pinnedNumberOptions(locale, options));
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

const languageDisplayNames = new Map<string, Intl.DisplayNames>();

/** A language's name in `locale`: `languageName('de', 'en')` → "Englisch". Cached like the rest. */
export function languageName(locale: string, code: string): string {
  let names = languageDisplayNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([locale], { type: 'language' });
    languageDisplayNames.set(locale, names);
  }
  return names.of(code) ?? code;
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

const listFormatters = new Map<string, Intl.ListFormat>();

/** Cached {@link Intl.ListFormat}. Same arguments → same instance. */
export function getListFormat(
  locale?: string | string[],
  options?: Intl.ListFormatOptions
): Intl.ListFormat {
  const key = cacheKey(locale, options);
  let formatter = listFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.ListFormat(locale, options);
    listFormatters.set(key, formatter);
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

/** Day indices (0 = Sunday, as `weekdayName` counts) in the Monday-first order every week on the site is drawn in. */
export const WEEKDAYS_MONDAY_FIRST: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

/**
 * The weekday name for a day index, 0 = Sunday … 6 = Saturday, as the API's
 * `DayOfWeekStat.dayOfWeek` and `Date#getUTCDay` count. Anchored in UTC on both ends: a UTC
 * midnight formatted in the runtime's zone is the day before anywhere west of Greenwich.
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
 * One clock time as short as the locale allows: „09:00" in German, „9 AM" or „9:30 AM" in English.
 * A 12-hour clock drops a `:00` it does not need; a 24-hour one keeps both digits, since „9–18"
 * reads like a date range.
 */
export function formatClockTime(iso: string, locale: string, timeZone: string): string {
  const twelveHour = ['h11', 'h12'].includes(
    getDateTimeFormat(locale, { hour: 'numeric', timeZone }).resolvedOptions().hourCycle ?? ''
  );
  const at = new Date(iso);
  if (!twelveHour) return formatTime(at, locale, { hour: '2-digit', minute: '2-digit', timeZone });
  // Minutes alone come back unpadded („0"), so the check is numeric.
  const onTheHour = Number(formatTime(at, 'en-GB', { minute: 'numeric', timeZone })) === 0;
  return formatTime(
    at,
    locale,
    onTheHour ? { hour: 'numeric', timeZone } : { hour: 'numeric', minute: '2-digit', timeZone }
  );
}

/**
 * Today's hours as short as the locale allows ({@link formatClockTime}): „09:00–18:00" in German,
 * „9 AM–6 PM" in English, for the homepage hero's half-width hours tile. Not `formatRange`, which
 * writes out both dates when a park closes after midnight.
 */
export function formatHoursRange(
  openingIso: string,
  closingIso: string,
  locale: string,
  timeZone: string
): string {
  return `${formatClockTime(openingIso, locale, timeZone)}–${formatClockTime(closingIso, locale, timeZone)}`;
}
