import { useTranslations } from 'next-intl';
import { WithContext, Thing } from 'schema-dts';

export function HomepageFAQStructuredData() {
  const t = useTranslations('seo.homepage.faq');

  const faqSchema: WithContext<Thing> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: t('whatIsQ'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('whatIsA'),
        },
      },
      {
        '@type': 'Question',
        name: t('whichParksQ'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('whichParksA'),
        },
      },
      {
        '@type': 'Question',
        name: t('liveDataQ'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('liveDataA'),
        },
      },
      {
        '@type': 'Question',
        name: t('freeQ'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('freeA'),
        },
      },
      {
        '@type': 'Question',
        name: t('favoritesQ'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('favoritesA'),
        },
      },
      {
        '@type': 'Question',
        name: t('featuresQ'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('featuresA'),
        },
      },
      {
        '@type': 'Question',
        name: t('mobileQ'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('mobileA'),
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}
