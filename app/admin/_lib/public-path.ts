/**
 * Reading a public park.fan address.
 *
 * Two places need this and they arrived from opposite directions: `/admin/go`
 * turns a pasted browser URL into an editor, and the contributions moderator
 * needs the park a submitted photo belongs to, which it only knows as the
 * entity's canonical page path. Same parse, so one function.
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
