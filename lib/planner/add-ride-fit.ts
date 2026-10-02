import type { PlanDay } from '@/lib/api/types';
import { buildDayGrid, earlyEntryOpenMin, growGridForSpans } from './day-grid';
import { occupiedMinutes } from './estimate';
import { fitBlocks, fitChoiceAll, fitWishes, needsFitHelp, type FitInput } from './fit';
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
 * A second go on a ride already in the day („Nochmal") is not represented: a
 * wish is keyed per ride, and `fitWishes` drops an addition whose slug is
 * already planned, as it does for the headliner button. The probe then asks
 * about the day as it stands, which still catches the evening where it is
 * already full.
 */
export function noRoomForRide(params: {
  day: PlanDay | null | undefined;
  entries: readonly PlannerEntry[];
  attractionSlug: string;
  clock: DayClock;
}): FitInput | null {
  const { day, entries, attractionSlug, clock } = params;
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

  const input: FitInput = {
    day,
    grid,
    entries,
    wishes: fitWishes(day, entries, [ride], clock),
    blocks: fitBlocks(entries),
    clock,
  };
  return needsFitHelp(input, fitChoiceAll()) ? input : null;
}
