import type { AttractionStatus, ParkAttraction, ParkStatus } from '@/lib/api/types';
import type { FavoriteAttraction } from '@/lib/api/favorites';

/**
 * Effective display status of an attraction: every attraction is CLOSED while the park is not
 * operating; otherwise the STANDBY queue status beats the attraction's own field. Shared by the
 * cards and the server-rendered wait-time overview so the two cannot disagree.
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
 * The status a visitor is shown for one attraction, from the live payload. Prefers the API's
 * `effectiveStatus`, the only source that knows the park has shut or a ride is out of season, and
 * keeps `UNKNOWN` instead of flattening it; queue rows alone can still say OPERATING hours after
 * closing. Shared by the attraction card and the „open only" filter so they cannot disagree.
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
 * STANDBY wait of an attraction in minutes, or null when it has no standby queue. Says nothing
 * about whether the ride is open: pair it with `getAttractionDisplayStatus`. Every surface reads
 * the wait here so there is one answer to „which queue do people mean".
 */
export function getStandbyWait(attraction: ParkAttraction | FavoriteAttraction): number | null {
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standby && 'waitTime' in standby ? standby.waitTime : null;
}

/** Groups attractions by land (`fallbackName` when none), each land sorted by name. */
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
