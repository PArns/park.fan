/**
 * The link that hands a stored plan to somebody else, and how it is read back.
 *
 * The trip id is the credential (see `trip-sync.ts`), so it travels in the URL
 * FRAGMENT and never in the path or the query: a fragment is not sent to the
 * server, so it stays out of access logs and out of the `Referer` of anything
 * the page loads, and Umami is loaded with `data-exclude-hash="true"`
 * (`app/[locale]/layout.tsx`), so it does not reach the analytics either.
 *
 * No localized segment. Like `/favorites` and `/alerts`, the page shows state
 * that exists only for whoever holds the link, is `noindex`, and is in no
 * sitemap, so there is nothing a translated slug would help rank.
 */

import { plannerStore } from './store';
import { getTripId, syncTrip } from './trip-sync';
import type { PlannerState } from './types';

/** The page's path under the locale. */
export const SHARED_TRIP_PATH = '/trip-planner/shared';

/**
 * What `TripsService.newId` issues: 12 random bytes as base64url. The same rule
 * as the proxy in `app/api/trips/[id]/route.ts`, so the page refuses a mangled
 * link itself instead of asking the server about it.
 */
const TRIP_ID = /^[A-Za-z0-9_-]{16}$/;

/** The absolute link for one trip, built from the page the button is on. */
export function sharedTripUrl(origin: string, locale: string, tripId: string): string {
  return `${origin}/${locale}${SHARED_TRIP_PATH}#${tripId}`;
}

/**
 * The trip id in a `location.hash`, or `null` when the fragment is not one.
 *
 * Decoded and trimmed before the check, because some messengers percent-encode
 * the fragment or carry a trailing space into the copied link.
 */
export function tripIdFromHash(hash: string): string | null {
  let value = hash.startsWith('#') ? hash.slice(1) : hash;
  try {
    value = decodeURIComponent(value);
  } catch {
    return null;
  }
  value = value.trim();
  return TRIP_ID.test(value) ? value : null;
}

/**
 * Take a shared plan over as this browser's own.
 *
 * The plan replaces the local one, and the sender's id is not stored anywhere.
 * Every write that follows therefore goes to THIS browser's trip, if it has
 * one, and never to the sender's.
 *
 * With push on, the viewer's own copy on the server is updated right away. The
 * auto-sync would not do it: it is armed only while the push switch is mounted
 * (the open panel or the planner page), and it reacts to edits made after it
 * subscribed. Without this call, the notification job would keep reading the
 * viewer's previous plan until their next edit.
 */
export async function adoptSharedPlan(plan: PlannerState): Promise<void> {
  plannerStore.update((current) => ({ ...plan, version: current.version }));
  if (getTripId() !== null) await syncTrip();
}
