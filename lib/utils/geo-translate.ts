type GeoTranslator = {
  has: (key: string) => boolean;
  (key: string): string;
};

/**
 * Safely translates a geo slug (country or continent) using next-intl.
 * tGeo() throws on missing keys, so we guard with has() first.
 * Normalizes the slug to lowercase-hyphenated form before lookup.
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
