import { formatHoursRange } from '@/lib/utils/intl-format';
import type { AssistantCard } from './actions';

/** A calendar card as the API sends it. */
export type AssistantCalendarCard = Extract<AssistantCard, { kind: 'calendar' }>;

/** A tiles card as the API sends it. */
export type AssistantTilesCard = Extract<AssistantCard, { kind: 'tiles' }>;

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
      (weather.condition != null || weather.tempMin != null || weather.tempMax != null),
  };
  return (Object.keys(has) as AssistantTile[]).filter((tile) => has[tile]);
}
