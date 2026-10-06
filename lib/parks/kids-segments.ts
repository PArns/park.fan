import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment for a park's „with kids" page, which prints the rides by the
 * height a child must reach (the park page keeps the same numbers behind a slider no crawler
 * moves). The words are the phrase a parent types. As with the wait-time record, the English slug
 * is the route folder and the others are rewritten onto it; this module, the rewrite block in
 * `next.config.ts` and the cache-header block above it move together.
 */
export const PARK_KIDS_SEGMENTS: Record<Locale, string> = {
  en: 'with-kids',
  de: 'mit-kindern',
  fr: 'avec-enfants',
  it: 'con-bambini',
  nl: 'met-kinderen',
  es: 'con-ninos',
};

/** The canonical route-folder segment (English), what the app router matches. */
export const PARK_KIDS_CANONICAL_SEGMENT = PARK_KIDS_SEGMENTS.en;

/**
 * Locale-relative path to a park's „with kids" page; `@/i18n/navigation`'s `Link` adds the locale.
 */
export function parkKidsPath(
  locale: Locale | string,
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): string {
  const segment = PARK_KIDS_SEGMENTS[locale as Locale] ?? PARK_KIDS_CANONICAL_SEGMENT;
  return `/parks/${continent}/${country}/${city}/${parkSlug}/${segment}`;
}
