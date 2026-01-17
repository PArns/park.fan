import { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { WithContext, Thing } from 'schema-dts';

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

  const mainEntity = [];

  // Question 1: Location
  if (park.name) {
    mainEntity.push({
      '@type': 'Question',
      name: t('locationQ', { attraction: attraction.name }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('locationA', {
          attraction: attraction.name,
          park: park.name,
          land: attraction.land ? t('inLand', { land: attraction.land }) : '',
        }),
      },
    });
  }

  // Question 2: Wait Time (if it's a ride)
  mainEntity.push({
    '@type': 'Question',
    name: t('waitTimeQ', { attraction: attraction.name }),
    acceptedAnswer: {
      '@type': 'Answer',
      text: t('waitTimeA', { attraction: attraction.name }),
    },
  });

  // Question 3: Single Rider
  const singleRiderQueue = attraction.queues?.find((q) => q.queueType === 'SINGLE_RIDER');
  // Check if we have Single Rider queue (either active or just defined in the array)
  if (singleRiderQueue) {
    mainEntity.push({
      '@type': 'Question',
      name: t('singleRiderQ', { attraction: attraction.name }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('singleRiderA', { attraction: attraction.name }),
      },
    });
  }

  // Question 4: Paid Queue / Premier Access
  const paidQueue = attraction.queues?.find(
    (q) => q.queueType === 'PAID_RETURN_TIME' || q.queueType === 'PAID_STANDBY'
  );

  if (paidQueue) {
    // Generic name since we don't have the specific system name in queue type
    // We provide a common term like "Premier Access / Express Pass"
    const typeName = 'Express Pass / Premier Access';

    mainEntity.push({
      '@type': 'Question',
      name: t('paidQueueQ', { attraction: attraction.name }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('paidQueueA', {
          attraction: attraction.name,
          type: typeName,
        }),
      },
    });
  }

  const jsonLd: WithContext<Thing> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
