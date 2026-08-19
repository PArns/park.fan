import type { AttractionResponse, ParkWithAttractions } from './types';

/**
 * Coordinates arrive from api.park.fan in two different JSON types, and
 * `lib/api/types.ts` only ever declared one of them.
 *
 * `/v1/discovery/*` and `/v1/search` send `latitude`/`longitude` as JSON
 * numbers. The park-detail family — `/v1/parks/{geo}/{park}`,
 * `…/attractions/{slug}` and the `/v1/parks` listing — sends the same values as
 * STRINGS (`"52.4401400"`), because the backend serialises its decimal columns
 * verbatim. Everything downstream is typed `number | null` and reads them as
 * numbers.
 *
 * It has never produced a visible bug, which is the reason it survived: Leaflet
 * runs `+lat` on whatever it is handed, `a.latitude - b.lat` coerces, and the
 * `!= null` guards in front of all of it pass for a string just as well as for a
 * number. The failure mode is the quiet kind — `Number.isFinite("52.44")` is
 * `false`, so any guard written that way drops every park instead of the broken
 * ones, and a `Number(...)` forgotten at one call site is indistinguishable from
 * one that is genuinely unnecessary. Two consumers already carry their own
 * coercion plus a comment about it, and the admin routes redeclare the fields as
 * `string` locally.
 *
 * So the values are parsed once, at the fetch boundary, and the declared type
 * becomes true for everything past it. The alternative — widening the type to
 * `string | number | null` — would be honest about the wire format and push the
 * problem into every component prop that renders a map marker or a distance.
 */

/**
 * A single coordinate as a number, or null when there isn't one.
 *
 * Not a validator: a latitude outside ±90 is still what the API answered and is
 * passed through unchanged. Only values that are no number at all become null,
 * because that is what the `!= null` guards downstream are there to catch.
 */
export function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  // `Number('')` is 0, so an empty string would otherwise put the park in the
  // Gulf of Guinea rather than reporting that it has no coordinates.
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

interface Coordinated {
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * A copy of `entity` with both coordinates parsed — or `entity` itself when
 * they already were numbers (or absent), so a payload the backend sends
 * correctly costs nothing and keeps its object identity.
 */
function withCoordinates<T extends Coordinated>(entity: T): T {
  const latitude = parseCoordinate(entity.latitude);
  const longitude = parseCoordinate(entity.longitude);
  if (latitude === entity.latitude && longitude === entity.longitude) return entity;
  return { ...entity, latitude, longitude };
}

/**
 * Parse the coordinates on a park and on every mapped thing inside it — the
 * attractions, shows and restaurants the park map draws markers for.
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
 * Parse the coordinates on an attraction detail response.
 *
 * Its nested `park` block carries no coordinates in the type and none are read
 * from it, so the attraction's own pair is the whole job here.
 */
export function withAttractionCoordinates(attraction: AttractionResponse): AttractionResponse {
  return withCoordinates(attraction);
}
