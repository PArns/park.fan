import type { Locale } from '@/i18n/config';

/**
 * Locale → localized first URL segment of the year rankings of rides by wait,
 * `/de/laengste-wartezeiten/europe/germany/2026`. The words are the phrase a visitor types.
 *
 * Same mechanism as the "how park.fan works" guide: the English slug is the route folder, the other
 * locales are served on it by a rewrite in `next.config.ts` and canonicalized by redirects. Kept in
 * its own tiny module so `next.config.ts` can import it before the `@/` aliases exist: the only
 * import here is a type import, which compiles away.
 */
export const RANKING_SEGMENTS: Record<Locale, string> = {
  en: 'longest-wait-times',
  de: 'laengste-wartezeiten',
  fr: 'plus-longues-attentes',
  it: 'attese-piu-lunghe',
  nl: 'langste-wachttijden',
  es: 'esperas-mas-largas',
};

/** The canonical route-folder segment (English), what the app router matches. */
export const RANKING_CANONICAL_SEGMENT = RANKING_SEGMENTS.en;

/**
 * Locale-relative path to a country's ranking of one year; `@/i18n/navigation`'s `Link` adds the
 * locale.
 */
export function rankingPath(
  locale: Locale | string,
  continent: string,
  country: string,
  year: number
): string {
  const segment = RANKING_SEGMENTS[locale as Locale] ?? RANKING_CANONICAL_SEGMENT;
  return `/${segment}/${continent}/${country}/${year}`;
}
