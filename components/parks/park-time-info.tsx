'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ScheduleItem } from '@/lib/api/types';

interface ParkTimeInfoProps {
  timezone: string;
  todaySchedule?: ScheduleItem | null;
}

/**
 * Client component that displays:
 * 1. Current time in the park's timezone (live updating)
 * 2. Opening hours for today
 * 3. "Opens in" / "Closes in" messages
 */
export function ParkTimeInfo({ timezone, todaySchedule }: ParkTimeInfoProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Format current time in park timezone
  const formatCurrentTime = () => {
    try {
      return currentTime.toLocaleTimeString('de-DE', {
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
  const formatScheduleTime = (time: string) => {
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('de-DE', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  // Don't show the card if park is not operating today or no schedule data
  if (!todaySchedule || todaySchedule.scheduleType !== 'OPERATING') {
    return null;
  }

  return (
    <Card>
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
            <span className="text-lg font-semibold tabular-nums">
              {formatScheduleTime(todaySchedule.openingTime || '')}
              {' - '}
              {formatScheduleTime(todaySchedule.closingTime || '')}
            </span>
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
            <span className="text-lg font-bold tabular-nums">{formatCurrentTime()}</span>
          </div>
        </div>

        {/* Holiday/Bridge Day Badges */}
        {(todaySchedule.isHoliday || todaySchedule.isBridgeDay) && (
          <div className="flex flex-wrap gap-2">
            {todaySchedule.isHoliday && todaySchedule.holidayName && (
              <Badge variant="outline" className="text-xs">
                🎄 {todaySchedule.holidayName}
              </Badge>
            )}
            {todaySchedule.isBridgeDay && (
              <Badge variant="outline" className="text-xs">
                🌉 Bridge Day
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
