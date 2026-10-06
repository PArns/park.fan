import type { Locale } from '@/i18n/config';

/**
 * Locale to localized URL segment for the trip planner's own page: the English slug is the route
 * folder, the others are rewrites in `next.config.ts`, as for the guide and the glossary. Its own
 * tiny module, because the header imports it on every page.
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

/**
 * The anchor on the planner page where a plan is started, which the hero's action jumps to. It sits
 * on whichever of the body's two "new day" controls is showing.
 */
export const PLANNER_START_ID = 'plan';

/** Localized path for a locale, e.g. `/tagesplaner`. */
export function plannerPath(locale: Locale | string): string {
  return `/${PLANNER_SEGMENTS[locale as Locale] ?? PLANNER_CANONICAL_SEGMENT}`;
}
