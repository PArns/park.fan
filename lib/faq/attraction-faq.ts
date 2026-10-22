import type { ParkAttraction, ParkWithAttractions } from '@/lib/api/types';
import { parkArgs } from '@/lib/i18n/park-phrase';
import type { Locale } from '@/i18n/config';
import { stripNewPrefix } from '@/lib/utils';
import { buildRideSummary } from '@/lib/parks/ride-summary';

export type AttractionFaqIconName = 'MapPin' | 'Clock' | 'Users' | 'Zap';

export interface AttractionFaqItem {
  /** Which question this is, so the visible FAQ can add to one answer without matching its text. */
  key: 'location' | 'waitTime' | 'singleRider' | 'paidQueue';
  iconName: AttractionFaqIconName;
  question: string;
  answer: string;
}

type T = (key: string, values?: Record<string, string | number | Date | undefined>) => string;

/**
 * Builds a ride page's FAQ: where the ride is, its typical and record waits when the API has them,
 * and single rider or paid queue questions when the ride has one. Shared by the visible FAQ and its
 * `FAQPage` JSON-LD, so the two cannot differ.
 */
export function buildAttractionFaqItems(
  attraction: ParkAttraction,
  park: ParkWithAttractions,
  t: T,
  /** For the German "{attraction} befindet sich im/in der/in {park}". */
  locale: Locale = 'de'
): AttractionFaqItem[] {
  const attractionName = stripNewPrefix(attraction.name);
  const parkName = stripNewPrefix(park.name);
  const items: AttractionFaqItem[] = [];

  if (park.name) {
    items.push({
      key: 'location',
      iconName: 'MapPin',
      question: t('locationQ', { attraction: attractionName }),
      answer: t('locationA', {
        attraction: attractionName,
        ...parkArgs(locale as Locale, parkName, park.nameArticleDe),
        land: attraction.land ? t('inLand', { land: attraction.land }) : '',
      }),
    });
  }

  // The ride's typical and record waits, from the same summary its data card prints. Never today's
  // live figures: Googlebot reads this answer at night too, and a closed ride's „0 minutes" is a
  // claim about the hour of the crawl, not about the ride.
  const summary = buildRideSummary(attraction, null, locale);
  const typical = summary.sentences.find((s) => s.key === 'typical')?.values;
  const record = summary.sentences.find((s) => s.key === 'record')?.values;
  if (typical) {
    items.push({
      key: 'waitTime',
      iconName: 'Clock',
      question: t('waitTimeQ', { attraction: attractionName }),
      answer: t('waitTimeTypicalA', {
        attraction: attractionName,
        shape: typical.shape,
        weekday: typical.weekday,
        weekend: typical.weekend,
        days: typical.days,
        hasRecord: record ? 'yes' : 'no',
        record: record?.minutes ?? 0,
        date: record?.date ?? '',
      }),
    });
  } else {
    items.push({
      key: 'waitTime',
      iconName: 'Clock',
      question: t('waitTimeQ', { attraction: attractionName }),
      answer: t('waitTimeA', { attraction: attractionName }),
    });
  }

  // The curated flag as well as the live queue list: a feed that drops the closed single-rider
  // queue overnight would otherwise take the question off the page until morning.
  const singleRiderQueue = attraction.queues?.find((q) => q.queueType === 'SINGLE_RIDER');
  if (attraction.hasSingleRider === true || singleRiderQueue) {
    items.push({
      key: 'singleRider',
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
      key: 'paidQueue',
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
