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
 * anything renders: a redirect thrown from a Server Component still renders the whole layout as
 * its body.
 *
 * The park is not needed: the rule comes from `./calendar-segments`, the module the route reads,
 * the park's timezone moves "today" by at most a day, and `scheduleCoverage.to` can only shorten
 * the window. So a month outside the widest window for every possible "today" is outside for every
 * park. Everything else returns `null` and the route decides.
 * See docs/rules/a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md.
 */

/**
 * The months it could be „today" for some park right now. `Etc/GMT+12` is UTC−12 and `Etc/GMT-14`
 * is UTC+14 (the POSIX sign is inverted): the two ends of the inhabited offsets. Usually one month.
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
 * `pathname` is the request path as it arrives, localized segment and all: the proxy runs before
 * the rewrite that serves the other locales on the English route folder.
 */
export function parkCalendarRedirect(pathname: string): string | null {
  // '', locale, 'parks', continent, country, city, park, calendar segment, year, month
  const parts = pathname.split('/');
  if (parts.length !== 10) return null;

  const [, locale, parksSegment, continent, country, city, parkSlug, calendarSegment] = parts;
  if (parksSegment !== 'parks' || !isValidLocale(locale)) return null;
  if (calendarSegment !== PARK_CALENDAR_SEGMENTS[locale as Locale]) return null;
  // The guard the page runs first: an unresolvable segment is a 404 before any redirect.
  if (!isServableRoute(locale, continent, country, city, parkSlug)) return null;

  const spelled = parseParkCalendarMonthSpelling(parts.slice(8));
  // `/2026/13` and `/abc/x` are a typo or a probe; the route 404s them.
  if (!spelled) return null;

  const nowMonths = candidateNowMonths();
  const inRange = (now: ParkCalendarMonth) => isParkCalendarMonthInRange(spelled.month, now);

  if (!nowMonths.some(inRange)) {
    return `/${locale}${parkCalendarPath(locale, continent, country, city, parkSlug)}`;
  }

  if (!spelled.padded) return null;
  // `/2026/09` 308s to `/2026/9` only for a month this route certainly serves: in range for every
  // candidate „today", and not in the future, where a park's `scheduleCoverage.to` could still
  // make it the hub redirect above instead.
  const isFuture = nowMonths.some(
    (now) => parkCalendarMonthIndex(spelled.month) > parkCalendarMonthIndex(now)
  );
  if (isFuture || !nowMonths.every(inRange)) return null;

  return `/${locale}${parkCalendarPath(locale, continent, country, city, parkSlug, spelled.month)}`;
}
