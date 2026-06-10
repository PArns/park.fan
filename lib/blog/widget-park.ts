import type { ResolvedPark } from './park-resolver';

export interface ParkGeoPath {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * Derive the API geo-path segments from a ResolvedPark.href, which has the
 * shape `/parks/{continent}/{country}/{city}/{park}`. Returns null when the
 * href doesn't have all four segments (e.g. geo data was unavailable).
 */
export function parkGeoPath(park: ResolvedPark): ParkGeoPath | null {
  const [, continent, country, city, parkSlug] = park.href.split('/').filter(Boolean);
  if (!continent || !country || !city || !parkSlug) return null;
  return { continent, country, city, parkSlug };
}
