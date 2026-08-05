import type { MediaGps, MediaImage } from './types';

/**
 * Turning an image's GPS fix into a park check.
 *
 * 63 of the photos in the database still carry the camera's GPS tag, and that is
 * the cheapest correctness check the database has: a photo assigned to
 * `europa-park` whose coordinates land in Kaatsheuvel is mislabelled, and no
 * amount of reading captions would have caught it. The admin browser runs this
 * over the park catalog to confirm assignments and to suggest one for images that
 * have none.
 *
 * Pure functions over a park list the caller supplies — this module never fetches.
 */

export interface GeoPark {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface ParkMatch {
  park: GeoPark;
  /** Great-circle distance from the photo to the park's coordinates, in metres. */
  distanceM: number;
}

/**
 * Great-circle distance in metres.
 *
 * A park's stored coordinate is a single point, usually the entrance, while the
 * grounds themselves run to a kilometre or more across — so this is a
 * "which park is this" signal, never a "was the shutter inside the fence" one.
 */
export function distanceMeters(a: MediaGps, b: { latitude: number; longitude: number }): number {
  const EARTH_RADIUS_M = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.lat);
  const dLon = toRad(b.longitude - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** The closest park to a GPS fix, or null when the list is empty. */
export function nearestPark(gps: MediaGps, parks: readonly GeoPark[]): ParkMatch | null {
  let best: ParkMatch | null = null;
  for (const park of parks) {
    if (!Number.isFinite(park.latitude) || !Number.isFinite(park.longitude)) continue;
    const distanceM = distanceMeters(gps, park);
    if (!best || distanceM < best.distanceM) best = { park, distanceM };
  }
  return best;
}

/**
 * Beyond this, a photo's coordinates are not evidence for the park it is assigned
 * to. Generous on purpose: resorts sprawl, hotel and parking shots are legitimate
 * park images, and a phone's fix under a coaster's steelwork drifts. The goal is
 * to surface the photo filed under the wrong country, not to police the fence.
 */
export const PARK_MATCH_RADIUS_M = 5_000;

export type GeoVerdict =
  /** No coordinates — nothing to say. */
  | { status: 'no-gps' }
  /** Coordinates agree with the assigned park. */
  | { status: 'match'; match: ParkMatch }
  /** Assigned to one park, taken at another — almost always a mislabel. */
  | { status: 'mismatch'; assigned: string; match: ParkMatch }
  /** Has coordinates but no park assigned; `match` is the suggestion. */
  | { status: 'suggestion'; match: ParkMatch }
  /** Coordinates far from every known park (or an unknown assigned slug). */
  | { status: 'no-park-nearby'; match: ParkMatch | null };

/**
 * Compare an image's GPS fix against its assigned park.
 *
 * Note what this deliberately does not do: it never rewrites `park`. A verdict is
 * evidence for a human, because the failure mode of auto-assigning from GPS is a
 * confidently wrong label on a photo taken from a car park between two resorts.
 */
export function checkParkAssignment(image: MediaImage, parks: readonly GeoPark[]): GeoVerdict {
  if (!image.gps) return { status: 'no-gps' };

  const match = nearestPark(image.gps, parks);
  if (!match || match.distanceM > PARK_MATCH_RADIUS_M) {
    return { status: 'no-park-nearby', match };
  }
  if (!image.park) return { status: 'suggestion', match };
  if (image.park === match.park.slug) return { status: 'match', match };
  return { status: 'mismatch', assigned: image.park, match };
}

/** Human-readable distance for the admin UI: `840 m`, `12.4 km`. */
export function formatDistance(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(distanceM < 10_000 ? 1 : 0)} km`;
}
