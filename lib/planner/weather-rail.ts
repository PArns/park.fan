import type { WeatherHourlyPoint } from '@/lib/api/types';
import { yFor, type DayGrid } from './day-grid';

/**
 * The weather rail's data, as geometry. Pure — no React, no DOM, no clock.
 *
 * The rail is a continuous band down the edge of the day and a handful of
 * labels, and the two halves answer different questions. The band answers "what
 * is it doing while I am in the park", continuously, so it is drawn for every
 * hour on the axis whether or not anything changed. The labels answer "when does
 * it turn", so they are drawn ONLY where it turns — a figure at every hour is a
 * table, and a table down the side of a plan is unreadable at a glance.
 *
 * The horizon is the forecast's, not the planner's: Open-Meteo answers about
 * fourteen days and the planner offers sixty, so most days have no rail at all
 * and the absence must read as "not known yet" rather than "dry". Nothing here
 * invents a value — {@link weatherRailSegments} returns an empty array and the
 * component renders nothing.
 */

/** How many days ahead the hourly forecast reaches. Measured, not documented upstream. */
export const WEATHER_RAIL_MAX_LEAD_DAYS = 14;

/**
 * Below this an hour counts as dry.
 *
 * Open-Meteo reports precipitation to a tenth of a millimetre, and 0.05 mm in an
 * hour is a damp railing rather than rain. Rounding it up to "0,1 mm" beside a
 * plan would promise the reader a decision to make about something they cannot
 * feel.
 */
export const WET_MM_FLOOR = 0.1;

/**
 * The condition groups the band paints, coarsest first.
 *
 * Deliberately fewer than the fifteen `getWeatherTranslationKey` distinguishes:
 * a 6 px column can carry maybe five colours a reader can tell apart, and
 * "drizzle" against "light rain" is not a decision anybody makes about a day at
 * a theme park. The labels beside it keep the full vocabulary.
 */
export type WeatherRailGroup = 'clear' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm';

/**
 * WMO weather code → the group the band paints.
 *
 * The same code ranges `getWeatherIcon` and `getWeatherTranslationKey` split on,
 * collapsed. A code this does not know is `cloud` rather than a hole: the band
 * is continuous by construction, and a gap in it would read as a gap in the day.
 *
 * The storm range is CLOSED (95–99) rather than "everything above 86", which is
 * how the first version read and how the fallback stopped being reachable — an
 * unrecognised code came out as a thunderstorm, the one group painted at full
 * strength. WMO stops at 99; a number past it is a bug upstream, not weather.
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
   * Whether this hour opens a new stretch — the first hour on the axis, or the
   * first hour of a group different from the one before it. This is what makes
   * the label sparse, and it is decided here rather than in the component so it
   * can be tested against a day rather than against a screenshot.
   */
  changes: boolean;
}

/**
 * One segment per hour the axis covers, in order.
 *
 * Clipped to the axis, never to the opening hours: a plan starts half an hour
 * before the park opens and the rain that decides what somebody wears is falling
 * then. Hours the forecast does not carry are skipped rather than filled, so a
 * partial day (the fourteenth, where the model runs out mid-afternoon) draws
 * what it has and stops.
 */
export function weatherRailSegments(
  grid: DayGrid,
  points: readonly WeatherHourlyPoint[] | undefined | null
): WeatherRailSegment[] {
  if (!points?.length) return [];

  const byHour = new Map<number, WeatherHourlyPoint>();
  for (const point of points) {
    // "YYYY-MM-DDTHH:00", park-local and naive — the same convention the nowcast
    // steps use. Parsing it as a Date would read it in the BROWSER's zone, which
    // is the one thing the planner never does.
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
    // A park closing after midnight runs the axis past 1440; the forecast is one
    // calendar day, so hour 25 is 01:00 and simply has no point. Skipped, not
    // wrapped: 01:00 of THIS day is twenty-four hours from the hour being drawn.
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
 * Whether this hour is wet enough to print a figure rather than an icon.
 *
 * The two are alternatives on purpose: the gutter is 44 px wide (40 on a phone)
 * and holds an hour label already, so an icon AND a figure do not both fit. A
 * wet hour's number is the thing worth reading; a dry one has no number, so it
 * gets the icon.
 */
export function isWet(segment: WeatherRailSegment): boolean {
  return segment.mm !== null && segment.mm >= WET_MM_FLOOR;
}

/**
 * Whether a date is inside the hourly forecast's reach.
 *
 * Both dates are `YYYY-MM-DD` in the PARK's reading, so this is a difference of
 * calendar days and not of instants — which is why it goes through `Date.UTC`
 * on the parts rather than through `new Date(string)`, whose result depends on
 * the reader's offset.
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
