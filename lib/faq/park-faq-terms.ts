import { getTranslations } from 'next-intl/server';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { filterMatchableTerms } from '@/lib/glossary/parse-segments';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { buildParkFaqItems } from '@/lib/faq/park-faq';
import type { Locale } from '@/i18n/config';
import type { ParkWithAttractions } from '@/lib/api/types';
import type { GlossaryInjectTerm } from '@/components/glossary/glossary-inject-context';

/**
 * The glossary terms a park's FAQ can actually link, and the locale's glossary segment.
 *
 * Narrowed before it crosses the client boundary: `<ParkFAQSection>` is a Client Component, so
 * anything handed to it is serialized into the page. The full dictionary was 61.2 KB (18.0 KB
 * brotli, a quarter of the park page's transfer) so that a few paragraphs could link a handful of
 * terms. Same reasoning as `leanParkForParkShell` — pass what is read, not what is available.
 *
 * The corpus is every string the FAQ can render. Q0–Q6 are built here exactly as the client builds
 * them; Q7 (least crowded) only appears after the client's calendar fetch, so its RAW ICU
 * templates stand in — they carry all the literal text, and the values interpolated into them
 * (weekday names, the park name, hours) are covered by the items above. A superset is required: a
 * term missing from the corpus would silently stop being linked.
 *
 * Shared by every page of a park, because the shell renders the same FAQ on all of them and a
 * second copy of this derivation is a second copy that drifts.
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
