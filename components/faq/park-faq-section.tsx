import { ParkWithAttractions } from '@/lib/api/types';
import { getTranslations } from 'next-intl/server';
import { formatInTimeZone } from 'date-fns-tz';
import { ChevronDown, MapPin, Calendar, Ticket, Map, Theater, UtensilsCrossed } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { translateCountry } from '@/lib/i18n/helpers';
import { stripNewPrefix } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface ParkFAQSectionProps {
  park: ParkWithAttractions;
  locale: string;
}

interface FAQItem {
  icon: LucideIcon;
  question: string;
  answer: string | { text: string; list: (string | null)[] };
}

export async function ParkFAQSection({ park, locale }: ParkFAQSectionProps) {
  const t = await getTranslations('seo.faq');
  const tGeo = await getTranslations('geo');
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

  const faqs: FAQItem[] = [];

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

  faqs.push({
    icon: Calendar,
    question: t('openingHoursQ', { park: parkName }),
    answer: openingHoursAnswer,
  });

  // Question 2: Location
  if (park.city && park.country) {
    const countrySlug = park.country.toLowerCase().replace(/\s+/g, '-');
    const translatedCountry = translateCountry(tGeo, countrySlug, locale, park.country);

    faqs.push({
      icon: MapPin,
      question: t('locationQ', { park: parkName }),
      answer: t('locationA', {
        park: parkName,
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
        text: t('themedAreasA', { park: parkName, count: uniqueLands.length }),
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
        text: t('showsA', { park: parkName, count: park.shows.length }),
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
        text: t('diningA', { park: parkName, count: park.restaurants.length }),
        list: restaurantNames,
      },
    });
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
                  {typeof faq.answer === 'object' &&
                  'text' in faq.answer &&
                  'list' in faq.answer ? (
                    <>
                      <p className="mb-2">{faq.answer.text}</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {faq.answer.list.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    (faq.answer as string)
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
