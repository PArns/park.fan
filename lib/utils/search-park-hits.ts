/** A park read off a `/api/search` payload: who it is, where it lives, how to show it. */
export interface SearchParkHit {
  slug: string;
  name: string;
  geo: { continent: string; country: string; city: string };
  city?: string;
  country?: string;
  /** ISO 3166-1 alpha-2, which is what a localized country name is derived from. */
  countryCode?: string;
  imageUrl?: string;
  imagePosition?: string;
}

const SLUG = /^[a-z0-9-]+$/;

/**
 * Park hits out of the search payload, with their geo read off the API's own URL.
 *
 * `/v1/parks/<continent>/<country>/<city>/<park>` — four slugs, taken rather than
 * derived. A result whose URL does not have that shape is dropped: a park filed
 * under a guessed path is a plan pointing at a 404.
 */
export function parkHits(data: unknown): SearchParkHit[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { results?: unknown[] })?.results)
      ? ((data as { results: unknown[] }).results ?? [])
      : [];

  const out: SearchParkHit[] = [];
  for (const raw of list) {
    const hit = raw as Record<string, unknown>;
    if (hit.type !== 'park') continue;
    if (typeof hit.slug !== 'string' || typeof hit.name !== 'string') continue;
    if (typeof hit.url !== 'string') continue;

    const parts = hit.url.split('/').filter(Boolean);
    const parksAt = parts.indexOf('parks');
    if (parksAt === -1) continue;
    const geoParts = parts.slice(parksAt + 1);
    if (geoParts.length < 4) continue;
    // Segments end up in API paths and in a comma-separated URL value; a slug is lowercase words.
    if (!geoParts.slice(0, 3).every((part) => SLUG.test(part)) || !SLUG.test(hit.slug)) continue;

    out.push({
      slug: hit.slug,
      name: hit.name,
      geo: { continent: geoParts[0], country: geoParts[1], city: geoParts[2] },
      city: typeof hit.city === 'string' ? hit.city : undefined,
      country: typeof hit.country === 'string' ? hit.country : undefined,
      countryCode: typeof hit.countryCode === 'string' ? hit.countryCode : undefined,
      imageUrl: typeof hit.imageUrl === 'string' ? hit.imageUrl : undefined,
      imagePosition: typeof hit.imagePosition === 'string' ? hit.imagePosition : undefined,
    });
  }
  return out;
}
