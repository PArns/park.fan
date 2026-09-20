import type { WorksPeriod } from '@/lib/api/types';

/**
 * Whether a curated rebuild window covers a given day.
 *
 * The TypeScript twin of the backend's `isCuratedOutOfService()`, and it has to
 * stay one: both halves compare the same two curated `date` columns against the
 * same park-local day, and a window that reads as running on one side and
 * finished on the other puts a „Umbaupause" badge on a ride whose planner gate
 * has already reopened.
 *
 * The comparison is lexicographic on `YYYY-MM-DD`, which for that format IS a
 * calendar comparison. No `Date` is constructed on purpose: parsing either
 * bound would drag an offset — the server's, or the reader's — into a question
 * that is only ever about the park's own calendar.
 *
 * Both bounds are inclusive: a window ending on the 3rd covers the 3rd. Either
 * may be null, and a half-open window runs from or until forever on that side.
 * Both null cannot happen (the API sends `null` for the whole block instead),
 * but it answers false rather than true, because "nothing is claimed" must not
 * read as "in a rebuild".
 *
 * @param period - The window as the API sends it, or null/undefined for none.
 * @param onDate - The PARK-local day as `YYYY-MM-DD`. Server-computed: a client
 *   component reading its own clock here is the hydration bug that
 *   `docs/rules/a-client-only-preference-may-not-decide-server-rendered-markup.md`
 *   exists to prevent. Undefined means "no day to test against", and the answer
 *   is then false — a listing that does not know the park's day (favorites, the
 *   blog, the homepage) says nothing rather than guessing.
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
