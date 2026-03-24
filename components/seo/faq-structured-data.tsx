import { ParkWithAttractions } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { WithContext, Thing } from 'schema-dts';
import { formatInTimeZone } from 'date-fns-tz';
import { translateCountry } from '@/lib/i18n/helpers';
import { escapeJsonLd } from '@/components/seo/structured-data';
import { stripNewPrefix, getGermanArticle } from '@/lib/utils';

interface FAQStructuredDataProps {
  park: ParkWithAttractions;
  locale: string;
}

export function FAQStructuredData({ park, locale }: FAQStructuredDataProps) {
  const t = useTranslations('seo.faq');
  const tGeo = useTranslations('geo');
  const parkName = stripNewPrefix(park.name);

  // German article forms (only for parks whose name contains "Park", e.g. "Europa-Park")
  const article = locale === 'de' ? getGermanArticle(parkName, park.slug) : undefined;
  const parkNom = article ? `${article} ${parkName}` : parkName;
  const parkNomCap = article
    ? `${article.charAt(0).toUpperCase()}${article.slice(1)} ${parkName}`
    : parkName;
  const parkAcc = article === 'der' ? `den ${parkName}` : parkNom;

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
      park: parkNom,
      open,
      close,
    });
  } else {
    openingHoursAnswer = t('openingHoursClosed', {
      date: localizedDate,
      park: parkNom,
    });
  }

  mainEntity.push({
    '@type': 'Question',
    name: t('openingHoursQ', { park: parkNom }),
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
      name: t('locationQ', { park: parkNom }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t('locationA', {
          park: parkNomCap,
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
    const intro = t('themedAreasA', { park: parkNomCap, count: themedAreas.length });
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
    const intro = t('showsA', { park: parkNom, count: park.shows.length });
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
    const intro = t('diningA', { park: parkNomCap, count: park.restaurants.length });
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
    name: t('crowdCalendarQ', { park: parkNom }),
    acceptedAnswer: {
      '@type': 'Answer',
      text: t('crowdCalendarA', { park: parkAcc }),
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
