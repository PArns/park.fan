'use client';

import { createElement, memo } from 'react';
import { PartyPopper, Calendar, Backpack, Ban, Ticket } from 'lucide-react';
import type { CalendarDay } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslations, useLocale } from 'next-intl';
import { format, parseISO } from 'date-fns';
import { de, enUS, es, fr, nl } from 'date-fns/locale';
import { getWeatherIconFromCode, getEventIcon } from '@/lib/utils/calendar-utils';

export interface ParkCalendarDayProps {
  day: CalendarDay;
  isToday: boolean;
}

function ParkCalendarDayComponent({ day, isToday }: ParkCalendarDayProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Map locale to date-fns locale
  const dateLocale =
    {
      de,
      en: enUS,
      es,
      fr,
      nl,
    }[locale as 'de' | 'en' | 'es' | 'fr' | 'nl'] || enUS;

  const dayDate = parseISO(day.date);
  const dayOfWeek = format(dayDate, 'EEE', { locale: dateLocale });
  const dayOfMonth = format(dayDate, 'd', { locale: dateLocale });
  const month = format(dayDate, 'MMM', { locale: dateLocale });

  // Get schedule icon and tooltip text
  // Priority: Closed > Public Holiday > School Vacation > Bridge Day
  const getScheduleIcon = () => {
    if (day.status !== 'OPERATING') {
      return {
        Icon: Ban,
        color: 'text-red-500 dark:text-red-400',
        tooltip: tCommon('closed'),
      };
    }

    // Priority 2: Public Holiday
    // Check both isHoliday (from API) and isPublicHoliday (optional field)
    if (day.isHoliday || day.isPublicHoliday) {
      const holiday = day.events?.find((e) => e.type === 'holiday');
      return {
        Icon: PartyPopper,
        color: 'text-orange-500 dark:text-orange-400',
        tooltip: holiday?.name || t('holiday'),
      };
    }

    // Priority 3: School Vacation
    if (day.isSchoolHoliday || day.isSchoolVacation) {
      return {
        Icon: Backpack,
        color: 'text-yellow-500 dark:text-yellow-400',
        tooltip: t('schoolVacation'),
      };
    }

    // Priority 4: Bridge Day
    if (day.isBridgeDay) {
      return {
        Icon: Calendar,
        color: 'text-blue-500 dark:text-blue-400',
        tooltip: t('bridgeDay'),
      };
    }
    return null;
  };

  // Determine border color based on schedule
  // Priority: Park Closed > Public Holiday > School Vacation > Bridge Day
  const getBorderColor = () => {
    const borderWidth = isToday ? 'border-4' : 'border';

    if (day.status !== 'OPERATING') {
      return `${borderWidth} border-red-500 dark:border-red-600`;
    }

    if (day.isHoliday || day.isPublicHoliday) {
      return `${borderWidth} border-orange-500 dark:border-orange-400`;
    } // No else if here, strict priority check ensures order if needed, but here we just return

    if (day.isSchoolHoliday || day.isSchoolVacation) {
      return `${borderWidth} border-yellow-500 dark:border-yellow-400`;
    }

    if (day.isBridgeDay) {
      return `${borderWidth} border-blue-500 dark:border-blue-400`;
    }

    if (isToday) {
      return `${borderWidth} border-primary`;
    }
    return borderWidth;
  };

  // Get crowd level badge styling
  const getCrowdLevelStyle = () => {
    if (!day.crowdLevel || day.crowdLevel === 'closed') return null;

    const styles = {
      very_low:
        'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/50 dark:text-green-100',
      low: 'border-lime-200 bg-lime-100 text-lime-800 dark:border-lime-800 dark:bg-lime-900/50 dark:text-lime-100',
      moderate:
        'border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100',
      high: 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-900/50 dark:text-orange-100',
      very_high:
        'border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/50 dark:text-red-100',
      extreme:
        'border-red-300 bg-red-200 text-red-900 dark:border-red-700 dark:bg-red-800/50 dark:text-red-50',
    };

    return styles[day.crowdLevel];
  };

  return (
    <Card
      className={`flex h-full flex-col gap-1 p-2 ${getBorderColor()} ${
        day.status !== 'OPERATING' ? 'bg-gray-100/50 dark:bg-gray-800/30' : ''
      }`}
    >
      {/* Header: Stacked Layout */}
      <div className="mb-1 flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs leading-tight font-medium">
            {isToday ? tCommon('today') : dayOfWeek}
          </span>
          <span
            className={`text-sm ${isToday ? 'font-bold' : 'font-semibold'} mt-0.5 leading-tight`}
          >
            {dayOfMonth}. {month}
          </span>
        </div>
        {(() => {
          const scheduleIcon = getScheduleIcon();
          if (scheduleIcon) {
            const { Icon, color, tooltip } = scheduleIcon;
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icon className={`h-4 w-4 ${color} cursor-help`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          return null;
        })()}
      </div>

      {/* Content */}
      {day.status === 'OPERATING' ? (
        <div className="flex flex-1 flex-col gap-2">
          {/* Crowd Level Badge */}
          {day.crowdLevel && day.crowdLevel !== 'closed' && (
            <div
              className={`flex w-full justify-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${getCrowdLevelStyle()}`}
            >
              {t(`crowdLevels.${day.crowdLevel}`)}
            </div>
          )}

          {/* Opening Hours */}
          {day.hours && (
            <div className="text-muted-foreground flex flex-col items-center gap-0.5 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {format(parseISO(day.hours.openingTime), 'HH:mm')} -{' '}
                  {format(parseISO(day.hours.closingTime), 'HH:mm')}
                </span>
              </div>
              {day.hours.isInferred && (
                <span className="text-muted-foreground/70 text-[9px]">(Est.)</span>
              )}
            </div>
          )}

          {/* Weather */}
          {day.weather && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground flex items-center justify-center gap-1 text-[10px]">
                  {createElement(getEventIcon(getWeatherIconFromCode(day.weather.icon)), {
                    className: 'h-3.5 w-3.5',
                  })}
                  <span>
                    {Math.round(day.weather.tempMin)}° - {Math.round(day.weather.tempMax)}°
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{day.weather.condition}</p>
                {day.weather.rainChance > 0 && <p>{day.weather.rainChance}% Rain</p>}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Ticket Price */}
          {day.ticket?.price && (
            <div className="text-muted-foreground flex items-center justify-center gap-1 text-[10px]">
              <Ticket className="h-3 w-3" />
              <span>
                {day.ticket.price.amount} {day.ticket.price.currency}
              </span>
            </div>
          )}

          {/* Average Wait Time */}
          {day.avgWaitTime && (
            <div className="text-muted-foreground text-center text-[10px]">
              ø {day.avgWaitTime} min
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-2 text-center">
          <div className="flex flex-col items-center gap-1">
            <Ban className="h-4 w-4 text-red-500 opacity-50" />
            <span className="text-muted-foreground text-[10px] font-medium text-red-500/80">
              {tCommon('closed')}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ParkCalendarDay = memo(ParkCalendarDayComponent);
