import { ParkWithAttractions } from '@/lib/api/types';
import type { BestDaysSnapshot } from '@/lib/api/integrated-calendar';
import { getTranslations } from 'next-intl/server';
import { WithContext, Thing } from 'schema-dts';
import { escapeJsonLd } from '@/components/seo/structured-data';
import { buildParkFaqItems, getLeastCrowdedDays, getParkArticleForms } from '@/lib/faq/park-faq';

interface FAQStructuredDataProps {
  park: ParkWithAttractions;
  locale: string;
  /**
   * Server "now" (epoch ms). The park page is force-dynamic (rendered per request), so the
   * JSON-LD may safely carry today's concrete opening hours — the same answer the visible FAQ
   * seeds itself with. Omit (null) for time-independent output (evergreen Q1).
   */
  nowMs?: number | null;
  /**
   * Best-days seed PROMISE (not the resolved value). This component is rendered inside a
   * <Suspense> boundary and awaits the promise itself, so the cold `/best-days` fetch streams the
   * JSON-LD in without blocking the page's TTFB. The awaited snapshot feeds the "least crowded"
   * question so it appears in the JSON-LD (the visible Q7 is client-rendered). `null`/resolves-null
   * → the FAQPage is emitted without the least-crowded entry.
   */
  seedPromise?: Promise<BestDaysSnapshot | null> | null;
}

export async function FAQStructuredData({
  park,
  locale,
  nowMs = null,
  seedPromise = null,
}: FAQStructuredDataProps) {
  const t = await getTranslations('seo.faq');
  const tGeo = await getTranslations('geo');
  const calendarSeed = seedPromise ? await seedPromise : null;

  const items = buildParkFaqItems(
    park,
    locale,
    t as Parameters<typeof buildParkFaqItems>[2],
    tGeo as Parameters<typeof buildParkFaqItems>[3],
    nowMs
  );

  const { parkNom, parkNomCap, parkAcc, parkLoc } = getParkArticleForms(park, locale);

  const mainEntity = items.map((item) => {
    const answerText =
      typeof item.answer === 'string'
        ? item.answer
        : `${item.answer.text} ${item.answer.list.filter(Boolean).join(', ')}`;
    return {
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: answerText },
    };
  });

  // Q7: Least crowded days — only when the calendar seed is available; uses the SAME derivation
  // as the visible FAQ (getLeastCrowdedDays) so the markup never claims what the page can't show.
  // `t.markup` renders the <calendar> tag as plain text for the JSON-LD string.
  if (calendarSeed && nowMs != null) {
    const leastCrowded = getLeastCrowdedDays(
      calendarSeed.days,
      nowMs,
      calendarSeed.meta.timezone,
      locale
    );
    if (leastCrowded.status === 'days') {
      mainEntity.push({
        '@type': 'Question',
        name: t('leastCrowdedQ', { park: parkNom, parkLoc }),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t.markup('leastCrowdedA', {
            park: parkNomCap,
            days: leastCrowded.dayNames,
            calendar: (chunks) => chunks,
          }),
        },
      });
    }
  }

  // Q8: Crowd Calendar (always included in structured data)
  mainEntity.push({
    '@type': 'Question',
    name: t('crowdCalendarQ', { park: parkNom }),
    acceptedAnswer: {
      '@type': 'Answer',
      text: t('crowdCalendarA', { park: parkAcc }),
    },
  });

  const jsonLd: WithContext<Thing> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }} />
  );
}
