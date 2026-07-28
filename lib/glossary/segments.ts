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

/**
 * Canonical URL of a glossary term page.
 *
 * The locale segment is part of the path (`/de/glossar/looping`), so link with
 * a plain `next/link` — the i18n navigation wrapper would prefix the locale a
 * second time.
 */
export function buildGlossaryTermHref(locale: Locale, slug: string): string {
  return `/${locale}/${GLOSSARY_SEGMENTS[locale]}/${slug}`;
}
