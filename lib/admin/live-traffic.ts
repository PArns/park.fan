import type { Locale } from '@/i18n/config';
import type { LiveMinute, LiveTraffic } from '@/lib/api/admin-live-traffic';
import { trafficQuery, type FilterDimension } from '@/lib/admin/site-analytics';
import { formatTime } from '@/lib/utils/intl-format';

/**
 * The pure half of `/admin/traffic/live`: the minutes of the chart, which counts rose since the
 * last answer, and how a list's rows are laid out when some of them drop out. Kept apart from the
 * page so it can be tested (`pnpm test:admin-live-traffic`).
 */

/** Milliseconds between two asks while the tab is in front. */
export const LIVE_POLL_MS = 5_000;

/** The minutes the chart shows: the last 30 whole ones and the current one. */
export const LIVE_MINUTES = 31;

/** At most this many countries ripple after one answer, the biggest rises first. */
export const MAX_RIPPLES = 5;

/**
 * How far apart two ripples of one answer start, in the units of `public/world.svg` (2000 wide):
 * about the width of Germany, so a busy Europe sends one ring instead of five stacked ones.
 */
export const RIPPLE_SPACING = 80;

const MINUTE_MS = 60_000;

/** A minute of the chart, its start in epoch milliseconds. */
export interface LiveMinutePoint {
  at: number;
  pageviews: number;
  events: number;
  visitors: number;
}

/**
 * The chart's minutes, oldest first: exactly {@link LIVE_MINUTES}, ending at the newest minute of
 * the answer or the minute of `at`, whichever is later. A minute the API left out counts zero, and
 * one outside the window is dropped, so the bars always stand on the same slots.
 */
export function minuteSeries(live: Pick<LiveTraffic, 'at' | 'perMinute'>): LiveMinutePoint[] {
  const byMinute = new Map<number, LiveMinute>();
  for (const minute of live.perMinute) {
    const at = Date.parse(minute.minute);
    if (Number.isFinite(at)) byMinute.set(Math.floor(at / MINUTE_MS) * MINUTE_MS, minute);
  }
  const fromAt = Date.parse(live.at);
  const latest = Math.max(
    Number.isFinite(fromAt) ? Math.floor(fromAt / MINUTE_MS) * MINUTE_MS : -Infinity,
    ...byMinute.keys()
  );
  if (!Number.isFinite(latest)) return [];
  return Array.from({ length: LIVE_MINUTES }, (_, index) => {
    const at = latest - (LIVE_MINUTES - 1 - index) * MINUTE_MS;
    const minute = byMinute.get(at);
    return {
      at,
      pageviews: minute?.pageviews ?? 0,
      events: minute?.events ?? 0,
      visitors: minute?.visitors ?? 0,
    };
  });
}

/** The time of an answer on the admin's own clock, `14:05:30`; the raw value when it is no time. */
export function formatLiveClock(at: string, timeZone?: string): string {
  const parsed = Date.parse(at);
  if (!Number.isFinite(parsed)) return at;
  return formatTime(parsed, 'de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
  });
}

/** A minute of the chart on the admin's own clock, `14:05`. */
export function formatLiveMinute(at: number, timeZone?: string): string {
  return formatTime(at, 'de-DE', { hour: '2-digit', minute: '2-digit', timeZone });
}

/** The sum of one figure over the chart's minutes. */
export function minuteTotal(
  minutes: readonly LiveMinutePoint[],
  key: 'pageviews' | 'events'
): number {
  return minutes.reduce((total, minute) => total + minute[key], 0);
}

/** Whether nothing at all arrived in the last half hour: no minute counted anything. */
export function isQuiet(live: LiveTraffic): boolean {
  return (
    live.activeVisitors === 0 &&
    live.perMinute.every(
      (minute) => minute.pageviews === 0 && minute.events === 0 && minute.visitors === 0
    )
  );
}

/**
 * The keys whose count rose since the previous answer, biggest rise first (a new key rises by its
 * whole count). The first answer has nothing to compare with, so it raises nothing: a page opened
 * to a busy site would otherwise ripple every country at once.
 */
export function risenKeys(
  previous: ReadonlyMap<string, number> | null,
  next: ReadonlyMap<string, number>
): string[] {
  if (!previous) return [];
  const rises: [string, number][] = [];
  for (const [key, count] of next) {
    const rise = count - (previous.get(key) ?? 0);
    if (rise > 0) rises.push([key, rise]);
  }
  return rises
    .sort(([keyA, a], [keyB, b]) => b - a || keyA.localeCompare(keyB))
    .map(([key]) => key);
}

/**
 * The countries that ripple after an answer, from those that rose (biggest rise first): only those
 * the map can place, none within `spacing` of one already picked, at most `max`.
 */
export function pickRipples(
  risen: readonly string[],
  anchors: Readonly<Record<string, { x: number; y: number }>>,
  max = MAX_RIPPLES,
  spacing = RIPPLE_SPACING
): string[] {
  const picked: string[] = [];
  for (const code of risen) {
    if (picked.length >= max) break;
    const anchor = anchors[code];
    if (!anchor) continue;
    const crowded = picked.some((other) => {
      const at = anchors[other];
      return Math.hypot(at.x - anchor.x, at.y - anchor.y) < spacing;
    });
    if (!crowded) picked.push(code);
  }
  return picked;
}

/** A row of a live list as it is drawn: in the list, or on its way out. */
export interface PlacedRow<T> {
  key: string;
  item: T;
  leaving: boolean;
}

/**
 * Lays out a list's rows after a new answer: the rows that were shown last time and are gone now
 * first, flagged as leaving and holding the item they were drawn with, then the rows of the answer
 * in its order. A leaving row is drawn out of the flow at the place it last held, so it can fade
 * there instead of vanishing, and coming first it is never the list's last child, whose spacing
 * differs. A row that was already leaving goes for good, and one that comes back is a row again.
 */
export function placeLiveRows<T>(
  previous: readonly PlacedRow<T>[],
  next: readonly T[],
  keyOf: (item: T) => string
): PlacedRow<T>[] {
  const placed: PlacedRow<T>[] = next.map((item) => ({ key: keyOf(item), item, leaving: false }));
  const nextKeys = new Set(placed.map((row) => row.key));
  const leaving = previous
    .filter((row) => !row.leaving && !nextKeys.has(row.key))
    .map((row) => ({ ...row, leaving: true }));
  return [...leaving, ...placed];
}

/**
 * The Traffic page for today, filtered to one value seen live: where a row of the live view leads
 * for the rest of the day's story. `dim` `null` opens today without a filter.
 */
export function liveDrillHref(
  dim: FilterDimension | null,
  value: string,
  locale: Locale | null
): string {
  const filters = dim ? [{ dim, value }] : [];
  return `/admin/traffic?${trafficQuery({ days: 1, locale, filters })}`;
}

/** The detail page of an event for today. */
export function liveEventHref(name: string, locale: Locale | null): string {
  return `/admin/traffic/events/${name}?${trafficQuery({ days: 1, locale })}`;
}
