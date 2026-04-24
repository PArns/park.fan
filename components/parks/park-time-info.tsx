'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Clock, Calendar, DoorOpen, Snowflake, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import type { ParkStatus } from '@/lib/api/types';
import { ParkTimeRange } from '@/components/common/park-time';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import type { ScheduleItem, NextScheduleItem, InfluencingHoliday } from '@/lib/api/types';

interface ParkTimeInfoProps {
  timezone: string;
  todaySchedule?: ScheduleItem | null;
  nextSchedule?: NextScheduleItem | null;
  status?: ParkStatus | null;
  hasOperatingSchedule?: boolean;
  className?: string;
}

/**
 * Client component that displays:
 * 1. Current time in the park's timezone (live updating)
 * 2. Opening hours for today
 * 3. "Opens in" / "Closes in" messages
 */
export function ParkTimeInfo({
  timezone,
  todaySchedule,
  nextSchedule,
  status,
  hasOperatingSchedule = true,
  className,
}: ParkTimeInfoProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const tNearby = useTranslations('nearby');
  const locale = useLocale();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Update current time every minute
  useEffect(() => {
    // Avoid hydration mismatch by setting time after mount
    const initialTimer = setTimeout(() => {
      setCurrentTime(new Date());
    }, 0);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  // Format current time in park timezone
  const formatCurrentTime = () => {
    if (!currentTime) return '—';
    try {
      return currentTime.toLocaleTimeString(locale, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  // Calculate time until opening/closing
  const getTimeUntilMessage = (): {
    message: string;
    variant: 'opening' | 'closing' | null;
  } | null => {
    if (!todaySchedule || todaySchedule.scheduleType !== 'OPERATING') {
      return null;
    }

    const { openingTime, closingTime } = todaySchedule;
    if (!openingTime || !closingTime) return null;

    const now = new Date();
    const opening = new Date(openingTime);
    const closing = new Date(closingTime);

    // Guard: opening must be today in the park's timezone (not tomorrow's schedule entry)
    const openingDateInParkTz = opening.toLocaleDateString('en-CA', { timeZone: timezone });
    const todayInParkTz = now.toLocaleDateString('en-CA', { timeZone: timezone });
    if (openingDateInParkTz !== todayInParkTz) return null;

    // If park hasn't opened yet
    if (now < opening) {
      const diffMs = opening.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0 && minutes > 0) {
        return {
          message: `${t('opensIn')} ${hours} ${tCommon('hour', { count: hours })} ${minutes} ${tCommon('minute', { count: minutes })}`,
          variant: 'opening',
        };
      } else if (hours > 0) {
        return {
          message: `${t('opensIn')} ${hours} ${tCommon('hour', { count: hours })}`,
          variant: 'opening',
        };
      } else {
        return {
          message: `${t('opensIn')} ${minutes} ${tCommon('minute', { count: minutes })}`,
          variant: 'opening',
        };
      }
    }

    // If park is open and will close soon
    if (now >= opening && now < closing) {
      const diffMs = closing.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0 && minutes > 0) {
        return {
          message: `${t('closesIn')} ${hours} ${tCommon('hour', { count: hours })} ${minutes} ${tCommon('minute', { count: minutes })}`,
          variant: 'closing',
        };
      } else if (hours > 0) {
        return {
          message: `${t('closesIn')} ${hours} ${tCommon('hour', { count: hours })}`,
          variant: 'closing',
        };
      } else {
        return {
          message: `${t('closesIn')} ${minutes} ${tCommon('minute', { count: minutes })}`,
          variant: 'closing',
        };
      }
    }

    return null;
  };

  const timeUntil = getTimeUntilMessage();

  // Format opening/closing times

  // Don't show the card if park is not operating today or no schedule data,
  // UNLESS we have a nextSchedule to show (OffSeason case) or we are in UNKNOWN state
  const isOperatingToday = todaySchedule && todaySchedule.scheduleType === 'OPERATING';
  const isUnknown = status === 'UNKNOWN' || (!isOperatingToday && !hasOperatingSchedule);

  if (!isOperatingToday && !isUnknown) {
    // API may send nextSchedule with only openingTime/closingTime (no date)
    const nextOpeningRaw = nextSchedule?.date ?? nextSchedule?.openingTime;
    if (!nextOpeningRaw || !hasOperatingSchedule) return null;

    const nextOpening = new Date(nextOpeningRaw);
    if (Number.isNaN(nextOpening.getTime())) return null;

    const now = new Date();
    const dayDiff = Math.ceil((nextOpening.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = dayDiff / 7;

    const dateFormatted = nextOpening.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      timeZone: timezone,
    });

    // If > 7 days – same icon/logic as nearby cards (offseason)
    if (totalWeeks >= 1) {
      const weeks = Math.ceil(totalWeeks);
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
                ({t('opensOn')} {dateFormatted} - {tCommon('in')} {weeks}{' '}
                {tNearby('week', { count: weeks })})
              </span>
            </div>
          </CardContent>
        </Card>
      );
    } else {
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
                {t('opensOn')} {dateFormatted}
              </span>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          {isUnknown ? t('schedule') : t('todaySchedule')}
          {status && <ParkStatusBadge status={status} className="ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Opening Hours with Countdown FIRST */}
        {!isUnknown && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">{t('openingHours')}</span>
              {todaySchedule?.openingTime && todaySchedule?.closingTime ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-semibold">
                    <ParkTimeRange
                      openingTime={todaySchedule.openingTime}
                      closingTime={todaySchedule.closingTime}
                      parkTimezone={timezone}
                      locale={locale}
                      showSuffix
                    />
                  </span>
                  {todaySchedule.isInferred && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground/60 h-3.5 w-3.5 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tNearby('estimatedHours')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ) : (
                <span className="text-lg font-semibold tabular-nums">—</span>
              )}
            </div>
            {/* Inline Countdown Badge */}
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

        {/* Current Time - Below opening hours */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">{t('currentTime')}</span>
          <div className="flex items-center gap-1.5">
            <Clock className="text-primary h-4 w-4" />
            <time
              dateTime={currentTime?.toISOString() ?? ''}
              className="text-lg font-bold tabular-nums"
              suppressHydrationWarning
            >
              {formatCurrentTime()}
            </time>
          </div>
        </div>

        {/* Holiday/Bridge Day/School Vacation Badges */}
        {(todaySchedule?.isHoliday ||
          todaySchedule?.isBridgeDay ||
          todaySchedule?.isSchoolVacation ||
          todaySchedule?.influencingHolidays) &&
          (() => {
            const shownNames = new Set<string>();
            const publicHolidayName = todaySchedule.isHoliday ? todaySchedule.holidayName : null;
            if (publicHolidayName) shownNames.add(publicHolidayName.toLowerCase());
            const uniqueInfluencing = (todaySchedule.influencingHolidays ?? []).filter(
              (h: InfluencingHoliday) => {
                const key = h.name.toLowerCase();
                if (shownNames.has(key)) return false;
                shownNames.add(key);
                return true;
              }
            );
            return (
              <div className="flex flex-wrap gap-2">
                {publicHolidayName && (
                  <Badge
                    variant="outline"
                    className="border-orange-300 bg-orange-50 text-xs dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300"
                  >
                    🎉 {publicHolidayName}
                  </Badge>
                )}
                {todaySchedule.isBridgeDay && (
                  <Badge
                    variant="outline"
                    className="border-blue-300 bg-blue-50 text-xs dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                  >
                    🌉 {t('bridgeDay')}
                  </Badge>
                )}
                {todaySchedule.isSchoolVacation && (
                  <Badge
                    variant="outline"
                    className="border-yellow-300 bg-yellow-50 text-xs dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300"
                  >
                    🎒 {t('schoolVacation')}
                  </Badge>
                )}
                {uniqueInfluencing.slice(0, 2).map((holiday: InfluencingHoliday) => (
                  <Badge
                    key={holiday.name}
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-xs dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                  >
                    🎄 {holiday.name}
                  </Badge>
                ))}
              </div>
            );
          })()}
      </CardContent>
    </Card>
  );
}
