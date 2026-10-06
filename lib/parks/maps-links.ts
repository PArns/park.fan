/**
 * The two map links on the park info card, built from the park's coordinates, which nearly every
 * park has (unlike a hand-written `streetAddress`). A `?q=lat,lng` link opens the native app on a
 * phone and the web map on a desktop. The range check lives here because `parseCoordinate` is not
 * a validator, and a link to where the park is not is worse than none.
 */

/** Google and Apple Maps URLs for one park. */
export interface ParkMapsLinks {
  google: string;
  apple: string;
}

/**
 * Both map URLs for a coordinate pair, or `null` when the pair is missing, non-finite, out of
 * range, or `0,0` (Null Island is what an ungeocoded row looks like).
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
