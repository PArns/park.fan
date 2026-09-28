import 'server-only';
import { getNewsParkRef } from './backlinks';
import { resolvePark } from './park-resolver';

/** The park a news post belongs to, as its label draws it. */
export interface NewsPark {
  /** The park slug. Also the value of the `?park=` filter on `/news`. */
  slug: string;
  name: string;
  /** Locale-relative park page, `/parks/<continent>/<country>/<city>/<park>`. */
  href: string;
}

/**
 * Resolve a news post's park ({@link getNewsParkRef}) to a name and a park page.
 *
 * `null` when the post names no park, or when the park is not in the geo structure (an API
 * outage at build time). The caller then draws the item without its park label; it is never
 * dropped for it.
 */
export async function resolveNewsPark(translationKey: string): Promise<NewsPark | null> {
  const ref = getNewsParkRef(translationKey);
  if (!ref) return null;
  const park = await resolvePark(ref.slug, ref.geo?.[0]);
  if (!park) return null;
  return { slug: park.slug, name: park.name, href: park.href };
}
