import { ParkWithAttractions } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { WithContext, Thing } from 'schema-dts';
import { escapeJsonLd } from '@/components/seo/structured-data';
import { buildParkFaqItems, getParkArticleForms } from '@/lib/faq/park-faq';

interface FAQStructuredDataProps {
  park: ParkWithAttractions;
  locale: string;
}

export function FAQStructuredData({ park, locale }: FAQStructuredDataProps) {
  const t = useTranslations('seo.faq');
  const tGeo = useTranslations('geo');

  const items = buildParkFaqItems(
    park,
    locale,
    t as Parameters<typeof buildParkFaqItems>[2],
    tGeo as Parameters<typeof buildParkFaqItems>[3]
  );

  const { parkNom, parkAcc } = getParkArticleForms(park, locale);

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

  // Q7: Crowd Calendar (always included in structured data)
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
