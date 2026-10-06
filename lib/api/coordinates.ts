import type { AttractionResponse, ParkWithAttractions } from './types';

/**
 * Coordinates arrive from api.park.fan as JSON numbers from `/v1/discovery/*` and `/v1/search`,
 * but as STRINGS (`"52.4401400"`) from the park-detail family, because the backend serialises its
 * decimal columns verbatim. Parsed once here at the fetch boundary so the declared `number | null`
 * is true everywhere past it; otherwise a `Number.isFinite` guard downstream silently drops every
 * park.
 */

/**
 * A single coordinate as a number, or null when there isn't one. Not a validator: an out-of-range
 * latitude passes through; only values that are no number at all become null.
 */
export function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  // `Number('')` is 0, which would put the park in the Gulf of Guinea.
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

interface Coordinated {
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * A copy of `entity` with both coordinates parsed, or `entity` itself when they already were
 * numbers (or absent), so a correct payload keeps its object identity.
 */
export function withCoordinates<T extends Coordinated>(entity: T): T {
  const latitude = parseCoordinate(entity.latitude);
  const longitude = parseCoordinate(entity.longitude);
  if (latitude === entity.latitude && longitude === entity.longitude) return entity;
  return { ...entity, latitude, longitude };
}

/**
 * Parse the coordinates on a park and on every mapped thing inside it (attractions, shows,
 * restaurants). `fetchParkByGeoPath` parses in its own trimming copy instead (`leanParkAtFetch`).
 */
export function withParkCoordinates(park: ParkWithAttractions): ParkWithAttractions {
  const parsed = withCoordinates(park);
  return {
    ...parsed,
    attractions: parsed.attractions?.map(withCoordinates) ?? parsed.attractions,
    shows: parsed.shows?.map(withCoordinates),
    restaurants: parsed.restaurants?.map(withCoordinates),
  };
}

/**
 * Parse the coordinates on an attraction detail response; its nested `park` block carries none.
 */
export function withAttractionCoordinates(attraction: AttractionResponse): AttractionResponse {
  return withCoordinates(attraction);
}
