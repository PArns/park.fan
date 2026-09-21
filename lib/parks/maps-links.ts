/**
 * The two map links on the park info card, built from the coordinates the park
 * payload already carries.
 *
 * No curation needed: `streetAddress` is hand-written in the admin and missing
 * for most parks, while `latitude`/`longitude` come from the upstream feeds and
 * are there for almost all of them. A `?q=lat,lng` link opens the native app on
 * a phone and the web map on a desktop, which is the whole reason it is a plain
 * link and not an embedded widget.
 *
 * The guard lives here rather than at the call site because `parseCoordinate`
 * (`lib/api/coordinates.ts`) is deliberately not a validator — it turns "no
 * number at all" into `null` and passes everything else through, including a
 * latitude of 900. A link is worse than no link when it points somewhere the
 * park is not, so this is where a pair has to earn one.
 */

export interface ParkMapsLinks {
  google: string;
  apple: string;
}

/**
 * Both map URLs for a coordinate pair, or `null` when the pair cannot address a
 * place on earth.
 *
 * Refused: a missing coordinate, a non-finite one, anything outside ±90 / ±180,
 * and `0,0` — Null Island is what an ungeocoded row looks like, and no park sits
 * in the Gulf of Guinea.
 */
export function parkMapsLinks(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): ParkMapsLinks | null {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  if (latitude === 0 && longitude === 0) return null;

  const query = `${latitude},${longitude}`;
  return {
    google: `https://www.google.com/maps?q=${encodeURIComponent(query)}`,
    apple: `https://maps.apple.com/?q=${encodeURIComponent(query)}`,
  };
}
