'use client';

import type { ReactNode } from 'react';
import { ParkWithAttractions } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { CrowdCalendarFaqLink } from '@/components/faq/crowd-calendar-faq-link';
import {
  HelpCircle,
  Calendar,
  MapPin,
  Ticket,
  Map,
  Theater,
  UtensilsCrossed,
  Clock2,
} from 'lucide-react';
import { stripNewPrefix } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { ChapterPanel } from '@/components/common/chapter-panel';
import { FaqAccordion } from '@/components/faq/faq-accordion';
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

/**
 * FAQ chapter on a park page: hours, location, tickets and more from `buildParkFaqItems`, the least
 * crowded days from the best-days calendar, and the crowd calendar question the `FAQPage` JSON-LD
 * also carries. Client Component seeded by the server so the answers are in the first HTML.
 */
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

  // "now" is the server's `seedNowMs`, so the time-dependent answers are in the crawlable first
  // HTML and both renders agree. The browser clock is read only without a seed: these answers are
  // day-granular, and taking it over after mount would only redo the whole FAQ.
  const browserNow = useBrowserNow(seedNowMs == null);
  const nowMs = browserNow ? browserNow.getTime() : (seedNowMs ?? null);

  // The calendar feeds only the least-crowded answer. The server seed backs it in the first HTML
  // until the deferred client fetch lands; without a seed the other answers render at once.
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

  const {
    parkNom,
    parkNomCap,
    parkAcc,
    parkLoc,
    args: parkArgs,
  } = getParkArticleForms(park, locale);
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

  /**
   * The crowd-calendar question, which the `FAQPage` markup carries, so the visible page must
   * answer it too. It needs no data, and uses `t`, not `t.rich`, so the visible answer and the one
   * in the markup are the same string.
   */
  faqs.push({
    iconName: 'Calendar' as ParkFaqIconName,
    question: t('crowdCalendarQ', { park: parkNom }),
    answer: t('crowdCalendarA', { ...parkArgs, park: parkAcc }),
  });

  if (faqs.length === 0) return null;

  return (
    <GlossaryInjectProvider
      terms={glossaryTerms}
      locale={locale as Locale}
      segment={glossarySegment}
    >
      {/* One box with the questions as rows: the `FaqAccordion` the ride page draws, inside the
        same `ChapterPanel`. This section emits no structured data; the park page's
        `FAQStructuredData` does, from the same `buildParkFaqItems` array. */}
      <ChapterPanel icon={HelpCircle} title={t('title', { park: parkName })} bodyPadding="none">
        <FaqAccordion
          items={faqs.map((faq) => ({
            icon: ICON_MAP[faq.iconName as keyof typeof ICON_MAP],
            question: faq.question,
            answer:
              typeof faq.answer === 'string' ? (
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
                (faq.answer as ReactNode)
              ),
          }))}
        />
      </ChapterPanel>
    </GlossaryInjectProvider>
  );
}
