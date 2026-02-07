import { ParkWithAttractions } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { WithContext, Thing } from 'schema-dts';
import { formatInTimeZone } from 'date-fns-tz';
import { translateCountry } from '@/lib/i18n/helpers';
import { escapeJsonLd } from '@/components/seo/structured-data';
import { stripNewPrefix } from '@/lib/utils';

interface FAQStructuredDataProps {
  park: ParkWithAttractions;
  locale: string;
}

export function FAQStructuredData({ park, locale }: FAQStructuredDataProps) {
  const t = useTranslations('seo.faq');
  const tGeo = useTranslations('geo');
  const parkName = stripNewPrefix(park.name);

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
      park: parkName,
      open,
      close,
    });
  } else {
    openingHoursAnswer = t('openingHoursClosed', {
      date: localizedDate,
      park: parkName,
    });
  }

  mainEntity.push({
    '@type': 'Question',
    name: t('openingHoursQ', { park: parkName }),
    acceptedAnswer: {
      '@type': 'Answer',
      text: openingHoursAnswer,
    },
  });

  // Question 2: Location
  if (park.city && park.country) {
    const countrySlug = park.country.toLowerCase().replace(/\s+/g, '-');
    const translatedCountry = translateCountry(tGeo, countrySlug, locale, park.country);

    mainEntity.push({
      '@type': 'Question',
      name: t('locationQ', { park: parkName }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('locationA', {
          park: parkName,
          city: park.city,
          country: translatedCountry,
        }),
      },
    });
  }

  // Question 3: Attraction Count
  const totalAttractions = park.analytics?.statistics?.totalAttractions || park.attractions?.length;

  if (totalAttractions) {
    mainEntity.push({
      '@type': 'Question',
      name: t('attractionCountQ', { park: parkName }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('attractionCountA', {
          park: parkName,
          count: totalAttractions,
        }),
      },
    });
  }

  // Question 4: Themed Areas
  const themedAreas = Array.from(new Set(park.attractions?.map((a) => a.land).filter(Boolean)));
  if (themedAreas.length > 0) {
    const intro = t('themedAreasA', { park: parkName, count: themedAreas.length });
    const list = themedAreas.join(', ');
    mainEntity.push({
      '@type': 'Question',
      name: t('themedAreasQ', { park: parkName }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${intro} ${list}`,
      },
    });
  }

  // Question 5: Shows
  if (park.shows && park.shows.length > 0) {
    const showNames = park.shows.map((s) => stripNewPrefix(s.name)).join(', ');
    const intro = t('showsA', { park: parkName, count: park.shows.length });
    mainEntity.push({
      '@type': 'Question',
      name: t('showsQ', { park: parkName }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${intro} ${showNames}`,
      },
    });
  }

  // Question 6: Dining
  if (park.restaurants && park.restaurants.length > 0) {
    const restaurantNames = park.restaurants.map((r) => stripNewPrefix(r.name)).join(', ');
    const intro = t('diningA', { park: parkName, count: park.restaurants.length });
    mainEntity.push({
      '@type': 'Question',
      name: t('diningQ', { park: parkName }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${intro} ${restaurantNames}`,
      },
    });
  }

  // Question 7: Crowd Calendar
  mainEntity.push({
    '@type': 'Question',
    name: t('crowdCalendarQ', { park: parkName }),
    acceptedAnswer: {
      '@type': 'Answer',
      text: t('crowdCalendarA', { park: parkName }),
    },
  });

  const jsonLd: WithContext<Thing> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }} />
  );
}
