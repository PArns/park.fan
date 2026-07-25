import type { Locale } from '@/i18n/config';

/**
 * Locale → localized URL segment for the "best time to visit" hub.
 *
 * The canonical route folder is the English slug (`best-time-to-visit`); the
 * other locales are served on it via a rewrite in `next.config.ts` (mirrors the
 * glossary segment pattern), and canonicalized via redirects. Kept in its own
 * tiny module so both server and client code can import it cheaply.
 */
export const BEST_TIME_SEGMENTS: Record<Locale, string> = {
  en: 'best-time-to-visit',
  de: 'beste-reisezeit',
  fr: 'meilleure-periode-pour-visiter',
  it: 'periodo-migliore-per-visitare',
  nl: 'beste-tijd-om-te-bezoeken',
  es: 'mejor-epoca-para-visitar',
};

/** The canonical route-folder segment (English), what the app router matches. */
export const BEST_TIME_CANONICAL_SEGMENT = BEST_TIME_SEGMENTS.en;
