import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment for a park's wait-time calendar, and the month URLs under it.
 *
 * The calendar used to be `#calendar` on the park page — a tab whose content was mounted lazily,
 * whose URL was written with `history.replaceState` and whose month stepper wrote
 * `#calendar-2026-04`. A hash is not a page: it cannot be crawled, cannot carry its own title or
 * description, cannot be linked to from a search result, and `replaceState` means the back button
 * does not undo it. A park's "when should I go" is a question with its own answer, so it gets its
 * own URL — and so does each month of it: `/parks/<geo>/<park>/wartezeiten-kalender/2026/9`.
 *
 * Same mechanism as the glossary, the best-travel-time hub and the guide: the canonical route
 * folder is the English slug and the other five locales are served on it via a rewrite in
 * `next.config.ts`.
 *
 * The segment sits in the same position as an attraction slug, so a ride slugged
 * `wartezeiten-kalender` would be shadowed by this route — Next matches the static segment before
 * `[attraction]`. No ride in the catalogue is, and these six words are not ride names in any
 * language; it is written down here because the next person to add a park sub-page needs the rule.
 *
 * The page is called the WAIT-TIME calendar in URL, tile and breadcrumb. It went out as
 * „Andrangskalender" first, on the reasoning that a crowd level per day is what the grid actually
 * draws; the trouble is that nobody arrives searching for it. A visitor comes from a wait-time
 * page with a wait-time question, and the calendar answers it a day at a time — so the name is
 * the one they came with, and the crowd level is what it is measured in.
 *
 * One name in one place: a URL, a tile and a breadcrumb that say three things are three things to
 * remember and three chances to say the wrong one.
 *
 * The TITLE and H1 are the exception, and deliberately so: they name the month instead
 * („Phantasialand Wartezeiten im August 2026"). „Wartezeiten-Kalender" is this site's own coinage
 * and close to nobody's search; „Wartezeiten im August" is what a person types. The hub is
 * canonical for the current month anyway — `/2026/8` points at it in August — so it IS that
 * month's page and reads like one, which also makes it structurally identical to the twelve under
 * it rather than a differently-worded parent.
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
 * Locale-relative path to a park's calendar, e.g.
 * `/parks/europe/germany/bruehl/phantasialand/wartezeiten-kalender`, optionally for one month.
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

/**
 * The first day the wait-time archive holds anything at all.
 *
 * The backwards half of {@link PARK_CALENDAR_MONTH_SPAN} used to justify itself with „a year back
 * for how was it", and that was measured to be false. Sampled on 2026-08-28, `/calendar` answered
 * **0 of 30 operating days for Phantasialand in September 2025** — a month it was open every
 * day — and 0 of 32 for October 2025, while June and July 2026 came back complete. The archive
 * simply does not reach that far, so twelve months back was an invitation to eleven empty grids
 * per park under real-looking titles.
 *
 * The boundary is this date, and the payload confirms it exactly: Phantasialand's December 2025
 * comes back as **6 of 31** operating days, which is the 26th to the 31st.
 *
 * A zero-day month is NOT proof of a gap, which is why this is a date and not a heuristic:
 * Europa-Park's 0 of 28 for February 2026 is correct, it is shut for the winter. Nothing in the
 * payload separates „closed" from „not recorded", so the floor has to be written down.
 */
export const CALENDAR_DATA_START = { year: 2025, month: 12, day: 26 } as const;

/** Months since year 0, so a window can be checked without date arithmetic. */
const monthIndex = ({ year, month }: ParkCalendarMonth) => year * 12 + (month - 1);

/**
 * The oldest month a calendar page may serve: the first one the archive covers *completely*.
 *
 * `day > 1` pushes it forward one, and that is the point rather than an off-by-one. December 2025
 * is covered from the 26th, so a page for it would draw 25 blank cells and its summary would
 * read „an 6 von 31 Tagen geöffnet" — a sentence that is false about the park and true only
 * about our recording. A partial month has no honest heading, so the window starts at the first
 * whole one.
 */
const EARLIEST_CALENDAR_MONTH: ParkCalendarMonth = shiftParkCalendarMonth(
  { year: CALENDAR_DATA_START.year, month: CALENDAR_DATA_START.month },
  CALENDAR_DATA_START.day > 1 ? 1 : 0
);

/**
 * How many months back the calendar actually reaches today — the smaller of the span and the
 * distance to {@link EARLIEST_CALENDAR_MONTH}.
 *
 * A single source for the three places that must agree: the route's range check (so a URL past
 * the edge is a 404 rather than an empty page), the month index (so it never links at one), and
 * the sitemap (so it never advertises one). They drifted apart once already, when the sitemap
 * carried its own hand-set constant.
 *
 * Grows on its own as the archive fills: today it yields 7, and it reaches the full 12 once a
 * year has passed since the data start — no follow-up edit, and none to forget.
 */
export function parkCalendarMonthsBack(now: ParkCalendarMonth): number {
  const available = monthIndex(now) - monthIndex(EARLIEST_CALENDAR_MONTH);
  return Math.max(0, Math.min(PARK_CALENDAR_MONTH_SPAN.back, available));
}

/**
 * How many months forward this park's calendar actually says anything — the mirror of
 * {@link parkCalendarMonthsBack}, and it exists for the same reason.
 *
 * The backwards half was capped because twelve months back drew eleven empty grids per park under
 * real-looking titles. The forwards half had the same hole and it was worse, because the API does
 * not go quiet past the end of a park's published schedule — it *answers*. Measured on 2026-08-28:
 * Phantasialand and Europa-Park returned `status: "CLOSED"`, `crowdLevel: "closed"` for **every day
 * of July 2027**, which is mid-season at both and simply meant their 2027 hours were not out yet;
 * Disneyland Paris and Toverland returned `UNKNOWN` with the constant `moderate` fallback and no
 * opening hours for the same month. Five of ten sampled parks were in the first group. A confident
 * closure and a flat constant are both pages that should not exist.
 *
 * `coverageTo` is `scheduleCoverage.to` from the API — the last date it has a park-level OPERATING
 * row for. The month that date falls in is the last one worth serving: it is partially covered, so
 * it still carries real days.
 *
 * **`null` and `undefined` mean "no answer", and must not shorten anything.** A park with no
 * schedule at all reports `null`, and a payload the API cached before the field shipped omits it
 * entirely; in both cases we know nothing new and fall back to the old span, exactly as this file
 * behaved before. Narrowing on absent data would delete a year of pages the day a cache went cold.
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

export interface ParkCalendarMonth {
  year: number;
  month: number;
}

/**
 * Parse the optional `[[...date]]` catch-all into a month.
 *
 * Three outcomes, and the caller has to tell them apart: `null` means "no month given" (the hub),
 * a month object means a valid one, and `'invalid'` means the segments were there and wrong —
 * which is a 404, not a silent fall back to the hub. `/wartezeiten-kalender/2026/13` is somebody's
 * typo or a crawler probing, and answering it with the current month would put the same content
 * on unbounded URLs.
 *
 * `padded` reports a `/2026/09` that should 308 to `/2026/9`, so a link written either way lands
 * on one canonical URL rather than on two pages with the same content.
 */
export function parseParkCalendarMonth(
  segments: string[] | undefined,
  now: ParkCalendarMonth,
  coverageTo?: string | null
): { month: ParkCalendarMonth | null; padded: boolean } | 'invalid' {
  if (!segments || segments.length === 0) return { month: null, padded: false };
  if (segments.length !== 2) return 'invalid';

  const [rawYear, rawMonth] = segments;
  if (!/^\d{4}$/.test(rawYear) || !/^\d{1,2}$/.test(rawMonth)) return 'invalid';

  const year = Number(rawYear);
  const month = Number(rawMonth);
  if (month < 1 || month > 12) return 'invalid';
  if (!isParkCalendarMonthInRange({ year, month }, now, coverageTo)) return 'invalid';

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
 *  never point at a 404.
 *
 *  `coverageTo` is optional so every existing call keeps its behaviour: omit it and the forward
 *  edge is the old fixed span. Pass `scheduleCoverage.to` wherever the park payload is in scope,
 *  and the edge becomes the last month the API can speak for. */
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
