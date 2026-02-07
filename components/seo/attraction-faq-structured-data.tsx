import { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { WithContext, Thing } from 'schema-dts';
import { escapeJsonLd } from '@/components/seo/structured-data';
import { stripNewPrefix } from '@/lib/utils';

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
  const attractionName = stripNewPrefix(attraction.name);
  const parkName = stripNewPrefix(park.name);

  const mainEntity = [];

  // Question 1: Location
  if (park.name) {
    mainEntity.push({
      '@type': 'Question',
      name: t('locationQ', { attraction: attractionName }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('locationA', {
          attraction: attractionName,
          park: parkName,
          land: attraction.land ? t('inLand', { land: attraction.land }) : '',
        }),
      },
    });
  }

  // Question 2: Wait Time (if it's a ride)
  mainEntity.push({
    '@type': 'Question',
    name: t('waitTimeQ', { attraction: attractionName }),
    acceptedAnswer: {
      '@type': 'Answer',
      text: t('waitTimeA', { attraction: attractionName }),
    },
  });

  // Question 3: Single Rider
  const singleRiderQueue = attraction.queues?.find((q) => q.queueType === 'SINGLE_RIDER');
  // Check if we have Single Rider queue (either active or just defined in the array)
  if (singleRiderQueue) {
    mainEntity.push({
      '@type': 'Question',
      name: t('singleRiderQ', { attraction: attractionName }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('singleRiderA', { attraction: attractionName }),
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
      name: t('paidQueueQ', { attraction: attractionName }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('paidQueueA', {
          attraction: attractionName,
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }} />
  );
}
