/**
 * Reading a public park.fan address, for `/admin/go` (a pasted browser URL) and the contributions
 * moderator (a submission's canonical page path).
 */

export interface PublicPathSlugs {
  parkSlug: string;
  citySlug?: string;
  rideSlug?: string;
}

/**
 * `/<locale>/parks/<continent>/<country>/<city>/<park>[/<ride>]` → its slugs.
 *
 * The locale is optional because a pasted link may or may not carry one, and
 * the whole thing may be an absolute URL. The city is what makes the answer
 * unambiguous later: `disneyland-park` exists in Anaheim and in Paris.
 */
export function slugsFromPublicPath(input: string): PublicPathSlugs | null {
  let pathname = input.trim();
  if (!pathname) return null;
  try {
    if (/^https?:\/\//i.test(pathname)) pathname = new URL(pathname).pathname;
  } catch {
    return null;
  }

  const parts = pathname.split('/').filter(Boolean);
  const start = parts.indexOf('parks');
  if (start === -1) return null;

  const [continent, country, city, park, ride] = parts.slice(start + 1);
  if (!continent || !country || !city || !park) return null;
  return { parkSlug: park, citySlug: city, ...(ride ? { rideSlug: ride } : {}) };
}
