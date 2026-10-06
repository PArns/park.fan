type GeoTranslator = {
  has: (key: string) => boolean;
  (key: string): string;
};

/**
 * Translates a geo slug (country or continent) with next-intl, normalized to lowercase-hyphenated
 * form. `tGeo()` throws on a missing key, so it checks `has()` first.
 */
export function translateGeoSlug(
  t: GeoTranslator,
  namespace: 'countries' | 'continents',
  slug: string,
  fallback: string
): string {
  const key = `${namespace}.${slug.toLowerCase().replace(/\s+/g, '-')}`;
  return t.has(key) ? t(key) : fallback;
}
