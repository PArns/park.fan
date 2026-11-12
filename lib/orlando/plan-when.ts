import { addDays } from '@/lib/utils/park-day';
import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import {
  MAX_DAYS_AHEAD,
  planQueryEntries,
  type OrlandoPlanState,
  type PlanSearchRange,
} from './plan';
import type { TripSchoolBreaks, TripWhenWeek, TripWhenWindow } from './types';

/**
 * The When mode: which dates to go, for parks and a trip length the visitor knows, from the API's
 * `/when` (`docs/frontend/trip-regions-when.md` in the API repo). Pure: the search ranges the
 * period chips stand for, the request, and which of the answer's codes this client can say.
 */

/** Windows the result asks for: the three cards of Level 0. */
export const WHEN_LIMIT = 3;

/** The period chips, in the order they are offered. */
export type WhenPeriodKey = 'next12' | 'year' | 'spring' | 'summer' | 'autumn' | 'custom';

/** A chip: its key, the year it names (for the label) and its range, already clipped to the horizon. */
export interface WhenPeriod {
  key: Exclude<WhenPeriodKey, 'custom'>;
  year: number;
  range: PlanSearchRange;
}

/**
 * The ranges behind the period chips, in park time: the next twelve months, the next calendar
 * year, and its spring (March–May), summer (June–August) and autumn (September–November). Each is
 * clipped to the year the API looks ahead; a period that has no `days` left inside it is not
 * offered, so a chip never asks for a 400.
 */
export function whenPeriods(today: string, days: number): WhenPeriod[] {
  const last = addDays(today, MAX_DAYS_AHEAD);
  const year = Number(today.slice(0, 4)) + 1;
  const clip = (from: string, to: string): PlanSearchRange | null => {
    const a = from < today ? today : from;
    const b = to > last ? last : to;
    return addDays(a, days - 1) <= b ? { from: a, to: b } : null;
  };
  const candidates: Array<[WhenPeriod['key'], string, string]> = [
    ['next12', today, last],
    ['year', `${year}-01-01`, `${year}-12-31`],
    ['spring', `${year}-03-01`, `${year}-05-31`],
    ['summer', `${year}-06-01`, `${year}-08-31`],
    ['autumn', `${year}-09-01`, `${year}-11-30`],
  ];
  return candidates.flatMap(([key, from, to]) => {
    const range = clip(from, to);
    return range ? [{ key, year, range }] : [];
  });
}

/** Which chip a search range is: one of {@link whenPeriods}, else `custom`. */
export function whenPeriodOf(
  range: PlanSearchRange | null,
  periods: readonly WhenPeriod[]
): WhenPeriodKey {
  if (!range) return 'next12';
  return (
    periods.find((p) => p.range.from === range.from && p.range.to === range.to)?.key ?? 'custom'
  );
}

/**
 * The `/when` request's query: the search, the length, the holiday region, the three windows the
 * cards show, and the trip options `/plan` takes, pins aside. `null` outside the When mode.
 */
export function whenRequestQuery(state: OrlandoPlanState): Record<string, string> | null {
  if (!state.when) return null;
  const query: Record<string, string> = {
    from: state.when.from,
    to: state.when.to,
    days: String(state.days),
  };
  if (state.within) query.within = state.within;
  query.limit = String(WHEN_LIMIT);
  for (const [key, value] of planQueryEntries({ ...state, when: null, locks: [] })) {
    if (key !== 'from' && key !== 'to') query[key] = value;
  }
  return query;
}

/** The reasons a window can carry, most telling first; the card shows the first. */
export const WHEN_REASON_ORDER = [
  'no_school_break',
  'after_holidays',
  'before_spring_break',
  'festival',
  'long_days',
  'mild_weather',
] as const;
/** A window reason this client can say. */
export type WhenReasonCode = (typeof WHEN_REASON_ORDER)[number];

/** The warnings a window can carry, most consequential first. */
export const WHEN_WARNING_ORDER = [
  'party_nights',
  'school_break',
  'water_park_closed',
  'hurricane_season',
  'hours_not_published',
  'estimate_last_year',
] as const;
/** A window warning this client can say. */
export type WhenWarningCode = (typeof WHEN_WARNING_ORDER)[number];

/** A window's reasons this client can say, in order. */
export function windowReasons(window: Pick<TripWhenWindow, 'reasons'>): WhenReasonCode[] {
  return WHEN_REASON_ORDER.filter((code) => window.reasons.includes(code));
}

/** A window's warnings this client can say, in order. */
export function windowWarnings(window: Pick<TripWhenWindow, 'warnings'>): WhenWarningCode[] {
  return WHEN_WARNING_ORDER.filter((code) => window.warnings.includes(code));
}

/**
 * How far a window lies below the range's average, in whole percent: "27 % below the period's
 * average". `null` where it is not below or a figure is missing; a window above average is never
 * sold as a saving.
 */
export function percentBelowAverage(
  window: Pick<TripWhenWindow, 'headlinerWait' | 'rangeAverageWait'>
): number | null {
  const { headlinerWait: wait, rangeAverageWait: average } = window;
  if (wait == null || average == null || average <= 0) return null;
  const below = Math.round(((average - wait) / average) * 100);
  return below > 0 ? below : null;
}

/** The five tiers the year strip paints with, quietest first. */
const STRIP_TIERS: readonly ColoredCrowdLevel[] = [
  'very_low',
  'low',
  'moderate',
  'high',
  'very_high',
];

/**
 * The year strip's tint per week: where the week's figure falls among the range's weeks, in five
 * equal shares from the quietest to the busiest. A comparison inside the period on screen, which the
 * strip's legend says, never the crowd calendar's level. `null` for a week without a figure.
 */
export function weekTiers(
  weeks: readonly Pick<TripWhenWeek, 'headlinerWait'>[]
): Array<ColoredCrowdLevel | null> {
  const figures = weeks
    .map((w) => w.headlinerWait)
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  if (figures.length === 0) return weeks.map(() => null);
  return weeks.map((w) => {
    if (w.headlinerWait == null) return null;
    // The share of weeks strictly quieter, so equal figures share a tier.
    const below = figures.findIndex((v) => v >= (w.headlinerWait as number));
    const share = figures.length > 1 ? below / (figures.length - 1) : 0;
    return STRIP_TIERS[Math.min(STRIP_TIERS.length - 1, Math.floor(share * STRIP_TIERS.length))];
  });
}

/** Whether a week overlaps a window, for marking the window on the strip. */
export function weekInWindow(
  weekStart: string,
  window: Pick<TripWhenWindow, 'from' | 'to'>
): boolean {
  return weekStart <= window.to && addDays(weekStart, 6) >= window.from;
}

/** The countries the picker asks the holiday data for: where most of park.fan's visitors live. */
export const WHEN_HOLIDAY_COUNTRIES = ['DE', 'NL', 'GB'] as const;

/** The country a locale's visitors most likely come from, offered first in the holiday picker. */
const LOCALE_COUNTRY: Record<string, string> = { de: 'DE', nl: 'NL', en: 'GB' };

/** A country of the picker with its regions, in the holiday data's own codes and names. */
export interface WhenHolidayCountry {
  country: string;
  regions: Array<{ code: string; name: string; through: string }>;
}

/**
 * The holiday data's regions grouped by country, the locale's own country first, each country's
 * regions in the order the data lists them. Only what the data has: a region it lacks is not
 * offered.
 */
export function holidayRegionsFor(
  answer: TripSchoolBreaks | undefined,
  locale: string
): WhenHolidayCountry[] {
  const byCountry = new Map<string, WhenHolidayCountry>();
  for (const r of answer?.regions ?? []) {
    const entry = byCountry.get(r.country) ?? { country: r.country, regions: [] };
    entry.regions.push({ code: r.code, name: r.name, through: r.through });
    byCountry.set(r.country, entry);
  }
  const first = LOCALE_COUNTRY[locale];
  return [...byCountry.values()].sort(
    (a, b) => Number(b.country === first) - Number(a.country === first)
  );
}
