import type { WeatherHourlyPoint } from '@/lib/api/types';
import { yFor, type DayGrid } from './day-grid';

/**
 * The weather rail's data, as geometry. Pure: no React, no DOM, no clock.
 *
 * The band is drawn for every hour on the axis; the labels only where the weather turns, since a
 * figure at every hour is a table. The horizon is the forecast's (about fourteen days), and past it
 * {@link weatherRailSegments} returns nothing rather than inventing a value.
 */

/** How many days ahead the hourly forecast reaches. Measured, not documented upstream. */
export const WEATHER_RAIL_MAX_LEAD_DAYS = 14;

/**
 * Below this an hour counts as dry: 0.05 mm is a damp railing, not rain to plan around.
 */
export const WET_MM_FLOOR = 0.1;

/**
 * The condition groups the band paints, coarsest first. Fewer than `getWeatherConfig` labels: a
 * 6 px column carries about five colours a reader can tell apart. The labels keep the full set.
 */
export type WeatherRailGroup = 'clear' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm';

/**
 * WMO weather code to the group the band paints, on the ranges `getWeatherConfig` splits on. An
 * unknown code is `cloud`, never a hole, since the band is continuous. The storm range is closed
 * (95–99), so an unknown code is never painted as the loudest group.
 */
export function weatherRailGroup(code: number | null | undefined): WeatherRailGroup {
  if (code === null || code === undefined) return 'cloud';
  if (code === 0) return 'clear';
  if (code <= 3) return 'cloud';
  if (code <= 48) return 'fog';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'rain';
  if (code <= 86) return 'snow';
  if (code >= 95 && code <= 99) return 'storm';
  return 'cloud';
}

/** One hour of the rail: where it is drawn and what the forecast says for it. */
export interface WeatherRailSegment {
  /** Park-local hour, 0–23. */
  hour: number;
  /** Pixels from the canvas top, and the height of this hour's slice. */
  y: number;
  height: number;
  group: WeatherRailGroup;
  /** The raw WMO code, for the label's own vocabulary. */
  code: number | null;
  /** Millimetres in this hour, or `null` where the forecast gives none. */
  mm: number | null;
  /** 0–100, or `null`. */
  probability: number | null;
  temperatureC: number | null;
  /**
   * Whether this hour opens a new stretch: the first hour, or a group different from the one
   * before. Decided here, not in the component, so it can be tested against a day.
   */
  changes: boolean;
}

/**
 * One segment per hour the axis covers, in order: clipped to the axis, not to the opening hours,
 * since the rain before opening decides what somebody wears. Hours the forecast lacks are skipped,
 * not filled.
 */
export function weatherRailSegments(
  grid: DayGrid,
  points: readonly WeatherHourlyPoint[] | undefined | null
): WeatherRailSegment[] {
  if (!points?.length) return [];

  const byHour = new Map<number, WeatherHourlyPoint>();
  for (const point of points) {
    // "YYYY-MM-DDTHH:00", park-local and naive: parsing it as a Date would read the browser's zone.
    const match = /T(\d{2}):/.exec(point.time);
    if (!match) continue;
    byHour.set(Number(match[1]), point);
  }
  if (byHour.size === 0) return [];

  const out: WeatherRailSegment[] = [];
  const firstHour = Math.floor(grid.gridStartMin / 60);
  const lastHour = Math.floor((grid.gridEndMin - 1) / 60);

  let previous: WeatherRailGroup | null = null;
  for (let hour = firstHour; hour <= lastHour; hour++) {
    // Past midnight the forecast, one calendar day, has no point: skipped, not wrapped.
    const point = hour < 24 ? byHour.get(hour) : undefined;
    if (!point) continue;

    const top = Math.max(yFor(grid, hour * 60), 0);
    const bottom = Math.min(yFor(grid, (hour + 1) * 60), grid.heightPx);
    if (bottom <= top) continue;

    const group = weatherRailGroup(point.weatherCode);
    out.push({
      hour,
      y: top,
      height: bottom - top,
      group,
      code: point.weatherCode ?? null,
      mm: point.precipitationMm ?? null,
      probability: point.precipitationProbability ?? null,
      temperatureC: point.temperatureC ?? null,
      changes: group !== previous,
    });
    previous = group;
  }

  return out;
}

/**
 * Whether this hour is wet enough to print a figure rather than an icon. Alternatives, because the
 * gutter beside an hour label has room for one of them.
 */
export function isWet(segment: WeatherRailSegment): boolean {
  return segment.mm !== null && segment.mm >= WET_MM_FLOOR;
}

/**
 * Whether a date is inside the hourly forecast's reach. Both dates are park-local `YYYY-MM-DD`, so
 * this counts calendar days through `Date.UTC`, never `new Date(string)`, which depends on the
 * reader's offset.
 */
export function withinWeatherHorizon(today: string, date: string): boolean {
  const days = dayDifference(today, date);
  return days !== null && days >= 0 && days <= WEATHER_RAIL_MAX_LEAD_DAYS;
}

function dayDifference(from: string, to: string): number | null {
  const a = parseDay(from);
  const b = parseDay(to);
  if (a === null || b === null) return null;
  return Math.round((b - a) / 86_400_000);
}

function parseDay(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
