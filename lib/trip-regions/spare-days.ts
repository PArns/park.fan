import { addDays } from '@/lib/utils/park-day';
import {
  MAX_VISITS_PER_PARK,
  setParkVisits,
  setTripDates,
  type PlanDay,
  type TripPlan,
  type TripPlanState,
} from './plan';

/**
 * The assistant's question when a trip has many more days than its parks need ("8 days without a
 * park"), and the four answers it offers, worked out from the plan on screen. Pure, so
 * `scripts/test-wizard-steps.mjs` pins it. docs/features/trip-planner/wizard.md#days-without-a-park.
 */

/** More free days than this in a row are worth a question even where the park days outnumber them. */
export const LONG_FREE_RUN = 3;

/** An answer to the question, as `trip_spare_choice` counts it. */
export type SpareChoice = 'more_parks' | 'more_days' | 'free' | 'shorter';

/** What the question says and what each answer would do. */
export interface SpareQuestion {
  /** The days without a park nobody asked for. */
  free: number;
  parkDays: number;
  /** Every day of the trip, arrival and departure included. */
  days: number;
  /** The days that are neither: arrival, departure, a travel day, a rest the rule keeps. */
  others: number;
  /** The parks of the plan. */
  parks: number;
  /** Parks to add, the API's `spareDayParks` where it sends them, else the region's others. */
  moreParks: string[];
  /** The plan's parks that can take one more day, one each. */
  moreDays: string[];
  /** The trip's length without its free days, or `null` where that changes nothing. */
  shorter: number | null;
}

/**
 * A free day: one the API marks `spare`; from an API that does not mark them yet, every rest day
 * the visitor did not pin.
 */
export function isFreeDay(day: Pick<PlanDay, 'kind' | 'spare' | 'reasons'>): boolean {
  if (day.spare !== undefined) return day.spare;
  return day.kind === 'rest' && !day.reasons.includes('locked');
}

/** The longest run of free days in a row. */
export function longestFreeRun(
  days: readonly Pick<PlanDay, 'kind' | 'spare' | 'reasons'>[]
): number {
  let run = 0;
  let longest = 0;
  for (const day of days) {
    run = isFreeDay(day) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}

/**
 * The question for a plan, or `null` where the trip does not need it: asked once the free days
 * outnumber the park days, or more than {@link LONG_FREE_RUN} of them fall in a row.
 */
export function spareQuestion(
  plan: Pick<TripPlan, 'days' | 'parks' | 'totals' | 'spareDayParks'>,
  regionOrder: readonly string[]
): SpareQuestion | null {
  const free = plan.days.filter(isFreeDay).length;
  const parkDays = plan.totals.parkDays;
  if (free === 0 || (free <= parkDays && longestFreeRun(plan.days) <= LONG_FREE_RUN)) return null;
  const chosen = new Set(plan.parks.map((p) => p.slug));
  const offered = plan.spareDayParks?.map((p) => p.park);
  const moreParks = (offered ?? regionOrder.filter((slug) => !chosen.has(slug))).slice(0, free);
  const moreDays = plan.parks
    .filter((p) => p.dates.length > 0 && p.dates.length < MAX_VISITS_PER_PARK)
    .map((p) => p.slug)
    .slice(0, free);
  const days = plan.days.length;
  const others = days - free - plan.days.filter((d) => d.parks.length > 0).length;
  const shorter = days - free;
  return {
    free,
    parkDays,
    days,
    others,
    parks: plan.parks.filter((p) => p.dates.length > 0).length,
    moreParks,
    moreDays,
    shorter: shorter > 0 && shorter < days ? shorter : null,
  };
}

/** The state an answer leads to, from the state the question was asked for. */
export function answerSpare(
  state: TripPlanState,
  choice: SpareChoice,
  question: SpareQuestion,
  plan: Pick<TripPlan, 'parks'>,
  regionOrder: readonly string[],
  headliners: readonly string[]
): TripPlanState {
  switch (choice) {
    case 'free':
      return state;
    case 'more_parks':
      return question.moreParks.reduce(
        (s, slug) => setParkVisits(s, slug, null, regionOrder, headliners),
        state
      );
    case 'more_days':
      return question.moreDays.reduce((s, slug) => {
        const visits = plan.parks.find((p) => p.slug === slug)?.dates.length ?? 1;
        return setParkVisits(s, slug, visits + 1, regionOrder, headliners);
      }, state);
    case 'shorter':
      return state.from && question.shorter
        ? setTripDates(state, state.from, addDays(state.from, question.shorter - 1))
        : state;
  }
}
