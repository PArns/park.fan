import { ParkWithAttractions } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { WithContext, Thing } from 'schema-dts';
import { formatInTimeZone } from 'date-fns-tz';

interface FAQStructuredDataProps {
  park: ParkWithAttractions;
  locale: string;
}

export function FAQStructuredData({ park, locale }: FAQStructuredDataProps) {
  const t = useTranslations('seo.faq');

  // Get current date in park's timezone
  const timeZone = park.timezone || 'UTC';
  const now = new Date();
  const parkDate = formatInTimeZone(now, timeZone, 'yyyy-MM-dd');

  // Find today's schedule
  const todaySchedule = park.schedule?.find((s) => s.date === parkDate);

  // Format localized date
  const localizedDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now);

  const mainEntity = [];

  // Question 1: Opening Hours
  let openingHoursAnswer = '';
  if (
    todaySchedule?.scheduleType === 'OPERATING' &&
    todaySchedule.openingTime &&
    todaySchedule.closingTime
  ) {
    const open = todaySchedule.openingTime.substring(0, 5);
    const close = todaySchedule.closingTime.substring(0, 5);
    openingHoursAnswer = t('openingHoursA', {
      date: localizedDate,
      park: park.name,
      open,
      close,
    });
  } else {
    openingHoursAnswer = t('openingHoursClosed', {
      date: localizedDate,
      park: park.name,
    });
  }

  mainEntity.push({
    '@type': 'Question',
    name: t('openingHoursQ', { park: park.name }),
    acceptedAnswer: {
      '@type': 'Answer',
      text: openingHoursAnswer,
    },
  });

  // Question 2: Location
  if (park.city && park.country) {
    mainEntity.push({
      '@type': 'Question',
      name: t('locationQ', { park: park.name }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('locationA', {
          park: park.name,
          city: park.city,
          country: park.country,
        }),
      },
    });
  }

  // Question 3: Attraction Count
  const totalAttractions = park.analytics?.statistics?.totalAttractions || park.attractions?.length;

  if (totalAttractions) {
    mainEntity.push({
      '@type': 'Question',
      name: t('attractionCountQ', { park: park.name }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('attractionCountA', {
          park: park.name,
          count: totalAttractions,
        }),
      },
    });
  }

  // Question 4: Themed Areas
  const themedAreas = Array.from(new Set(park.attractions?.map((a) => a.land).filter(Boolean)));
  if (themedAreas.length > 0) {
    mainEntity.push({
      '@type': 'Question',
      name: t('themedAreasQ', { park: park.name }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('themedAreasA', {
          park: park.name,
          areas: themedAreas.join(', '),
        }),
      },
    });
  }

  // Question 5: Shows
  if (park.shows && park.shows.length > 0) {
    const showNames = park.shows
      .slice(0, 3)
      .map((s) => s.name)
      .join(', ');
    mainEntity.push({
      '@type': 'Question',
      name: t('showsQ', { park: park.name }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('showsA', {
          park: park.name,
          count: park.shows.length,
          examples: showNames,
        }),
      },
    });
  }

  // Question 6: Dining
  if (park.restaurants && park.restaurants.length > 0) {
    mainEntity.push({
      '@type': 'Question',
      name: t('diningQ', { park: park.name }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('diningA', {
          park: park.name,
          count: park.restaurants.length,
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
