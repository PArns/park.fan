import type { AttractionStatus, ParkAttraction, ParkStatus } from '@/lib/api/types';
import type { FavoriteAttraction } from '@/lib/api/favorites';

/**
 * Effective display status of an attraction: when the whole park is not operating every
 * attraction reads as CLOSED; otherwise the STANDBY queue status wins over the attraction's
 * own status field. Shared by the attraction cards (LandSection) and the server-rendered
 * wait-time overview so both views can never disagree.
 */
export function getAttractionDisplayStatus(
  attraction: ParkAttraction,
  parkStatus?: ParkStatus
): AttractionStatus {
  if (parkStatus && parkStatus !== 'OPERATING') {
    return 'CLOSED';
  }
  const standbyQueue = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standbyQueue?.status ?? attraction.status ?? 'CLOSED';
}

/**
 * The status a visitor is shown for one attraction, from the live payload.
 *
 * Sharper than {@link getAttractionDisplayStatus} and not a replacement for it: this
 * one prefers the API's `effectiveStatus`, the only source that knows the park has
 * shut and that a ride is out of season, and it reports `UNKNOWN` rather than
 * flattening it to CLOSED. Queue rows keep their last value when a source stops
 * publishing at closing time, so reading them alone still says OPERATING hours later.
 *
 * It lived inside `attraction-card.tsx` as a private `getStatus`, which was fine
 * while the card was the only surface asking. The filter panel's "open only" toggle
 * is the second, and a filter that hid a card the card itself calls open would be
 * the same class of disagreement the wait-time overview once had with the counter
 * above it.
 */
export function getLiveAttractionStatus(
  attraction: ParkAttraction | FavoriteAttraction,
  parkStatus?: ParkStatus
): AttractionStatus | 'UNKNOWN' {
  if (parkStatus === 'UNKNOWN') return 'UNKNOWN';
  if (parkStatus && parkStatus !== 'OPERATING') return 'CLOSED';
  // Cards without a `parkStatus` prop (favorites) depend on this.
  if ('effectiveStatus' in attraction && attraction.effectiveStatus) {
    return attraction.effectiveStatus as AttractionStatus;
  }
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  if (standby && 'status' in standby) {
    return (
      (standby.status as AttractionStatus) ?? (attraction.status as AttractionStatus) ?? 'CLOSED'
    );
  }
  return (attraction.status as AttractionStatus) ?? 'CLOSED';
}

/**
 * STANDBY wait of an attraction in minutes, or null when it has no standby queue.
 *
 * Says nothing about whether the ride is open — pair it with `getAttractionDisplayStatus`, or a
 * closed ride reports the last number its queue carried. It lived inside the wait-time overview
 * until the header's headliner strip needed the same reading; two copies of "which queue is the
 * one people mean" is how two surfaces on one page start disagreeing.
 *
 * The third reader is `buildWaitTimeObservations`, and it is the one that made this worth
 * exporting: the `Observation` markup has to mirror the visible overview reading for reading, so
 * a copy that drifted there would put the structured data at odds with the page it describes.
 */
export function getStandbyWait(attraction: ParkAttraction): number | null {
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standby && 'waitTime' in standby ? standby.waitTime : null;
}

/**
 * Groups attractions by their land name.
 * Attractions without a land fall back to `fallbackName`.
 * Attractions within each land are sorted alphabetically.
 */
export function groupAttractionsByLand(
  attractions: ParkAttraction[],
  fallbackName: string = 'Other Attractions'
): Record<string, ParkAttraction[]> {
  const grouped: Record<string, ParkAttraction[]> = {};

  attractions.forEach((attraction) => {
    const landName = attraction.land || fallbackName;
    if (!grouped[landName]) {
      grouped[landName] = [];
    }
    grouped[landName].push(attraction);
  });

  Object.keys(grouped).forEach((land) => {
    grouped[land].sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped;
}
