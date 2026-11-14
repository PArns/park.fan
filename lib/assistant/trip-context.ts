import { tripPlannerBridge } from '@/lib/trip-regions/planner-bridge';
import {
  forgetTrip,
  rememberedTrip,
  rememberedTrips,
  type TripParty,
} from '@/lib/trip-regions/remembered-trip';

/**
 * The trip planner as Parky reads and changes it: the `trips` field of every question (the planner
 * on screen and each region's remembered trip) and Parky's own last change per region, which his
 * undo takes back only while the trip is still as he left it. The API's
 * `docs/frontend/assistant.md#the-visitors-plans` holds the contract.
 */

/** One trip as a question carries it. */
export interface AssistantTripSnapshot {
  region: string;
  query: string;
  onScreen?: true;
  party?: TripParty;
}

/** The API reads one trip per region and at most this many. */
export const TRIPS_SNAPSHOT_MAX = 4;

/**
 * The trips a question carries: the planner on screen first, then the trips this browser
 * remembers for the regions in `regions`; `undefined` without any, so the request leaves the field
 * out.
 */
export function assistantTripsSnapshot(
  regions: readonly string[]
): AssistantTripSnapshot[] | undefined {
  const onScreen = tripPlannerBridge.current();
  const trips: AssistantTripSnapshot[] = [];
  if (onScreen) {
    const party = rememberedTrip(onScreen.region)?.party;
    trips.push({
      region: onScreen.region,
      query: onScreen.query,
      onScreen: true,
      ...(party && { party }),
    });
  }
  for (const kept of rememberedTrips(regions)) {
    if (kept.region === onScreen?.region) continue;
    trips.push({
      region: kept.region,
      query: kept.query,
      ...(kept.party && { party: kept.party }),
    });
  }
  return trips.length > 0 ? trips.slice(0, TRIPS_SNAPSHOT_MAX) : undefined;
}

/** The trip's query right now: the planner on screen, else the one remembered. */
export function currentTripQuery(region: string): string {
  const onScreen = tripPlannerBridge.current();
  if (onScreen?.region === region) return onScreen.query;
  return rememberedTrip(region)?.query ?? '';
}

/**
 * Parky's last change per region: the query before it, and the query after it as the planner wrote
 * it back, which is what an undo compares with (`null` until the planner has written it).
 */
interface TripChange {
  before: string;
  after: string | null;
  /** The query Parky sent, the stand-in for `after` until the planner writes its own spelling. */
  sent: string;
}
const tripChanges = new Map<string, TripChange>();

/** Parameter order and spelling aside, two queries that say the same. */
export function sameTripQuery(a: string, b: string): boolean {
  const canonical = (q: string) =>
    [...new URLSearchParams(q)]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('&');
  return canonical(a) === canonical(b);
}

tripPlannerBridge.subscribe(() => {
  const onScreen = tripPlannerBridge.current();
  const change = onScreen && tripChanges.get(onScreen.region);
  // The planner's first write after Parky's change is the change in its own spelling.
  if (change && change.after === null) change.after = onScreen.query;
});

/** Keep a change Parky just sent for a region, with the trip before it. */
export function rememberTripChange(region: string, before: string, sent: string): void {
  const onScreen = tripPlannerBridge.current();
  tripChanges.set(region, {
    before,
    sent,
    after:
      onScreen?.region === region && sameTripQuery(onScreen.query, sent) ? onScreen.query : null,
  });
}

/** What Parky's undo of a region's trip does: the query to go back to, or why there is none. */
export type TripUndo = { query: string } | 'changed' | 'none';

/**
 * The trip before Parky's last change, while the trip is still what he left; `changed` once the
 * visitor has changed it since, so their own edits are never undone. Consumes the change.
 */
export function takeTripUndo(region: string): TripUndo {
  const change = tripChanges.get(region);
  if (!change) return 'none';
  tripChanges.delete(region);
  const now = currentTripQuery(region);
  const left = change.after ?? change.sent;
  if (!sameTripQuery(now, left)) return 'changed';
  if (!change.before) forgetTrip(region);
  return { query: change.before };
}
