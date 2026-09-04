import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment for the trip planner's own page.
 *
 * Same mechanism as the guide, the glossary and the best-travel-time hub: the
 * canonical route folder is the English slug, the other locales are served on it
 * by a rewrite in `next.config.ts` and canonicalized by redirects. Its own tiny
 * module so the header, the footer and the route can each import it without
 * pulling anything else in — the header is a Client Component mounted on every
 * page, and this is what a link there costs.
 */
export const PLANNER_SEGMENTS: Record<Locale, string> = {
  en: 'trip-planner',
  de: 'tagesplaner',
  fr: 'planificateur',
  it: 'pianificatore',
  nl: 'dagplanner',
  es: 'planificador',
};

/** The canonical route-folder segment (English), what the app router matches. */
export const PLANNER_CANONICAL_SEGMENT = PLANNER_SEGMENTS.en;

/** Localized path for a locale, e.g. `/tagesplaner`. */
export function plannerPath(locale: Locale | string): string {
  return `/${PLANNER_SEGMENTS[locale as Locale] ?? PLANNER_CANONICAL_SEGMENT}`;
}
