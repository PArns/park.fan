import {
  currentParkCalendarMonth,
  parkCalendarMonthIndex,
  parseParkCalendarMonthSpelling,
  shiftParkCalendarMonth,
} from '@/lib/parks/calendar-segments';
import { ORLANDO_REGION, ORLANDO_TIMEZONE, type OrlandoMonth } from './types';

/**
 * The Orlando hub's URLs and its month window. Client-safe and free of server imports, because the
 * header's More menu, the park bands and the planner all link here.
 *
 * "orlando" is the city's name and the word people search with in every language, so the segment
 * is the same in all six locales: no rewrite, no segment family in `lib/i18n/localized-path.ts`.
 */
export const ORLANDO_SEGMENT = 'orlando';

/** The anchor of chapter 02, the trip planner, which the hero's action and Parky's links open. */
export const ORLANDO_PLANNER_ID = 'planner';

/** The anchor of chapter 01, the calendar, for the park bands and the homepage teaser. */
export const ORLANDO_CALENDAR_ID = 'calendar';

/**
 * How many months the hub serves: the current month (the hub itself) and the eleven after it, in
 * Orlando time. Past `forecastUntil` a month reads last year's measured days with a banner.
 */
export const ORLANDO_MONTH_COUNT = 12;

/**
 * The locale-relative path of the hub or one of its months (`/orlando`, `/orlando/2026/12`);
 * `Link` from `@/i18n/navigation` adds the locale. The month is unpadded, so each month has one
 * URL; the proxy 308s the padded spelling.
 */
export function orlandoPath(month?: OrlandoMonth | null): string {
  return month ? `/${ORLANDO_SEGMENT}/${month.year}/${month.month}` : `/${ORLANDO_SEGMENT}`;
}

/**
 * The address to link a month by: the hub for the current month, whose canonical it is, and the
 * month's own URL for every other, so the site never mints a URL that only canonicals away.
 */
export function orlandoMonthHref(month: OrlandoMonth, current: OrlandoMonth): string {
  return isSameMonth(month, current) ? orlandoPath() : orlandoPath(month);
}

/** Whether two months are the same month. */
export function isSameMonth(a: OrlandoMonth, b: OrlandoMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/**
 * Today's month in Orlando, never the server's or the browser's: the hub, the window and the
 * proxy agree on which month "this month" is across midnight in Europe.
 */
export function currentOrlandoMonth(): OrlandoMonth {
  return currentParkCalendarMonth(ORLANDO_TIMEZONE);
}

/** The months the hub serves, from the current one on. */
export function orlandoMonths(now: OrlandoMonth): OrlandoMonth[] {
  return Array.from({ length: ORLANDO_MONTH_COUNT }, (_, i) => shiftParkCalendarMonth(now, i));
}

/** Whether a month is one the hub serves: the current one or one of the eleven after it. */
export function isOrlandoMonthInRange(month: OrlandoMonth, now: OrlandoMonth): boolean {
  const delta = parkCalendarMonthIndex(month) - parkCalendarMonthIndex(now);
  return delta >= 0 && delta < ORLANDO_MONTH_COUNT;
}

/**
 * The month the `[[...date]]` segments ask for: `null` for the hub, `'invalid'` for segments that
 * are not a month the hub serves (a 404, or a 308 the proxy has already answered), and `padded`
 * for `/2026/09`, which the proxy 308s to `/2026/9`.
 */
export function parseOrlandoMonth(
  segments: string[] | undefined,
  now: OrlandoMonth
): { month: OrlandoMonth | null; padded: boolean } | 'invalid' {
  if (!segments || segments.length === 0) return { month: null, padded: false };
  const spelled = parseParkCalendarMonthSpelling(segments);
  if (!spelled || !isOrlandoMonthInRange(spelled.month, now)) return 'invalid';
  return spelled;
}

/** The first and last day of a month, `YYYY-MM-DD`, for a `/calendar` or `/best-days` window. */
export function orlandoMonthRange({ year, month }: OrlandoMonth): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(lastDay)}` };
}

/** The month a `YYYY-MM-DD` date falls in. */
export function monthOfDate(date: string): OrlandoMonth {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) };
}

/** The trip-region routes a browser may ask through this site's relay. */
export type OrlandoRelayRoute = 'calendar' | 'best-days' | 'plan';

/**
 * Where a page asks for one of the keyed trip-region routes: the same-origin relay
 * (`app/api/trip-regions/[...path]/route.ts`), which adds the site's data key. The query names are
 * the API's own.
 */
export function orlandoRelayUrl(
  route: OrlandoRelayRoute,
  query: Record<string, string | undefined> = {}
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  const qs = params.toString();
  return `/api/trip-regions/${ORLANDO_REGION}/${route}${qs ? `?${qs}` : ''}`;
}
