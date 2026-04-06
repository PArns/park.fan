import type { ReactNode } from 'react';
import { ParkWithAttractions, IntegratedCalendarResponse } from '@/lib/api/types';
import { getTranslations } from 'next-intl/server';
import { formatInTimeZone } from 'date-fns-tz';
import { CrowdCalendarFaqLink } from '@/components/faq/crowd-calendar-faq-link';
import {
  ChevronDown,
  MapPin,
  Calendar,
  Ticket,
  Map,
  Theater,
  UtensilsCrossed,
  Clock2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { translateCountry } from '@/lib/i18n/helpers';
import { stripNewPrefix, getGermanArticle } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { analyzeBestDays } from '@/lib/utils/crowd-analysis';

interface ParkFAQSectionProps {
  park: ParkWithAttractions;
  locale: string;
  calendarData?: IntegratedCalendarResponse;
}

interface FAQItem {
  icon: LucideIcon;
  question: string;
  answer: string | { text: string; list: (string | null)[] } | ReactNode;
}

function isFaqListAnswer(
  answer: FAQItem['answer']
): answer is { text: string; list: (string | null)[] } {
  return (
    answer !== null &&
    typeof answer === 'object' &&
    'list' in answer &&
    Array.isArray((answer as { list: unknown }).list)
  );
}

export async function ParkFAQSection({ park, locale, calendarData }: ParkFAQSectionProps) {
  const t = await getTranslations('seo.faq');
  const tGeo = await getTranslations('geo');

  const crowdCalendarLink = (chunks: ReactNode) => (
    <CrowdCalendarFaqLink className="text-primary decoration-primary/50 hover:decoration-primary font-medium underline underline-offset-2">
      {chunks}
    </CrowdCalendarFaqLink>
  );
  const parkName = stripNewPrefix(park.name);

  // German article forms (only for parks whose name contains "Park", e.g. "Europa-Park")
  const article = locale === 'de' ? getGermanArticle(parkName, park.slug) : undefined;
  const parkNom = article ? `${article} ${parkName}` : parkName;
  const parkNomCap = article
    ? `${article.charAt(0).toUpperCase()}${article.slice(1)} ${parkName}`
    : parkName;
  // DE FAQ question only: "Wann ist im Phantasialand …" (locative, no article)
  const parkLoc = locale === 'de' ? `im ${parkName}` : parkName;

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

  const faqs: FAQItem[] = [];

  // Question 1: Opening Hours
  let openingHoursAnswer = '';
  if (
    todaySchedule?.scheduleType === 'OPERATING' &&
    todaySchedule.openingTime &&
    todaySchedule.closingTime
  ) {
    const open = formatInTimeZone(new Date(todaySchedule.openingTime), timeZone, 'HH:mm');
    const close = formatInTimeZone(new Date(todaySchedule.closingTime), timeZone, 'HH:mm');
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

  faqs.push({
    icon: Calendar,
    question: t('openingHoursQ', { park: parkNom }),
    answer: openingHoursAnswer,
  });

  // Question 2: Location
  if (park.city && park.country) {
    const countrySlug = park.country.toLowerCase().replace(/\s+/g, '-');
    const translatedCountry = translateCountry(tGeo, countrySlug, locale, park.country);

    faqs.push({
      icon: MapPin,
      question: t('locationQ', { park: parkNom }),
      answer: t('locationA', {
        park: parkNomCap,
        city: park.city,
        country: translatedCountry,
      }),
    });
  }

  // Question 3: Attraction Count
  const totalAttractions = park.analytics?.statistics?.totalAttractions || park.attractions?.length;

  if (totalAttractions) {
    faqs.push({
      icon: Ticket,
      question: t('attractionCountQ', { park: parkName }),
      answer: t('attractionCountA', {
        park: parkName,
        count: totalAttractions,
      }),
    });
  }

  // Question 4: Themed Areas
  const uniqueLands = Array.from(new Set(park.attractions?.map((a) => a.land).filter(Boolean)));

  if (uniqueLands.length > 0) {
    faqs.push({
      icon: Map,
      question: t('themedAreasQ', { park: parkName }),
      answer: {
        text: t('themedAreasA', { park: parkNomCap, count: uniqueLands.length }),
        list: uniqueLands,
      },
    });
  }

  // Question 5: Shows
  if (park.shows && park.shows.length > 0) {
    const showNames = park.shows.map((s) => stripNewPrefix(s.name));
    faqs.push({
      icon: Theater,
      question: t('showsQ', { park: parkName }),
      answer: {
        text: t('showsA', { park: parkNom, count: park.shows.length }),
        list: showNames,
      },
    });
  }

  // Question 6: Dining
  if (park.restaurants && park.restaurants.length > 0) {
    const restaurantNames = park.restaurants.map((r) => stripNewPrefix(r.name));
    faqs.push({
      icon: UtensilsCrossed,
      question: t('diningQ', { park: parkName }),
      answer: {
        text: t('diningA', { park: parkNomCap, count: park.restaurants.length }),
        list: restaurantNames,
      },
    });
  }

  // Question 7: Least crowded
  if (calendarData) {
    const analysis = analyzeBestDays(calendarData.days);
    if (analysis.totalDays >= 7) {
      if (analysis.bestDaysOfWeek.length >= 2) {
        // Monday-first order in prose (e.g. DE: "Montag und Dienstag", not "Dienstag und Montag")
        const mondayFirstOrder = (dayIndex: number) => (dayIndex + 6) % 7;
        const dayNames = [...analysis.bestDaysOfWeek.slice(0, 2)]
          .sort((a, b) => mondayFirstOrder(a.dayIndex) - mondayFirstOrder(b.dayIndex))
          .map((s) => {
            const refMonday = new Date(2025, 0, 6);
            const date = new Date(refMonday);
            date.setDate(refMonday.getDate() + ((s.dayIndex - 1 + 7) % 7));
            return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
          })
          .join(
            locale === 'de'
              ? ' und '
              : locale === 'fr'
                ? ' et '
                : locale === 'nl'
                  ? ' en '
                  : locale === 'es'
                    ? ' y '
                    : ' and '
          );
        faqs.push({
          icon: Clock2,
          question: t('leastCrowdedQ', { park: parkNom, parkLoc }),
          answer: t.rich('leastCrowdedA', {
            park: parkNomCap,
            days: dayNames,
            calendar: crowdCalendarLink,
          }),
        });
      } else {
        faqs.push({
          icon: Clock2,
          question: t('leastCrowdedQ', { park: parkNom, parkLoc }),
          answer: t.rich('leastCrowdedNoDataA', { calendar: crowdCalendarLink }),
        });
      }
    }
  }

  if (faqs.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">{t('title', { park: parkName })}</h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const Icon = faq.icon;

          return (
            <Card key={index} className="overflow-hidden">
              <details className="group">
                <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center justify-between p-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon className="text-primary h-5 w-5 flex-shrink-0" />
                    <span className="text-left font-medium">{faq.question}</span>
                  </div>
                  <ChevronDown className="text-muted-foreground h-5 w-5 flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="text-muted-foreground border-t px-4 pt-2 pb-4">
                  {typeof faq.answer === 'string' ? (
                    <GlossaryInject>{faq.answer}</GlossaryInject>
                  ) : isFaqListAnswer(faq.answer) ? (
                    <>
                      <p className="mb-2">{faq.answer.text}</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {faq.answer.list.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>{faq.answer as ReactNode}</>
                  )}
                </div>
              </details>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
