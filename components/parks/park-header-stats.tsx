'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronRight, Clock, DoorOpen, Sparkles, Users } from 'lucide-react';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { useCalendarData } from '@/lib/hooks/use-calendar-data';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { useTodaySchedule } from '@/lib/hooks/use-today-schedule';
import { ParkStatusBadge } from './park-status-badge';
import { ParkCalendarDayDetail } from './park-calendar-day-detail';
import { CrowdLevelBadge } from './crowd-level-badge';
import { ParkTimeRange } from '@/components/common/park-time';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

interface ParkHeaderStatsProps {
  initialData: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * One column of the stats band: a small uppercase caption + its value stack. No background or box
 * of its own — on desktop the columns are separated by a thin left rule; on mobile they sit in a
 * 2-col grid with whitespace. The band is part of the header card, not a card inside it.
 */
function Cell({
  caption,
  icon: Icon,
  children,
}: {
  caption: string;
  icon?: typeof Clock;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border/50 flex flex-col gap-1.5 md:border-l md:pl-4 md:first:border-l-0 md:first:pl-0">
      <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
        {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
        {caption}
      </span>
      {/* justify-start (not -center) so the primary value (badge/time) sits at the SAME top
          line across all cells — cells with a second line (Ø wait, countdown) grow downward
          instead of pushing their badge up and out of alignment with single-line cells. */}
      <div className="flex min-h-[1.75rem] flex-col items-start justify-start gap-1">
        {children}
      </div>
    </div>
  );
}

/** Subtle pill placeholder while a live/forecast value is still loading. */
function Pending() {
  return <span className="bg-muted-foreground/20 h-5 w-20 animate-pulse rounded-full" />;
}

/**
 * "Heute" stats band in the park header — the single at-a-glance summary of today: live status +
 * park-local time, today's opening hours + "closes in X" countdown, the current crowd + average
 * wait, and — the differentiator — the **AI crowd forecast for today**. Rendered as an integrated
 * band (a top hairline + column rules), NOT a nested card, so it reads as part of the header.
 * Replaces the separate "Heutige Öffnungszeiten" card that used to sit below (no duplication).
 *
 * Caching: schedule/status come from `useTodaySchedule`, which shares the live park query key with
 * <LiveParkData> (one 5-min poll, no extra fetch); the forecast reuses <ParkBestDaysSection>'s
 * calendar query key (same {from,to}) so both read ONE cached request, still `useLoadLast`-gated so
 * the forecast loads last. The 90-day "today" scan is memoised against the calendar.
 */
export function ParkHeaderStats({
  initialData,
  continent,
  country,
  city,
  parkSlug,
}: ParkHeaderStatsProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const timezone = initialData.timezone ?? 'UTC';

  const sched = useTodaySchedule({
    timezone,
    schedule: initialData.schedule,
    nextSchedule: initialData.nextSchedule,
    status: initialData.status,
    hasOperatingSchedule: initialData.hasOperatingSchedule,
    continent,
    country,
    city,
    parkSlug,
  });

  // Crowd/wait live in currentLoad (live) or analytics.statistics (mirrors park-status.tsx).
  const park = sched.livePark ?? initialData;
  const currentCrowd =
    park.analytics?.statistics?.crowdLevel ?? park.currentLoad?.crowdLevel ?? null;
  const avgWait = park.analytics?.statistics?.avgWaitTime ?? park.currentLoad?.currentWaitTime ?? 0;
  // Show live crowd only when the park is (or might be) open; hide it when clearly closed/offseason.
  const isOpenish = sched.badgeStatus === 'OPERATING' || sched.isUnknown;

  const browserNow = useBrowserNow(null);
  const { data: calendar } = useParkBestDaysCalendar({
    continent,
    country,
    city,
    parkSlug,
  });
  // "Today" is derived from the browser clock in the park tz — the `/best-days` snapshot
  // deliberately carries no `isToday` flag (a baked flag goes stale in the CDN cache).
  const todayStr = useMemo(
    () => (browserNow ? browserNow.toLocaleDateString('en-CA', { timeZone: timezone }) : null),
    [browserNow, timezone]
  );

  // "Prognose heute" = the ML FORECAST for today (predicted peak), NOT the live level:
  // the calendar's today `crowdLevel` is overridden with real-time occupancy, so we read
  // the separate `predictedCrowdLevel`. Fall back to crowdLevel only on older API builds /
  // unratable days (no regression), and never surface a "closed" sentinel as a forecast.
  const predictedToday = useMemo(() => {
    if (!calendar || !todayStr) return null;
    const today = calendar.days.find((d) => d.date === todayStr);
    const level = today?.predictedCrowdLevel ?? today?.crowdLevel ?? null;
    return level === 'closed' ? null : level;
  }, [calendar, todayStr]);

  // Click-to-open detail for the forecast cell: the SAME day-detail dialog the crowd calendar
  // opens for today (status & hours, live vs. forecast split, headliner waits, hourly chart,
  // weather, holiday context). Needs the FULL CalendarDay, which the lean `/best-days` snapshot
  // doesn't carry — so fetch just today from `/calendar`. Same query key + staleTime as the
  // calendar grid's today-patch (one shared cached request), and deferred via `useLoadLast` so
  // it never competes with the live/weather queries (loads-last rule).
  const [todayDetailOpen, setTodayDetailOpen] = useState(false);
  const releasedLast = useLoadLast();
  const { data: todayCalendar } = useCalendarData({
    continent,
    country,
    city,
    parkSlug,
    from: todayStr ?? '',
    to: todayStr ?? '',
    enabled: !!todayStr && releasedLast,
  });
  const todayDay = todayStr ? (todayCalendar?.days.find((d) => d.date === todayStr) ?? null) : null;

  const holidayBadges = sched.holiday
    ? [
        sched.holiday.publicHolidayName && (
          <Badge
            key="public"
            variant="outline"
            className="border-orange-300 bg-orange-50 text-xs dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300"
          >
            🎉 {sched.holiday.publicHolidayName}
          </Badge>
        ),
        sched.holiday.isBridgeDay && (
          <Badge
            key="bridge"
            variant="outline"
            className="border-blue-300 bg-blue-50 text-xs dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
          >
            🌉 {t('bridgeDay')}
          </Badge>
        ),
        sched.holiday.isSchoolVacation && (
          <Badge
            key="vacation"
            variant="outline"
            className="border-yellow-300 bg-yellow-50 text-xs dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300"
          >
            🎒 {t('schoolVacation')}
          </Badge>
        ),
        // NOTE: neighbouring-region school breaks (holiday.influencing) are NOT shown here anymore —
        // the richer <HeaderHolidayPanel> owns that story at every breakpoint (right column on lg+,
        // full-width below the intro on mobile/tablet), so a duplicate badge in this band would be
        // redundant.
      ].filter(Boolean)
    : [];

  return (
    <div className="border-border/50 mt-5 max-w-3xl border-t pt-4">
      <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-4 md:gap-x-0">
        {/* Status + park-local time */}
        <Cell caption={t('statusLabel')}>
          {sched.showStatusBadge && sched.badgeStatus ? (
            <ParkStatusBadge status={sched.badgeStatus} />
          ) : (
            <Pending />
          )}
          {sched.currentTime && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {sched.currentTimeFormatted}
              {tCommon('timeSuffix')} · {t('localTime')}
            </span>
          )}
        </Cell>

        {/* Today's opening hours + countdown */}
        <Cell caption={t('openingHours')} icon={DoorOpen}>
          {sched.isOperatingToday && sched.openingTime && sched.closingTime ? (
            <>
              <span className="text-foreground text-sm font-semibold">
                <ParkTimeRange
                  openingTime={sched.openingTime}
                  closingTime={sched.closingTime}
                  parkTimezone={timezone}
                  locale={locale}
                  showSuffix
                />
              </span>
              {sched.timeUntil && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    sched.timeUntil.variant === 'opening'
                      ? 'text-primary'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {sched.timeUntil.message}
                </span>
              )}
            </>
          ) : sched.offseason ? (
            <span className="text-foreground text-sm font-medium">{sched.offseason.message}</span>
          ) : (
            <span className="text-muted-foreground text-sm">{t('status.CLOSED')}</span>
          )}
        </Cell>

        {/* Current crowd + average wait */}
        <Cell caption={t('crowdNow')} icon={Users}>
          {isOpenish && currentCrowd ? (
            <CrowdLevelBadge level={currentCrowd} />
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
          {isOpenish && avgWait > 0 && (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
              <Clock className="h-3 w-3" aria-hidden="true" />
              Ø&nbsp;{avgWait}&nbsp;min
            </span>
          )}
        </Cell>

        {/* AI crowd forecast for today — the differentiator. Once today's full CalendarDay is
            loaded the value becomes a button (chevron = affordance) opening the same day-detail
            dialog a click on today in the crowd calendar opens; until then it renders static. */}
        <Cell caption={t('forecastToday')} icon={Sparkles}>
          {calendar ? (
            todayDay ? (
              <button
                type="button"
                onClick={() => setTodayDetailOpen(true)}
                title={t('dayDetail.openToday')}
                aria-label={t('dayDetail.openToday')}
                aria-haspopup="dialog"
                className="group hover:bg-muted/60 focus-visible:ring-primary -m-1 flex cursor-pointer items-center gap-0.5 rounded-lg p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {predictedToday ? (
                  <CrowdLevelBadge level={predictedToday} />
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
                <ChevronRight
                  className="text-muted-foreground h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            ) : predictedToday ? (
              <CrowdLevelBadge level={predictedToday} />
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )
          ) : (
            <Pending />
          )}
        </Cell>
      </div>

      {/* Holiday / bridge-day / school-vacation context — explains today's crowds */}
      {holidayBadges.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{holidayBadges}</div>}

      {/* Day-detail dialog for today — the exact component the crowd calendar uses for a
          day click, fed with the same /calendar data (shared query), so header and calendar
          always tell the same story. */}
      <ParkCalendarDayDetail
        day={todayDay}
        open={todayDetailOpen}
        onOpenChange={setTodayDetailOpen}
      />
    </div>
  );
}
