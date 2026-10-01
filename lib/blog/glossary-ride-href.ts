/** `/<locale>/parks/<continent>/<country>/<city>/<park>/<ride>`: five segments after `parks`. */
const RIDE_HREF = /^\/[a-z]{2}\/parks\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)\/?$/;

export interface GlossaryRideHref {
  geoPath: string;
  parkSlug: string;
  rideSlug: string;
}

/** Splits a ride href; `null` for a park link (four segments), an external URL or anything else. */
export function parseGlossaryRideHref(href: string): GlossaryRideHref | null {
  const m = RIDE_HREF.exec(href);
  if (!m) return null;
  const [, continent, country, city, parkSlug, rideSlug] = m;
  return { geoPath: `${continent}/${country}/${city}`, parkSlug, rideSlug };
}
