import type { ComparisonPark } from '@/lib/hooks/use-park-comparison-stats';

/** Four rows still fit the table at 360 px without the page scrolling sideways. */
export const MAX_COMPARE_PARKS = 4;

/** A park named in the `parks` query value: the bare slug, or the full path when a slug is shared. */
export interface CompareRef {
  slug: string;
  /** `continent/country/city`, present only for the long form. */
  geoPath?: string;
}

/** The query value as Next hands it over: absent, one string, or one string per repeated key. */
export type CompareParam = string | string[] | undefined;

/**
 * Read the `parks` query value into at most {@link MAX_COMPARE_PARKS} distinct references.
 *
 * Two forms per entry, comma-separated: `efteling`, or `europe/france/paris/disneyland-park`
 * (a leading `/parks/` is accepted, since that is how the site writes a park everywhere else).
 * A bare park slug is not unique: `disneyland-park` is Paris and Anaheim. The long form is what
 * {@link serializeCompare} writes for such a slug, so a shared link keeps its park.
 *
 * Anything that is neither form is dropped rather than guessed at, and so is the fifth park: the
 * URL is typed by hand and pasted from chats, and a crawler can send any string.
 */
export function parseCompareParam(raw: CompareParam): CompareRef[] {
  const text = Array.isArray(raw) ? raw.join(',') : (raw ?? '');
  const refs: CompareRef[] = [];
  const seen = new Set<string>();

  for (const entry of text.split(',')) {
    const parts = entry
      .trim()
      .replace(/^\/?parks\//, '')
      .split('/')
      .filter(Boolean);
    let ref: CompareRef | null = null;
    if (parts.length === 1) ref = { slug: parts[0] };
    else if (parts.length === 4) ref = { slug: parts[3], geoPath: parts.slice(0, 3).join('/') };
    if (!ref) continue;

    const key = ref.geoPath ? `${ref.geoPath}/${ref.slug}` : ref.slug;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push(ref);
    if (refs.length === MAX_COMPARE_PARKS) break;
  }
  return refs;
}

/**
 * The `parks` query value for a selection, or `null` when it is empty (the bare URL).
 *
 * The short form wherever it is unambiguous; `ambiguousSlugs` is the server's list of slugs that
 * more than one park carries.
 */
export function serializeCompare(
  parks: readonly ComparisonPark[],
  ambiguousSlugs: ReadonlySet<string>
): string | null {
  if (parks.length === 0) return null;
  return parks
    .map((p) =>
      ambiguousSlugs.has(p.parkSlug)
        ? `${p.continent}/${p.country}/${p.city}/${p.parkSlug}`
        : p.parkSlug
    )
    .join(',');
}

/** The identity of a park in the selection: its full geo path, never the bare slug. */
export function compareKey(p: {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}): string {
  return `${p.continent}/${p.country}/${p.city}/${p.parkSlug}`;
}
