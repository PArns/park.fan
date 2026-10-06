import type { Locale } from '@/i18n/config';
import { getDateTimeFormat } from '@/lib/utils/intl-format';

/**
 * Locale → localized URL segment for a park's wait-time calendar, and the month URLs under it
 * (`/parks/<geo>/<park>/wartezeiten-kalender/2026/9`). A park's „when should I go" gets its own
 * crawlable URLs rather than a hash. As with the glossary, the route folder is the English slug
 * and the other locales are rewritten onto it in `next.config.ts`.
 *
 * The segment sits where an attraction slug would, and Next matches the static segment first, so
 * a ride slugged like one of these would be shadowed; the next park sub-page needs the same care.
 * URL, tile and breadcrumb all say „wait-time calendar", the name visitors arrive with; title and
 * H1 name the month instead („Phantasialand Wartezeiten im August 2026"), which is what people
 * search for.
 */
export const PARK_CALENDAR_SEGMENTS: Record<Locale, string> = {
  en: 'wait-time-calendar',
  de: 'wartezeiten-kalender',
  fr: 'calendrier-temps-attente',
  it: 'calendario-tempi-attesa',
  nl: 'wachttijden-kalender',
  es: 'calendario-tiempos-espera',
};

/** The canonical route-folder segment (English), what the app router matches. */
export const PARK_CALENDAR_CANONICAL_SEGMENT = PARK_CALENDAR_SEGMENTS.en;

/**
 * Locale-relative path to a park's calendar, optionally for one month; `@/i18n/navigation`'s
 * `Link` adds the locale. The month is written unpadded (`/2026/9`) so each month has exactly one
 * URL; the route redirects the padded form.
 */
export function parkCalendarPath(
  locale: Locale | string,
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  month?: { year: number; month: number }
): string {
  const segment = PARK_CALENDAR_SEGMENTS[locale as Locale] ?? PARK_CALENDAR_CANONICAL_SEGMENT;
  const base = `/parks/${continent}/${country}/${city}/${parkSlug}/${segment}`;
  return month ? `${base}/${month.year}/${month.month}` : base;
}

/**
 * How far a month URL may reach, counted in months from the current one. The API answers any
 * range, past a park's season with every day `CLOSED`, so the route has to stop somewhere.
 *
 * Asymmetric on purpose. Forward is the planning surface and is trimmed per park by
 * `scheduleCoverage` ({@link parkCalendarMonthsForward}). Back is three: the months a visitor
 * might compare against, and the window the backend keeps warm (older months are slow cold paths
 * that the sitemap would hand crawlers). Months that fall out 308 to the hub.
 * See docs/optimization/decisions.md (2026-09-01, calendar back span).
 */
export const PARK_CALENDAR_MONTH_SPAN = { back: 3, forward: 12 } as const;

/**
 * The first day the wait-time archive holds anything at all. Written down rather than inferred,
 * because a zero-day month in the payload cannot tell „closed for the winter" from „not recorded".
 */
export const CALENDAR_DATA_START = { year: 2025, month: 12, day: 26 } as const;

/** Months since year 0, so a window can be checked without date arithmetic. */
export const parkCalendarMonthIndex = ({ year, month }: ParkCalendarMonth) =>
  year * 12 + (month - 1);

const monthIndex = parkCalendarMonthIndex;

/**
 * The oldest month a calendar page may serve: the first one the archive covers completely. A
 * partial month would read „an 6 von 31 Tagen geöffnet", true only about our recording.
 */
const EARLIEST_CALENDAR_MONTH: ParkCalendarMonth = shiftParkCalendarMonth(
  { year: CALENDAR_DATA_START.year, month: CALENDAR_DATA_START.month },
  CALENDAR_DATA_START.day > 1 ? 1 : 0
);

/**
 * How many months back the calendar reaches today: the smaller of the span and the distance to
 * {@link EARLIEST_CALENDAR_MONTH}. One source for the route's range check, the month index and
 * the sitemap, so none of them links or serves past the edge.
 */
export function parkCalendarMonthsBack(now: ParkCalendarMonth): number {
  const available = monthIndex(now) - monthIndex(EARLIEST_CALENDAR_MONTH);
  return Math.max(0, Math.min(PARK_CALENDAR_MONTH_SPAN.back, available));
}

/**
 * How many months forward this park's calendar says anything. Past a park's published schedule
 * the API still answers, with every day `CLOSED` or a constant fallback, so the forward window
 * ends at the month `coverageTo` (`scheduleCoverage.to`) falls in.
 *
 * `null` and `undefined` mean „no answer" (no schedule, or a payload cached before the field) and
 * must not shorten anything: narrowing on absent data would delete pages the day a cache went cold.
 */
export function parkCalendarMonthsForward(
  now: ParkCalendarMonth,
  coverageTo: string | null | undefined
): number {
  if (!coverageTo) return PARK_CALENDAR_MONTH_SPAN.forward;
  const [year, month] = coverageTo.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return PARK_CALENDAR_MONTH_SPAN.forward;
  }
  const covered = monthIndex({ year, month }) - monthIndex(now);
  return Math.max(0, Math.min(PARK_CALENDAR_MONTH_SPAN.forward, covered));
}

/** A calendar month, 1-based. */
export interface ParkCalendarMonth {
  year: number;
  month: number;
}

/**
 * Parse the optional `[[...date]]` catch-all into a month. `null` month means the hub; `'invalid'`
 * means segments that were there and wrong, a 404 rather than a silent fall back to the hub (which
 * would put the same content on unbounded URLs). `padded` flags a `/2026/09` that should 308 to
 * `/2026/9`.
 */
export function parseParkCalendarMonth(
  segments: string[] | undefined,
  now: ParkCalendarMonth,
  coverageTo?: string | null
): { month: ParkCalendarMonth | null; padded: boolean } | 'invalid' {
  if (!segments || segments.length === 0) return { month: null, padded: false };

  const spelled = parseParkCalendarMonthSpelling(segments);
  if (!spelled) return 'invalid';
  if (!isParkCalendarMonthInRange(spelled.month, now, coverageTo)) return 'invalid';

  return spelled;
}

/**
 * Whether two URL segments spell a month, not whether the route serves it: `/2026/13` is a typo
 * and stays a 404, while an out-of-window real month 308s to the hub. Shared by the route and
 * `parkCalendarRedirect` so the spelling rule cannot drift.
 */
export function parseParkCalendarMonthSpelling(
  segments: string[] | undefined
): { month: ParkCalendarMonth; padded: boolean } | null {
  if (!segments || segments.length !== 2) return null;

  const [rawYear, rawMonth] = segments;
  if (!/^\d{4}$/.test(rawYear) || !/^\d{1,2}$/.test(rawMonth)) return null;

  const year = Number(rawYear);
  const month = Number(rawMonth);
  if (month < 1 || month > 12) return null;

  // `09` and `9` must not be two URLs; the only padded form left after the 1–12 check is `0[1-9]`.
  return { month: { year, month }, padded: rawMonth.length === 2 && rawMonth.startsWith('0') };
}

/** The month before/after, rolling the year over. Used for the crawlable prev/next links. */
export function shiftParkCalendarMonth(
  { year, month }: ParkCalendarMonth,
  delta: number
): ParkCalendarMonth {
  const zero = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zero / 12), month: (zero % 12) + 1 };
}

/** Whether a month is inside the window the route serves, so prev/next links never point at a
 *  404. Pass `scheduleCoverage.to` as `coverageTo` wherever the park payload is in scope; without
 *  it the forward edge is the fixed span. */
export function isParkCalendarMonthInRange(
  month: ParkCalendarMonth,
  now: ParkCalendarMonth,
  coverageTo?: string | null
): boolean {
  const delta = monthIndex(month) - monthIndex(now);
  return (
    delta >= -parkCalendarMonthsBack(now) && delta <= parkCalendarMonthsForward(now, coverageTo)
  );
}

/**
 * Today's month in the park's timezone, never the server's or browser's, so the page and the grid
 * agree on which month „this month" is across a month boundary. Uses the cached formatter, since
 * `proxy.ts` calls it for every calendar month URL.
 */
export function currentParkCalendarMonth(timezone: string | null | undefined): ParkCalendarMonth {
  const parts = getDateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month') };
}
