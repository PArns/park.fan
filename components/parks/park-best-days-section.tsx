'use client';

import { useState } from 'react';
import { CalendarDays, TrendingDown, AlertTriangle, Sunset } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMounted, useBrowserNow } from '@/lib/hooks/use-mounted';
import { getCalendarWindow } from '@/lib/hooks/use-calendar-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/common/glass-card';
import type { IntegratedCalendarResponse, CrowdLevel, DayOfWeekStat } from '@/lib/api/types';
import { analyzeBestDays } from '@/lib/utils/crowd-analysis';
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
  className?: string;
}

function scoreToCrowdLevel(score: number): CrowdLevel {
  if (score <= 1.5) return 'very_low';
  if (score <= 2.5) return 'low';
  if (score <= 3.5) return 'moderate';
  if (score <= 4.5) return 'high';
  if (score <= 5.5) return 'very_high';
  return 'extreme';
}

const CROWD_CHIP: Record<string, string> = {
  very_low: 'bg-crowd-very-low/20 text-crowd-very-low border border-crowd-very-low/30',
  low: 'bg-crowd-low/20 text-crowd-low border border-crowd-low/30',
  moderate: 'bg-crowd-moderate/20 text-crowd-moderate border border-crowd-moderate/30',
  high: 'bg-crowd-high/20 text-crowd-high border border-crowd-high/30',
  very_high: 'bg-crowd-very-high/20 text-crowd-very-high border border-crowd-very-high/30',
  extreme: 'bg-crowd-extreme/20 text-crowd-extreme border border-crowd-extreme/30',
};

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
        CROWD_CHIP[level]
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
  className,
}: ParkBestDaysSectionProps) {
  // Both queries are browser-only (disabled during SSR). Gate the content render on `mounted`
  // so the static prerender (and first paint) shows the skeleton instead of reaching the
  // clock-reading content below — reading Date.now() inside a Client Component during the
  // prerender is forbidden under Cache Components.
  const mounted = useMounted();
  // Calendar window derived from the browser clock (client-only) so the park shell never reads
  // the server clock — keeping it time-independent for the 1-day TTL.
  const { from, to } = getCalendarWindow(useBrowserNow(null));
  // `isPending` (not `isLoading`): both queries start DISABLED — until mounted/the calendar
  // window is known, and until useLoadLast releases them (best-travel-time loads last, see
  // the hooks). A disabled query is pending but not fetching, so `isLoading` would be false
  // and the section would flash its empty fallback during the defer window.
  const { data: calendarData, isPending: calendarPending } = useParkBestDaysCalendar({
    continent,
    country,
    city,
    parkSlug,
    from,
    to,
  });
  const { data: stats, isPending: statsPending } = useParkHistoricalStats({
    continent,
    country,
    city,
    parkSlug,
  });

  // The compact header card has no skeleton placeholder; render nothing until data arrives.
  if (!mounted || calendarPending || statsPending) {
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
      className={className}
    />
  );
}

interface BestDaysContentProps {
  calendarData: IntegratedCalendarResponse;
  statsByDayOfWeek?: DayOfWeekStat[];
  parkName: string;
  parkSlug: string;
  locale: string;
  compact?: boolean;
  className?: string;
}

function BestDaysContent({
  calendarData,
  statsByDayOfWeek,
  parkName,
  parkSlug,
  locale,
  compact = false,
  className,
}: BestDaysContentProps) {
  const t = useTranslations('parks.bestDays');
  // Capture "now" once at mount (lazy init) — analyzeBestDays only needs day-granular precision,
  // and calling Date.now() directly during render is a purity violation.
  const [nowMs] = useState(() => Date.now());
  const analysis = analyzeBestDays(calendarData.days, nowMs, calendarData.meta.timezone);

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
        <div className="flex items-center gap-2">
          <CalendarDays className="text-primary h-5 w-5" aria-hidden="true" />
          <h2 id="best-days-heading" className="text-xl font-semibold">
            {t('title', { park: displayName })}
          </h2>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
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
                  const level = day.crowdLevel as CrowdLevel;
                  return (
                    <span
                      key={day.date}
                      className={cn(
                        'inline-flex items-center rounded-md px-3 py-1 text-sm font-medium',
                        CROWD_CHIP[level] ??
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
          </CardContent>
        </Card>
      </div>

      {analysis.schoolHolidaysAreBusy && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{t('schoolHolidayWarning', { park: displayName })}</p>
        </div>
      )}
    </section>
  );
}
