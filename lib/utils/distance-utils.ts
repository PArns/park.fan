/**
 * Distance calculation utilities using Haversine formula
 */

/**
 * Calculate distance between two GPS coordinates in meters
 * Uses Haversine formula for accurate results
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * Format distance as human-readable string
 * < 1000m: "123 m"
 * < 100km: "1.2 km"
 * >= 100km: "1234 km" — a tenth of a km is noise at that range (and the geo hub pages
 *           routinely show continent-scale distances, where "1234.6 km" just reads long).
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  if (km < 100) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/** A park position as a compact tuple — `[latitude, longitude]`. */
export type Coordinate = readonly [number, number];

/**
 * Collect the coordinates of every park in a geo subtree (continent / country / city), skipping
 * parks the backend could not geocode. Used by the hub pages to show "nearest park X km away" on a
 * continent or country card: the tuple list is a fraction of the RSC payload the full tree would be.
 */
export function collectParkCoordinates(
  node:
    | {
        countries: {
          cities: { parks: { latitude?: number | null; longitude?: number | null }[] }[];
        }[];
      }
    | { cities: { parks: { latitude?: number | null; longitude?: number | null }[] }[] }
    | { parks: { latitude?: number | null; longitude?: number | null }[] }
): Coordinate[] {
  const parks =
    'countries' in node
      ? node.countries.flatMap((c) => c.cities.flatMap((city) => city.parks))
      : 'cities' in node
        ? node.cities.flatMap((city) => city.parks)
        : node.parks;

  const coordinates: Coordinate[] = [];
  for (const park of parks) {
    // `/v1/discovery/*` sends these as real JSON numbers; the park-detail endpoints are
    // the ones that send decimal strings, and those are parsed at the fetch boundary
    // (lib/api/coordinates). Coerce anyway, and drop anything that isn't a real pair.
    const lat = Number(park.latitude);
    const lng = Number(park.longitude);
    if (
      park.latitude != null &&
      park.longitude != null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      coordinates.push([lat, lng]);
    }
  }
  return coordinates;
}

/**
 * Distance in meters from a reference point to the CLOSEST of `coordinates`.
 * Returns null for an empty list.
 */
export function nearestDistance(
  lat: number,
  lng: number,
  coordinates: readonly Coordinate[]
): number | null {
  let nearest: number | null = null;
  for (const [parkLat, parkLng] of coordinates) {
    const distance = calculateDistance(lat, lng, parkLat, parkLng);
    if (nearest === null || distance < nearest) nearest = distance;
  }
  return nearest;
}
