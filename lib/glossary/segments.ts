import type { Locale } from '@/i18n/config';

/**
 * Locale → canonical glossary URL segment (for link generation).
 *
 * Lives in its own module (no glossary data imports) so client components can
 * import it without pulling the full GLOSSARY_TERMS data set into the bundle.
 */
export const GLOSSARY_SEGMENTS: Record<Locale, string> = {
  en: 'glossary',
  de: 'glossar',
  fr: 'glossaire',
  it: 'glossario',
  nl: 'woordenboek',
  es: 'glosario',
};
