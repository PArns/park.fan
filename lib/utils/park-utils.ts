import type { AttractionStatus, ParkAttraction, ParkStatus } from '@/lib/api/types';

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
