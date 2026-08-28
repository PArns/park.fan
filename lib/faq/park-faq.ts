import type { CalendarDay, ParkWithAttractions } from '@/lib/api/types';
import { formatInTimeZone } from 'date-fns-tz';
import { translateCountry } from '@/lib/i18n/helpers';
import { analyzeBestDays } from '@/lib/utils/crowd-analysis';
import { stripNewPrefix, getGermanArticle } from '@/lib/utils';
import { parkArgs, parkPhrase } from '@/lib/i18n/park-phrase';
import type { Locale } from '@/i18n/config';

export type ParkFaqIconName =
  'Calendar' | 'MapPin' | 'Ticket' | 'Map' | 'Theater' | 'UtensilsCrossed' | 'Clock2';

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
  /** `{park}`, `{inPark}`, `{forPark}`, … for the strings that carry the phrase. */
  args: ReturnType<typeof parkArgs>;
}

/**
 * The park name in the forms German sentences need.
 *
 * The article now comes from the API (`nameArticleDe`), curated per park, and
 * only falls back to the name-based guess when that is absent. `parkLoc` used
 * to be `im ${parkName}` unconditionally — the same bug as everywhere else,
 * producing "im Cedar Point" and "im Toverland"; it goes through `parkPhrase`,
 * which knows that `in dem` contracts and `in der` does not.
 */
export function getParkArticleForms(park: ParkWithAttractions, locale: string): ParkArticleForms {
  const parkName = stripNewPrefix(park.name);
  const article =
    locale === 'de' ? getGermanArticle(parkName, park.slug, park.nameArticleDe) : undefined;
  const parkNom = article ? `${article} ${parkName}` : parkName;
  const parkNomCap = article
    ? `${article.charAt(0).toUpperCase()}${article.slice(1)} ${parkName}`
    : parkName;
  const parkAcc =
    article === 'der' ? `den ${parkName}` : article === 'die' ? `die ${parkName}` : parkNom;
  // Only German gets a preposition here; the other locales' FAQ sentences carry
  // their own and always did.
  const parkLoc =
    locale === 'de' ? parkPhrase('de', 'in', parkName, article ?? null) : parkName;
  return {
    parkName,
    parkNom,
    parkNomCap,
    parkAcc,
    parkLoc,
    args: parkArgs(locale as Locale, parkName, article ?? null),
  };
}

export function buildParkFaqItems(
  park: ParkWithAttractions,
  locale: string,
  t: T,
  tGeo: TGeo,
  /**
   * Epoch ms for "now", or `null` for a TIME-INDEPENDENT build. The only time-dependent answer is
   * Q1 (today's opening hours): with a `nowMs` it renders today's concrete hours, with `null` an
   * evergreen "see the calendar" answer. The park page is force-dynamic (per-request render), so
   * its callers pass the per-request server clock (SSR) or the browser clock (after mount);
   * pass `null` from any statically-cached context that must not read a clock.
   */
  nowMs: number | null
): ParkFaqItem[] {
  const { parkNom, parkNomCap, args } = getParkArticleForms(park, locale);

  const timeZone = park.timezone || 'UTC';
  const now = nowMs != null ? new Date(nowMs) : null;
  const parkDate = now ? formatInTimeZone(now, timeZone, 'yyyy-MM-dd') : null;
  const todaySchedule = parkDate ? park.schedule?.find((s) => s.date === parkDate) : undefined;
  const localizedDate = now
    ? new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(now)
    : null;

  const items: ParkFaqItem[] = [];

  // Q0: Park-wide wait times today — targets the head query "{park} wait times (today)".
  // Uses live aggregate stats when the park is operating, else a generic evergreen answer.
  const stats = park.analytics?.statistics;
  if (stats && stats.operatingAttractions > 0 && stats.avgWaitToday > 0) {
    items.push({
      iconName: 'Clock2',
      question: t('waitTimesQ', args),
      answer: t('waitTimesA', {
        ...args,
        avg: Math.round(stats.avgWaitToday),
        peak: Math.round(stats.peakWaitToday),
        operating: stats.operatingAttractions,
      }),
    });
  } else {
    items.push({
      iconName: 'Clock2',
      question: t('waitTimesQ', args),
      answer: t('waitTimesNoDataA', args),
    });
  }

  // Q1: Opening Hours. Time-INDEPENDENT when nowMs is null (SSR/structured-data/pre-mount): an
  // evergreen answer that never reads the clock, so it can't pin or stale the static shell. With a
  // client-derived nowMs it upgrades to today's concrete hours after mount.
  let openingHoursAnswer: string;
  if (
    now &&
    localizedDate &&
    todaySchedule?.scheduleType === 'OPERATING' &&
    todaySchedule.openingTime &&
    todaySchedule.closingTime
  ) {
    const open = formatInTimeZone(new Date(todaySchedule.openingTime), timeZone, 'HH:mm');
    const close = formatInTimeZone(new Date(todaySchedule.closingTime), timeZone, 'HH:mm');
    openingHoursAnswer = t('openingHoursA', { date: localizedDate, park: parkNom, open, close });
  } else if (now && localizedDate && todaySchedule) {
    openingHoursAnswer = t('openingHoursClosed', { date: localizedDate, park: parkNom });
  } else {
    openingHoursAnswer = t('openingHoursEvergreenA', { park: parkNom });
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
      question: t('attractionCountQ', args),
      answer: t('attractionCountA', { ...args, count: totalAttractions }),
    });
  }

  // Q4: Themed Areas
  const uniqueLands = Array.from(new Set(park.attractions?.map((a) => a.land).filter(Boolean)));
  if (uniqueLands.length > 0) {
    items.push({
      iconName: 'Map',
      question: t('themedAreasQ', args),
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
      question: t('showsQ', args),
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
      question: t('diningQ', args),
      answer: {
        text: t('diningA', { park: parkNomCap, count: park.restaurants.length }),
        list: restaurantNames,
      },
    });
  }

  return items;
}

/** Localised " and " conjunction for joining the two quietest weekdays. */
const DAY_CONJUNCTIONS: Record<string, string> = {
  de: ' und ',
  fr: ' et ',
  nl: ' en ',
  es: ' y ',
  it: ' e ',
};

export type LeastCrowdedResult =
  /** Fewer than 7 rated days — don't emit the FAQ entry at all. */
  | { status: 'insufficient' }
  /** Enough days but no clear weekday pattern — emit the generic "check the calendar" answer. */
  | { status: 'no-pattern' }
  /** Two quietest weekdays, already localised and joined (e.g. "Dienstag und Mittwoch"). */
  | { status: 'days'; dayNames: string };

/**
 * Shared derivation for the "when is {park} least crowded?" FAQ entry — used by BOTH the
 * server-rendered FAQPage JSON-LD and the visible FAQ section, so the structured data can never
 * claim something the page doesn't show.
 */
export function getLeastCrowdedDays(
  days: CalendarDay[],
  nowMs: number,
  timezone: string,
  locale: string
): LeastCrowdedResult {
  const analysis = analyzeBestDays(days, nowMs, timezone);
  if (analysis.totalDays < 7) return { status: 'insufficient' };
  if (analysis.bestDaysOfWeek.length < 2) return { status: 'no-pattern' };

  const conjunction = DAY_CONJUNCTIONS[locale] ?? ' and ';
  const mondayFirstOrder = (dayIndex: number) => (dayIndex + 6) % 7;
  const dayNames = [...analysis.bestDaysOfWeek.slice(0, 2)]
    .sort((a, b) => mondayFirstOrder(a.dayIndex) - mondayFirstOrder(b.dayIndex))
    .map((s) => {
      // Reference Monday (2025-01-06) + offset → a date with the wanted weekday, for Intl naming.
      const refMonday = new Date(2025, 0, 6);
      const date = new Date(refMonday);
      date.setDate(refMonday.getDate() + ((s.dayIndex - 1 + 7) % 7));
      return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
    })
    .join(conjunction);
  return { status: 'days', dayNames };
}
