import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment for a park's crowd calendar, and the month URLs under it.
 *
 * The calendar used to be `#calendar` on the park page — a tab whose content was mounted lazily,
 * whose URL was written with `history.replaceState` and whose month stepper wrote
 * `#calendar-2026-04`. A hash is not a page: it cannot be crawled, cannot carry its own title or
 * description, cannot be linked to from a search result, and `replaceState` means the back button
 * does not undo it. A park's "when should I go" is a question with its own answer, so it gets its
 * own URL — and so does each month of it: `/parks/<geo>/<park>/andrangskalender/2026/9`.
 *
 * Same mechanism as the glossary, the best-travel-time hub and the guide: the canonical route
 * folder is the English slug and the other five locales are served on it via a rewrite in
 * `next.config.ts`.
 *
 * The segment sits in the same position as an attraction slug, so a ride slugged
 * `andrangskalender` would be shadowed by this route — Next matches the static segment before
 * `[attraction]`. No ride in the catalogue is, and these six words are not ride names in any
 * language; it is written down here because the next person to add a park sub-page needs the rule.
 *
 * The URL segment and the H1 say `Andrangskalender`, because that is what the page shows: a crowd
 * level per day, with opening hours, weather and holidays behind it.
 *
 * The TILE in the header row says `Wartezeiten-Kalender` instead, and the difference is deliberate.
 * The two words are read at different moments: on the calendar page the heading answers „what am I
 * looking at", where „Andrang" is the accurate word; in the tile row it answers „where does this
 * take me" from a park page about wait times, and „Wartezeiten-Kalender" is the phrase a visitor
 * came with. The label lives in `parks.tileCalendarLabel` and is the only place the two part ways
 * — meta title, description and intro carry both terms anyway.
 */
export const PARK_CALENDAR_SEGMENTS: Record<Locale, string> = {
  en: 'crowd-calendar',
  de: 'andrangskalender',
  fr: 'calendrier-affluence',
  it: 'calendario-affluenza',
  nl: 'drukte-kalender',
  es: 'calendario-afluencia',
};

/** The canonical route-folder segment (English), what the app router matches. */
export const PARK_CALENDAR_CANONICAL_SEGMENT = PARK_CALENDAR_SEGMENTS.en;

/**
 * Locale-relative path to a park's calendar, e.g.
 * `/parks/europe/germany/bruehl/phantasialand/andrangskalender`, optionally for one month.
 *
 * Locale-RELATIVE because every link to it goes through `@/i18n/navigation`'s `Link`, which
 * prefixes the locale itself. Pass the same geo segments the park page was rendered with.
 *
 * The month is written UNPADDED (`/2026/9`, never `/2026/09`) so there is exactly one spelling of
 * each month; the route redirects the padded form to this one, because two URLs for one month is
 * the duplicate this whole exercise exists to avoid.
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
 * How far a month URL may reach, counted in MONTHS from the current one.
 *
 * Not a taste call: the API answers `/calendar` for any range, and past a park's published season
 * it answers every day `CLOSED` — measured on Phantasialand, March 2027 came back as 31 closed
 * days with no hours, no weather and no forecast. So the route has to stop somewhere, and 12 back
 * / 12 forward is where the data still says something: a year back for "how was it", a year ahead
 * for planning.
 *
 * Counted in months rather than in years on purpose. A year-based check (`back: 1, forward: 2`)
 * reads as "a year and a bit" and serves up to three years in December — 212 parks × 6 locales ×
 * 36 months is ~46k indexable URLs, most of them an all-CLOSED grid under a real-looking title.
 */
export const PARK_CALENDAR_MONTH_SPAN = { back: 12, forward: 12 } as const;

/** Months since year 0, so a window can be checked without date arithmetic. */
const monthIndex = ({ year, month }: ParkCalendarMonth) => year * 12 + (month - 1);

export interface ParkCalendarMonth {
  year: number;
  month: number;
}

/**
 * Parse the optional `[[...date]]` catch-all into a month.
 *
 * Three outcomes, and the caller has to tell them apart: `null` means "no month given" (the hub),
 * a month object means a valid one, and `'invalid'` means the segments were there and wrong —
 * which is a 404, not a silent fall back to the hub. `/andrangskalender/2026/13` is somebody's
 * typo or a crawler probing, and answering it with the current month would put the same content
 * on unbounded URLs.
 *
 * `padded` reports a `/2026/09` that should 308 to `/2026/9`, so a link written either way lands
 * on one canonical URL rather than on two pages with the same content.
 */
export function parseParkCalendarMonth(
  segments: string[] | undefined,
  now: ParkCalendarMonth
): { month: ParkCalendarMonth | null; padded: boolean } | 'invalid' {
  if (!segments || segments.length === 0) return { month: null, padded: false };
  if (segments.length !== 2) return 'invalid';

  const [rawYear, rawMonth] = segments;
  if (!/^\d{4}$/.test(rawYear) || !/^\d{1,2}$/.test(rawMonth)) return 'invalid';

  const year = Number(rawYear);
  const month = Number(rawMonth);
  if (month < 1 || month > 12) return 'invalid';
  if (!isParkCalendarMonthInRange({ year, month }, now)) return 'invalid';

  // `09` and `9` are the same month and must not be two URLs. `0` alone is already out on the
  // range check above, so the only padded form left is a leading zero on 1–9.
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

/** Whether a month is inside the window the route serves — the prev/next links check it so they
 *  never point at a 404. */
export function isParkCalendarMonthInRange(
  month: ParkCalendarMonth,
  now: ParkCalendarMonth
): boolean {
  const delta = monthIndex(month) - monthIndex(now);
  return delta >= -PARK_CALENDAR_MONTH_SPAN.back && delta <= PARK_CALENDAR_MONTH_SPAN.forward;
}

/**
 * Today's month in a given timezone.
 *
 * The park's zone, never the server's or the browser's: a park in Florida is still on yesterday's
 * date for six hours after midnight in Berlin, and "this month" on its calendar has to mean the
 * month it is there. One implementation, because the page computes the hub's neighbouring months
 * and the grid decides which month to draw, and the two disagreeing across a month boundary is a
 * stepper pointing one month off.
 */
export function currentParkCalendarMonth(timezone: string | null | undefined): ParkCalendarMonth {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month') };
}
