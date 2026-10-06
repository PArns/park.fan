import { getTranslations } from 'next-intl/server';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { filterMatchableTerms } from '@/lib/glossary/parse-segments';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { buildParkFaqItems } from '@/lib/faq/park-faq';
import type { Locale } from '@/i18n/config';
import type { ParkWithAttractions } from '@/lib/api/types';
import type { GlossaryInjectTerm } from '@/components/glossary/glossary-inject-context';

/**
 * The glossary terms a park's FAQ can link, and the locale's glossary segment. Narrowed before it
 * crosses the client boundary, because `<ParkFAQSection>` serializes everything it is handed and
 * the full dictionary would be a large share of the park page. The corpus is every string the FAQ
 * can render; Q7's raw ICU templates stand in for the text the client builds after its calendar
 * fetch, since a term missing from the corpus would silently stop being linked.
 */
export async function getParkFaqGlossary(
  park: ParkWithAttractions,
  locale: string,
  nowMs: number
): Promise<{ terms: GlossaryInjectTerm[]; segment: string }> {
  const [glossaryTerms, tFaq, tGeo] = await Promise.all([
    getGlossaryTerms(locale as Locale),
    getTranslations('seo.faq'),
    getTranslations('geo'),
  ]);

  const corpus = [
    ...buildParkFaqItems(
      park,
      locale,
      tFaq as Parameters<typeof buildParkFaqItems>[2],
      tGeo as Parameters<typeof buildParkFaqItems>[3],
      nowMs
    ).flatMap((item) => [
      item.question,
      typeof item.answer === 'string'
        ? item.answer
        : [item.answer.text, ...item.answer.list].filter(Boolean).join(' '),
    ]),
    tFaq.raw('leastCrowdedQ'),
    tFaq.raw('leastCrowdedA'),
    tFaq.raw('leastCrowdedNoDataA'),
  ].join('\n');

  return {
    terms: filterMatchableTerms(corpus, glossaryTerms).map((term) => ({
      id: term.id,
      name: term.name,
      shortDefinition: term.shortDefinition,
      slug: term.slug,
      aliases: term.aliases,
    })),
    segment: GLOSSARY_SEGMENTS[locale as Locale],
  };
}
