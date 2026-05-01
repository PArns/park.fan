import type { ReactNode } from 'react';
import { ParkWithAttractions, IntegratedCalendarResponse } from '@/lib/api/types';
import { getTranslations } from 'next-intl/server';
import { CrowdCalendarFaqLink } from '@/components/faq/crowd-calendar-faq-link';
import {
  ChevronDown,
  Calendar,
  MapPin,
  Ticket,
  Map,
  Theater,
  UtensilsCrossed,
  Clock2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { stripNewPrefix } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { analyzeBestDays } from '@/lib/utils/crowd-analysis';
import { buildParkFaqItems, getParkArticleForms, type ParkFaqIconName } from '@/lib/faq/park-faq';

interface ParkFAQSectionProps {
  park: ParkWithAttractions;
  locale: string;
  calendarData?: IntegratedCalendarResponse;
}

interface FAQItem {
  iconName: ParkFaqIconName | 'Clock2';
  question: string;
  answer: string | { text: string; list: (string | null)[] } | ReactNode;
}

const ICON_MAP: Record<ParkFaqIconName | 'Clock2', LucideIcon> = {
  Calendar,
  MapPin,
  Ticket,
  Map,
  Theater,
  UtensilsCrossed,
  Clock2,
};

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
  const faqs: FAQItem[] = buildParkFaqItems(
    park,
    locale,
    t as Parameters<typeof buildParkFaqItems>[2],
    tGeo as Parameters<typeof buildParkFaqItems>[3]
  );

  const { parkNom, parkNomCap, parkLoc } = getParkArticleForms(park, locale);
  const parkName = stripNewPrefix(park.name);

  const crowdCalendarLink = (chunks: ReactNode) => (
    <CrowdCalendarFaqLink className="text-primary decoration-primary/50 hover:decoration-primary font-medium underline underline-offset-2">
      {chunks}
    </CrowdCalendarFaqLink>
  );

  // Q7: Least crowded (requires calendar data, uses rich text)
  if (calendarData) {
    const analysis = analyzeBestDays(calendarData.days);
    if (analysis.totalDays >= 7) {
      const conjunctions: Record<string, string> = {
        de: ' und ',
        fr: ' et ',
        nl: ' en ',
        es: ' y ',
      };
      const conjunction = conjunctions[locale] ?? ' and ';

      if (analysis.bestDaysOfWeek.length >= 2) {
        const mondayFirstOrder = (dayIndex: number) => (dayIndex + 6) % 7;
        const dayNames = [...analysis.bestDaysOfWeek.slice(0, 2)]
          .sort((a, b) => mondayFirstOrder(a.dayIndex) - mondayFirstOrder(b.dayIndex))
          .map((s) => {
            const refMonday = new Date(2025, 0, 6);
            const date = new Date(refMonday);
            date.setDate(refMonday.getDate() + ((s.dayIndex - 1 + 7) % 7));
            return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
          })
          .join(conjunction);
        faqs.push({
          iconName: 'Clock2' as ParkFaqIconName,
          question: t('leastCrowdedQ', { park: parkNom, parkLoc }),
          answer: t.rich('leastCrowdedA', {
            park: parkNomCap,
            days: dayNames,
            calendar: crowdCalendarLink,
          }),
        });
      } else {
        faqs.push({
          iconName: 'Clock2' as ParkFaqIconName,
          question: t('leastCrowdedQ', { park: parkNom, parkLoc }),
          answer: t.rich('leastCrowdedNoDataA', { calendar: crowdCalendarLink }),
        });
      }
    }
  }

  if (faqs.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="bg-background/70 rounded-xl px-4 py-3 backdrop-blur-md">
        <h2 className="text-2xl font-bold">{t('title', { park: parkName })}</h2>
      </div>
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const Icon = ICON_MAP[faq.iconName as keyof typeof ICON_MAP];

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
