import type { PlanDay } from '@/lib/api/types';
import { buildDayGrid, earlyEntryOpenMin, growGridForSpans, withEarlyEntry } from './day-grid';
import { spansFor } from './estimate';
import {
  addWishKey,
  fitBlocks,
  fitChoiceAll,
  fitWishes,
  needsFitHelp,
  togglePin,
  type FitChoice,
  type FitInput,
} from './fit';
import { canOptimize } from './optimize';
import type { DayClock } from './park-time';
import type { PlannerEntry } from './types';

/**
 * The question a press on „In den Plan" raises, or `null` where it raises none.
 *
 * The button files without a minute, so `addEntry` puts the ride an hour after the last entry, and
 * late in the day presses run past closing and stack on the 25:00 ceiling. So it asks what the
 * optimise buttons ask (`fitWishes`, `fitBlocks`, `needsFitHelp`): the day plus this ride, and
 * whether every wish gets a slot before `closeMin`. Where not, the answer is the `FitInput` the
 * assistant opens on, and nothing has been written.
 *
 * `null` (file as before) wherever the question cannot be asked honestly: no payload, no hours, no
 * readable waits (`canOptimize`), a walked day, or a ride the payload does not list. A second go on
 * a planned ride is appended under its `a:<slug>` key, since `fitWishes` drops repeats. See
 * docs/rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md.
 */
export function noRoomForRide(params: {
  day: PlanDay | null | undefined;
  entries: readonly PlannerEntry[];
  attractionSlug: string;
  clock: DayClock;
  /**
   * The visitor's early-entry answer for this day, folded in with `withEarlyEntry` as the day
   * column does, so both ask about the same opening.
   */
  earlyEntry?: boolean;
}): FitInput | null {
  const { entries, attractionSlug, clock } = params;
  const day = withEarlyEntry(params.day, params.earlyEntry);
  if (!day || clock.phase === 'past') return null;
  const ride = day.rides.find((candidate) => candidate.attractionSlug === attractionSlug);
  if (!ride) return null;

  // The same grown axis the panel builds, so the assistant gets the grid the flyout would give it.
  const grid = growGridForSpans(
    buildDayGrid(
      day.context.openHour,
      day.context.closeHour,
      undefined,
      earlyEntryOpenMin(day.context)
    ),
    spansFor(day, entries)
  );
  if (!grid || !canOptimize(day, grid)) return null;

  const wishes = fitWishes(day, entries, [ride], clock);
  const key = addWishKey(attractionSlug);
  if (!wishes.some((wish) => wish.key === key)) {
    wishes.push({
      key,
      entryId: null,
      attractionSlug,
      attractionName: ride.attractionName,
      ride,
      headliner: Boolean(ride.isHeadliner),
    });
  }

  const input: FitInput = {
    day,
    grid,
    entries,
    wishes,
    blocks: fitBlocks(entries),
    clock,
  };
  return needsFitHelp(input, fitChoiceAll()) ? input : null;
}

/**
 * The answer the assistant opens on after „In den Plan": everything ticked and the pressed ride
 * pinned, so the proposed plan cannot leave out the ride just asked for. An ordinary pin the
 * visitor can take off.
 */
export function requestedRideChoice(attractionSlug: string): FitChoice {
  return togglePin(fitChoiceAll(), addWishKey(attractionSlug));
}
