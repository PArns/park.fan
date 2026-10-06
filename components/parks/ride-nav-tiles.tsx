'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Boxes, CalendarDays, Clock, HelpCircle, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  EntryTileBody,
  SelectionBar,
  phoneLastCellSpan,
  tileCell,
  tileRowPhone,
} from '@/components/parks/park-entry-tiles';
import { useTileReveal } from '@/lib/hooks/use-tile-reveal';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { useMinuteNowDate } from '@/lib/hooks/use-minute-now';
import { getLiveAttractionStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { formatTime } from '@/lib/utils/intl-format';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ParkAttraction } from '@/lib/api/types';

interface RideNavTilesProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  attractionSlug: string;
  /** The server-rendered snapshot — what the row draws from before any fetch lands. */
  attraction: ParkAttraction;
  timezone: string;
  /**
   * The park publishes wait times, so „Wartezeiten heute" and „Wartezeit-Verlauf" render.
   *
   * Both chapters answer a question that has no answer without a source — see the page, which
   * reads the curated `liveWaitTimes` flag rather than deriving it from an empty payload.
   */
  hasWaitTimeChapters: boolean;
  /** „Beste Besuchszeit planen" renders — it has a rope-drop card, typical waits, or both. */
  hasPlanChapter: boolean;
  /** The ride-profile chapter renders for this ride — the same predicate the section asks. */
  hasRideProfile: boolean;
  /** Track figures in the curated profile. Zero for a dark ride whose profile is types + facts. */
  rideProfileCount: number;
  /** The FAQ chapter renders for this ride. */
  hasFaq: boolean;
  /** Questions it renders. */
  faqCount: number;
  /**
   * The two chapter titles this row cannot name itself. Handed in, because
   * `useTranslations('seo.faq.attraction')` in this Client Component would put that whole namespace
   * into the routed messages of every attraction URL, for two labels the server already has.
   */
  labels: { rideProfile: string; faq: string };
}

/**
 * The ride page's chapter row: the park page's entry tiles one page type over, with the same cell
 * (`tileCell`), body (`EntryTileBody`) and place as the footer band of `ParkHeaderCard`.
 *
 * Jump links, not tabs: tabs would take the typical-wait table, the history, the ride profile and
 * the FAQ out of the served HTML. The hints come from the live panel's query by the same key, and
 * each box is reserved at two lines so the poll does not move the page. No tile is marked current,
 * since a scroll position is not a selection; `SelectionBar` still renders, invisible, so both rows
 * keep one structure.
 */
export function RideNavTiles({
  continent,
  country,
  city,
  parkSlug,
  attractionSlug,
  attraction,
  timezone,
  hasWaitTimeChapters,
  hasPlanChapter,
  hasRideProfile,
  rideProfileCount,
  hasFaq,
  faqCount,
  labels,
}: RideNavTilesProps) {
  const t = useTranslations('attractions');
  const locale = useLocale();
  const rowRef = useTileReveal<HTMLDivElement>();
  const browserNow = useMinuteNowDate();

  // The live panel's own query, by key — React Query serves both from one fetch.
  const { data: detail } = useAttractionDetail({
    continent,
    country,
    city,
    parkSlug,
    attractionSlug,
  });

  const bold = (chunks: React.ReactNode) => (
    <strong className="text-foreground font-semibold">{chunks}</strong>
  );

  const live = detail
    ? {
        ...attraction,
        queues: detail.queues ?? attraction.queues,
        status: detail.status ?? attraction.status,
      }
    : attraction;
  /**
   * The wait, and only while the ride is open: a closed ride's queue usually still carries `0`,
   * which would put „Jetzt 0 Min." under a panel saying „Geschlossen". The park's tile row gates on
   * the display status for the same reason.
   */
  const status = getLiveAttractionStatus(live, undefined);
  const wait = status === 'OPERATING' ? getStandbyWait(live) : null;

  /** The next recommended slot still ahead of the reader — the plan tile's whole point. */
  const nextSlot = useMemo(() => {
    if (!browserNow) return null;
    const nowMs = browserNow.getTime();
    const slot = (detail?.bestVisitTimes ?? attraction.bestVisitTimes ?? [])
      .filter((s) => new Date(s.time).getTime() > nowMs)
      .sort((a, b) => a.time.localeCompare(b.time))[0];
    if (!slot) return null;
    // `hour`/`minute` are load-bearing: without them Intl falls back to its date defaults.
    return formatTime(new Date(slot.time), locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    });
  }, [detail?.bestVisitTimes, attraction.bestVisitTimes, browserNow, locale, timezone]);

  /** The window's high-water mark, so the history tile says what is in the grid below. */
  const historyPeak = useMemo(() => {
    let peak = 0;
    let measured = 0;
    for (const day of detail?.history ?? []) {
      // `> 1`, the threshold at which the grid calls a day open, so the tile counts the days the
      // grid draws.
      if ((day.hourlyP90?.length ?? 0) < 2) continue;
      measured += 1;
      for (const point of day.hourlyP90) if (point.value > peak) peak = point.value;
    }
    return peak > 0 ? { peak: roundWaitTo5(peak), measured } : null;
  }, [detail?.history]);

  const items: {
    href: string;
    icon: LucideIcon;
    label: string;
    count?: number;
    hint: React.ReactNode;
  }[] = [
    ...(hasWaitTimeChapters
      ? [
          {
            href: '#live',
            icon: Clock,
            // The chapter it points at, not the hint's reading: the live minute is in the header
            // card above, and a tile labelled „Wartezeit jetzt" that scrolled past it to a chart
            // would lie about where it goes.
            label: t('todayChart.title'),
            hint:
              wait !== null
                ? t.rich('tiles.live', { min: roundWaitTo5(wait), b: bold })
                : t('tiles.liveClosed'),
          },
        ]
      : []),
    ...(hasPlanChapter
      ? [
          {
            href: '#plan',
            icon: Sparkles,
            label: t('sectionPlanVisit'),
            hint: nextSlot ? t.rich('tiles.plan', { time: nextSlot, b: bold }) : null,
          },
        ]
      : []),
    ...(hasWaitTimeChapters
      ? [
          {
            href: '#history',
            icon: CalendarDays,
            label: t('historyCalendar'),
            hint: historyPeak
              ? t.rich('tiles.history', {
                  days: historyPeak.measured,
                  max: historyPeak.peak,
                  b: bold,
                })
              : null,
          },
        ]
      : []),
    ...(hasRideProfile
      ? [
          {
            href: '#ride-profile',
            icon: Boxes,
            label: labels.rideProfile,
            count: rideProfileCount > 0 ? rideProfileCount : undefined,
            hint: null,
          },
        ]
      : []),
    ...(hasFaq
      ? [
          {
            href: '#faq',
            icon: HelpCircle,
            label: labels.faq,
            count: faqCount,
            hint: null,
          },
        ]
      : []),
  ];

  return (
    <nav
      ref={rowRef}
      aria-label={t('sectionNavLabel')}
      className={cn(
        // `-mr-px -mb-px` + the card's `overflow-hidden` clip the trailing hairlines, exactly as
        // the park's row does one card over. No `gap`: the cells touch and the rules between them
        // are the separation.
        '-mr-px -mb-px grid w-full auto-rows-fr grid-cols-2 items-stretch sm:grid-cols-3',
        tileRowPhone,
        items.length === 5 && '@min-[1024px]/page:grid-cols-5',
        items.length === 4 && '@min-[1024px]/page:grid-cols-4',
        items.length === 3 && '@min-[1024px]/page:grid-cols-3',
        items.length === 2 && '@min-[1024px]/page:grid-cols-2',
        items.length === 1 && 'grid-cols-1'
      )}
    >
      {items.map((item, index) => (
        <a
          key={item.href}
          href={item.href}
          className={cn('group', tileCell, phoneLastCellSpan(index, items.length))}
        >
          <SelectionBar />
          <EntryTileBody icon={item.icon} label={item.label} count={item.count} hint={item.hint} />
        </a>
      ))}
    </nav>
  );
}
