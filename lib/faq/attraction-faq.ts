import type { ParkAttraction, ParkWithAttractions } from '@/lib/api/types';
import { stripNewPrefix } from '@/lib/utils';

export type AttractionFaqIconName = 'MapPin' | 'Clock' | 'Users' | 'Zap';

export interface AttractionFaqItem {
  iconName: AttractionFaqIconName;
  question: string;
  answer: string;
}

type T = (key: string, values?: Record<string, string | number | Date | undefined>) => string;

export function buildAttractionFaqItems(
  attraction: ParkAttraction,
  park: ParkWithAttractions,
  t: T
): AttractionFaqItem[] {
  const attractionName = stripNewPrefix(attraction.name);
  const parkName = stripNewPrefix(park.name);
  const items: AttractionFaqItem[] = [];

  if (park.name) {
    items.push({
      iconName: 'MapPin',
      question: t('locationQ', { attraction: attractionName }),
      answer: t('locationA', {
        attraction: attractionName,
        park: parkName,
        land: attraction.land ? t('inLand', { land: attraction.land }) : '',
      }),
    });
  }

  items.push({
    iconName: 'Clock',
    question: t('waitTimeQ', { attraction: attractionName }),
    answer: t('waitTimeA', { attraction: attractionName }),
  });

  const singleRiderQueue = attraction.queues?.find((q) => q.queueType === 'SINGLE_RIDER');
  if (singleRiderQueue) {
    items.push({
      iconName: 'Users',
      question: t('singleRiderQ', { attraction: attractionName }),
      answer: t('singleRiderA', { attraction: attractionName }),
    });
  }

  const paidQueue = attraction.queues?.find(
    (q) => q.queueType === 'PAID_RETURN_TIME' || q.queueType === 'PAID_STANDBY'
  );
  if (paidQueue) {
    items.push({
      iconName: 'Zap',
      question: t('paidQueueQ', { attraction: attractionName }),
      answer: t('paidQueueA', {
        attraction: attractionName,
        type: 'Express Pass / Premier Access',
      }),
    });
  }

  return items;
}
