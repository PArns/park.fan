import { parkDaysAvailable, type TripPlanState } from './plan';
import { AUTO_REST_STREAK, restStreak } from './wizard-choices';

/**
 * How many parks a trip's days hold before the visitor chooses any: the headliners the Parks step
 * starts with. Pure, so `scripts/test-orlando-plan.mjs` pins it.
 * docs/features/trip-planner/wizard.md#dates-and-parks.
 */

/** What of the trip decides how many park days it holds. */
export type TripFitState = Pick<
  TripPlanState,
  'from' | 'to' | 'arrival' | 'departure' | 'locks' | 'rest'
>;

/**
 * The park days a trip holds as the planner counts them: its days less a free arrival and a free
 * departure day (`parkDaysAvailable`), less the rest days the rest rule puts between them
 * (`rest=auto` no more than four park days in a row, `max:n` n, `none` no rest day). The arrival
 * and the departure break a run, so the days between them are one run.
 */
export function parkDaysHeld(state: TripFitState): number {
  const days = parkDaysAvailable(state);
  const streak =
    state.rest === 'none'
      ? null
      : state.rest === 'auto'
        ? AUTO_REST_STREAK
        : restStreak(state.rest);
  return streak === null ? days : days - Math.floor(days / (streak + 1));
}

/**
 * The headliners a trip starts with while the visitor has chosen no parks: the region's, in its
 * order, as many as the trip's park days hold ({@link parkDaysHeld}), at least one, a pinned one
 * always. Without both dates, and where all of them fit, the same list.
 */
export function headlinersForTrip(
  headliners: readonly string[],
  state: TripFitState
): readonly string[] {
  if (!state.from || !state.to) return headliners;
  const held = Math.max(1, parkDaysHeld(state));
  if (held >= headliners.length) return headliners;
  const pinned = new Set(state.locks.map((lock) => lock.target));
  let room = held - headliners.filter((slug) => pinned.has(slug)).length;
  const fitted = headliners.filter((slug) => pinned.has(slug) || room-- > 0);
  return fitted.length === headliners.length ? headliners : fitted;
}
