'use client';

import { createElement, memo } from 'react';
import { Info, Star } from 'lucide-react';
import type { CalendarDay } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { useTranslations, useLocale } from 'next-intl';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { Temp } from '@/components/common/unit-display';
import { format, parseISO } from 'date-fns';
import { de, enUS, es, fr, it, nl } from 'date-fns/locale';
import { getWeatherIconFromCode, getEventIcon } from '@/lib/utils/calendar-utils';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { CROWD_TEXT_CLASS, CROWD_TILE_CLASS } from '@/lib/utils/crowd-level-styles';
import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ParkTimeRange } from '@/components/common/park-time';
import { cn } from '@/lib/utils';

export interface ParkCalendarDayProps {
  day: CalendarDay;
  /** Park IANA timezone — opening hours render in park time (browser-time tooltip on hover). */
  parkTimezone: string;
  isToday: boolean;
  isBest?: boolean;
  /** Opens the day-detail panel for `day.date`. When set, the whole card becomes a
   *  button — the touch-friendly way to reach the weather / forecast / prediction
   *  detail (the calendar's hover tooltips never opened on mobile). Receives the
   *  date so callers can pass ONE stable handler instead of a per-day arrow (which
   *  would defeat this component's `memo`). */
  onSelect?: (date: string) => void;
}

/**
 * The four things a day can carry besides its crowd level, as a bar across the top edge.
 *
 * They used to be the cell's BORDER COLOUR plus an icon in the header row, which could only ever
 * show one of them: the border is one colour, and the icon picked a winner by priority. A Friday
 * in the summer holidays that is also a public holiday somewhere next door is three facts, and
 * the cell showed one. A bar splits into as many segments as there are signals, so the same cell
 * says all of it in three pixels — and the border is free to carry the crowd level instead, which
 * is the thing the reader came for.
 *
 * Colours are deliberately not the `--crowd-*` palette: these are categories, not a scale, and
 * borrowing the scale's amber for „Ferien in Nachbarregionen" would put a legend colour next to a
 * tier colour that means something else entirely. Red for a public holiday follows the calendar
 * convention every German wall calendar already taught the reader.
 */
function daySignals(day: CalendarDay, locale: string) {
  const signals: { key: string; className: string; label: string }[] = [];

  if (day.isSchoolHoliday || day.isSchoolVacation) {
    const name = day.events?.find((e) => e.type === 'school-holiday')?.name;
    signals.push({
      key: 'school',
      className: 'bg-yellow-500 dark:bg-yellow-400',
      label: translateHolidayName(name, locale) || '',
    });
  }
  if ((day.neighborHolidays?.length ?? 0) > 0 && day.status !== 'CLOSED') {
    signals.push({ key: 'neighbor', className: 'bg-amber-600 dark:bg-amber-500', label: '' });
  }
  if (day.isHoliday || day.isPublicHoliday) {
    const name = day.events?.find((e) => e.type === 'holiday')?.name;
    signals.push({
      key: 'holiday',
      className: 'bg-red-500 dark:bg-red-400',
      label: translateHolidayName(name, locale) || '',
    });
  }
  if (day.isBridgeDay) {
    signals.push({ key: 'bridge', className: 'bg-blue-500 dark:bg-blue-400', label: '' });
  }

  return signals;
}

function ParkCalendarDayComponent({
  day,
  parkTimezone,
  isToday,
  isBest,
  onSelect,
}: ParkCalendarDayProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const tLegend = useTranslations('attractions.historyLegend');
  const locale = useLocale();

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
   *
   * `headlinerForecast.avgWait`, NOT `day.avgWaitTime` — the cell used to render the latter and
   * therefore rendered nothing, because `/calendar` does not send it. Checked against the live
   * payload for Phantasialand: a day carries `crowdLevel`, `hours`, `weather`, `peakLoad`,
   * `events`, the holiday flags and `headlinerForecast`, and no `avgWaitTime` at all. The field
   * stays in the fallback for a park or a cached response that does send one.
   *
   * `roundWaitTo5` on the way out as well as in the API: a displayed wait time is always a
   * multiple of five, and an average across a day is exactly the arithmetic that breaks it.
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
    <Card
      className={cn(
        'relative flex h-full min-h-[92px] flex-col gap-0 overflow-hidden rounded-xl p-[10px] lg:min-h-[150px] lg:p-3',
        colored ? CROWD_TILE_CLASS[colored] : 'bg-muted/25 border-border/60',
        isToday && 'border-primary border-2',
        clickable &&
          'focus-visible:ring-primary cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none'
      )}
      {...(clickable
        ? {
            role: 'button' as const,
            tabIndex: 0,
            'aria-label': `${dayOfWeek} ${dayOfMonth}. ${month} — ${statusLabel}${
              signalHint ? ` · ${signalHint}` : ''
            }`,
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
      {/* The signal bar. Sits on the cell's own top edge, inside its rounding, so it reads as part
        of the tile rather than as a chip laid on it. */}
      {signals.length > 0 && (
        <span className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px]">
          {signals.map((s) => (
            <span key={s.key} className={cn('h-full flex-1', s.className)} />
          ))}
        </span>
      )}

      {/* Header: the date on the left, what it costs in queue on the right.
        `flex-wrap` and a date group that refuses to shrink, because the seven-column grid starts
        at 1024 px where a cell is 128 px wide and „28 · HEUTE · 40 Min" wants about 133: without
        the wrap the date group was squeezed to 44 px and the pill slid out from under it, across
        the wait time. Wrapped, the wait drops to a line of its own and the cell still comes in
        under its 150 px — from 1280 px up nothing wraps at all. */}
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
          {/* The weekday gives way to the „Heute" pill rather than squeezing beside it: at `lg`
            the cell is 132 px inside its padding and „28 Fr HEUTE 15 Min" does not fit in it. */}
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

      {/* What kind of day it is, in one word. */}
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

      {/* Hours and weather sit on the cell's floor, so every tile in a row lines them up. Below
        `lg` they share a line — the two-column list is 177 px wide on a phone and a stacked pair
        would cost the row a third of its height for two figures that fit side by side. */}
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
            {createElement(getEventIcon(getWeatherIconFromCode(day.weather.icon)), {
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

// Memoize component to prevent unnecessary re-renders
export const ParkCalendarDay = memo(ParkCalendarDayComponent);
