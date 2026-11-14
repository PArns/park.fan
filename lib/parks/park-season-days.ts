import type { ParkSeason, ParkSeasonKind, ParkSeasonStatus } from '@/lib/api/types';
import { parkCalendarMonthRange, type ParkCalendarMonth } from '@/lib/parks/calendar-segments';

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
 * range. The rule of the API's `seasonCovers`.
 */
export function seasonRunsOn(
  season: { startDate: string; endDate: string; dates?: readonly string[] | null },
  date: string
): boolean {
  if (season.dates && season.dates.length > 0) return season.dates.includes(date);
  return season.startDate <= date && date <= season.endDate;
}

/** The event seasons running on a date, in the order given. */
export function eventSeasonsOn<T extends ParkSeason>(seasons: readonly T[], date: string): T[] {
  return seasons.filter((season) => isSeasonEvent(season) && seasonRunsOn(season, date));
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
 * The event seasons of one month, per day. The one computation the grid's tiles, the day dialog and
 * the legend all read, so the legend keys exactly the icons the month shows.
 */
export function seasonDaysOfMonth(
  seasons: readonly ParkSeason[],
  month: ParkCalendarMonth
): SeasonDays {
  const { from, to } = parkCalendarMonthRange(month);
  const monthDays = Number(to.slice(8));
  const dates = Array.from(
    { length: monthDays },
    (_, i) => `${from.slice(0, 8)}${String(i + 1).padStart(2, '0')}`
  );
  const days: SeasonDays = {};
  for (const season of seasons) {
    if (!isSeasonEvent(season)) continue;
    const runs = dates.filter((date) => seasonRunsOn(season, date));
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

/** The kinds a month's days show, in `SEASON_EVENT_KINDS` order: what its legend keys. */
export function seasonKindsIn(days: SeasonDays): SeasonEventKind[] {
  const shown = new Set(Object.values(days).flatMap((list) => list.map((season) => season.kind)));
  return SEASON_EVENT_KINDS.filter((kind) => shown.has(kind));
}

/**
 * A day's seasons as the tile marks them: one icon per kind, in `SEASON_EVENT_KINDS` order, quiet
 * only when every season of that kind is.
 */
export function seasonMarks(
  seasons: readonly SeasonOnDay[]
): Array<{ kind: SeasonEventKind; quiet: boolean; seasons: SeasonOnDay[] }> {
  return SEASON_EVENT_KINDS.flatMap((kind) => {
    const ofKind = seasons.filter((season) => season.kind === kind);
    return ofKind.length > 0
      ? [{ kind, quiet: ofKind.every((season) => season.quiet), seasons: ofKind }]
      : [];
  });
}
