'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, TrendingDown, AlertTriangle, Sunset } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMounted } from '@/lib/hooks/use-mounted';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard, TILE_GLASS } from '@/components/common/glass-card';
import { PANEL_CELL, PanelGrid, PanelMetric } from '@/components/parks/park-panel-cell';
import type { IntegratedCalendarResponse } from '@/lib/api/types';
import type { BestDaysByDayOfWeek, BestDaysSnapshot } from '@/lib/api/integrated-calendar';
import { analyzeBestDays, scoreToCrowdLevel } from '@/lib/utils/crowd-analysis';
import { CROWD_CHIP_CLASS } from '@/lib/utils/crowd-level-styles';
import { cn } from '@/lib/utils';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { useParkHistoricalStats } from '@/lib/hooks/use-park-historical-stats';
import { ParkBestDaysSectionSkeleton } from '@/components/parks/park-best-days-section-skeleton';
import { ParkBestDaysHeader, localizedParkName } from '@/components/parks/park-best-days-header';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { parkArgs } from '@/lib/i18n/park-phrase';
import type { Locale } from '@/i18n/config';

interface ParkBestDaysSectionProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Park timezone — used for the empty-calendar fallback meta while data loads/fails. */
  timezone: string;
  hasOperatingSchedule: boolean;
  parkName: string;
  /** The park's German article, for "Beste Reisezeit für den/das …". */
  articleDe?: string | null;
  locale: string;
  /** Renders as a compact card without section heading — for embedding in the header area */
  compact?: boolean;
  /**
   * When true, the (non-compact) section header shows a visible "view full crowd calendar" link
   * that jumps to the park page's `#calendar` tab. Only meaningful on the park page (where that
   * tab exists) — left off elsewhere (e.g. the blog widget renders `compact`, which has no header).
   */
  showCalendarLink?: boolean;
  className?: string;
  /**
   * Server-fetched calendar seed (data-cached `getBestDaysCalendarSeed`). When present, the
   * SSR / pre-mount render shows the REAL best-days content (from the seed) instead of a
   * skeleton — this is what puts the "beste Reisezeit" text into the crawlable first HTML.
   * The client queries below still load exactly as before (deferred via useLoadLast) and
   * replace the seed once they settle. `null`/absent → the pre-seed skeleton behavior.
   */
  initialCalendar?: BestDaysSnapshot | null;
  /** Server "now" (epoch ms) the seed was rendered with — keeps SSR and the first client
   *  render byte-identical (no hydration mismatch from two clock reads). */
  seedNowMs?: number;
  /**
   * Server-rendered lead-in, rendered as the first row inside this section's box.
   *
   * The calendar page passes its month summary here. Both answer „wann ist es leer" — this
   * section for the next ninety days by weekday, the summary for the month on screen, day by
   * day — so they are one chapter under one heading rather than two cards with park photograph
   * between them.
   */
  intro?: React.ReactNode;
}

function getDayShort(dayIndex: number, locale: string): string {
  const refMonday = new Date(2025, 0, 6);
  const date = new Date(refMonday);
  date.setDate(refMonday.getDate() + ((dayIndex - 1 + 7) % 7));
  return getDateTimeFormat(locale, { weekday: 'short' }).format(date).replace(/\.$/, '');
}

function DayChip({ dayIndex, score, locale }: { dayIndex: number; score: number; locale: string }) {
  const level = scoreToCrowdLevel(score);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-3 py-1 text-sm font-medium',
        CROWD_CHIP_CLASS[level]
      )}
    >
      {getDayShort(dayIndex, locale)}
    </span>
  );
}

/**
 * Client wrapper: fetches the calendar window + historical stats client-side (via the
 * `/api/parks/.../calendar` + `/stats` CDN-cached routes), shows the skeleton while loading,
 * then renders the best-days content. Moving this off the server render is what lets the park
 * page stay statically prerenderable (no `connection()` / dynamic hole). Falls back to an empty
 * calendar / undefined stats on error so a failed fetch degrades gracefully (mirrors the old
 * server-side loadBestDaysCalendar/loadParkStats fallbacks).
 */
export function ParkBestDaysSection({
  continent,
  country,
  city,
  parkSlug,
  timezone,
  hasOperatingSchedule,
  parkName,
  articleDe,
  locale,
  compact = false,
  showCalendarLink = false,
  className,
  initialCalendar,
  seedNowMs,
  intro,
}: ParkBestDaysSectionProps) {
  // Both queries are browser-only (disabled during SSR). Gate the content render on `mounted`
  // so the static prerender (and first paint) shows the skeleton instead of reaching the
  // clock-reading content below — reading Date.now() inside a Client Component during the
  // prerender is forbidden under Cache Components.
  const mounted = useMounted();
  // `isPending` (not `isLoading`): both queries start DISABLED — until mounted, and until
  // useLoadLast releases them (best-travel-time loads last, see the hooks). A disabled query is
  // pending but not fetching, so `isLoading` would be false and the section would flash its empty
  // fallback during the defer window.
  const { data: calendarData, isPending: calendarPending } = useParkBestDaysCalendar({
    continent,
    country,
    city,
    parkSlug,
  });
  const { data: stats, isPending: statsPending } = useParkHistoricalStats({
    continent,
    country,
    city,
    parkSlug,
  });

  // Until the client queries have settled, render the SERVER seed when we have one — the
  // best-days text is then part of the initial HTML (SSR + first client render are identical,
  // both driven by the same props). The `/best-days` snapshot carries the stats-quality weekday
  // aggregate (`byDayOfWeek`) too, so even the seed shows the proper "quietest weekdays" ranking
  // (not just the calendar-derived fallback); once the deferred client queries land, the full
  // stats view replaces the seed. Without a seed: skeleton, as before.
  if (!mounted || calendarPending || statsPending) {
    if (initialCalendar && seedNowMs != null) {
      return (
        <BestDaysContent
          intro={intro}
          calendarData={initialCalendar}
          statsByDayOfWeek={initialCalendar.byDayOfWeek}
          nowMs={seedNowMs}
          parkName={parkName}
          parkSlug={parkSlug}
          articleDe={articleDe}
          locale={locale}
          compact={compact}
          showCalendarLink={showCalendarLink}
          className={className}
        />
      );
    }
    return compact ? null : (
      // `intro` goes through here too. It is server-rendered and needs none of the queries this
      // branch is waiting for — dropping it meant that a best-days seed which timed out silently
      // took the month summary with it, and the page went back to being the near-duplicate this
      // whole chapter exists to stop being. No error, no empty box, just the sentences gone.
      <ParkBestDaysSectionSkeleton
        parkName={parkName}
        parkSlug={parkSlug}
        locale={locale}
        showCalendarLink={showCalendarLink}
        intro={intro}
      />
    );
  }

  // Graceful empty fallback when the calendar fetch failed (mirrors loadBestDaysCalendar).
  const resolvedCalendar: IntegratedCalendarResponse = calendarData ?? {
    meta: { slug: parkSlug, timezone, hasOperatingSchedule },
    days: [],
  };

  return (
    <BestDaysContent
      intro={intro}
      calendarData={resolvedCalendar}
      statsByDayOfWeek={stats?.byDayOfWeek}
      parkName={parkName}
      parkSlug={parkSlug}
      articleDe={articleDe}
      locale={locale}
      compact={compact}
      showCalendarLink={showCalendarLink}
      className={className}
    />
  );
}

interface BestDaysContentProps {
  calendarData: IntegratedCalendarResponse;
  /** Weekday aggregate — the full `/stats` shape (client path) OR the lean `/best-days` subset
   *  (seed path); only `dayOfWeek`/`avgCrowdScore`/`sampleDays` are read, so the subset suffices. */
  statsByDayOfWeek?: BestDaysByDayOfWeek[];
  /** Externally supplied "now" (the SSR seed's server clock). Omitted → captured at mount. */
  nowMs?: number;
  parkName: string;
  parkSlug: string;
  /** The park's German article, for "Beste Reisezeit für den/das …". */
  articleDe?: string | null;
  locale: string;
  compact?: boolean;
  showCalendarLink?: boolean;
  className?: string;
  /** See `ParkBestDaysSectionProps.intro` — threaded through so it lands inside the panel box. */
  intro?: React.ReactNode;
}

function BestDaysContent({
  calendarData,
  statsByDayOfWeek,
  nowMs: nowMsProp,
  parkName,
  parkSlug,
  articleDe,
  locale,
  compact = false,
  showCalendarLink = false,
  className,
  intro,
}: BestDaysContentProps) {
  const t = useTranslations('parks.bestDays');
  // Capture "now" once at mount (lazy init) — analyzeBestDays only needs day-granular precision,
  // and calling Date.now() directly during render is a purity violation. The seed path passes
  // the server clock in via prop instead, so SSR and hydration read the SAME value.
  const [mountNowMs] = useState(() => nowMsProp ?? Date.now());
  const nowMs = nowMsProp ?? mountNowMs;
  // Memoized: this section re-renders on every background poll tick (useLoadLast subscribes to
  // the page-wide fetch count), and the 90-day analysis is the expensive part.
  const analysis = useMemo(
    () => analyzeBestDays(calendarData.days, nowMs, calendarData.meta.timezone),
    [calendarData.days, nowMs, calendarData.meta.timezone]
  );

  const bestDaysOfWeek =
    statsByDayOfWeek && statsByDayOfWeek.length > 0
      ? [...statsByDayOfWeek]
          .sort((a, b) => a.avgCrowdScore - b.avgCrowdScore)
          .slice(0, 3)
          .sort((a, b) => ((a.dayOfWeek - 1 + 7) % 7) - ((b.dayOfWeek - 1 + 7) % 7))
          .map((d) => ({
            dayIndex: d.dayOfWeek,
            avgScore: d.avgCrowdScore,
            sampleSize: d.sampleDays,
          }))
      : analysis.bestDaysOfWeek;

  const weekendStats = statsByDayOfWeek?.filter((d) => {
    const offset = (d.dayOfWeek - 1 + 7) % 7;
    return offset === 5 || offset === 6;
  });
  const bestWeekendDay =
    weekendStats && weekendStats.length > 0
      ? weekendStats.reduce((best, curr) => (curr.avgCrowdScore < best.avgCrowdScore ? curr : best))
      : null;

  const hasBestDays = bestDaysOfWeek.length > 0;
  const hasUpcoming = analysis.upcomingQuietDays.length > 0;

  const hasEnoughData =
    (statsByDayOfWeek && statsByDayOfWeek.length > 0) || analysis.totalDays >= 7;
  if (!hasEnoughData || (!hasBestDays && !hasUpcoming)) return null;

  const displayName = localizedParkName(parkName, parkSlug, locale);

  if (compact) {
    if (!hasBestDays && !bestWeekendDay) return null;

    return (
      <GlassCard variant="medium" className={cn('min-w-0', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="text-primary h-4 w-4" aria-hidden="true" />
            {t('titleCompact')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasBestDays && (
            <div className="space-y-2">
              <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium tracking-wide uppercase">
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
                {t('quietestDaysTitle')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {bestDaysOfWeek.map((stat) => (
                  <DayChip
                    key={stat.dayIndex}
                    dayIndex={stat.dayIndex}
                    score={stat.avgScore}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          )}

          {bestWeekendDay && (
            <div className="space-y-2">
              <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium tracking-wide uppercase">
                <Sunset className="h-3 w-3" aria-hidden="true" />
                {t('bestWeekendDayTitle')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <DayChip
                  dayIndex={bestWeekendDay.dayOfWeek}
                  score={bestWeekendDay.avgCrowdScore}
                  locale={locale}
                />
              </div>
            </div>
          )}
        </CardContent>
      </GlassCard>
    );
  }

  return (
    <section aria-labelledby="best-days-heading" className="mt-8 space-y-4">
      {/* Header and the three cards are ONE box, the way „Monat für Monat" and its month
        stepper are: the band squares off its bottom, the card underneath drops its top border
        and radius, and the chapter reads as one object instead of a lid resting on a gap of
        park photograph. */}
      <div>
        <ParkBestDaysHeader
          parkName={parkName}
          parkSlug={parkSlug}
          articleDe={articleDe}
          locale={locale}
          showCalendarLink={showCalendarLink}
          className="mb-0 rounded-b-none"
        />

        {/* Columns with hairline rules, not three cards in a row — the same shape „Heute im
          Park" uses one box up the page, and for the same reason: these are three readings of
          one thing, and a card around each of them says they are three separate objects. Shared
          machinery in `park-panel-cell.tsx` so the rules, the padding and the caption cannot
          drift between the two panels.

          The count is computed: a park with no quiet weekday and no quiet weekend day renders one
          column, and a fixed `lg:grid-cols-3` would leave two empty tracks inside the border. */}
        <div
          className={cn(
            TILE_GLASS,
            'border-border/50 overflow-hidden rounded-b-xl border border-t-0'
          )}
        >
          {/* The month's own sentences, as the top row of this same box.
            They were a separate floating card directly above, which put two answers to one
            question — „wann ist es leer" — in two objects with a strip of park photograph
            between them. Inside the border they read as what they are: the prose version of the
            three readings underneath. */}
          {intro ? <div className="border-border/50 border-b p-4 md:p-5">{intro}</div> : null}

          <PanelGrid columnCount={1 + (hasBestDays ? 1 : 0) + (bestWeekendDay ? 1 : 0)}>
            {hasBestDays && (
              <div className={PANEL_CELL}>
                <PanelMetric caption={t('quietestDaysTitle')} icon={TrendingDown}>
                  <div className="flex flex-wrap gap-2">
                    {bestDaysOfWeek.map((stat) => (
                      <DayChip
                        key={stat.dayIndex}
                        dayIndex={stat.dayIndex}
                        score={stat.avgScore}
                        locale={locale}
                      />
                    ))}
                  </div>
                </PanelMetric>
              </div>
            )}

            {bestWeekendDay && (
              <div className={PANEL_CELL}>
                <PanelMetric caption={t('bestWeekendDayTitle')} icon={Sunset}>
                  <div className="flex flex-wrap gap-2">
                    <DayChip
                      dayIndex={bestWeekendDay.dayOfWeek}
                      score={bestWeekendDay.avgCrowdScore}
                      locale={locale}
                    />
                  </div>
                </PanelMetric>
              </div>
            )}

            <div className={PANEL_CELL}>
              <PanelMetric caption={t('upcomingQuietTitle')} icon={CalendarDays}>
                {hasUpcoming ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.upcomingQuietDays.map((day) => {
                      const [y, m, d] = day.date.split('-').map(Number);
                      const date = new Date(y, m - 1, d);
                      const label = getDateTimeFormat(locale, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })
                        .format(date)
                        .replace(/\.$/, '');
                      // Loose lookup: crowdLevel can be 'closed'/'unknown', which carry no chip color.
                      const chipClass = (CROWD_CHIP_CLASS as Record<string, string>)[
                        day.crowdLevel
                      ];
                      return (
                        <span
                          key={day.date}
                          className={cn(
                            'inline-flex items-center rounded-md px-3 py-1 text-sm font-medium',
                            chipClass ??
                              'bg-muted/20 text-muted-foreground border border-transparent'
                          )}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t('noUpcomingQuiet')}</p>
                )}
              </PanelMetric>
            </div>
          </PanelGrid>
        </div>
      </div>

      {analysis.schoolHolidaysAreBusy && (
        <div className="relative overflow-hidden rounded-lg border border-yellow-500/30 text-sm text-yellow-700 dark:text-yellow-400">
          {/* Frosted surface + semantic tint so the warning stays legible over the hero. */}
          <div
            className="bg-background/85 pointer-events-none absolute inset-0 rounded-lg backdrop-blur-md"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/15"
            aria-hidden="true"
          />
          <div className="relative flex items-start gap-2 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{t('schoolHolidayWarning', parkArgs(locale as Locale, displayName, articleDe))}</p>
          </div>
        </div>
      )}
    </section>
  );
}
