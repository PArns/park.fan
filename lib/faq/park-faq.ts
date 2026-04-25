import type { ParkWithAttractions } from '@/lib/api/types';
import { formatInTimeZone } from 'date-fns-tz';
import { translateCountry } from '@/lib/i18n/helpers';
import { stripNewPrefix, getGermanArticle } from '@/lib/utils';

export type ParkFaqIconName =
  | 'Calendar'
  | 'MapPin'
  | 'Ticket'
  | 'Map'
  | 'Theater'
  | 'UtensilsCrossed';

export interface ParkFaqItem {
  iconName: ParkFaqIconName;
  question: string;
  answer: string | { text: string; list: (string | null)[] };
}

type T = (key: string, values?: Record<string, string | number | Date | undefined>) => string;
type TGeo = (key: string) => string;

export interface ParkArticleForms {
  parkName: string;
  parkNom: string;
  parkNomCap: string;
  parkAcc: string;
  parkLoc: string;
}

export function getParkArticleForms(park: ParkWithAttractions, locale: string): ParkArticleForms {
  const parkName = stripNewPrefix(park.name);
  const article = locale === 'de' ? getGermanArticle(parkName, park.slug) : undefined;
  const parkNom = article ? `${article} ${parkName}` : parkName;
  const parkNomCap = article
    ? `${article.charAt(0).toUpperCase()}${article.slice(1)} ${parkName}`
    : parkName;
  const parkAcc = article === 'der' ? `den ${parkName}` : parkNom;
  const parkLoc = locale === 'de' ? `im ${parkName}` : parkName;
  return { parkName, parkNom, parkNomCap, parkAcc, parkLoc };
}

export function buildParkFaqItems(
  park: ParkWithAttractions,
  locale: string,
  t: T,
  tGeo: TGeo
): ParkFaqItem[] {
  const { parkName, parkNom, parkNomCap } = getParkArticleForms(park, locale);

  const timeZone = park.timezone || 'UTC';
  const now = new Date();
  const parkDate = formatInTimeZone(now, timeZone, 'yyyy-MM-dd');
  const todaySchedule = park.schedule?.find((s) => s.date === parkDate);
  const localizedDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now);

  const items: ParkFaqItem[] = [];

  // Q1: Opening Hours
  let openingHoursAnswer: string;
  if (
    todaySchedule?.scheduleType === 'OPERATING' &&
    todaySchedule.openingTime &&
    todaySchedule.closingTime
  ) {
    const open = formatInTimeZone(new Date(todaySchedule.openingTime), timeZone, 'HH:mm');
    const close = formatInTimeZone(new Date(todaySchedule.closingTime), timeZone, 'HH:mm');
    openingHoursAnswer = t('openingHoursA', { date: localizedDate, park: parkNom, open, close });
  } else {
    openingHoursAnswer = t('openingHoursClosed', { date: localizedDate, park: parkNom });
  }
  items.push({
    iconName: 'Calendar',
    question: t('openingHoursQ', { park: parkNom }),
    answer: openingHoursAnswer,
  });

  // Q2: Location
  if (park.city && park.country) {
    const countrySlug = park.country.toLowerCase().replace(/\s+/g, '-');
    const translatedCountry = translateCountry(tGeo, countrySlug, locale, park.country);
    items.push({
      iconName: 'MapPin',
      question: t('locationQ', { park: parkNom }),
      answer: t('locationA', { park: parkNomCap, city: park.city, country: translatedCountry }),
    });
  }

  // Q3: Attraction Count
  const totalAttractions = park.analytics?.statistics?.totalAttractions || park.attractions?.length;
  if (totalAttractions) {
    items.push({
      iconName: 'Ticket',
      question: t('attractionCountQ', { park: parkName }),
      answer: t('attractionCountA', { park: parkName, count: totalAttractions }),
    });
  }

  // Q4: Themed Areas
  const uniqueLands = Array.from(new Set(park.attractions?.map((a) => a.land).filter(Boolean)));
  if (uniqueLands.length > 0) {
    items.push({
      iconName: 'Map',
      question: t('themedAreasQ', { park: parkName }),
      answer: {
        text: t('themedAreasA', { park: parkNomCap, count: uniqueLands.length }),
        list: uniqueLands,
      },
    });
  }

  // Q5: Shows
  if (park.shows && park.shows.length > 0) {
    const showNames = park.shows.map((s) => stripNewPrefix(s.name));
    items.push({
      iconName: 'Theater',
      question: t('showsQ', { park: parkName }),
      answer: {
        text: t('showsA', { park: parkNom, count: park.shows.length }),
        list: showNames,
      },
    });
  }

  // Q6: Dining
  if (park.restaurants && park.restaurants.length > 0) {
    const restaurantNames = park.restaurants.map((r) => stripNewPrefix(r.name));
    items.push({
      iconName: 'UtensilsCrossed',
      question: t('diningQ', { park: parkName }),
      answer: {
        text: t('diningA', { park: parkNomCap, count: park.restaurants.length }),
        list: restaurantNames,
      },
    });
  }

  return items;
}
