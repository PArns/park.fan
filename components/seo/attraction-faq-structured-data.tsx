import { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { WithContext, Thing } from 'schema-dts';
import { escapeJsonLd } from '@/components/seo/structured-data';
import { buildAttractionFaqItems } from '@/lib/faq/attraction-faq';

interface AttractionFAQStructuredDataProps {
  attraction: ParkAttraction;
  park: ParkWithAttractions;
  locale: string;
}

export function AttractionFAQStructuredData({
  attraction,
  park,
}: AttractionFAQStructuredDataProps) {
  const t = useTranslations('seo.faq.attraction');
  const faqs = buildAttractionFaqItems(
    attraction,
    park,
    t as Parameters<typeof buildAttractionFaqItems>[2]
  );

  const mainEntity = faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }));

  const jsonLd: WithContext<Thing> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }} />
  );
}
