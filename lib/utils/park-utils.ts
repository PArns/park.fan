import type { DiscoveryCity, ParkAttraction } from '@/lib/api/types';

/**
 * Strips the `attractions` array from every park in a list of cities.
 * Discovery listing endpoints include the full array, but listing pages only
 * display the count – omitting it keeps the RSC payload small (e.g. USA has
 * 10k+ AttractionReference objects that would otherwise be serialised for free).
 */
export function stripParkAttractions(cities: DiscoveryCity[]) {
  return cities.map((city) => ({
    ...city,
    parks: city.parks.map(({ attractions: _unused, ...park }) => park),
  }));
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
