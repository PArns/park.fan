/**
 * The link that hands a stored plan to somebody else, and how it is read back. The trip id is the
 * credential (see `trip-sync.ts`), so it travels in the URL fragment, which is not sent to the
 * server, not in a `Referer`, and excluded from Umami (`data-exclude-hash`). No localized segment:
 * the page is `noindex` and in no sitemap, like `/favorites`.
 */

import { forgetArmedPush } from './push-arming';
import { repointPushSubscription } from './push-repoint';
import { plannerStore } from './store';
import { forgetTrip, getTripId, syncTrip } from './trip-sync';
import type { PlannerState } from './types';

/** The page's path under the locale. */
export const SHARED_TRIP_PATH = '/trip-planner/shared';

/**
 * What `TripsService.newId` issues, 12 random bytes as base64url; the same rule as the proxy in
 * `app/api/trips/[id]/route.ts`, so a mangled link is refused without asking the server.
 */
const TRIP_ID = /^[A-Za-z0-9_-]{16}$/;

/** The absolute link for one trip, built from the page the button is on. */
export function sharedTripUrl(origin: string, locale: string, tripId: string): string {
  return `${origin}/${locale}${SHARED_TRIP_PATH}#${tripId}`;
}

/**
 * The trip id in a `location.hash`, or `null`. Decoded and trimmed first, since messengers may
 * percent-encode the fragment or append a space.
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
 * Take a shared plan over as this browser's own: it replaces the local plan, and the sender's id is
 * stored nowhere. With push on, the copy is synced at once, since the auto-sync is not mounted
 * here, and a trip replaced by that sync is re-pointed here too; where that fails, the plan is
 * taken down and the switch reads off, as for a refused write.
 */
export async function adoptSharedPlan(plan: PlannerState): Promise<void> {
  plannerStore.update((current) => ({ ...plan, version: current.version }));
  if (getTripId() === null) return;
  const synced = await syncTrip();
  if (!synced.ok || !synced.replaced) return;
  if (await repointPushSubscription(synced.id)) return;
  // Overtaken by a switch-off: the id is gone, and so is the plan.
  if (getTripId() !== synced.id) return;
  // The plan comes down and the switch reads off; the browser's subscription stays, as ride alerts
  // and followed shows share it. A refused DELETE keeps the id, so the next switch-off retries.
  await forgetTrip();
  forgetArmedPush();
}
