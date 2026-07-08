'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Clock, DoorOpen, Sparkles, Users } from 'lucide-react';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { getCalendarWindow } from '@/lib/hooks/use-calendar-window';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { useTodaySchedule } from '@/lib/hooks/use-today-schedule';
import { ParkStatusBadge } from './park-status-badge';
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
      <div className="flex min-h-[1.75rem] flex-col items-start justify-center gap-1">{children}</div>
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
  const avgWait =
    park.analytics?.statistics?.avgWaitTime ?? park.currentLoad?.currentWaitTime ?? 0;
  // Show live crowd only when the park is (or might be) open; hide it when clearly closed/offseason.
  const isOpenish = sched.badgeStatus === 'OPERATING' || sched.isUnknown;

  const { from, to } = getCalendarWindow(useBrowserNow(null));
  const { data: calendar } = useParkBestDaysCalendar({ continent, country, city, parkSlug, from, to });
  const predictedToday = useMemo(
    () => calendar?.days.find((d) => d.isToday)?.crowdLevel ?? null,
    [calendar]
  );

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
        ...sched.holiday.influencing.slice(0, 2).map((h) => (
          <Badge
            key={h.name}
            variant="outline"
            className="border-amber-300 bg-amber-50 text-xs dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
          >
            🎄 {h.name}
          </Badge>
        )),
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
              <Clock className="h-3 w-3" aria-hidden="true" />Ø&nbsp;{avgWait}&nbsp;min
            </span>
          )}
        </Cell>

        {/* AI crowd forecast for today — the differentiator */}
        <Cell caption={t('forecastToday')} icon={Sparkles}>
          {calendar ? (
            predictedToday ? (
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
    </div>
  );
}
