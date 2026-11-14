/**
 * Whether a region's hub shows a plan: the hub has two states (docs/features/orlando-hub.md#two-states),
 * the landing page without a plan and "Your trip" with one. A plan is the planner's query with both
 * dates; the address bar holds it (a shared link, Parky's, one the visitor just planned), or this
 * browser remembers it (`remembered-trip.ts`) and the hub puts it back. Pure, so the rules are
 * pinned in `scripts/test-orlando-hub.mjs`; the hook that reads them is `HubTripProvider`.
 */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The dates of a planned trip, `YYYY-MM-DD` in the region's time. */
export interface HubTripDates {
  from: string;
  to: string;
}

/** The trip a planner query holds: both dates, as days, in order; else none. */
export function hubTripOf(query: string): HubTripDates | null {
  const params = new URLSearchParams(query);
  const from = params.get('from');
  const to = params.get('to');
  if (!from || !to || !ISO_DAY.test(from) || !ISO_DAY.test(to) || to < from) return null;
  return { from, to };
}

/**
 * The remembered query the hub puts back into the address bar, or null. Only on a bare visit (no
 * query at all: a link with `parks=` or a search came with its own intent) and only for a trip that
 * has not ended in the region's today, so a past holiday does not come back as "your plan".
 */
export function restorableTrip(
  search: string,
  remembered: string | null | undefined,
  todayIso: string
): string | null {
  if (new URLSearchParams(search).size > 0 || !remembered) return null;
  const trip = hubTripOf(remembered);
  return trip && trip.to >= todayIso ? remembered : null;
}
