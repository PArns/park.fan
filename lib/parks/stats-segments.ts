import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment for a park's wait-time record.
 *
 * The page behind it draws what the park page keeps client-side and what nothing draws at all:
 * crowd by month and weekday over two years, the typical day hour by hour, and the rides ranked
 * by the queue they normally carry. The park page server-renders today's table already, so a
 * second page showing that table would be a duplicate with its own URL competing with the page it
 * copied — see `docs/seo/dedicated-landing-pages.md` §2. A new park URL earns its place by
 * server-rendering something no existing URL server-renders, and the historical half is the only
 * thing left that qualifies.
 *
 * Same mechanism as the calendar, the glossary and the guide: the canonical route folder is the
 * English slug and the other five locales are served on it via a rewrite in `next.config.ts`.
 *
 * The words are the phrase a visitor types, not the word a competitor's URL uses. „Wartezeiten-
 * Statistik" reads as a section name; „durchschnittliche Wartezeiten" is a question somebody asks.
 * The alternative set is written down in §4 of the concept and was decided against on 2026-09-21.
 *
 * The segment sits in the same position as an attraction slug, so a ride slugged
 * `durchschnittliche-wartezeiten` would be shadowed by this route — Next matches the static
 * segment before `[attraction]`. No ride in the catalogue is, and these six phrases are not ride
 * names in any language; the rule is written down here because it is the second park sub-page to
 * depend on it.
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
 * Locale-relative path to a park's wait-time record, e.g.
 * `/parks/europe/germany/bruehl/phantasialand/durchschnittliche-wartezeiten`.
 *
 * Locale-RELATIVE because every link to it goes through `@/i18n/navigation`'s `Link`, which
 * prefixes the locale itself. Pass the same geo segments the park page was rendered with.
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
