'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Boxes, CalendarDays, Clock, HelpCircle, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EntryTileBody, SelectionBar, tileCell } from '@/components/parks/park-entry-tiles';
import { useTileReveal } from '@/lib/hooks/use-tile-reveal';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
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
   * The two chapter titles this row cannot name itself.
   *
   * Handed in rather than looked up, and it is not a style choice: this is a Client Component, so
   * a `useTranslations('seo.faq.attraction')` here puts that whole namespace — and
   * `attraction.rideProfile` with it — into the routed message payload of all 42,756 attraction
   * URLs, for two labels the server already has. Same reasoning as `leanParkForAttractionShell`
   * one layer down: pass what is read, not what is available.
   */
  labels: { rideProfile: string; faq: string };
}

/**
 * The ride page's chapter row — the park page's entry tiles, one page type over.
 *
 * These are **jump links, not tabs**, and the difference is the whole point. The park page's
 * tiles switch a `Tabs` whose inactive panels are not in the DOM; doing the same here would take
 * the typical-wait table, the 30-day history, the ride profile and the FAQ out of the served HTML
 * of every ride page on the site, which is most of what a ride page is for. The chapters stay
 * where they are and the row is a way to reach them.
 *
 * What changed is everything else about it. The row used to be four rounded, gapped tiles
 * carrying an icon and a label and nothing else, sitting on the park photo under a card — while
 * the park page's row is a seamless band of hairline-ruled cells inside the header card, each
 * saying what is behind it right now. Two pages one click apart, two different objects doing the
 * same job. This one takes the park's cell (`tileCell`), the park's body (`EntryTileBody` with
 * its reserved two-line hint) and the park's place in the layout: the footer band of
 * `ParkHeaderCard`, under „Heute an dieser Bahn".
 *
 * The hints come from the query the live panel above it already runs — same key, one fetch — so
 * the row costs a request from nobody. Each is `null` until its data lands and the box is
 * reserved at two lines either way, which is what keeps the poll from moving the page.
 *
 * Nothing marks a tile „current": a scroll position is not a selection, and the honest version of
 * that is a scroll spy over chapters that are metres tall. `SelectionBar` is rendered all the
 * same — it is `opacity-0` without `data-state=active` or `aria-current`, so it costs a span and
 * keeps the two rows structurally identical.
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
  const browserNow = useBrowserNow(60_000);

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
   * The wait, and only when the ride is actually open.
   *
   * `getStandbyWait` says so in its own docstring — "a closed ride reports the last number its
   * queue carried" — and the number it carries is usually `0`. Verified against the live API: at
   * 06:37 UTC Phantasialand returns Taron `CLOSED` with `queues: [{ STANDBY, status: CLOSED,
   * waitTime: 0 }]`, so this tile served „Jetzt 0 Min." in the first HTML of every ride page of
   * every closed park, two rows under a panel saying „Geschlossen". The park's own tile row gates
   * on the display status for the same reason.
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
    // `hour`/`minute` are load-bearing: without them Intl falls back to its DATE defaults and the
    // tile reads „Beste Zeit: 26.8.2026 Uhr". Every other formatTime call site passes them.
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
      // `> 1`, the same threshold the grid calls a day OPEN. At `>= 1` the tile counted a day the
      // grid draws as closed and said „29 Tage" over a grid showing 28.
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
            // The chapter it points at, not the reading in the hint: the live minute now opens the page
            // inside the header card this row is the footer of, and a tile labelled „Wartezeit jetzt"
            // that scrolls PAST it to a chart is a tile that lies about where it goes.
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
        items.length === 5 && 'lg:grid-cols-5',
        items.length === 4 && 'lg:grid-cols-4',
        items.length === 3 && 'lg:grid-cols-3',
        items.length === 2 && 'lg:grid-cols-2',
        items.length === 1 && 'grid-cols-1'
      )}
    >
      {items.map((item) => (
        <a key={item.href} href={item.href} className={cn('group', tileCell)}>
          <SelectionBar />
          <EntryTileBody icon={item.icon} label={item.label} count={item.count} hint={item.hint} />
        </a>
      ))}
    </nav>
  );
}
