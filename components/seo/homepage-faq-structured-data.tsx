import { getTranslations } from 'next-intl/server';
import { WithContext, Thing } from 'schema-dts';
import { escapeJsonLd } from '@/components/seo/structured-data';
import { HOMEPAGE_FAQ } from '@/lib/faq/homepage-faq';

/**
 * The homepage's `FAQPage` markup.
 *
 * The questions come from {@link HOMEPAGE_FAQ}, which `HomeFaqSection` renders from the same
 * list — the markup and the visible answers cannot drift apart, and a question added in one
 * place is a question added in both. For four years this file was the ONLY place these seven
 * answers existed: valid markup describing a page that did not contain them.
 */
export async function HomepageFAQStructuredData() {
  const t = await getTranslations('seo.homepage.faq');

  const faqSchema: WithContext<Thing> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOMEPAGE_FAQ.map((entry) => ({
      '@type': 'Question' as const,
      name: t(entry.q),
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: t(entry.a),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(faqSchema) }}
    />
  );
}
