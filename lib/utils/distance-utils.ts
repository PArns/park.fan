/** Great-circle (haversine) distance between two GPS coordinates, in metres. */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format a distance for display: „123 m", „1.2 km", and whole kilometres from 100 km, where a
 * tenth is noise (the geo hubs show continent-scale distances).
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
 * The coordinates of every geocoded park in a geo subtree (continent, country or city), for a hub
 * card's „nearest park X km away"; the tuple list is a fraction of the full tree's RSC payload.
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
    // Discovery sends real numbers; coerce anyway and drop anything that is not a real pair.
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

/** Distance in metres from a point to the closest of `coordinates`, or null for an empty list. */
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
