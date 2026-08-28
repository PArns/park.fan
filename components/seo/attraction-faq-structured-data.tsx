import { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import type { Locale } from '@/i18n/config';
import { useLocale, useTranslations } from 'next-intl';
import type { WithContext, FAQPage, Question } from 'schema-dts';
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
  const locale = useLocale();
  const faqs = buildAttractionFaqItems(
    attraction,
    park,
    t as Parameters<typeof buildAttractionFaqItems>[2],
    locale as Locale
  );

  const mainEntity: Question[] = faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }));

  const jsonLd: WithContext<FAQPage> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }} />
  );
}
