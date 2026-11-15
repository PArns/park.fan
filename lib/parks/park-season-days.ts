import type { CalendarDay, ParkSeason, ParkSeasonKind, ParkSeasonStatus } from '@/lib/api/types';
import { parkCalendarMonthRange, type ParkCalendarMonth } from '@/lib/parks/calendar-segments';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { addDays } from '@/lib/utils/park-day';

/**
 * Which curated seasons a calendar day marks, and how. Pure, so the park calendar's grid, its
 * legend, its day dialog, the hub's event lanes and the agent tools read one rule.
 */

/**
 * The season kinds a day marks: the events a visitor picks a day for. `opening` is the park's own
 * season, which its open days already show; a `closure` is closed days, which the grid shows as
 * closed; `maintenance` shuts rides, which the works key shows.
 */
export const SEASON_EVENT_KINDS = [
  'halloween',
  'christmas',
  'winter',
  'summer_nights',
  'special_event',
] as const satisfies readonly ParkSeasonKind[];

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' };
const FULL_DATE: Intl.DateTimeFormatOptions = { ...SHORT_DATE, year: 'numeric' };

/**
 * A season's bounds as one localized range, „20. Nov. – 18. Jan. 2027": the year once when both ends
 * share it, on both ends when they do not. Falls back to the raw dates when either does not parse.
 */
export function formatSeasonRange(locale: string, start: string, end: string): string {
  const from = new Date(`${start}T12:00:00Z`);
  const to = new Date(`${end}T12:00:00Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return `${start} – ${end}`;

  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const fromFormat = getDateTimeFormat(locale, sameYear ? SHORT_DATE : FULL_DATE);

  return `${fromFormat.format(from)} – ${getDateTimeFormat(locale, FULL_DATE).format(to)}`;
}

/** A season kind a calendar day marks with its icon. */
export type SeasonEventKind = (typeof SEASON_EVENT_KINDS)[number];

/**
 * Whether a season is one of the events a day marks and still on. A cancelled season marks no day:
 * it is listed, struck through, on the park's season card and nowhere else.
 */
export function isSeasonEvent<T extends { kind: ParkSeasonKind; status: ParkSeasonStatus }>(
  season: T
): season is T & { kind: SeasonEventKind; status: Exclude<ParkSeasonStatus, 'cancelled'> } {
  return (
    season.status !== 'cancelled' && (SEASON_EVENT_KINDS as readonly string[]).includes(season.kind)
  );
}

/**
 * Whether a season runs on a date: only on its `dates` where it lists them, else every day of its
 * range (the API's `seasonCovers`) the calendar does not show `closed`. A range is the season's
 * outer bounds and says nothing about a day the park is shut; listed dates are the park's own word
 * and stand. An unknown day counts as open, since nobody said it is closed.
 */
export function seasonRunsOn(
  season: { startDate: string; endDate: string; dates?: readonly string[] | null },
  date: string,
  closed = false
): boolean {
  if (season.dates && season.dates.length > 0) return season.dates.includes(date);
  return !closed && season.startDate <= date && date <= season.endDate;
}

/** The event seasons running on a date the calendar shows `closed` or not, in the order given. */
export function eventSeasonsOn<
  T extends Pick<ParkSeason, 'kind' | 'status' | 'startDate' | 'endDate' | 'dates'>,
>(seasons: readonly T[], date: string, closed = false): T[] {
  return seasons.filter((season) => isSeasonEvent(season) && seasonRunsOn(season, date, closed));
}

/** An event season as a „today" surface draws it: its name and kind, and when it runs. */
export type TodaySeason = Pick<
  ParkSeason,
  'id' | 'kind' | 'name' | 'status' | 'startDate' | 'endDate' | 'dates'
>;

/** A park's event seasons around one day, for a surface that names the season running today. */
export interface SeasonsNearToday {
  /** The server's park-local day, which the first HTML is drawn for. */
  today: string;
  /** The event seasons running on {@link today} or the day after. */
  seasons: TodaySeason[];
}

/**
 * The event seasons that run on `todayIso` or the day after, `dates` cut to those two days. The
 * „Heute im Park" panel draws the server's day first and then the browser's, and stays open past
 * midnight, so it needs tomorrow too; the rest of a list like Wintertraum's 67 days it never draws.
 */
export function eventSeasonsNearToday(
  seasons: readonly ParkSeason[],
  todayIso: string
): SeasonsNearToday {
  const tomorrow = addDays(todayIso, 1);
  return {
    today: todayIso,
    seasons: seasons
      .filter((season) => isSeasonEvent(season))
      .filter((season) => seasonRunsOn(season, todayIso) || seasonRunsOn(season, tomorrow))
      .map(({ id, kind, name, status, startDate, endDate, dates }) => ({
        id,
        kind,
        name,
        status,
        startDate,
        endDate,
        // Never cut to empty: a season kept here runs on one of the two days, and an empty list
        // would read as „every day of the range" to `seasonRunsOn`.
        dates: dates?.length ? dates.filter((d) => d === todayIso || d === tomorrow) : null,
      })),
  };
}

/**
 * Whether a month's day statuses decide anything: only a season in it without single dates, which
 * skips the closed days, needs them. The calendar page waits for them only then.
 */
export function seasonsNeedDayStatus(
  seasons: readonly ParkSeason[],
  month: ParkCalendarMonth
): boolean {
  const { from, to } = parkCalendarMonthRange(month);
  return seasons.some(
    (season) =>
      isSeasonEvent(season) &&
      !season.dates?.length &&
      season.startDate <= to &&
      season.endDate >= from
  );
}

/** One event season on one calendar day, as the tile, the legend and the day's dialog draw it. */
export interface SeasonOnDay extends Pick<
  ParkSeason,
  | 'id'
  | 'name'
  | 'status'
  | 'separateTicket'
  | 'priceFrom'
  | 'priceCurrency'
  | 'opensAt'
  | 'closesAt'
> {
  kind: SeasonEventKind;
  /**
   * Drawn quietly on the tile: the season runs on more than half of the month, where an icon on
   * every tile would drown the crowd colours, or it is only `expected`, which is no promise.
   */
  quiet: boolean;
}

/** A month's event seasons per date (`YYYY-MM-DD`); a date none runs on has no entry. */
export type SeasonDays = Record<string, SeasonOnDay[]>;

/**
 * The event seasons of one month, per day, a season without single dates only on the `calendarDays`
 * not `CLOSED`. The one computation the grid's tiles, the day dialog and the legend all read, so the
 * legend keys exactly the icons the month shows.
 */
export function seasonDaysOfMonth(
  seasons: readonly ParkSeason[],
  month: ParkCalendarMonth,
  calendarDays: ReadonlyArray<Pick<CalendarDay, 'date' | 'status'>> = []
): SeasonDays {
  const { from, to } = parkCalendarMonthRange(month);
  const monthDays = Number(to.slice(8));
  const dates = Array.from(
    { length: monthDays },
    (_, i) => `${from.slice(0, 8)}${String(i + 1).padStart(2, '0')}`
  );
  const closed = new Set(calendarDays.filter((d) => d.status === 'CLOSED').map((d) => d.date));
  const days: SeasonDays = {};
  for (const season of seasons) {
    if (!isSeasonEvent(season)) continue;
    const runs = dates.filter((date) => seasonRunsOn(season, date, closed.has(date)));
    if (runs.length === 0) continue;
    const entry: SeasonOnDay = {
      id: season.id,
      kind: season.kind,
      name: season.name,
      status: season.status,
      separateTicket: season.separateTicket,
      priceFrom: season.priceFrom,
      priceCurrency: season.priceCurrency,
      opensAt: season.opensAt,
      closesAt: season.closesAt,
      quiet: runs.length > monthDays / 2 || season.status === 'expected',
    };
    for (const date of runs) (days[date] ??= []).push(entry);
  }
  return days;
}

/** The seasons a month's days carry, each once, in the order they first appear. */
export function seasonsInMonth(days: SeasonDays): SeasonOnDay[] {
  return [...new Map(Object.values(days).flatMap((list) => list.map((s) => [s.id, s]))).values()];
}

/** The kinds a month's days show, in `SEASON_EVENT_KINDS` order: what its legend keys. */
export function seasonKindsIn(days: SeasonDays): SeasonEventKind[] {
  return seasonMarks(seasonsInMonth(days)).map((mark) => mark.kind);
}

/**
 * A day's seasons as the tile marks them: one icon per kind, in `SEASON_EVENT_KINDS` order, quiet
 * only when every season of that kind is.
 */
export function seasonMarks<S extends { kind: ParkSeasonKind; quiet: boolean } = SeasonOnDay>(
  seasons: readonly S[]
): Array<{ kind: SeasonEventKind; quiet: boolean; seasons: S[] }> {
  return SEASON_EVENT_KINDS.flatMap((kind) => {
    const ofKind = seasons.filter((season) => season.kind === kind);
    return ofKind.length > 0
      ? [{ kind, quiet: ofKind.every((season) => season.quiet), seasons: ofKind }]
      : [];
  });
}
