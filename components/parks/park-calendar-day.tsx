'use client';

import { createElement, memo } from 'react';
import {
  PartyPopper,
  Calendar,
  Backpack,
  Ban,
  Ticket,
  Clock,
  HelpCircle,
  Info,
  Luggage,
  Star,
} from 'lucide-react';
import type { CalendarDay } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { useTranslations, useLocale } from 'next-intl';
import { Temp } from '@/components/common/unit-display';
import { format, parseISO } from 'date-fns';
import { de, enUS, es, fr, it, nl } from 'date-fns/locale';
import { getWeatherIconFromCode, getEventIcon } from '@/lib/utils/calendar-utils';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';

export interface ParkCalendarDayProps {
  day: CalendarDay;
  isToday: boolean;
  isBest?: boolean;
  /** Opens the day-detail panel. When set, the whole card becomes a button —
   *  the touch-friendly way to reach the weather / forecast / prediction detail
   *  (the calendar's hover tooltips never opened on mobile). */
  onSelect?: () => void;
}

function ParkCalendarDayComponent({ day, isToday, isBest, onSelect }: ParkCalendarDayProps) {
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
      it,
      nl,
    }[locale as 'de' | 'en' | 'es' | 'fr' | 'it' | 'nl'] || enUS;

  const dayDate = parseISO(day.date);
  const dayOfWeek = format(dayDate, 'EEE', { locale: dateLocale });
  const dayOfMonth = format(dayDate, 'd', { locale: dateLocale });
  const month = format(dayDate, 'MMM', { locale: dateLocale });

  // Get schedule icon + label. Native `title` gives a lightweight desktop hover
  // hint; the full explanation lives in the click-to-open detail panel (mobile).
  // Priority: CLOSED / UNKNOWN (by status) > Public Holiday > School Vacation > Bridge Day
  const getScheduleIcon = () => {
    if (day.status === 'CLOSED') {
      return { Icon: Ban, color: 'text-red-500 dark:text-red-400', label: tCommon('closed') };
    }
    if (day.status === 'UNKNOWN') {
      return {
        Icon: HelpCircle,
        color: 'text-gray-500 dark:text-gray-400',
        label: t('calendarView.details.schedule.scheduleNotYetAvailable'),
      };
    }
    if (day.isHoliday || day.isPublicHoliday) {
      const holiday = day.events?.find((e) => e.type === 'holiday');
      return {
        Icon: PartyPopper,
        color: 'text-orange-500 dark:text-orange-400',
        label: holiday?.name || t('holiday'),
      };
    }
    if (day.isSchoolHoliday || day.isSchoolVacation) {
      return {
        Icon: Backpack,
        color: 'text-yellow-500 dark:text-yellow-400',
        label: t('schoolVacation'),
      };
    }
    if (day.isBridgeDay) {
      return { Icon: Calendar, color: 'text-blue-500 dark:text-blue-400', label: t('bridgeDay') };
    }
    return null;
  };

  // Determine border color based on schedule
  // Priority: Park CLOSED > UNKNOWN (neutral) > Public Holiday > School Vacation > Bridge Day
  const getBorderColor = () => {
    const borderWidth = isToday ? 'border-4' : 'border';

    if (day.status === 'CLOSED') {
      return `${borderWidth} border-status-closed`;
    }
    if (day.status === 'UNKNOWN') {
      return `${borderWidth} border-gray-300 dark:border-gray-600`;
    }
    if (day.isHoliday || day.isPublicHoliday) {
      return `${borderWidth} border-orange-500 dark:border-orange-400`;
    }
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

  const isBestDay = isBest ?? day.recommendation === 'highly_recommended';

  // Neighbouring-region holidays (top influencing regions only) → distinct amber
  // marker so it never blends with the local orange/yellow/blue holiday icons.
  const hasNeighbor = (day.neighborHolidays?.length ?? 0) > 0 && day.status !== 'CLOSED';

  const scheduleIcon = getScheduleIcon();
  const clickable = !!onSelect;

  return (
    <Card
      className={`relative flex h-full flex-col gap-1 p-2 ${getBorderColor()} ${
        day.status === 'CLOSED' ? 'bg-gray-100/50 dark:bg-gray-800/30' : ''
      } ${day.status === 'UNKNOWN' ? 'bg-gray-100/50 dark:bg-gray-800/30' : ''} ${
        clickable
          ? 'focus-visible:ring-primary cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none'
          : ''
      }`}
      {...(clickable
        ? {
            role: 'button' as const,
            tabIndex: 0,
            'aria-label': `${dayOfWeek} ${dayOfMonth}. ${month}`,
            onClick: onSelect,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.();
              }
            },
          }
        : {})}
    >
      {isBestDay && (
        <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <span className="flex items-center gap-1 rounded-full border border-green-500/80 bg-green-500/65 px-2 py-0.5 text-[9px] font-bold tracking-wide whitespace-nowrap text-white uppercase backdrop-blur-md dark:border-green-500/40 dark:bg-green-500/25">
            <Star className="h-2.5 w-2.5" />
            {t('bestDay')}
          </span>
        </div>
      )}
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
        <div className="flex items-center gap-1">
          {/* Neighbouring-region holidays: amber Luggage marker (distinct from the
              local orange/yellow/blue holiday icons). Full list in the detail panel. */}
          {hasNeighbor && (
            <span title={t('influencingHolidays')} className="inline-flex">
              <Luggage
                className="h-4 w-4 text-amber-500 dark:text-amber-400"
                aria-label={t('influencingHolidays')}
              />
            </span>
          )}
          {scheduleIcon && (
            <span title={scheduleIcon.label} className="inline-flex">
              <scheduleIcon.Icon
                className={`h-4 w-4 ${scheduleIcon.color}`}
                aria-label={scheduleIcon.label}
              />
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {day.status === 'OPERATING' || day.status === 'UNKNOWN' ? (
        <div className="flex flex-1 flex-col gap-2">
          {/* Crowd Level Badge */}
          {day.crowdLevel && day.crowdLevel !== 'closed' && (
            <div className="flex w-full justify-center">
              <CrowdLevelBadge
                level={day.crowdLevel}
                className="w-full justify-center py-0.5 text-[10px]"
              />
            </div>
          )}

          {/* Opening Hours */}
          {day.status === 'OPERATING' && day.hours ? (
            <div className="text-muted-foreground flex flex-col items-center gap-0.5 text-[10px]">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="font-medium">
                  {format(parseISO(day.hours.openingTime), 'HH:mm')} -{' '}
                  {format(parseISO(day.hours.closingTime), 'HH:mm')}
                </span>
                {(day.isEstimated || day.hours.isInferred) && (
                  <span
                    title={t('calendarView.details.schedule.estimatedHours')}
                    className="inline-flex"
                  >
                    <Info className="text-muted-foreground/60 h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            </div>
          ) : null}

          {/* Weather */}
          {day.weather && (
            <div className="text-muted-foreground flex items-center justify-center gap-1 text-[10px]">
              {createElement(getEventIcon(getWeatherIconFromCode(day.weather.icon)), {
                className: 'h-3.5 w-3.5',
              })}
              <span>
                <Temp celsius={day.weather.tempMin} /> – <Temp celsius={day.weather.tempMax} />
              </span>
            </div>
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
