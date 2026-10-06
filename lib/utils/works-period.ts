import type { WorksPeriod } from '@/lib/api/types';

/**
 * Whether a curated rebuild window covers a given day. The twin of the backend's
 * `isCuratedOutOfService()` and must stay one, or the „Umbaupause" badge and the planner gate
 * disagree. Compared as `YYYY-MM-DD` strings, never `Date`s, so no offset enters a question about
 * the park's own calendar. Both bounds are inclusive and either may be null (open-ended); both null
 * answers false, since „nothing claimed" must not read as „in a rebuild".
 *
 * @param onDate The PARK-local day, computed on the server (a client clock here is a hydration
 *   bug). Undefined answers false, so a listing that does not know the park's day says nothing.
 */
export function isWorksPeriodActive(
  period: WorksPeriod | null | undefined,
  onDate: string | undefined
): boolean {
  if (!period || !onDate) return false;

  const { from, to } = period;
  if (!from && !to) return false;
  if (from && onDate < from) return false;
  if (to && onDate > to) return false;
  return true;
}
