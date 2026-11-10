import { formatClockTime, formatHoursRange } from '@/lib/utils/intl-format';
import type { AssistantCard } from './actions';

/** A calendar card as the API sends it. */
export type AssistantCalendarCard = Extract<AssistantCard, { kind: 'calendar' }>;

/** A tiles card as the API sends it. */
export type AssistantTilesCard = Extract<AssistantCard, { kind: 'tiles' }>;

/** A shows card as the API sends it. */
export type AssistantShowsCard = Extract<AssistantCard, { kind: 'shows' }>;

/** A restaurants card as the API sends it. */
export type AssistantRestaurantsCard = Extract<AssistantCard, { kind: 'restaurants' }>;

/** A posts card as the API sends it. */
export type AssistantPostsCard = Extract<AssistantCard, { kind: 'posts' }>;

/** A glossary card as the API sends it. */
export type AssistantGlossaryCard = Extract<AssistantCard, { kind: 'glossary' }>;

const DAY_MS = 86_400_000;
const OFFSET = /(?:Z|([+-])(\d{2}):?(\d{2}))$/;

/**
 * The days of a calendar card as Monday-first weeks of seven, with `null` before the first day and
 * after the last. Each day sits by its date, so a gap in the days stays a gap.
 */
export function calendarWeeks<T extends { date: string }>(days: readonly T[]): (T | null)[][] {
  if (days.length === 0) return [];
  const first = Date.parse(days[0].date);
  const pad = (new Date(first).getUTCDay() + 6) % 7;
  const span = Math.round((Date.parse(days[days.length - 1].date) - first) / DAY_MS) + 1;
  const cells: (T | null)[] = Array(Math.ceil((pad + span) / 7) * 7).fill(null);
  for (const day of days) cells[pad + Math.round((Date.parse(day.date) - first) / DAY_MS)] = day;
  const weeks: (T | null)[][] = [];
  for (let at = 0; at < cells.length; at += 7) weeks.push(cells.slice(at, at + 7));
  return weeks;
}

/** An instant with an offset as that wall-clock time in UTC, or null; the card names no zone. */
function wallClockUtc(iso: string): string | null {
  const at = Date.parse(iso);
  const offset = OFFSET.exec(iso);
  if (Number.isNaN(at) || !offset) return null;
  const minutes = offset[1] ? Number(offset[2]) * 60 + Number(offset[3]) : 0;
  return new Date(at + (offset[1] === '-' ? -minutes : minutes) * 60_000).toISOString();
}

/**
 * Opening to closing time in the park's own clock, read off the offsets the API wrote: „09:00–18:00"
 * in German, „9 AM–6 PM" in English. Null when either is missing.
 */
export function parkHours(
  opens: string | null,
  closes: string | null,
  locale: string
): string | null {
  const from = opens && wallClockUtc(opens);
  const to = closes && wallClockUtc(closes);
  return from && to ? formatHoursRange(from, to, locale, 'UTC') : null;
}

/** One time in the park's own clock, read off its offset like {@link parkHours}; null if unreadable. */
export function parkClock(iso: string, locale: string): string | null {
  const wall = wallClockUtc(iso);
  return wall && formatClockTime(wall, locale, 'UTC');
}

/** A show time as its chip draws it. */
export interface ShowTime {
  iso: string;
  past: boolean;
  /** The first time not yet past. */
  next: boolean;
}

/**
 * A show's times split at `now`: those before it are past, the first one after is next. Without a
 * clock (the server render and hydration) none is either, so both renders agree.
 */
export function showTimes(times: readonly string[], now: number | null): ShowTime[] {
  let nextFound = false;
  return times.map((iso) => {
    const past = now !== null && Date.parse(iso) < now;
    const next = now !== null && !past && !nextFound;
    if (next) nextFound = true;
    return { iso, past, next };
  });
}

/** One stat a tiles card can show. */
export type AssistantTile = 'crowd' | 'avgWait' | 'peakWait' | 'rides' | 'hours' | 'weather';

/** The tiles a card has a value for, in the order they are drawn; a missing value has no tile. */
export function presentTiles(card: AssistantTilesCard): AssistantTile[] {
  const { weather } = card;
  const has: Record<AssistantTile, boolean> = {
    crowd: card.crowdLevel != null,
    avgWait: card.avgWaitMinutes != null,
    peakWait: card.peakWaitMinutes != null,
    rides: card.openRides != null,
    hours: parkHours(card.opens, card.closes, 'en') !== null,
    weather:
      weather != null &&
      (weather.weatherCode != null ||
        weather.condition != null ||
        weather.tempMin != null ||
        weather.tempMax != null),
  };
  return (Object.keys(has) as AssistantTile[]).filter((tile) => has[tile]);
}
