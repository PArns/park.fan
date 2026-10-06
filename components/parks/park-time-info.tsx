'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Clock, Calendar, DoorOpen, Snowflake, Info, Luggage } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import {
  HolidayChip,
  NEIGHBOUR_CHIP_TONE,
  localHolidayChips,
  neighbourRegions,
} from '@/components/parks/park-holiday-row';
import { useTodaySchedule } from '@/lib/hooks/use-today-schedule';
import { ParkTimeRange } from '@/components/common/park-time';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import type { NextScheduleItem, ParkStatus, ScheduleItem } from '@/lib/api/types';

interface ParkTimeInfoProps {
  timezone: string;
  /** Full park schedule (day-stable, lives in the static shell). Today's entry is picked
   *  CLIENT-side from the browser clock + park timezone, so the shell stays time-independent. */
  schedule?: ScheduleItem[] | null;
  nextSchedule?: NextScheduleItem | null;
  status?: ParkStatus | null;
  hasOperatingSchedule?: boolean;
  /**
   * Geo-routing params. When provided, the card subscribes to the live park query (shared key with
   * LiveParkData, so no extra fetch) instead of showing the up-to-a-day-old server snapshot. The
   * demo showcases omit them and keep the static props.
   */
  continent?: string;
  country?: string;
  city?: string;
  parkSlug?: string;
  className?: string;
}

/** Neighbouring regions shown in the card before the rest is summed up as "+n". */
const MAX_NEIGHBOURS = 2;

/**
 * The park's clock, today's opening hours with an opens-in or closes-in countdown, and today's
 * holidays with the park page's holiday chips. Every value comes from `useTodaySchedule`, the hook
 * `ParkTodayPanel` reads; without geo params its live query stays off, so the guide page and the UI
 * showcase render from fixtures.
 */
export function ParkTimeInfo({
  timezone,
  schedule,
  nextSchedule,
  status,
  hasOperatingSchedule = true,
  continent,
  country,
  city,
  parkSlug,
  className,
}: ParkTimeInfoProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const tNearby = useTranslations('nearby');
  const locale = useLocale();

  const sched = useTodaySchedule({
    timezone,
    schedule,
    nextSchedule,
    status,
    hasOperatingSchedule,
    continent,
    country,
    city,
    parkSlug,
  });
  const { isOperatingToday, isUnknown, timeUntil, holiday } = sched;

  if (!isOperatingToday && !isUnknown) {
    // Not operating today: the reopening date, once the clock has mounted (the hook answers null
    // before that, and when no reopening is known).
    const offseason = sched.offseason;
    if (!offseason) return null;

    // A week or more away – same icon/logic as nearby cards (offseason)
    if (offseason.weeks !== null) {
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {t('schedule')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-amber-500">
              <Snowflake className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">
                <GlossaryTermLink
                  termId="offseason"
                  className="cursor-help border-b border-dashed border-current/40 font-[inherit]"
                >
                  {t('offseason')}
                </GlossaryTermLink>{' '}
                ({t('opensOn')} {offseason.dateFormatted} - {tCommon('in')} {offseason.weeks}{' '}
                {tNearby('week', { count: offseason.weeks })})
              </span>
            </div>
          </CardContent>
        </Card>
      );
    }
    // < 1 week, but not today – same icon as nearby (opening)
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            {t('schedule')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1.5">
            <DoorOpen className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span className="font-medium">
              {t('opensOn')} {offseason.dateFormatted}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const localChips = localHolidayChips(holiday, locale, t('bridgeDay'));
  const neighbours = neighbourRegions(holiday, locale);
  const shownNeighbours = neighbours.slice(0, MAX_NEIGHBOURS);
  const neighbourOverflow = neighbours.length - shownNeighbours.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          {isUnknown ? t('schedule') : t('todaySchedule')}
          {sched.showStatusBadge && sched.badgeStatus && (
            <ParkStatusBadge status={sched.badgeStatus} className="ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isUnknown && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">{t('openingHours')}</span>
              {sched.openingTime && sched.closingTime ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-semibold">
                    <ParkTimeRange
                      openingTime={sched.openingTime}
                      closingTime={sched.closingTime}
                      parkTimezone={timezone}
                      locale={locale}
                      showSuffix
                    />
                  </span>
                  {sched.isInferredHours && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground/60 h-3.5 w-3.5 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('calendarView.details.schedule.estimatedHours')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ) : (
                <span className="text-lg font-semibold tabular-nums">—</span>
              )}
            </div>
            {timeUntil && (
              <div className="flex items-center justify-end overflow-hidden">
                <Badge
                  variant={timeUntil.variant === 'opening' ? 'default' : 'secondary'}
                  className="max-w-full text-xs font-medium"
                >
                  <span className="min-w-0 truncate">{timeUntil.message}</span>
                </Badge>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">{t('currentTime')}</span>
          <div className="flex items-center gap-1.5">
            <Clock className="text-primary h-4 w-4" />
            <time
              dateTime={sched.currentTime?.toISOString() ?? ''}
              className="text-lg font-bold tabular-nums"
              suppressHydrationWarning
            >
              {sched.currentTimeFormatted}
            </time>
          </div>
        </div>

        {timezone && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">{t('timezone')}</span>
            <span className="font-mono text-sm font-medium">{timezone}</span>
          </div>
        )}

        {localChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {localChips.map((chip) => (
              <HolidayChip key={chip.key} icon={chip.icon} tone={chip.tone}>
                {chip.label}
              </HolidayChip>
            ))}
          </div>
        )}
        {shownNeighbours.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <Luggage
                className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              {t('influencingHolidaysShort')}
            </span>
            {shownNeighbours.map((r) => (
              <HolidayChip key={r.label} icon={r.flag} tone={NEIGHBOUR_CHIP_TONE}>
                {r.label}
              </HolidayChip>
            ))}
            {neighbourOverflow > 0 && (
              <span className="text-muted-foreground text-xs font-medium">
                +{neighbourOverflow}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
