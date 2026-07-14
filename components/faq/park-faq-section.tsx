'use client';

import type { ReactNode } from 'react';
import { ParkWithAttractions } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
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
import { GlossaryInjectClient } from '@/components/glossary/glossary-inject-client';
import {
  GlossaryInjectProvider,
  type GlossaryInjectTerm,
} from '@/components/glossary/glossary-inject-context';
import type { Locale } from '@/i18n/config';
import {
  buildParkFaqItems,
  getLeastCrowdedDays,
  getParkArticleForms,
  type ParkFaqIconName,
} from '@/lib/faq/park-faq';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import type { IntegratedCalendarResponse } from '@/lib/api/types';

interface ParkFAQSectionProps {
  park: ParkWithAttractions;
  locale: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Glossary terms + URL segment, loaded in the server shell, so the client tree can highlight
   *  terms without awaiting them. */
  glossaryTerms: GlossaryInjectTerm[];
  glossarySegment: string;
  /** Server-fetched calendar seed — lets Q7 (least crowded) render into the initial HTML
   *  instead of streaming in only after the deferred client calendar fetch. */
  initialCalendar?: IntegratedCalendarResponse | null;
  /** Server "now" (epoch ms) — SSR fallback for the browser clock, so Q1 (today's hours) and
   *  Q7 render server-side; the browser clock takes over after mount (same day → same output). */
  seedNowMs?: number;
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

export function ParkFAQSection({
  park,
  locale,
  continent,
  country,
  city,
  parkSlug,
  glossaryTerms,
  glossarySegment,
  initialCalendar,
  seedNowMs,
}: ParkFAQSectionProps) {
  const t = useTranslations('seo.faq');
  const tGeo = useTranslations('geo');

  // "now": browser clock once mounted; before that (SSR + first client render) the server-passed
  // seedNowMs, so the time-dependent Q1 (today's hours) and Q7 (least crowded) are part of the
  // crawlable first HTML. Both renders read the SAME prop value → no hydration mismatch; the
  // page is force-dynamic, so a per-request server clock is fine. Day-granular precision is all
  // Q1/Q7 need, so the browser clock taking over after mount yields the same text.
  const browserNow = useBrowserNow(null);
  const nowMs = browserNow ? browserNow.getTime() : (seedNowMs ?? null);

  // Calendar feeds only Q7 (least-crowded days). The deferred client fetch takes over once it
  // lands; until then the server seed (when available) backs Q7 so it's already in the first
  // HTML. Without a seed the base Q0–Q6 render immediately — the old streamed behavior.
  const { data: clientCalendarData } = useParkBestDaysCalendar({
    continent,
    country,
    city,
    parkSlug,
  });
  const calendarData = clientCalendarData ?? initialCalendar ?? undefined;

  const faqs: FAQItem[] = buildParkFaqItems(
    park,
    locale,
    t as Parameters<typeof buildParkFaqItems>[2],
    tGeo as Parameters<typeof buildParkFaqItems>[3],
    nowMs
  );

  const { parkNom, parkNomCap, parkLoc } = getParkArticleForms(park, locale);
  const parkName = stripNewPrefix(park.name);

  const crowdCalendarLink = (chunks: ReactNode) => (
    <CrowdCalendarFaqLink className="text-primary decoration-primary/50 hover:decoration-primary font-medium underline underline-offset-2">
      {chunks}
    </CrowdCalendarFaqLink>
  );

  // Q7: Least crowded — shared derivation with the FAQPage JSON-LD (getLeastCrowdedDays), so
  // the structured data and the visible answer can never diverge. Rich text (calendar link)
  // stays a visible-only affordance.
  if (calendarData && nowMs != null) {
    const leastCrowded = getLeastCrowdedDays(
      calendarData.days,
      nowMs,
      calendarData.meta.timezone,
      locale
    );
    if (leastCrowded.status === 'days') {
      faqs.push({
        iconName: 'Clock2' as ParkFaqIconName,
        question: t('leastCrowdedQ', { park: parkNom, parkLoc }),
        answer: t.rich('leastCrowdedA', {
          park: parkNomCap,
          days: leastCrowded.dayNames,
          calendar: crowdCalendarLink,
        }),
      });
    } else if (leastCrowded.status === 'no-pattern') {
      faqs.push({
        iconName: 'Clock2' as ParkFaqIconName,
        question: t('leastCrowdedQ', { park: parkNom, parkLoc }),
        answer: t.rich('leastCrowdedNoDataA', { calendar: crowdCalendarLink }),
      });
    }
  }

  if (faqs.length === 0) return null;

  return (
    <GlossaryInjectProvider
      terms={glossaryTerms}
      locale={locale as Locale}
      segment={glossarySegment}
    >
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
                      <GlossaryInjectClient>{faq.answer}</GlossaryInjectClient>
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
    </GlossaryInjectProvider>
  );
}
