import { calculateDistance } from '@/lib/utils/distance-utils';

/** The orders a country page can list its parks in. `standard` is the server's city grouping. */
export type CountryParkSort = 'standard' | 'quietest' | 'nearest';

interface SortablePark {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface SortableLive {
  status?: string;
  averageWaitTime?: number;
}

/**
 * Park ids in the order a flat „quietest first" or „nearest first" list shows them.
 *
 * Parks that are not open, and open parks with no figure to rank by, follow the ranked ones in
 * their input order, so the tail never shuffles between two clicks. Equal figures keep input
 * order too. `standard` returns the input order unchanged.
 */
export function orderCountryParks(
  parks: readonly SortablePark[],
  sort: CountryParkSort,
  live: Readonly<Record<string, SortableLive>> | undefined,
  viewer: { lat: number; lng: number } | null
): string[] {
  const ranked: { id: string; value: number; index: number }[] = [];
  const rest: string[] = [];

  parks.forEach((park, index) => {
    const value = sort === 'standard' ? NaN : rankValue(park, sort, live?.[park.id], viewer);
    if (Number.isFinite(value)) ranked.push({ id: park.id, value, index });
    else rest.push(park.id);
  });

  if (sort === 'standard') return parks.map((park) => park.id);
  ranked.sort((a, b) => a.value - b.value || a.index - b.index);
  return [...ranked.map((entry) => entry.id), ...rest];
}

function rankValue(
  park: SortablePark,
  sort: Exclude<CountryParkSort, 'standard'>,
  live: SortableLive | undefined,
  viewer: { lat: number; lng: number } | null
): number {
  if (live?.status !== 'OPERATING') return NaN;
  if (sort === 'quietest') return live.averageWaitTime ?? NaN;
  const lat = park.latitude == null ? NaN : Number(park.latitude);
  const lng = park.longitude == null ? NaN : Number(park.longitude);
  if (!viewer || !Number.isFinite(lat) || !Number.isFinite(lng)) return NaN;
  return calculateDistance(viewer.lat, viewer.lng, lat, lng);
}
