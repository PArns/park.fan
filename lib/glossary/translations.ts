import { cache } from 'react';
import type { Locale } from '@/i18n/config';
import { GLOSSARY_TERMS } from './data';
import type { GlossaryTerm, GlossaryTermTranslation } from './types';

/** Locale → canonical glossary URL segment (for link generation). */
export const GLOSSARY_SEGMENTS: Record<Locale, string> = {
  en: 'glossary',
  de: 'glossar',
  fr: 'glossaire',
  it: 'glossario',
  nl: 'woordenlijst',
  es: 'glosario',
};

async function loadTranslations(locale: Locale): Promise<GlossaryTermTranslation[]> {
  const mod = await import(`@/content/glossary/${locale}`);
  return (mod.default ?? mod) as GlossaryTermTranslation[];
}

export const getGlossaryTerms = cache(async (locale: Locale): Promise<GlossaryTerm[]> => {
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
});

export const getTermBySlug = cache(
  async (locale: Locale, slug: string): Promise<GlossaryTerm | null> => {
    const terms = await getGlossaryTerms(locale);
    return terms.find((t) => t.slug === slug) ?? null;
  }
);
