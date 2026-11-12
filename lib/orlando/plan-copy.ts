import { addDays, daysBetween } from '@/lib/utils/park-day';
import type { PlanDay, PlanMeta, PlanParkSummary, PlanTotals, TripPlan } from './plan';
import type { TripPerk } from './types';

/**
 * Which sentence a plan's codes become. Pure: the codes are the API's (`docs/frontend/trip-regions.md`),
 * the sentences live in `messages/*.json` under `orlandoPlanner`, and this file only picks and
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
] as const;
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
 * does that day, in this order. An early close comes first (owner's decision: an earlier closing
 * time always counts), a rest day is a day off, an early slot is a reason to get up.
 */
export type DayMarker = 'closes' | 'rest' | 'early' | 'evening' | 'last_year';

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
  day: Pick<PlanDay, 'kind' | 'warnings' | 'reasons' | 'perks' | 'basis' | 'closesEarly'>
): DayMarker | null {
  if (day.kind === 'rest') return 'rest';
  if (day.kind !== 'park' && day.kind !== 'hop') return null;
  if (closesEarly(day)) return 'closes';
  const perks = day.perks ?? [];
  if (perks.includes('early_entry') || perks.includes('early_park_admission')) return 'early';
  if (perks.includes('extended_evening')) return 'evening';
  if (day.basis === 'last_year') return 'last_year';
  return null;
}

/** Rules the plan loosened, as `orlandoPlanner.relaxed.*` keys; unknown ones are dropped. */
export function relaxedRules(
  meta: Pick<PlanMeta, 'relaxed'>
): Array<'blocks_relaxed' | 'streak_relaxed'> {
  return known(['blocks_relaxed', 'streak_relaxed'] as const, meta.relaxed ?? []);
}

/** A park the plan could not place, with a reason this client can say. */
export function unplacedParks(
  plan: Pick<TripPlan, 'unplaced'>
): Array<{ slug: string; reason: 'no_open_day' | 'no_day_left' }> {
  return plan.unplaced.flatMap((u) =>
    u.reason === 'no_open_day' || u.reason === 'no_day_left'
      ? [{ slug: u.slug, reason: u.reason }]
      : []
  );
}

/** Pins the plan could not keep, with a reason this client can say. */
export function ignoredLocks(plan: Pick<TripPlan, 'ignoredLocks'>): Array<{
  target: string;
  date: string;
  reason: 'outside_trip' | 'closed' | 'day_taken' | 'no_visit_left';
}> {
  const reasons = ['outside_trip', 'closed', 'day_taken', 'no_visit_left'] as const;
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
  const saved = Math.max(0, totals.savedMinutesPerRide ?? average - planned);
  const flat = totals.orderMatters === false || saved === 0;
  return {
    kind: flat ? 'flat' : 'saving',
    planned: Math.round(planned),
    average: Math.round(average),
    saved: Math.round(saved),
    expectedError: totals.expectedError != null ? Math.round(totals.expectedError) : null,
  };
}

/**
 * When the forecast should reach the trip's first `last_year` day: the horizon (today to
 * `forecastUntil`) moves forward a day a day, so it reaches that day as many days before it as the
 * horizon is long. Never before tomorrow. `null` when no day of the plan is a last-year day or the
 * calendar has no horizon yet.
 */
export function lastYearReach(
  days: readonly Pick<PlanDay, 'date' | 'basis' | 'parks'>[],
  forecastUntil: string | undefined,
  today: string
): { first: string; reach: string } | null {
  const first = days.find(
    (d) => d.basis === 'last_year' || d.parks.some((p) => p.basis === 'last_year')
  )?.date;
  if (!first || !forecastUntil) return null;
  const horizon = Math.max(0, daysBetween(today, forecastUntil));
  const reach = addDays(first, -horizon);
  const tomorrow = addDays(today, 1);
  return { first, reach: reach < tomorrow ? tomorrow : reach };
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

/** The early slot a day's hotel gets, if any. */
export function earlyPerk(perks: readonly TripPerk[] | undefined): TripPerk | null {
  if (!perks) return null;
  if (perks.includes('early_park_admission')) return 'early_park_admission';
  if (perks.includes('early_entry')) return 'early_entry';
  return null;
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
