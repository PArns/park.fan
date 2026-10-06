'use client';

import { createElement, memo } from 'react';
import { Info, Star } from 'lucide-react';
import type { CalendarDay } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { useTranslations, useLocale } from 'next-intl';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { Temp } from '@/components/common/unit-display';
import { format, parseISO } from 'date-fns';
import { dateFnsLocale } from '@/lib/utils/date-fns-locale';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { CROWD_TEXT_CLASS, CROWD_TILE_CLASS } from '@/lib/utils/crowd-level-styles';
import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ParkTimeRange } from '@/components/common/park-time';
import { cn } from '@/lib/utils';

/** Props of one crowd-calendar day cell. */
export interface ParkCalendarDayProps {
  day: CalendarDay;
  /** Park IANA timezone — opening hours render in park time (browser-time tooltip on hover). */
  parkTimezone: string;
  isToday: boolean;
  isBest?: boolean;
  /**
   * Opens the day-detail panel for `day.date`; when set, the whole card is a button, which also
   * works on touch. Takes the date so callers pass one stable handler and the `memo` holds.
   */
  onSelect?: (date: string) => void;
  /**
   * Whether the grid is in comparison mode, where a press picks the day instead of opening it. The
   * click handler is the grid's decision; this only adds `aria-pressed`, which is honest only for a
   * control that stays down.
   */
  selectable?: boolean;
  /**
   * `1` or `2` where this day is one of the two being compared, `null` otherwise. A number because
   * the picks are not interchangeable: the comparison's left column is the first one chosen.
   */
  selectionIndex?: 1 | 2 | null;
}

/**
 * The four things a day can carry besides its crowd level, as a bar across the top edge. The bar
 * splits into one segment per signal, so a cell shows all of them at once and the border stays free
 * for the crowd level.
 */
function daySignals(day: CalendarDay, locale: string) {
  const signals: { key: string; className: string; label: string }[] = [];

  if (day.isSchoolHoliday || day.isSchoolVacation) {
    const name = day.events?.find((e) => e.type === 'school-holiday')?.name;
    signals.push({
      key: 'school',
      className: DAY_SIGNAL_CLASS.school,
      label: translateHolidayName(name, locale) || '',
    });
  }
  if ((day.neighborHolidays?.length ?? 0) > 0 && day.status !== 'CLOSED') {
    signals.push({ key: 'neighbor', className: DAY_SIGNAL_CLASS.neighbor, label: '' });
  }
  if (day.isHoliday || day.isPublicHoliday) {
    const name = day.events?.find((e) => e.type === 'holiday')?.name;
    signals.push({
      key: 'holiday',
      className: DAY_SIGNAL_CLASS.holiday,
      label: translateHolidayName(name, locale) || '',
    });
  }
  if (day.isBridgeDay) {
    signals.push({ key: 'bridge', className: DAY_SIGNAL_CLASS.bridge, label: '' });
  }

  return signals;
}

function ParkCalendarDayComponent({
  day,
  parkTimezone,
  isToday,
  isBest,
  onSelect,
  selectable = false,
  selectionIndex = null,
}: ParkCalendarDayProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const tLegend = useTranslations('attractions.historyLegend');
  const locale = useLocale();

  const dateLocale = dateFnsLocale(locale);

  const dayDate = parseISO(day.date);
  const dayOfWeek = format(dayDate, 'EEE', { locale: dateLocale });
  const dayOfMonth = format(dayDate, 'd', { locale: dateLocale });
  const month = format(dayDate, 'MMM', { locale: dateLocale });

  const isClosed = day.status === 'CLOSED';
  const isUnknown = day.status === 'UNKNOWN';
  const level = day.crowdLevel;
  // The colour is the crowd level's, and only when there IS one. A closed day and a park whose
  // wait times nobody publishes both arrive here with no usable level, and both must stay grey —
  // an aggregate over an empty set is Ø 0 minutes, which is byte-for-byte a very quiet day.
  const colored: ColoredCrowdLevel | null =
    !isClosed && level && level !== 'closed' && level !== 'unknown'
      ? (level as ColoredCrowdLevel)
      : null;

  const isBestDay = isBest ?? day.recommendation === 'highly_recommended';
  const signals = daySignals(day, locale);
  const clickable = !!onSelect;

  /**
   * The day's wait in one number: the average across the park's headliners.
   * `headlinerForecast.avgWait` first, because `/calendar` does not send `day.avgWaitTime`; that
   * field stays as the fallback for a response that does. Rounded, since a displayed wait time is
   * always a multiple of five.
   */
  const rawWait = day.headlinerForecast?.avgWait ?? day.avgWaitTime;
  const wait = rawWait && rawWait > 0 ? roundWaitTo5(rawWait) : null;

  const statusLabel = isClosed
    ? tCommon('closed')
    : isUnknown
      ? t('crowdLevels.unknown')
      : colored
        ? t(`crowdLevels.${colored}`)
        : t('crowdLevels.unknown');

  const signalHint = [
    day.isHoliday || day.isPublicHoliday ? tLegend('holiday') : null,
    day.isSchoolHoliday || day.isSchoolVacation ? tLegend('schoolVacation') : null,
    day.isBridgeDay ? tLegend('bridgeDay') : null,
    (day.neighborHolidays?.length ?? 0) > 0 && !isClosed ? t('influencingHolidays') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    // Every `lg:` below dresses the cell for the seven-column week grid, which <ParkCalendarGrid>
    // picks with `matchMedia('(min-width: 1024px)')`, so these stay on the window until that query
    // does.
    <Card
      className={cn(
        'relative flex h-full min-h-[92px] flex-col gap-0 overflow-hidden rounded-xl p-[10px] lg:min-h-[150px] lg:p-3',
        colored ? CROWD_TILE_CLASS[colored] : 'bg-muted/25 border-border/60',
        isToday && 'border-primary border-2',
        // The picked state is a ring, not a border colour: the crowd tile and „heute" already own
        // the border, and a ring outside the box keeps the day's crowd level readable.
        selectionIndex !== null && 'ring-primary ring-offset-background z-10 ring-2 ring-offset-2',
        clickable &&
          'focus-visible:ring-primary cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none'
      )}
      {...(clickable
        ? {
            role: 'button' as const,
            tabIndex: 0,
            ...(selectable ? { 'aria-pressed': selectionIndex !== null } : {}),
            'aria-label': `${dayOfWeek} ${dayOfMonth}. ${month} — ${statusLabel}${
              signalHint ? ` · ${signalHint}` : ''
            }${selectable ? ` · ${t('dayComparison.pickDay')}` : ''}`,
            onClick: () => onSelect?.(day.date),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.(day.date);
              }
            },
          }
        : {})}
    >
      {/* Which of the two picks this is. Numbered, not ticked: the comparison's left column is the
          first day chosen. */}
      {selectionIndex !== null && (
        <span className="bg-primary text-primary-foreground absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums">
          {selectionIndex}
        </span>
      )}

      {/* Inside the cell's rounding, so it reads as part of the tile rather than a chip laid on it.
       */}
      {signals.length > 0 && (
        <span className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px]">
          {signals.map((s) => (
            <span key={s.key} className={cn('h-full flex-1', s.className)} />
          ))}
        </span>
      )}

      {/* `flex-wrap` and a date group that does not shrink: in the narrowest seven-column cell the
          date, the „Heute" pill and the wait do not fit one line, and without the wrap the pill
          slid across the wait time. */}
      <div className="flex flex-wrap items-start justify-between gap-x-1.5 gap-y-0.5">
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span
            className={cn(
              'text-[21px] leading-none font-bold tabular-nums lg:text-[26px]',
              colored ? CROWD_TEXT_CLASS[colored] : 'text-muted-foreground'
            )}
          >
            {dayOfMonth}
          </span>
          {/* The weekday gives way to the „Heute" pill: at `lg` the two do not fit side by side.
           */}
          {isToday ? (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-[3px] text-[8.5px] font-bold tracking-wider whitespace-nowrap uppercase">
              {tCommon('today')}
            </span>
          ) : (
            <span className="text-muted-foreground text-[11px] font-medium lg:text-xs">
              {dayOfWeek}
            </span>
          )}
        </div>
        {wait !== null && (
          <span
            className={cn(
              'ml-auto text-[13px] leading-tight font-bold whitespace-nowrap tabular-nums lg:text-[15px]',
              colored ? CROWD_TEXT_CLASS[colored] : 'text-muted-foreground'
            )}
          >
            {wait} {tCommon('min')}
          </span>
        )}
      </div>

      <div
        className={cn(
          'mt-1.5 flex items-center gap-1 text-[9.5px] font-bold tracking-wider uppercase lg:mt-2 lg:text-[10.5px]',
          isClosed
            ? 'text-status-closed'
            : colored
              ? CROWD_TEXT_CLASS[colored]
              : 'text-muted-foreground'
        )}
      >
        {isBestDay && !isClosed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Star className="h-3 w-3 shrink-0 fill-current" aria-label={t('bestDay')} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('bestDay')}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <span className="truncate">{statusLabel}</span>
      </div>

      {/* Hours and weather sit on the cell's floor so a row lines them up. Below `lg` they share a
          line; stacked, they would cost a phone row a third of its height. */}
      <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-[10.5px] lg:flex-col lg:items-start lg:gap-1 lg:text-[11px]">
        {day.status === 'OPERATING' && day.hours && (
          <span className="flex items-center gap-1 tabular-nums">
            <ParkTimeRange
              openingTime={day.hours.openingTime}
              closingTime={day.hours.closingTime}
              parkTimezone={parkTimezone}
              locale={locale}
            />
            {(day.isEstimated || day.hours.isInferred) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground/60 h-2.5 w-2.5 shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('calendarView.details.schedule.estimatedHours')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </span>
        )}
        {day.weather && (
          <span className="flex items-center gap-1">
            {createElement(getWeatherConfig(day.weather.icon).icon, {
              className: 'h-3 w-3 shrink-0',
            })}
            <span className="tabular-nums">
              <Temp celsius={day.weather.tempMin} />–<Temp celsius={day.weather.tempMax} />
            </span>
          </span>
        )}
      </div>
    </Card>
  );
}

/**
 * One day cell of the crowd calendar, memoised so a grid update re-renders only the days that
 * changed.
 */
export const ParkCalendarDay = memo(ParkCalendarDayComponent);
