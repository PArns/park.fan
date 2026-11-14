import type { PlanDay, PlanMeta, PlanParkSummary, PlanTotals, TripPlan } from './plan';
import type { TripEarlyKind, TripPerk, TripWhenWindow } from './types';

/**
 * Which sentence a plan's codes become. Pure: the codes are the API's (`docs/frontend/trip-regions.md`),
 * the sentences live in `messages/*.json` under `tripPlanner` (and a region's own under `tripRegions.<slug>.planner`), and this file only picks and
 * orders keys. A code this client does not know is dropped here, so the page never prints one raw;
 * the API may add codes before the site learns them.
 */

/** The reasons a park day can carry, most telling first: the one-line reason is the first present. */
export const PLAN_REASON_ORDER = [
  'locked',
  'quietest_in_window',
  'runner_up_close',
  'party_night',
  'express_included',
  'extended_evening',
  'early_park_admission',
  'early_entry',
  'happy_entry',
  'extra_magic_time',
  'holiday_ends',
  'water_park_weather',
  'weekday',
] as const;
/** A park day's reason this client can say. */
export type PlanReasonCode = (typeof PLAN_REASON_ORDER)[number];

/** A rest day's reasons, most telling first. */
export const REST_REASON_ORDER = ['locked', 'busiest_day_spared', 'rest_after_streak'] as const;
/** A rest day's reason this client can say. */
export type RestReasonCode = (typeof REST_REASON_ORDER)[number];

/**
 * The warnings, most consequential first. `repeat_back_to_back` and `adjacent_repeat` say the same
 * thing (two visits of one park on consecutive days, because nothing else fitted); the API names
 * it either way depending on its version, so both read as one line.
 */
export const PLAN_WARNING_ORDER = [
  'party_night_short_hours',
  'closes_early',
  'hours_not_published',
  'no_forecast',
  'estimate_last_year',
  'long_range',
  'repeat_back_to_back',
  'adjacent_repeat',
  'long_streak',
  'move_day',
  'long_day_trip',
] as const;

/**
 * The season's facts a day or a window can carry, said as short chips ("hot", "hurricane season",
 * "peak hurricane season"), never as sentences. The peak says the season already. The storm is the
 * region's (Orlando's hurricanes, Japan's typhoons); Japan's rainy season is a fact the ranking
 * does not price. A chip without words in `tripPlanner.climate` is not drawn.
 */
export type ClimateChip =
  'extreme_heat' | `${'hurricane' | 'typhoon'}_${'peak' | 'season'}` | 'rainy_season';

/** The climate chips of a day's or a window's warnings, in order, the season folded into its peak. */
export function climateChips(warnings: readonly string[]): ClimateChip[] {
  const chips: ClimateChip[] = [];
  if (warnings.includes('extreme_heat')) chips.push('extreme_heat');
  for (const storm of ['hurricane', 'typhoon'] as const) {
    if (warnings.includes(`${storm}_peak`)) chips.push(`${storm}_peak`);
    else if (warnings.includes(`${storm}_season`)) chips.push(`${storm}_season`);
  }
  if (warnings.includes('rainy_season')) chips.push('rainy_season');
  return chips;
}

/** Why an evening after the park is worth it, most telling first; the sheet says the first. */
export const EVENING_REASON_ORDER = [
  'park_closes_early',
  'night_show',
  'fireworks_view',
  'open_later',
  'free_entry',
  'short_transfer',
] as const;
/** An evening reason this client can say. */
export type EveningReasonCode = (typeof EVENING_REASON_ORDER)[number];

/** An evening's reasons this client can say, in order. */
export function eveningReasons(evening: { reasons: readonly string[] }): EveningReasonCode[] {
  return EVENING_REASON_ORDER.filter((code) => evening.reasons.includes(code));
}
/** A warning this client can say. */
export type PlanWarningCode = (typeof PLAN_WARNING_ORDER)[number];

const known = <T extends string>(order: readonly T[], codes: readonly string[]): T[] =>
  order.filter((code) => codes.includes(code));

/** The one-line reason of a day: the first code of {@link PLAN_REASON_ORDER} or {@link REST_REASON_ORDER} it carries. */
export function primaryReason(
  day: Pick<PlanDay, 'kind' | 'reasons'>
): PlanReasonCode | RestReasonCode | null {
  if (day.kind === 'rest') return known(REST_REASON_ORDER, day.reasons)[0] ?? null;
  if (day.kind !== 'park' && day.kind !== 'hop') return null;
  return known(PLAN_REASON_ORDER, day.reasons)[0] ?? null;
}

/**
 * A day's warnings this client can say, in order, the two spellings of a back-to-back repeat
 * folded into one.
 */
export function dayWarnings(day: Pick<PlanDay, 'warnings'>): PlanWarningCode[] {
  const codes = known(PLAN_WARNING_ORDER, day.warnings);
  return codes.includes('repeat_back_to_back')
    ? codes.filter((c) => c !== 'adjacent_repeat')
    : codes;
}

/**
 * The one marker a day may wear in the overview (Level 1): the fact that changes what the visitor
 * does that day, in this order. A day outside its ticket comes first (it can cost the entry at the
 * gate), then an early close (owner's decision: an earlier closing time always counts); a rest day
 * is a day off, an early slot is a reason to get up. Last year's figures are no marker: after the
 * forecast's days every day has them, and the answer says so once.
 */
export type DayMarker = 'outside_ticket' | 'closes' | 'rest' | 'early' | 'evening';

/** Whether the day guests leave early that day: the API's flag, or one of its two codes. */
export function closesEarly(day: Pick<PlanDay, 'closesEarly' | 'warnings' | 'reasons'>): boolean {
  return (
    day.closesEarly === true ||
    day.warnings.includes('party_night_short_hours') ||
    day.warnings.includes('closes_early') ||
    day.reasons.includes('closes_early')
  );
}

/** The one marker of a day in the overview, or `null`. */
export function dayMarker(
  day: Pick<PlanDay, 'kind' | 'warnings' | 'reasons' | 'perks' | 'closesEarly'>
): DayMarker | null {
  if (day.kind === 'rest') return 'rest';
  if (day.kind !== 'park' && day.kind !== 'hop') return null;
  if (day.warnings.includes('outside_ticket_window')) return 'outside_ticket';
  if (closesEarly(day)) return 'closes';
  const perks = day.perks ?? [];
  if (earlyPerk(perks) !== null) return 'early';
  if (perks.includes('extended_evening')) return 'evening';
  return null;
}

/** Rules the plan loosened, as `tripPlanner.relaxed.*` (or the region's own) keys; unknown ones are dropped. */
export function relaxedRules(
  meta: Pick<PlanMeta, 'relaxed'>
): Array<'blocks_relaxed' | 'streak_relaxed'> {
  return known(['blocks_relaxed', 'streak_relaxed'] as const, meta.relaxed ?? []);
}

/**
 * The chosen parks that got no day at all because the trip has too few park days, in the region's
 * order: the API's `parksLeftOut` where it sends it, else the parks `unplaced` names with no visit
 * on any day. The answer names them in one sentence with the ways to make room.
 */
export function parksLeftOut(plan: Pick<TripPlan, 'parksLeftOut' | 'unplaced' | 'days'>): string[] {
  if (plan.parksLeftOut) {
    return plan.parksLeftOut.filter((p) => p.reason === 'no_day_left').map((p) => p.park);
  }
  const planned = new Set(plan.days.flatMap((d) => d.parks.map((p) => p.slug)));
  return [
    ...new Set(
      plan.unplaced
        .filter((u) => u.reason === 'no_day_left' && !planned.has(u.slug))
        .map((u) => u.slug)
    ),
  ];
}

/**
 * The chosen parks a found window has no day for, and its park days, for the same sentence the plan
 * says: the API's `parksLeftOut` where it sends it, else the chosen parks its day-by-day sketch
 * does not name.
 */
export function windowParksLeftOut(
  plan: TripWhenWindow['plan'],
  chosen: readonly string[]
): { parks: string[]; days: number } | null {
  if (!plan) return null;
  const days = plan.days.filter((d) => d.kind === 'park' || d.kind === 'hop').length;
  const planned = new Set(plan.days.flatMap((d) => d.parks));
  const parks = plan.parksLeftOut
    ? plan.parksLeftOut.filter((p) => p.reason === 'no_day_left').map((p) => p.park)
    : chosen.filter((slug) => !planned.has(slug));
  return parks.length > 0 ? { parks, days } : null;
}

/** A park the plan could not give every visit, with a reason this client can say. */
export interface UnplacedPark {
  slug: string;
  reason: 'no_open_day' | 'no_second_day' | 'no_ticket_day' | 'no_base';
}

/**
 * A park the plan could not place, with a reason this client can say. A park {@link parksLeftOut}
 * names is said there; a park with a day that lost a repeat visit reads `no_second_day`.
 */
export function unplacedParks(
  plan: Pick<TripPlan, 'unplaced' | 'parksLeftOut' | 'days'>
): UnplacedPark[] {
  const left = new Set(parksLeftOut(plan));
  const planned = new Set(plan.days.flatMap((d) => d.parks.map((p) => p.slug)));
  const seen = new Set<string>();
  return plan.unplaced.flatMap((u): UnplacedPark[] => {
    if (left.has(u.slug) || seen.has(`${u.slug}:${u.reason}`)) return [];
    seen.add(`${u.slug}:${u.reason}`);
    if (u.reason === 'no_day_left') {
      return planned.has(u.slug) ? [{ slug: u.slug, reason: 'no_second_day' }] : [];
    }
    return u.reason === 'no_open_day' || u.reason === 'no_ticket_day' || u.reason === 'no_base'
      ? [{ slug: u.slug, reason: u.reason }]
      : [];
  });
}

/** Pins the plan could not keep, with a reason this client can say. */
export function ignoredLocks(plan: Pick<TripPlan, 'ignoredLocks'>): Array<{
  target: string;
  date: string;
  reason: 'outside_trip' | 'closed' | 'day_taken' | 'no_visit_left' | 'base_unreachable';
}> {
  const reasons = [
    'outside_trip',
    'closed',
    'day_taken',
    'no_visit_left',
    'base_unreachable',
  ] as const;
  return (plan.ignoredLocks ?? []).flatMap((l) => {
    const reason = reasons.find((r) => r === l.reason);
    const [target, date] = l.lock.split('@');
    return reason && target && date ? [{ target, date, reason }] : [];
  });
}

/**
 * What the savings sentence says, from the plan's totals: minutes per headliner ride, never hours
 * per trip. `flat` where the order barely matters (the API's `orderMatters` false), and `null`
 * without both figures.
 */
export type PlanSavings = {
  kind: 'saving' | 'flat';
  planned: number;
  average: number;
  /** Planned less than average, per ride; 0 or less never reads as a saving. */
  saved: number;
  expectedError: number | null;
};

/** The savings sentence's figures, or `null` where the totals carry none. */
export function planSavings(totals: PlanTotals): PlanSavings | null {
  const planned = totals.headlinerWait;
  const average = totals.averageDayWait;
  if (planned == null || average == null) return null;
  const saved = Math.max(0, Math.round(totals.savedMinutesPerRide ?? average - planned));
  const flat = totals.orderMatters === false || saved === 0;
  return {
    kind: flat ? 'flat' : 'saving',
    planned: Math.round(planned),
    average: Math.round(average),
    saved,
    expectedError: totals.expectedError != null ? Math.round(totals.expectedError) : null,
  };
}

/**
 * From which date a run of days, in date order, reads last year's measured day: the first that does,
 * and `all` when that is the first of them. After the forecast's days every day does, because the
 * API ranks them on last year; a surface says it once with this, never per day. `null` when none
 * does.
 */
export function lastYearStart<T extends { date: string }>(
  days: readonly T[],
  lastYear: (day: T) => boolean
): { from: string; all: boolean } | null {
  const first = days.find(lastYear);
  return first ? { from: first.date, all: first === days[0] } : null;
}

/** Whether a plan day is figured on last year's measured day, the whole day or one of its parks. */
export function planDayLastYear(day: Pick<PlanDay, 'basis' | 'parks'>): boolean {
  return day.basis === 'last_year' || day.parks.some((p) => p.basis === 'last_year');
}

/**
 * The runner-up of a park's visit on `date`: the best alternative day, with how many minutes more
 * (or fewer) its headliners wait. `null` without one or without both figures.
 */
export function runnerUp(
  summary: Pick<PlanParkSummary, 'alternatives'> | undefined,
  plannedWait: number | undefined
): { date: string; wait: number; delta: number } | null {
  const alt = summary?.alternatives.find((a) => a.headlinerWait != null);
  if (!alt || alt.headlinerWait == null || plannedWait == null) return null;
  return { date: alt.date, wait: alt.headlinerWait, delta: alt.headlinerWait - plannedWait };
}

/** The early slots in the order a day names them when a hotel has several. */
const EARLY_PERKS: readonly TripEarlyKind[] = [
  'early_park_admission',
  'early_entry',
  'happy_entry',
  'extra_magic_time',
];

/** The early slot a day's hotel gets, if any, by the region's own name for it. */
export function earlyPerk(perks: readonly TripPerk[] | undefined): TripEarlyKind | null {
  if (!perks) return null;
  return EARLY_PERKS.find((kind) => perks.includes(kind)) ?? null;
}

/**
 * The edit bar's figure: what the visitor's pins cost against the best order the plan had before
 * them, per ride, in whole minutes. `null` without both means; 0 reads as "no cost".
 */
export function editCost(
  best: Pick<PlanTotals, 'headlinerWait'> | null,
  current: Pick<PlanTotals, 'headlinerWait'> | null
): { best: number; current: number; delta: number } | null {
  if (best?.headlinerWait == null || current?.headlinerWait == null) return null;
  const b = Math.round(best.headlinerWait);
  const c = Math.round(current.headlinerWait);
  return { best: b, current: c, delta: c - b };
}

/**
 * The parks the split gave a second (or third) day, for the answer's "we added a second day at
 * Magic Kingdom Park". Only entries the API marks `auto` with more than one visit; anything else
 * in `meta.split` is ignored.
 */
export function autoSplit(
  meta: Pick<PlanMeta, 'split'>
): Array<{ slug: string; visits: number; ticket?: string }> {
  if (!Array.isArray(meta.split)) return [];
  return meta.split.flatMap((e) =>
    e && e.auto === true && typeof e.slug === 'string' && Number.isInteger(e.visits) && e.visits > 1
      ? [
          {
            slug: e.slug,
            visits: e.visits,
            ...(typeof e.ticket === 'string' && { ticket: e.ticket }),
          },
        ]
      : []
  );
}
