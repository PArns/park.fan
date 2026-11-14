import {
  currentParkCalendarMonth,
  parkCalendarMonthIndex,
  parseParkCalendarMonthSpelling,
  shiftParkCalendarMonth,
} from '@/lib/parks/calendar-segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import type { Locale } from '@/i18n/config';
import {
  bestTimePageOf,
  requireTripRegion,
  tripRegionSegment,
  type TripRegionConfig,
} from './registry';
import type { TripMonth } from './types';

/**
 * A trip region hub's URLs and its month window. Client-safe and free of server imports, because
 * the header's menus, the park bands and the planner all link here. Every path is locale-relative
 * (`Link` from `@/i18n/navigation` adds the locale) and takes the locale anyway, because the
 * region's segment is spelled per locale (`/kalifornien`, `/california`); the registry has the
 * spellings. The route behind them is one, rewritten in `next.config.ts`
 * (docs/features/trip-regions.md).
 */

/** The anchor of the hub's planner chapter, which the hero's action and Parky's links open. */
export const TRIP_PLANNER_ID = 'planner';

/**
 * The region's guide to its planner, a blog post (`/blog/<slug>` in the locale), where the planner's
 * options are explained at length; `null` where the region has none yet.
 */
export function tripRegionGuidePath(
  region: Pick<TripRegionConfig, 'guide'>,
  locale: string
): string | null {
  const slug = region.guide?.[locale as Locale] ?? region.guide?.en;
  return slug ? `/blog/${slug}` : null;
}

/** The anchor of chapter 01, the calendar, for the park bands and the homepage teaser. */
export const TRIP_CALENDAR_ID = 'calendar';

/** The anchor of the hub's question on how far and how well the forecast reaches. */
export const TRIP_ACCURACY_ID = 'faq-accuracy';

/**
 * How many months a hub serves: the current month (the hub itself) and the eleven after it, in the
 * region's time. Past `forecastUntil` a month reads last year's measured days with a banner.
 */
export const TRIP_REGION_MONTH_COUNT = 12;

/**
 * The locale-relative path of a region's hub or one of its months (`/orlando`, `/orlando/2026/12`).
 * The month is unpadded, so each month has one URL; the proxy 308s the padded spelling.
 */
export function tripRegionPath(
  region: string,
  locale: Locale | string,
  month?: TripMonth | null
): string {
  const segment = tripRegionSegment(requireTripRegion(region), locale);
  return month ? `/${segment}/${month.year}/${month.month}` : `/${segment}`;
}

/**
 * The locale-relative path of a region's "best time to visit" pages: the region's own
 * (`/orlando/beste-reisezeit`) or a resort's (`/orlando/best-time-to-visit/disney-world`). The
 * segment is the best-time hub's own word per locale (`BEST_TIME_SEGMENTS`), the query people
 * use; the resort segments are the same in every language.
 *
 * @param page a page id from the region's `bestTime` (`region`, `disney-world`); absent, the
 *   region's own page
 */
export function tripRegionBestTimePath(
  region: string,
  locale: Locale | string,
  page?: string
): string {
  const segment = BEST_TIME_SEGMENTS[locale as Locale] ?? BEST_TIME_SEGMENTS.en;
  const resort = page ? bestTimePageOf(requireTripRegion(region), page)?.segment : undefined;
  return `${tripRegionPath(region, locale)}/${segment}${resort ? `/${resort}` : ''}`;
}

/**
 * A region's hub and every best-time page of it in a locale, locale-relative: the pages that stand
 * for the region in a search, without its months. IndexNow's static set and the landing-page checks
 * read them, so a region that goes live joins both.
 */
export function tripRegionLandingPaths(region: string, locale: Locale | string): string[] {
  return [
    tripRegionPath(region, locale),
    ...requireTripRegion(region).bestTime.map((page) =>
      tripRegionBestTimePath(region, locale, page.id)
    ),
  ];
}

/**
 * The address to link a month by: the hub for the current month, whose canonical it is, and the
 * month's own URL for every other, so the site never mints a URL that only canonicals away.
 */
export function tripRegionMonthHref(
  region: string,
  locale: Locale | string,
  month: TripMonth,
  current: TripMonth
): string {
  return tripRegionPath(region, locale, isSameMonth(month, current) ? null : month);
}

/** Whether two months are the same month. */
export function isSameMonth(a: TripMonth, b: TripMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/**
 * Today's month in the region, never the server's or the browser's: the hub, the window and the
 * proxy agree on which month "this month" is across midnight elsewhere.
 */
export function currentTripRegionMonth(region: string): TripMonth {
  return currentParkCalendarMonth(requireTripRegion(region).timezone);
}

/** The months a hub serves, from the current one on. */
export function tripRegionMonths(now: TripMonth): TripMonth[] {
  return Array.from({ length: TRIP_REGION_MONTH_COUNT }, (_, i) => shiftParkCalendarMonth(now, i));
}

/**
 * The years a hub's months span, for its `<title>` (`{years}`): "2026–2027", or the one year from
 * January. Read from the region's current month on every request, so the title rolls over without
 * a deploy, in the park's time and not the server's.
 */
export function tripRegionYears(now: TripMonth): string {
  const months = tripRegionMonths(now);
  const first = months[0].year;
  const last = months[months.length - 1].year;
  return first === last ? String(first) : `${first}–${last}`;
}

/** Whether a month is one a hub serves: the current one or one of the eleven after it. */
export function isTripRegionMonthInRange(month: TripMonth, now: TripMonth): boolean {
  const delta = parkCalendarMonthIndex(month) - parkCalendarMonthIndex(now);
  return delta >= 0 && delta < TRIP_REGION_MONTH_COUNT;
}

/**
 * The month the `[[...date]]` segments ask for: `null` for the hub, `'invalid'` for segments that
 * are not a month the hub serves (a 404, or a 308 the proxy has already answered), and `padded`
 * for `/2026/09`, which the proxy 308s to `/2026/9`.
 */
export function parseTripRegionMonth(
  segments: string[] | undefined,
  now: TripMonth
): { month: TripMonth | null; padded: boolean } | 'invalid' {
  if (!segments || segments.length === 0) return { month: null, padded: false };
  const spelled = parseParkCalendarMonthSpelling(segments);
  if (!spelled || !isTripRegionMonthInRange(spelled.month, now)) return 'invalid';
  return spelled;
}

/** The first and last day of a month, `YYYY-MM-DD`, for a `/calendar` or `/best-days` window. */
export function tripMonthRange({ year, month }: TripMonth): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(lastDay)}` };
}

/** The month a `YYYY-MM-DD` date falls in. */
export function monthOfDate(date: string): TripMonth {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) };
}

/** The trip-region routes a browser may ask through this site's relay. */
export type TripRelayRoute = 'calendar' | 'best-days' | 'plan' | 'when' | 'school-breaks';

/**
 * Where a page asks for one of a region's keyed routes: the same-origin relay
 * (`app/api/trip-regions/[...path]/route.ts`), which adds the site's data key. The query names are
 * the API's own.
 */
export function tripRegionRelayUrl(
  region: string,
  route: TripRelayRoute,
  query: Record<string, string | undefined> = {}
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  const qs = params.toString();
  return `/api/trip-regions/${encodeURIComponent(region)}/${route}${qs ? `?${qs}` : ''}`;
}
