import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment of the year rankings of rides by wait: a country's ranking under
 * its country page, `/de/parks/europe/germany/laengste-wartezeiten/2026`, and the hub under the
 * parks hub, `/de/parks/laengste-wartezeiten`. The words are the phrase a visitor types.
 *
 * As with the park sub-pages, the English slug is the route folder and `next.config.ts` rewrites
 * the other locales onto it, and a city or continent slugged like a segment would be shadowed. Kept
 * in its own tiny module so `next.config.ts` can import it before the `@/` aliases exist: the only
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

function segmentFor(locale: Locale | string): string {
  return RANKING_SEGMENTS[locale as Locale] ?? RANKING_CANONICAL_SEGMENT;
}

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
  return `/parks/${continent}/${country}/${segmentFor(locale)}/${year}`;
}

/** Locale-relative path to the rankings' hub, every country that has one. */
export function rankingHubPath(locale: Locale | string): string {
  return `/parks/${segmentFor(locale)}`;
}
