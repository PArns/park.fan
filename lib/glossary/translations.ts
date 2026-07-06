import { cache } from 'react';
import type { Locale } from '@/i18n/config';
import { GLOSSARY_TERMS } from './data';
import type { GlossaryTerm, GlossaryTermTranslation } from './types';

async function loadTranslations(locale: Locale): Promise<GlossaryTermTranslation[]> {
  const mod = await import(`@/content/glossary/${locale}`);
  return (mod.default ?? mod) as GlossaryTermTranslation[];
}

async function buildGlossaryTerms(locale: Locale): Promise<GlossaryTerm[]> {
  const translations = await loadTranslations(locale);
  const translationMap = new Map(translations.map((t) => [t.id, t]));

  return GLOSSARY_TERMS.flatMap((termData) => {
    const translation = translationMap.get(termData.id);
    if (!translation) return [];
    return [
      {
        ...termData,
        name: translation.name,
        shortDefinition: translation.shortDefinition,
        definition: translation.definition,
        slug: termData.slugs[locale],
        relatedTermIds: translation.relatedTermIds,
        aliases: translation.aliases,
        alternateNames: translation.alternateNames,
      },
    ];
  });
}

// Glossary data is fixed at build time, so memoize per process instead of rebuilding the
// 219-term array (+ translation map) on every request (glossary pages, search route, sitemap).
const termsByLocale = new Map<Locale, Promise<GlossaryTerm[]>>();

export function getGlossaryTerms(locale: Locale): Promise<GlossaryTerm[]> {
  let terms = termsByLocale.get(locale);
  if (!terms) {
    terms = buildGlossaryTerms(locale);
    termsByLocale.set(locale, terms);
  }
  return terms;
}

export const getTermBySlug = cache(
  async (locale: Locale, slug: string): Promise<GlossaryTerm | null> => {
    const terms = await getGlossaryTerms(locale);
    return terms.find((t) => t.slug === slug) ?? null;
  }
);

/**
 * Resolve a term slug from ANY locale to the requested locale's term.
 *
 * Google's index holds thousands of cross-locale glossary URLs from the era of
 * next-intl's auto-generated alternate links (e.g. /nl/glossaire/harnais-epaules —
 * a FRENCH slug under the NL locale). The segment redirect in next.config fixes
 * the segment but keeps the foreign slug, which then 404s. This lookup lets the
 * term page translate the slug and 308 to the correct local URL instead.
 *
 * Only call this after `getTermBySlug` missed for the requested locale.
 */
export const findTermByAnySlug = cache(
  async (locale: Locale, slug: string): Promise<GlossaryTerm | null> => {
    // slugs for all locales live in the static term data — no translation loads needed
    const termData = GLOSSARY_TERMS.find((t) => Object.values(t.slugs).includes(slug));
    if (!termData) return null;
    return getTermBySlug(locale, termData.slugs[locale]);
  }
);
