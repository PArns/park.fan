'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, TrendingDown, AlertTriangle, Sunset, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMounted } from '@/lib/hooks/use-mounted';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/common/glass-card';
import { CrowdCalendarFaqLink } from '@/components/faq/crowd-calendar-faq-link';
import type { IntegratedCalendarResponse } from '@/lib/api/types';
import type { BestDaysByDayOfWeek, BestDaysSnapshot } from '@/lib/api/integrated-calendar';
import { analyzeBestDays, scoreToCrowdLevel } from '@/lib/utils/crowd-analysis';
import { CROWD_CHIP_CLASS } from '@/lib/utils/crowd-level-styles';
import { getGermanArticle } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { useParkHistoricalStats } from '@/lib/hooks/use-park-historical-stats';
import { ParkBestDaysSectionSkeleton } from '@/components/parks/park-best-days-section-skeleton';

interface ParkBestDaysSectionProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Park timezone — used for the empty-calendar fallback meta while data loads/fails. */
  timezone: string;
  hasOperatingSchedule: boolean;
  parkName: string;
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
}

function getDayShort(dayIndex: number, locale: string): string {
  const refMonday = new Date(2025, 0, 6);
  const date = new Date(refMonday);
  date.setDate(refMonday.getDate() + ((dayIndex - 1 + 7) % 7));
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace(/\.$/, '');
}

function localizedParkName(parkName: string, parkSlug: string, locale: string): string {
  if (locale !== 'de') return parkName;
  const nominative = getGermanArticle(parkName, parkSlug);
  const accusative = nominative === 'der' ? 'den' : nominative;
  return accusative ? `${accusative} ${parkName}` : parkName;
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
  locale,
  compact = false,
  showCalendarLink = false,
  className,
  initialCalendar,
  seedNowMs,
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
          calendarData={initialCalendar}
          statsByDayOfWeek={initialCalendar.byDayOfWeek}
          nowMs={seedNowMs}
          parkName={parkName}
          parkSlug={parkSlug}
          locale={locale}
          compact={compact}
          showCalendarLink={showCalendarLink}
          className={className}
        />
      );
    }
    return compact ? null : <ParkBestDaysSectionSkeleton />;
  }

  // Graceful empty fallback when the calendar fetch failed (mirrors loadBestDaysCalendar).
  const resolvedCalendar: IntegratedCalendarResponse = calendarData ?? {
    meta: { slug: parkSlug, timezone, hasOperatingSchedule },
    days: [],
  };

  return (
    <BestDaysContent
      calendarData={resolvedCalendar}
      statsByDayOfWeek={stats?.byDayOfWeek}
      parkName={parkName}
      parkSlug={parkSlug}
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
  locale: string;
  compact?: boolean;
  showCalendarLink?: boolean;
  className?: string;
}

function BestDaysContent({
  calendarData,
  statsByDayOfWeek,
  nowMs: nowMsProp,
  parkName,
  parkSlug,
  locale,
  compact = false,
  showCalendarLink = false,
  className,
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
      <div className="bg-background/70 rounded-xl px-4 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-primary h-5 w-5" aria-hidden="true" />
              <h2 id="best-days-heading" className="text-xl font-semibold">
                {t('title', { park: displayName })}
              </h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
          </div>
          {showCalendarLink && (
            <CrowdCalendarFaqLink className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium no-underline transition-colors">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {t('viewCalendarLink')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </CrowdCalendarFaqLink>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hasBestDays && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4" />
                {t('quietestDaysTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {bestWeekendDay && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sunset className="h-4 w-4" />
                {t('bestWeekendDayTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <DayChip
                  dayIndex={bestWeekendDay.dayOfWeek}
                  score={bestWeekendDay.avgCrowdScore}
                  locale={locale}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              {t('upcomingQuietTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasUpcoming ? (
              <div className="flex flex-wrap gap-2">
                {analysis.upcomingQuietDays.map((day) => {
                  const [y, m, d] = day.date.split('-').map(Number);
                  const date = new Date(y, m - 1, d);
                  const label = new Intl.DateTimeFormat(locale, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })
                    .format(date)
                    .replace(/\.$/, '');
                  // Loose lookup: crowdLevel can be 'closed'/'unknown', which carry no chip color.
                  const chipClass = (CROWD_CHIP_CLASS as Record<string, string>)[day.crowdLevel];
                  return (
                    <span
                      key={day.date}
                      className={cn(
                        'inline-flex items-center rounded-md px-3 py-1 text-sm font-medium',
                        chipClass ?? 'bg-muted/20 text-muted-foreground border border-transparent'
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
          </CardContent>
        </Card>
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
            <p>{t('schoolHolidayWarning', { park: displayName })}</p>
          </div>
        </div>
      )}
    </section>
  );
}
