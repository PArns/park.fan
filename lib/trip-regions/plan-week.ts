import {
  buildDayGrid,
  POST_PAD_MIN,
  PRE_PAD_MIN,
  PX_PER_MIN,
  PX_PER_MIN_COARSE,
  type DayGrid,
} from '@/lib/planner/day-grid';
import {
  CROWD_LEVEL_ORDER,
  isColoredCrowdLevel,
  type ColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import type { DaySignal } from '@/lib/utils/day-signal-styles';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { addDays, daysBetween } from '@/lib/utils/park-day';
import { earlyPerk } from './plan-copy';
import type { PlanDay, PlanDayKind, PlanTotals, TripPlan } from './plan';
import type {
  TripCalendar,
  TripCalendarDay,
  TripEveningKind,
  TripParkDay,
  TripRegionPark,
  TripSeason,
} from './types';
import { PARK_NAME_SUFFIXES } from './registry';

/**
 * The geometry of the result's Week and Month views. Pure, and built on the day planner's own axis
 * (`lib/planner/day-grid.ts`): each column is a `DayGrid` with that day's opening and close on one
 * canvas the whole trip shares, so `PlannerGridGround` draws its band, early slot and hour rules
 * exactly as it does in the day planner, and `yFor` places the blocks.
 */

/**
 * The trip overview's scale: half the day planner's, on a phone and off it, so a whole park day
 * fits a screen while a phone keeps the planner's larger step. Derived from the planner's constants,
 * so the two views keep their ratio if either is retuned.
 */
export const TRIP_WEEK_PX_PER_MIN = PX_PER_MIN / 2;
/** {@link TRIP_WEEK_PX_PER_MIN} on a phone. */
export const TRIP_WEEK_PX_PER_MIN_COARSE = PX_PER_MIN_COARSE / 2;

/** Days per page of the Week view: a week on a wide screen, three on a phone. */
export const WEEK_COLUMNS_WIDE = 7;
/** {@link WEEK_COLUMNS_WIDE} on a phone. */
export const WEEK_COLUMNS_PHONE = 3;

/**
 * Minutes since the trip day's midnight in `timeZone`, for a park-local ISO instant: past midnight
 * runs on (25:00 is 01:00 the next morning), so a close after midnight stays below the opening.
 */
export function parkMinuteOf(iso: string, date: string, timeZone: string): number | null {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const parts = getDateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const localDate = `${get('year')}-${get('month')}-${get('day')}`;
  return daysBetween(date, localDate) * 1440 + Number(get('hour')) * 60 + Number(get('minute'));
}

/** One park's stretch of a column, in minutes since the day's midnight. */
export interface TripBlockSpan {
  slug: string;
  startMin: number;
  endMin: number;
}

/** A column of the Week view: what each piece of the day is, in minutes. */
export interface TripDaySpan {
  date: string;
  kind: PlanDayKind;
  /** One block on a park day, two on a hop day; none on a day without a park or without hours. */
  blocks: TripBlockSpan[];
  /** The early slot, only where the chosen hotel gets it that day. */
  early: { startMin: number; endMin: number } | null;
  /**
   * After the day guests' close: a party night always (it is why the day is short), Extended
   * Evening Hours only where the hotel gets them.
   */
  evening: { kind: TripEveningKind; startMin: number; endMin: number } | null;
  /** A hop day's move, between its two blocks. */
  hopAt: number | null;
  /** The plan's evening after the park: a second park or a venue, and the move to it. */
  night: {
    kind: 'hop' | 'venue';
    /** The park slug or the venue key. */
    target: string;
    startMin: number;
    endMin: number;
    travelMinutes: number | null;
  } | null;
}

/**
 * Minutes since the trip day's midnight for a time the plan gives as park-local ISO or as `HH:MM`;
 * an `HH:MM` before 05:00 is after midnight.
 */
export function planTimeMinute(value: string, date: string, timeZone: string): number | null {
  const clock = /^(\d{2}):(\d{2})$/.exec(value);
  if (!clock) return parkMinuteOf(value, date, timeZone);
  const minute = Number(clock[1]) * 60 + Number(clock[2]);
  return minute < 5 * 60 ? minute + 1440 : minute;
}

/** The calendar cell of a park on a date, if the calendar has it. */
export function calendarCell(
  calendar: TripCalendar | undefined,
  slug: string,
  date: string
): TripParkDay | undefined {
  return calendar?.days.find((d) => d.date === date)?.parks[slug];
}

/**
 * The wait a park's day shows. Within the forecast's days the forecast as the park's own calendar
 * shows it (`forecastWait`), so a day never reads two numbers on two pages; after them last year's
 * measured day. What ranks the day stays `headlinerWait`, the forecast times its lead factor.
 */
export function shownWait(
  day: Pick<TripParkDay, 'basis' | 'headlinerWait' | 'forecastWait'>
): number | undefined {
  return day.basis === 'forecast' ? (day.forecastWait ?? day.headlinerWait) : day.headlinerWait;
}

/**
 * {@link shownWait} of a park on a plan's date, read off the trip's calendar; the plan's own figure
 * where the calendar has none.
 */
export function shownWaitOn(
  calendar: TripCalendar | undefined,
  slug: string,
  date: string,
  planned: number | undefined
): number | undefined {
  const cell = calendarCell(calendar, slug, date);
  return (cell && shownWait(cell)) ?? planned;
}

/**
 * The plan's totals in the shown figure, so the line under the plan adds up with the days above it:
 * the visits' mean, and for the same visits the mean over every open day of the trip of that park,
 * as the API compares them. What ranks the plan stays the API's totals. `null` where the calendar
 * does not cover the plan's days (it is still on its way, or holds another trip's), or a visit has
 * no figure.
 */
export function shownTotals(
  plan: Pick<TripPlan, 'days'>,
  calendar: TripCalendar | undefined
): Pick<PlanTotals, 'headlinerWait' | 'averageDayWait' | 'savedMinutesPerRide'> | null {
  if (!calendar) return null;
  const dates = new Set(calendar.days.map((d) => d.date));
  if (!plan.days.every((d) => dates.has(d.date))) return null;
  const mean = (values: readonly number[]) => values.reduce((a, b) => a + b, 0) / values.length;
  const planned: number[] = [];
  const average: number[] = [];
  for (const day of plan.days) {
    if (day.kind !== 'park' && day.kind !== 'hop') continue;
    for (const visit of day.parks) {
      const own =
        day.kind === 'park' ? (visit.headlinerWait ?? day.headlinerWait) : visit.headlinerWait;
      const wait = shownWaitOn(calendar, visit.slug, day.date, own);
      const open = calendar.days.flatMap((d) => {
        const cell = d.parks[visit.slug];
        const figure = cell && cell.status !== 'CLOSED' ? shownWait(cell) : undefined;
        return figure == null ? [] : [figure];
      });
      if (wait == null || open.length === 0) return null;
      planned.push(wait);
      average.push(mean(open));
    }
  }
  if (planned.length === 0) return null;
  const headlinerWait = mean(planned);
  const averageDayWait = mean(average);
  return { headlinerWait, averageDayWait, savedMinutesPerRide: averageDayWait - headlinerWait };
}

/** {@link shownWaitOn} for a plan day's own figure: a park day's park; a hop day has none. */
export function shownDayWait(
  day: Pick<PlanDay, 'date' | 'kind' | 'parks' | 'headlinerWait'>,
  calendar: TripCalendar | undefined
): number | undefined {
  const park = day.kind === 'park' ? day.parks[0] : undefined;
  return park ? shownWaitOn(calendar, park.slug, day.date, day.headlinerWait) : day.headlinerWait;
}

/**
 * Each trip day's pieces, read off the plan and the calendar. A park day whose hours the calendar
 * does not carry gets no block: the honest answer is the day planner's, no axis rather than an
 * invented one.
 */
export function tripDaySpans(
  days: readonly PlanDay[],
  calendar: TripCalendar | undefined,
  timeZone: string
): TripDaySpan[] {
  return days.map((day) => {
    const span: TripDaySpan = {
      date: day.date,
      kind: day.kind,
      blocks: [],
      early: null,
      evening: null,
      hopAt: null,
      night: null,
    };
    if (day.kind !== 'park' && day.kind !== 'hop') return span;
    const cells = day.parks.map((p) => ({
      slug: p.slug,
      cell: calendarCell(calendar, p.slug, day.date),
    }));
    const hours = cells.map(({ slug, cell }) => {
      const visit = day.parks.find((p) => p.slug === slug);
      // The plan's own day-guest close wins over the calendar's: it is the hour the plan priced.
      const closeIso =
        visit?.dayGuestCloseAt ??
        (day.parks.length === 1 ? day.dayGuestCloseAt : undefined) ??
        cell?.closesAt;
      const open = cell?.opensAt ? parkMinuteOf(cell.opensAt, day.date, timeZone) : null;
      const close = closeIso ? parkMinuteOf(closeIso, day.date, timeZone) : null;
      return open !== null && close !== null && close > open ? { slug, open, close, cell } : null;
    });
    if (hours.some((h) => h === null)) return span;
    const [first, second] = hours as Array<NonNullable<(typeof hours)[number]>>;

    if (day.kind === 'hop' && second) {
      // Where in the day the move happens is not part of the plan, only that it happens: the
      // column splits the day in the middle and draws the leg there.
      const mid = Math.round((first.open + second.close) / 2 / 15) * 15;
      span.blocks = [
        { slug: first.slug, startMin: first.open, endMin: mid },
        { slug: second.slug, startMin: mid, endMin: second.close },
      ];
      span.hopAt = mid;
    } else {
      span.blocks = [{ slug: first.slug, startMin: first.open, endMin: first.close }];
    }

    const early = first.cell?.early;
    if (early && earlyPerk(day.perks)) {
      const start = parkMinuteOf(early.opensAt, day.date, timeZone);
      if (start !== null && start < first.open)
        span.early = { startMin: start, endMin: first.open };
    }
    const last = second ?? first;
    const evening = last.cell?.evening;
    if (
      evening &&
      (evening.kind === 'ticketed_event' || (day.perks ?? []).includes('extended_evening'))
    ) {
      const start = parkMinuteOf(evening.opensAt, day.date, timeZone);
      const end = parkMinuteOf(evening.closesAt, day.date, timeZone);
      if (start !== null && end !== null && end > start) {
        span.evening = { kind: evening.kind, startMin: Math.max(start, last.close), endMin: end };
      }
    }
    const night = day.evening;
    const target = night?.kind === 'hop' ? night.park : night?.venue;
    if (night && target) {
      const start = planTimeMinute(night.from, day.date, timeZone);
      const end = planTimeMinute(night.to, day.date, timeZone);
      if (start !== null && end !== null && end > start) {
        span.night = {
          kind: night.kind,
          target,
          startMin: start,
          endMin: end,
          travelMinutes: night.travel?.minutes ?? null,
        };
      }
    }
    return span;
  });
}

/** The canvas every column shares: the earliest piece to the latest, padded as the planner pads. */
export interface TripCanvas {
  startMin: number;
  endMin: number;
}

/** A canvas for a trip whose calendar has no hours yet: a plain day, so rest days still have room. */
export const TRIP_FALLBACK_CANVAS: TripCanvas = { startMin: 8 * 60, endMin: 22 * 60 };

/**
 * The shared canvas, from the earliest piece of any day to the latest, on whole hours and padded
 * by the planner's own {@link PRE_PAD_MIN} and {@link POST_PAD_MIN}. `null` when no day has hours.
 */
export function tripCanvas(spans: readonly TripDaySpan[]): TripCanvas | null {
  let start = Infinity;
  let end = -Infinity;
  for (const span of spans) {
    for (const b of span.blocks) {
      start = Math.min(start, b.startMin);
      end = Math.max(end, b.endMin);
    }
    if (span.early) start = Math.min(start, span.early.startMin);
    if (span.evening) end = Math.max(end, span.evening.endMin);
    if (span.night) end = Math.max(end, span.night.endMin);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return {
    startMin: Math.floor((start - PRE_PAD_MIN) / 60) * 60,
    endMin: Math.ceil((end + POST_PAD_MIN) / 60) * 60,
  };
}

/**
 * A column's axis: the day planner's `DayGrid` for that day's hours, stretched onto the shared
 * canvas. Real minutes, not the API's rounded hours, so there is no closing slack to hatch. A day
 * without hours gets the canvas alone (open and close at its ends), which the ground then draws as
 * one band.
 */
export function tripColumnGrid(span: TripDaySpan, canvas: TripCanvas, pxPerMin: number): DayGrid {
  const open = span.blocks[0]?.startMin ?? canvas.startMin + PRE_PAD_MIN;
  const close = span.blocks.at(-1)?.endMin ?? canvas.endMin - POST_PAD_MIN;
  const base = buildDayGrid(0, 1, pxPerMin) as DayGrid;
  return {
    ...base,
    openMin: open,
    closeMin: close,
    closeSlackMin: 0,
    closeIsTruncated: false,
    earlyEntryOpenMin: span.early?.startMin ?? null,
    gridStartMin: canvas.startMin,
    gridEndMin: canvas.endMin,
    heightPx: (canvas.endMin - canvas.startMin) * pxPerMin,
  };
}

/** One piece of a Month view day band, placed in percent of the trip's shared canvas. */
export interface DayBandPiece {
  /**
   * `early` the hotel's slot before opening, `park` a park's day-guest hours, `party` the ticketed
   * evening that ends a day guest's day, `extended` the hotel's extra evening, `hop` the plan's
   * evening in a second park, `venue` its evening at a venue.
   */
  kind: 'early' | 'park' | 'party' | 'extended' | 'hop' | 'venue';
  /** The park of a `park` or `hop` piece. */
  slug: string | null;
  left: number;
  width: number;
}

/**
 * A day of the Week view (`tripDaySpans`) as the Month view's band: the same pieces on the same
 * canvas ({@link tripCanvas}), in percent, so the two views cannot disagree on an hour. The plan's
 * own evening wins over a ticketed one it overlaps, since it is what the visitor does.
 */
export function dayBandPieces(span: TripDaySpan, canvas: TripCanvas): DayBandPiece[] {
  const length = canvas.endMin - canvas.startMin;
  if (length <= 0) return [];
  const at = (min: number) =>
    (Math.min(Math.max(min, canvas.startMin), canvas.endMin) - canvas.startMin) / length;
  const piece = (
    kind: DayBandPiece['kind'],
    slug: string | null,
    startMin: number,
    endMin: number
  ): DayBandPiece => ({
    kind,
    slug,
    left: Math.round(at(startMin) * 1000) / 10,
    width: Math.round((at(endMin) - at(startMin)) * 1000) / 10,
  });
  const pieces: DayBandPiece[] = [];
  if (span.early) pieces.push(piece('early', null, span.early.startMin, span.early.endMin));
  for (const block of span.blocks)
    pieces.push(piece('park', block.slug, block.startMin, block.endMin));
  if (span.evening && !span.night) {
    pieces.push(
      piece(
        span.evening.kind === 'ticketed_event' ? 'party' : 'extended',
        null,
        span.evening.startMin,
        span.evening.endMin
      )
    );
  }
  if (span.night) {
    pieces.push(
      span.night.kind === 'hop'
        ? piece('hop', span.night.target, span.night.startMin, span.night.endMin)
        : piece('venue', null, span.night.startMin, span.night.endMin)
    );
  }
  return pieces.filter((p) => p.width > 0);
}

/** The trip's dates in pages of `perPage`, from the first day: page by week, not by calendar week. */
export function weekPages<T>(items: readonly T[], perPage: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  return pages;
}

/** One cell of the Month view: a date, and whether it is a day of the trip. */
export interface TripMonthCell {
  date: string;
  inTrip: boolean;
}

/**
 * The Month view's rows: whole weeks, Monday first, from the week the trip starts in to the week it
 * ends in, so the trip sits in its calendar and a two-month trip reads as one run of weeks.
 */
export function tripMonthWeeks(from: string, to: string): TripMonthCell[][] {
  const weekday = (date: string) => (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDays(from, -weekday(from));
  const end = addDays(to, 6 - weekday(to));
  const weeks: TripMonthCell[][] = [];
  for (let d = start; d <= end; d = addDays(d, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(d, i);
        return { date, inTrip: date >= from && date <= to };
      })
    );
  }
  return weeks;
}

/** Words that name the kind of park, not the park. */
const GENERIC_WORDS = new Set(['park', 'theme', 'water', 'of', 'the', 'and']);
/** Words that name the owner, kept only where the park's own name is one plain word. */
const OWNER_WORDS = new Set(['universal', "universal's", 'universal’s', "disney's", 'disney’s']);
/**
 * Words that name the place: the first word of each region's park-name suffixes (`Tampa` of
 * `Tampa Bay`; `Bay` alone would also cut Volcano Bay to one word).
 */
const PLACE_WORDS = new Set(
  PARK_NAME_SUFFIXES.map((suffix) => suffix.split(/\s+/)[0].toLowerCase())
);

/**
 * The two-letter mark of a park for the Month view's chips, from the words that name the park:
 * Magic Kingdom MK, Hollywood Studios HS, Epic Universe EU, SeaWorld SW, EPCOT EP, and Universal
 * Studios Florida US, where "Studios" alone would say nothing. Always drawn with the park's full
 * name beside it for a screen reader and on hover.
 */
export function parkInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const core = words.filter((w) => {
    const lower = w.toLowerCase();
    return !GENERIC_WORDS.has(lower) && !OWNER_WORDS.has(lower) && !PLACE_WORDS.has(lower);
  });
  const initials = (list: readonly string[]) =>
    list
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  if (core.length >= 2) return initials(core);
  const word = core[0] ?? words[0] ?? '';
  const camel = word.match(/[A-Z][a-z]+/g);
  if (camel && camel.length >= 2 && word === camel.join('')) return initials(camel);
  if (word === word.toUpperCase()) return word.slice(0, 2);
  const owner = words.find((w) => OWNER_WORDS.has(w.toLowerCase()));
  return owner ? initials([owner, word]) : word.slice(0, 2).toUpperCase();
}

/**
 * A park's code in every view that has room for two letters (the date grid, the Month view, their
 * key): the region's curated `code` where the API sends one, else {@link parkInitials}. The key under
 * a grid reads the same function, so a code and its explanation cannot disagree.
 */
export function parkCode(park: Pick<TripRegionPark, 'name' | 'code'>): string {
  return park.code ?? parkInitials(park.name);
}

/**
 * A park's label in a calendar cell: the region's short name (`parkShortNames`) where the cell has
 * room for it, a `tight` cell taking one of at most four letters, else {@link parkCode}.
 */
export function parkLabel(
  park: Pick<TripRegionPark, 'slug' | 'name' | 'code'>,
  shortNames: Readonly<Record<string, string>> | undefined,
  room: 'tight' | 'wide'
): string {
  const short = shortNames?.[park.slug];
  return short && (room === 'wide' || short.length <= 4) ? short : parkCode(park);
}

/** One line of a code key: the code and the park it stands for. */
export interface ParkCodeEntry {
  slug: string;
  code: string;
  name: string;
}

/**
 * The key to the codes a view shows: each park among `slugs` once, in the region's order, with the
 * code the view draws (`codeOf`, {@link parkCode} by default) and its name as `nameOf` gives it.
 * Parks the region does not list are left out.
 */
export function parkCodeKey(
  parks: readonly TripRegionPark[],
  slugs: Iterable<string>,
  nameOf: (park: TripRegionPark) => string,
  codeOf: (park: TripRegionPark) => string = parkCode
): ParkCodeEntry[] {
  const shown = new Set(slugs);
  return parks
    .filter((park) => shown.has(park.slug))
    .map((park) => ({ slug: park.slug, code: codeOf(park), name: nameOf(park) }));
}

/**
 * The curated seasons a park's day lists (its cell's `seasons`), cancelled ones and closures
 * left out: what the day sheet names as the day's events.
 */
export function daySeasons(
  calendar: TripCalendar | undefined,
  slug: string,
  date: string
): TripSeason[] {
  const ids = calendarCell(calendar, slug, date)?.seasons ?? [];
  return (calendar?.seasons ?? []).filter(
    (s) => ids.includes(s.id) && s.status !== 'cancelled' && s.kind !== 'closure'
  );
}

/** The separately ticketed season behind a day's evening event, if the calendar names one. */
export function partySeason(
  calendar: TripCalendar | undefined,
  slug: string,
  date: string
): TripSeason | null {
  return daySeasons(calendar, slug, date).find((s) => s.separateTicket) ?? null;
}

/** Hours a day guest has on a park's day, from the calendar's open to its day-guest close. */
export function dayGuestHours(
  cell: TripParkDay | undefined,
  date: string,
  timeZone: string
): number | null {
  if (cell?.status !== 'OPERATING' || !cell.opensAt || !cell.closesAt) return null;
  const open = parkMinuteOf(cell.opensAt, date, timeZone);
  const close = parkMinuteOf(cell.closesAt, date, timeZone);
  return open !== null && close !== null && close > open ? (close - open) / 60 : null;
}

/**
 * How many hours shorter a park's day is for a day guest than the park's usual day in the calendar
 * window (its median), rounded to whole hours: the figure "about 4 hours less than a usual day
 * here" says. `null` where the day is not at least an hour short or a figure is missing.
 */
export function hoursLessThanUsual(
  calendar: TripCalendar | undefined,
  slug: string,
  date: string,
  timeZone: string
): number | null {
  if (!calendar) return null;
  const hours = calendar.days
    .map((d) => dayGuestHours(d.parks[slug], d.date, timeZone))
    .filter((h): h is number => h !== null)
    .sort((a, b) => a - b);
  const today = dayGuestHours(calendarCell(calendar, slug, date), date, timeZone);
  if (hours.length === 0 || today === null) return null;
  const mid = Math.floor(hours.length / 2);
  const usual = hours.length % 2 ? hours[mid] : (hours[mid - 1] + hours[mid]) / 2;
  const less = Math.round(usual - today);
  return less >= 1 ? less : null;
}

/** What a trade would do, read off the calendar before anything is asked. */
export type SwapPreview =
  | {
      kind: 'minutes';
      delta: number;
      /** A park the trade puts on a day its day guests get fewer hours than usual. */
      short: { slug: string; hours: number } | null;
    }
  | { kind: 'closed'; slug: string }
  | { kind: 'no_figure' };

/**
 * The change in big-ride minutes if the park of day `a` traded places with day `b`'s park (or day
 * off): the two parks' shown waits ({@link shownWait}) on their new days less those on their old
 * ones, so the difference is the one the days on screen give. A cell difference,
 * as the critic asked for: the re-plan after the press may move other days too, and the edit bar
 * then shows what the whole plan costs. A park moved onto a short day (a party night, an early
 * close) is named with the hours it loses, because the minutes alone hide that cost.
 */
export function swapPreview(
  calendar: TripCalendar | undefined,
  a: PlanDay,
  b: PlanDay,
  timeZone: string
): SwapPreview {
  const target = (day: PlanDay) =>
    day.kind === 'rest' ? 'rest' : day.kind === 'park' ? (day.parks[0]?.slug ?? null) : null;
  let delta = 0;
  let short: { slug: string; hours: number } | null = null;
  for (const [slug, from, to] of [
    [target(a), a.date, b.date],
    [target(b), b.date, a.date],
  ] as const) {
    if (!slug || slug === 'rest') continue;
    const there = calendarCell(calendar, slug, to);
    if (there?.status === 'CLOSED') return { kind: 'closed', slug };
    const hereCell = calendarCell(calendar, slug, from);
    const here = hereCell && shownWait(hereCell);
    const away = there && shownWait(there);
    if (away == null || here == null) return { kind: 'no_figure' };
    delta += away - here;
    const less = hoursLessThanUsual(calendar, slug, to, timeZone);
    if (less !== null && (short === null || less > short.hours)) short = { slug, hours: less };
  }
  return { kind: 'minutes', delta, short };
}

/**
 * The signals a trip region's calendar knows: its own school breaks and holidays. It carries no
 * bridge days or neighbouring regions, so the planner's grids key only these two.
 */
export const TRIP_DAY_SIGNALS: readonly DaySignal[] = ['school', 'holiday'];

/**
 * A date's tint in the date grid: how busy the region's headliner parks are that day, the median of
 * the crowd levels of those that are open and have one (the lower middle for an even count). Each
 * level compares a park with its own typical day, so the median reads as "a busy day in the region"
 * the way a park's crowd calendar does for one park. `null` for a date with no level.
 */
export function dateLevel(
  day: TripCalendarDay | undefined,
  headliners: readonly string[]
): ColoredCrowdLevel | null {
  if (!day) return null;
  const ranks = headliners
    .map((slug) => day.parks[slug])
    .filter((cell) => cell && cell.status !== 'CLOSED')
    .map((cell) => cell.crowdLevel)
    .filter(isColoredCrowdLevel)
    .map((level) => CROWD_LEVEL_ORDER.indexOf(level))
    .sort((a, b) => a - b);
  return ranks.length > 0 ? CROWD_LEVEL_ORDER[ranks[Math.floor((ranks.length - 1) / 2)]] : null;
}
