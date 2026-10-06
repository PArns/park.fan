import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment for a park's wait-time record: crowd by month and weekday, the
 * typical day hour by hour, and rides ranked by their usual queue, the historical half nothing else
 * server-renders. The words are the phrase a visitor types („durchschnittliche Wartezeiten").
 * As with the calendar, the English slug is the route folder and the other locales are rewritten
 * onto it; and as with the calendar, a ride slugged like a segment would be shadowed.
 * See docs/seo/dedicated-landing-pages.md.
 */
export const PARK_STATS_SEGMENTS: Record<Locale, string> = {
  en: 'average-wait-times',
  de: 'durchschnittliche-wartezeiten',
  fr: 'temps-attente-moyens',
  it: 'tempi-di-attesa-medi',
  nl: 'gemiddelde-wachttijden',
  es: 'tiempos-de-espera-medios',
};

/** The canonical route-folder segment (English), what the app router matches. */
export const PARK_STATS_CANONICAL_SEGMENT = PARK_STATS_SEGMENTS.en;

/**
 * Locale-relative path to a park's wait-time record; `@/i18n/navigation`'s `Link` adds the locale.
 */
export function parkStatsPath(
  locale: Locale | string,
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): string {
  const segment = PARK_STATS_SEGMENTS[locale as Locale] ?? PARK_STATS_CANONICAL_SEGMENT;
  return `/parks/${continent}/${country}/${city}/${parkSlug}/${segment}`;
}
