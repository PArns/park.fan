import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment for a park's "with kids" page.
 *
 * The page lists a park's rides by the height a child has to reach, with the park's own limits as
 * the steps. The park page keeps the same numbers behind a slider (`RiderHeightFilter`) that no
 * crawler moves, so this URL is where they are printed. Decided on 2026-09-29 (PAR-356, PO answer
 * to the open question of the ticket); the words are the phrase a parent types.
 *
 * Same mechanism as the wait-time record and the calendar: the canonical route folder is the
 * English slug and the other five locales are served on it by a rewrite in `next.config.ts`.
 * The segment sits in the `[attraction]` position, so a ride slugged like one of these would be
 * shadowed by the route — the rule `stats-segments.ts` states applies unchanged, and the six
 * phrases were checked against the ride slugs of the catalogue before the build.
 *
 * Three places move together, as for the record: this module, the rewrite block in
 * `next.config.ts` and the cache-header block above it.
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
 * Locale-relative path to a park's "with kids" page, e.g.
 * `/parks/europe/germany/bruehl/phantasialand/mit-kindern`.
 *
 * Locale-RELATIVE because every link to it goes through `@/i18n/navigation`'s `Link`, which
 * prefixes the locale itself.
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
