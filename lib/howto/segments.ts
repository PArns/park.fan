import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment for the "how park.fan works" guide.
 *
 * Same mechanism as the glossary and the best-travel-time hub: the canonical
 * route folder is the English slug, the other locales are served on it via a
 * rewrite in `next.config.ts` and canonicalized via redirects. Kept in its own
 * tiny module so server and client code can both import it cheaply.
 */
export const HOWTO_SEGMENTS: Record<Locale, string> = {
  en: 'how-park-fan-works',
  de: 'so-funktioniert-park-fan',
  fr: 'comment-fonctionne-park-fan',
  it: 'come-funziona-park-fan',
  nl: 'hoe-park-fan-werkt',
  es: 'como-funciona-park-fan',
};

/** The canonical route-folder segment (English), what the app router matches. */
export const HOWTO_CANONICAL_SEGMENT = HOWTO_SEGMENTS.en;

/** The old `/howto` segment, which `next.config.ts` still redirects to the localized ones. */
export const HOWTO_LEGACY_SEGMENT = 'howto';

/** Localized path for a locale, e.g. `/so-funktioniert-park-fan`. */
export function howtoPath(locale: Locale | string): string {
  return `/${HOWTO_SEGMENTS[locale as Locale] ?? HOWTO_CANONICAL_SEGMENT}`;
}
