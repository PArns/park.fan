import { distanceMeters, formatDistance, nearestPark, type GeoPark } from './geo';
import type { MediaGps } from './types';

/**
 * Turning a photo's GPS fix into park and ride suggestions for the admin. Parks are kilometres
 * apart, so the nearest park is proposed as the answer. The nearest ride is right only about half
 * the time (rides stand metres apart and are photographed from a distance), and a wrong label
 * looks reviewed, so rides come as a ranked shortlist.
 */

/** Below this, "nearest park" is a confident answer rather than a guess. */
const PARK_CONFIDENT_M = 2_000;
/** Past this, the photo is not at a park we know. */
const PARK_PLAUSIBLE_M = 15_000;

export interface GeoAttraction {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Themed area, as `land` in the API — becomes the `area` suggestion. */
  land?: string | null;
}

export interface ParkSuggestion {
  slug: string;
  name: string;
  distanceM: number;
  distanceLabel: string;
  /** `confident` fills the field in; `uncertain` asks; `none` leaves it empty. */
  confidence: 'confident' | 'uncertain' | 'none';
}

export interface RideSuggestion {
  slug: string;
  name: string;
  distanceM: number;
  distanceLabel: string;
  area: string | null;
}

/**
 * The park a photo was most likely taken at.
 *
 * Never returns a park beyond `PARK_PLAUSIBLE_M`: a fix in the middle of a
 * motorway should produce no suggestion, not the least-distant park in Europe.
 */
export function suggestPark(gps: MediaGps, parks: readonly GeoPark[]): ParkSuggestion | null {
  const match = nearestPark(gps, parks);
  if (!match || match.distanceM > PARK_PLAUSIBLE_M) return null;
  return {
    slug: match.park.slug,
    name: match.park.name,
    distanceM: Math.round(match.distanceM),
    distanceLabel: formatDistance(match.distanceM),
    confidence: match.distanceM <= PARK_CONFIDENT_M ? 'confident' : 'uncertain',
  };
}

/**
 * The park's attractions, nearest first — the shortlist the admin offers.
 *
 * Returns distances so the UI can show them: "18 m" next to a candidate is what
 * lets a human resolve the cases GPS alone cannot.
 */
export function suggestRides(
  gps: MediaGps,
  attractions: readonly GeoAttraction[],
  limit = 8
): RideSuggestion[] {
  return attractions
    .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))
    .map((attraction) => {
      const distanceM = distanceMeters(gps, attraction);
      return {
        slug: attraction.slug,
        name: attraction.name,
        distanceM: Math.round(distanceM),
        distanceLabel: formatDistance(distanceM),
        area: attraction.land ?? null,
      };
    })
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}
