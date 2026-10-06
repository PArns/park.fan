import { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import type { Locale } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { FaqStructuredData } from '@/components/seo/structured-data';
import { buildAttractionFaqItems } from '@/lib/faq/attraction-faq';

interface AttractionFAQStructuredDataProps {
  attraction: ParkAttraction;
  park: ParkWithAttractions;
  locale: string;
}

/**
 * `FAQPage` JSON-LD for a ride page, built from the same `buildAttractionFaqItems` questions the
 * visible FAQ shows.
 */
export function AttractionFAQStructuredData({
  attraction,
  park,
  locale,
}: AttractionFAQStructuredDataProps) {
  const t = useTranslations('seo.faq.attraction');
  const faqs = buildAttractionFaqItems(
    attraction,
    park,
    t as Parameters<typeof buildAttractionFaqItems>[2],
    locale as Locale
  );

  return <FaqStructuredData items={faqs} />;
}
