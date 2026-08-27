import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment for a park's crowd calendar.
 *
 * The calendar used to be `#calendar` on the park page — a tab whose content was mounted lazily,
 * whose URL was written with `history.replaceState` and whose month stepper wrote
 * `#calendar-2026-04`. A hash is not a page: it cannot be crawled, cannot carry its own title or
 * description, cannot be linked to from a search result, and `replaceState` means the back button
 * does not undo it. A park's "when should I go" is a question with its own answer, so it gets its
 * own URL — `/parks/<geo>/<park>/kalender`.
 *
 * Same mechanism as the glossary, the best-travel-time hub and the guide: the canonical route
 * folder is the English slug and the other five locales are served on it via a rewrite in
 * `next.config.ts`.
 *
 * The segment sits in the same position as an attraction slug, so a ride slugged `kalender` would
 * be shadowed by this route — Next matches the static segment before `[attraction]`. No ride in
 * the catalogue is, and these six words are not ride names in any language; it is written down
 * here because the next person to add a park sub-page needs to know the rule.
 */
export const PARK_CALENDAR_SEGMENTS: Record<Locale, string> = {
  en: 'calendar',
  de: 'kalender',
  fr: 'calendrier',
  it: 'calendario',
  nl: 'kalender',
  es: 'calendario',
};

/** The canonical route-folder segment (English), what the app router matches. */
export const PARK_CALENDAR_CANONICAL_SEGMENT = PARK_CALENDAR_SEGMENTS.en;

/**
 * Locale-relative path to a park's calendar, e.g. `/parks/europe/germany/bruehl/phantasialand/kalender`.
 *
 * Locale-RELATIVE because every link to it goes through `@/i18n/navigation`'s `Link`, which
 * prefixes the locale itself. Pass the same geo segments the park page was rendered with.
 */
export function parkCalendarPath(
  locale: Locale | string,
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): string {
  const segment = PARK_CALENDAR_SEGMENTS[locale as Locale] ?? PARK_CALENDAR_CANONICAL_SEGMENT;
  return `/parks/${continent}/${country}/${city}/${parkSlug}/${segment}`;
}
