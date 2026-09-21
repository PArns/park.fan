import { isValidLocale, type Locale } from '@/i18n/config';
import { isServableRoute } from '@/lib/utils/servable-route';
import {
  PARK_CALENDAR_SEGMENTS,
  currentParkCalendarMonth,
  isParkCalendarMonthInRange,
  parkCalendarMonthIndex,
  parkCalendarPath,
  parseParkCalendarMonthSpelling,
  type ParkCalendarMonth,
} from './calendar-segments';

/**
 * The calendar's month redirects, decided from the URL alone so `proxy.ts` can answer them before
 * anything renders.
 *
 * **Why this exists at all.** A `redirect()` or `permanentRedirect()` thrown from a Server
 * Component does not produce a bare `Location`. Next catches it, sets the status and the header,
 * and then still renders a document as the body — `UNDERSCORE_NOT_FOUND_ROUTE_ENTRY` through the
 * root and locale layouts (`next/dist/server/app-render/app-render.js`, the `isRedirectError`
 * branch). Measured on 2026-09-21: an out-of-range calendar month answered `308` with **81,963 B**
 * in production and 75,832 B against a local `next start`, of which 77,152 B were the locale
 * layout's inlined flight payload. That is 1.4× the ~58 kB brotli page the redirect refuses, it
 * carries no `content-encoding`, and it grows with the layout rather than with the redirect — the
 * same body was 72,235 B eighteen days earlier. The calendar is ~21,948 of those URLs and every
 * month rollover adds 1,260 more (210 parks × 6 locales), so this is not a decaying transition.
 *
 * **Why the window can be decided here without the park.** It was deferred once (2026-09-01, in
 * `docs/optimization/decisions.md`) on the grounds that a proxy-level month check would be a
 * second copy of the month rule living where nothing renders it. It is not one: every function
 * below comes from `./calendar-segments`, the same module the route reads, and the park-specific
 * halves of the rule resolve without asking the API.
 *
 * - The park's timezone only moves which DAY it is by up to a day, so today's month is one of the
 *   two the extreme zones report. On all but a day or so per month they are the same month.
 * - `scheduleCoverage.to` can only SHORTEN the forward window ({@link parkCalendarMonthsForward}),
 *   never lengthen it, so omitting it gives the widest window any park could have.
 *
 * A month outside that widest window, for every month it could be today anywhere, is outside for
 * every park — the route would 308 it to the hub and nothing it fetches could say otherwise.
 * Everything else returns `null` and falls through to the route unchanged, which keeps the route
 * the place the rule is applied and this the place a subset of its answers is anticipated.
 */

/**
 * The months it could be "today" for some park right now.
 *
 * `Etc/GMT+12` is UTC−12 and `Etc/GMT-14` is UTC+14 — the POSIX sign is inverted, which is the one
 * thing to get wrong here. Those two are the ends of the inhabited offset range, so a park's own
 * month is one of them; they differ only across a month boundary, and the pair collapses to one
 * entry the rest of the time.
 */
function candidateNowMonths(): ParkCalendarMonth[] {
  const earliest = currentParkCalendarMonth('Etc/GMT+12');
  const latest = currentParkCalendarMonth('Etc/GMT-14');
  return earliest.year === latest.year && earliest.month === latest.month
    ? [earliest]
    : [earliest, latest];
}

/**
 * The path a park calendar month URL should be 308'd to, or `null` to let the route decide.
 *
 * `pathname` is the request path as it arrives, localized segment and all — the proxy runs before
 * the rewrite in `next.config.ts` that serves the other five locales on the English route folder.
 */
export function parkCalendarRedirect(pathname: string): string | null {
  // '', locale, 'parks', continent, country, city, park, calendar segment, year, month
  const parts = pathname.split('/');
  if (parts.length !== 10) return null;

  const [, locale, parksSegment, continent, country, city, parkSlug, calendarSegment] = parts;
  if (parksSegment !== 'parks' || !isValidLocale(locale)) return null;
  if (calendarSegment !== PARK_CALENDAR_SEGMENTS[locale as Locale]) return null;
  // The same guard the page runs first, for the same reason: a segment the API can never resolve
  // is a 404 before any redirect is considered, and that must not change because the answer now
  // comes earlier.
  if (!isServableRoute(locale, continent, country, city, parkSlug)) return null;

  const spelled = parseParkCalendarMonthSpelling(parts.slice(8));
  // `/2026/13` and `/abc/x` are a typo or a probe. The route 404s them and keeps doing so.
  if (!spelled) return null;

  const nowMonths = candidateNowMonths();
  const inRange = (now: ParkCalendarMonth) => isParkCalendarMonthInRange(spelled.month, now);

  if (!nowMonths.some(inRange)) {
    return `/${locale}${parkCalendarPath(locale, continent, country, city, parkSlug)}`;
  }

  if (!spelled.padded) return null;
  // `/2026/09` 308s to `/2026/9`, but only for a month this route certainly serves. "Certainly" is
  // two conditions: in range whichever of the candidate months is today, and not in the future —
  // a future month is the one place a park's `scheduleCoverage.to` could still turn this redirect
  // into the one above, and the target differs.
  const isFuture = nowMonths.some(
    (now) => parkCalendarMonthIndex(spelled.month) > parkCalendarMonthIndex(now)
  );
  if (isFuture || !nowMonths.every(inRange)) return null;

  return `/${locale}${parkCalendarPath(locale, continent, country, city, parkSlug, spelled.month)}`;
}
