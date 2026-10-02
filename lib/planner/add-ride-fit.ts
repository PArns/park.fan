import type { PlanDay } from '@/lib/api/types';
import { buildDayGrid, earlyEntryOpenMin, growGridForSpans, withEarlyEntry } from './day-grid';
import { occupiedMinutes } from './estimate';
import { addWishKey, fitBlocks, fitChoiceAll, fitWishes, needsFitHelp, type FitInput } from './fit';
import { canOptimize } from './optimize';
import type { DayClock } from './park-time';
import type { PlannerEntry } from './types';

/**
 * The question a press on „In den Plan" raises, or `null` where it raises none
 * (PAR-67).
 *
 * The ride-page button files a ride without a minute, so `addEntry` puts it an
 * hour after the last entry and never before now. Late on the day you are in
 * the park that runs past closing within five presses and then stacks on the
 * 25:00 ceiling: eight presses at 20:10 gave `20:15 · 21:15 · 22:15 · 23:15 ·
 * 24:15 · 25:00 · 25:00 · 25:00`. The day had no room for the ride and the plan
 * did not say so.
 *
 * So the button asks the question the optimise buttons ask, with the same
 * three pieces (`fitWishes`, `fitBlocks`, `needsFitHelp`) and no second
 * wording of it: the day as planned plus this one ride, and whether the engine
 * can give every wish a slot before `closeMin`. Where it cannot, the answer is
 * the `FitInput` the assistant opens on, and nothing has been written.
 *
 * `null` means "file it the way the button always did", and that covers every
 * case where the question cannot be asked honestly: no payload, no opening
 * hours, a park whose wait times nobody can read (`canOptimize`, the same gate
 * the optimise row uses), a day already walked, and a ride the payload does
 * not list. A press there is not a conflict the app can measure, so it is not
 * one it may refuse.
 *
 * A second go on a ride already in the day („Nochmal") is a wish of its own.
 * `fitWishes` drops an addition whose slug is already planned, which is right
 * for the headliner button (it never adds a ride twice) and wrong here: the
 * press asks for another lap, and repeated presses on one ride are exactly how
 * the 25:00 stack was reached. So the lap is appended under its `a:<slug>` key,
 * and the engine plans it as an add like any other second go (`fitOrder` puts
 * laps last).
 */
export function noRoomForRide(params: {
  day: PlanDay | null | undefined;
  entries: readonly PlannerEntry[];
  attractionSlug: string;
  clock: DayClock;
  /**
   * The visitor's early-entry answer for this day (`PlannerDay.prefs`), folded
   * in with `withEarlyEntry` exactly as the day column folds it before the
   * optimise buttons see the day, so both ask about the same opening.
   */
  earlyEntry?: boolean;
}): FitInput | null {
  const { entries, attractionSlug, clock } = params;
  const day = withEarlyEntry(params.day, params.earlyEntry);
  if (!day || clock.phase === 'past') return null;
  const ride = day.rides.find((candidate) => candidate.attractionSlug === attractionSlug);
  if (!ride) return null;

  // The axis the panels build for the same day, grown until it holds the plan.
  // Only `closeMin` and the opening decide anything here and growth moves
  // neither, but it is the same grid the assistant would get from the flyout.
  const grid = growGridForSpans(
    buildDayGrid(
      day.context.openHour,
      day.context.closeHour,
      undefined,
      earlyEntryOpenMin(day.context)
    ),
    entries.map((entry) => ({
      startMinute: entry.startMinute,
      spanMinutes: occupiedMinutes(day, entry),
    }))
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
