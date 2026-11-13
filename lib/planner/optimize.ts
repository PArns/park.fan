import type { PlanDay, PlanDayRide } from '@/lib/api/types';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import type { DayGrid } from './day-grid';
import { worksPeriodFor } from './estimate';
import { partyFlags } from './party';
import type { DayClock } from './park-time';
import type { PlannerDayPrefs, PlannerEntry } from './types';

/**
 * Whether the optimise buttons are drawn, and over what. The search itself runs in the API
 * (`requestOptimize` in `optimize-remote.ts`), which applies these same rules; they stay here
 * because the buttons are drawn before anybody presses one, and a request per render would be a
 * request per minute per open planner. See docs/features/trip-planner/optimizer.md.
 */

/**
 * Whether the clock has passed this entry's start: at 14:00 somebody is already in the queue a
 * 13:30 block gives, so a started slot is fixed, not only a finished one.
 *
 * Strictly `<`: the floor snaps up to the quarter hour, so a press at 14:00 files the next ride AT
 * 14:00, and with `<=` that ride would count as started the instant it is planned.
 */
function hasStarted(entry: PlannerEntry, clock?: DayClock): boolean {
  return clock?.phase === 'today' && entry.startMinute < clock.nowMinute;
}

/**
 * The entries a press may move: not ticked off, not a free block, a real ride, not already under
 * way, and not shut for maintenance that day (`worksPeriodFor`). The API's engine reads the same
 * filter; the buttons need it to know whether there are two rides to order.
 */
export function movableEntries(
  entries: readonly PlannerEntry[],
  clock?: DayClock,
  day?: PlanDay | null
): PlannerEntry[] {
  return entries.filter(
    (entry) =>
      !entry.done &&
      !entry.custom &&
      entry.attractionSlug &&
      !hasStarted(entry, clock) &&
      !worksPeriodFor(day, entry.attractionSlug)
  );
}

/**
 * Whether ordering this day could mean anything.
 *
 * Three ways it cannot, and they are different: no payload at all, no axis to
 * place anything on, and a park whose wait times nobody can read — where every
 * ride costs the same assumed nothing and any order is as good as any other.
 */
export function canOptimize(day: PlanDay | null | undefined, grid: DayGrid | null): boolean {
  if (!day || !grid) return false;
  if (!hasReadableWaitTimes(day.context)) return false;
  return day.rides.length > 0;
}

/**
 * The park's headliners that this day does not have and this party can ride.
 *
 * The curated `isHeadliner`, never the day's busiest rides. The party filter removes rides here and
 * only here: everywhere else `partyFlags` flags without hiding, but this button says "plan the
 * headliners for us".
 */
export function headlinersToAdd(
  day: PlanDay | null | undefined,
  entries: readonly PlannerEntry[],
  prefs: PlannerDayPrefs | undefined
): PlanDayRide[] {
  if (!day) return [];
  const planned = new Set(
    entries.map((entry) => entry.attractionSlug).filter((slug): slug is string => Boolean(slug))
  );
  return day.rides.filter((ride) => {
    if (!ride.isHeadliner) return false;
    if (planned.has(ride.attractionSlug)) return false;
    const flags = partyFlags(ride, prefs);
    return !flags.tooShort && !flags.wet;
  });
}

/** Headliners this party cannot ride, so a caller can say how many were skipped. */
export function headlinersSkipped(
  day: PlanDay | null | undefined,
  entries: readonly PlannerEntry[],
  prefs: PlannerDayPrefs | undefined
): number {
  if (!day) return 0;
  const planned = new Set(
    entries.map((entry) => entry.attractionSlug).filter((slug): slug is string => Boolean(slug))
  );
  return day.rides.filter((ride) => {
    if (!ride.isHeadliner || planned.has(ride.attractionSlug)) return false;
    const flags = partyFlags(ride, prefs);
    return flags.tooShort || flags.wet;
  }).length;
}
