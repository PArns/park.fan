'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocalTimeRange } from '@/components/ui/local-time';
import type { ScheduleItem, InfluencingHoliday } from '@/lib/api/types';

interface ParkTimeInfoProps {
  timezone: string;
  todaySchedule?: ScheduleItem | null;
  nextSchedule?: ScheduleItem | null;
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
  className,
}: ParkTimeInfoProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
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
  // UNLESS we have a nextSchedule to show (OffSeason case)
  const isOperatingToday = todaySchedule && todaySchedule.scheduleType === 'OPERATING';

  if (!isOperatingToday) {
    if (!nextSchedule) return null;

    // OffSeason Logic
    const nextOpening = new Date(nextSchedule.date);
    const now = new Date(); // This should ideally be timezone aware or strictly relative, but for days diff native Date is often used in this app context.
    // However, the previous logic in park-card-nearby used specific math.
    // Let's use a simpler heuristic or replicate logic if needed.
    // For now, let's assume we show it if we have nextSchedule.

    // We need to calculate if it is > 7 days to show the special "OffSeason (Opens...)" message
    // Or just show "Opens [Date]" if < 7 days?
    // The user said: "If the park opens today or tomorrow, show as is. Otherwise like in park card".

    // Let's replicate the logic for > 7 days vs < 7 days from park-card-nearby
    const dayDiff = Math.ceil((nextOpening.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = dayDiff / 7;

    const dateFormatted = nextOpening.toLocaleDateString(locale, {
      // Use locale from context if possible, but here we might default or need hook
      day: 'numeric',
      month: 'long',
      timeZone: timezone,
    }); // Note: using de-DE here hardcoded is risky if not using proper locale.
    // But the component uses `toLocaleTimeString` later with hardcoded de-DE in `formatCurrentTime`.
    // We should arguably use the user's locale.
    // `ParkTimeInfo` doesn't currently receive locale.
    // `park-card-nearby` received `locale`.
    // I should probably stick to `t` translation values mostly.

    // Wait, `ParkTimeInfo` uses `useTranslations`.

    // Let's rely on `nextSchedule` display.

    // If > 7 days
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
            <div className="flex items-center gap-2 text-amber-500">
              <span className="font-medium">
                {t('offseason')} ({t('opensOn')} {dateFormatted} - {tCommon('in')} {weeks}{' '}
                {t('week', { count: weeks })})
              </span>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      // < 1 week, but not today (since isOperatingToday is false)
      // Show "Opens [Day/Date]"
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {t('schedule')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
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
          {t('todaySchedule')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Opening Hours with Countdown FIRST */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">{t('openingHours')}</span>
            {todaySchedule.openingTime && todaySchedule.closingTime ? (
              <span className="text-lg font-semibold tabular-nums">
                <LocalTimeRange
                  start={todaySchedule.openingTime}
                  end={todaySchedule.closingTime}
                  timeZone={timezone}
                />
              </span>
            ) : (
              <span className="text-lg font-semibold tabular-nums">—</span>
            )}
          </div>

          {/* Inline Countdown Badge */}
          {timeUntil && (
            <div className="flex items-center justify-end">
              <Badge
                variant={timeUntil.variant === 'opening' ? 'default' : 'secondary'}
                className="text-xs font-medium"
              >
                {timeUntil.message}
              </Badge>
            </div>
          )}
        </div>

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
        {(todaySchedule.isHoliday ||
          todaySchedule.isBridgeDay ||
          todaySchedule.isSchoolVacation ||
          todaySchedule.influencingHolidays) && (
          <div className="flex flex-wrap gap-2">
            {todaySchedule.isHoliday && todaySchedule.holidayName && (
              <Badge
                variant="outline"
                className="border-orange-300 bg-orange-50 text-xs dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300"
              >
                🎉 {todaySchedule.holidayName}
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
            {todaySchedule.influencingHolidays &&
              todaySchedule.influencingHolidays.length > 0 &&
              todaySchedule.influencingHolidays
                .slice(0, 2)
                .map((holiday: InfluencingHoliday, i: number) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-xs dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                  >
                    🎄 {holiday.name}
                  </Badge>
                ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
