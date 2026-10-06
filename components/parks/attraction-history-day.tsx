'use client';

import { memo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';
import { dateFnsLocale } from '@/lib/utils/date-fns-locale';
import type {
  AttractionHistoryDay as AttractionHistoryDayData,
  ScheduleItem,
} from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { HourlyP90Sparkline } from './hourly-p90-sparkline';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { CROWD_TEXT_CLASS, CROWD_TILE_CLASS } from '@/lib/utils/crowd-level-styles';
import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** One day of the ride's history window, as the grid hands it to a cell. */
export interface DayDataProps {
  dateStr: string;
  historyData?: AttractionHistoryDayData;
  scheduleData?: ScheduleItem;
  attractionStatus: 'OPEN' | 'CLOSED_RIDE' | 'NOT_YET_OPEN' | 'PARK_CLOSED' | 'UNKNOWN';
  isToday: boolean;
}

interface AttractionHistoryDayProps {
  day: DayDataProps;
  /** Shared top of scale across the grid — see {@link HourlyP90Sparkline}. */
  yMax?: number;
}

/**
 * The four things a day can carry besides its crowd level, as a bar across the top edge.
 *
 * The ride's twin of `daySignals` in {@link ParkCalendarDay}, reading a `ScheduleItem` where that
 * one reads a `CalendarDay`: same colours, same order, same legend. The neighbour signal is dropped
 * on a day the park was shut (nobody travelled in), but kept on a day only the ride stood.
 */
function daySignals(
  day: DayDataProps,
  labels: { school: string; neighbor: string; holiday: string; bridge: string }
) {
  const s = day.scheduleData;
  const signals: { key: string; className: string; label: string }[] = [];
  if (!s) return signals;

  if (s.isSchoolHoliday || s.isSchoolVacation) {
    signals.push({
      key: 'school',
      className: DAY_SIGNAL_CLASS.school,
      label: labels.school,
    });
  }
  if ((s.influencingHolidays?.length ?? 0) > 0 && day.attractionStatus !== 'PARK_CLOSED') {
    signals.push({
      key: 'neighbor',
      className: DAY_SIGNAL_CLASS.neighbor,
      label: labels.neighbor,
    });
  }
  if (s.isPublicHoliday) {
    signals.push({
      key: 'holiday',
      className: DAY_SIGNAL_CLASS.holiday,
      label: labels.holiday,
    });
  }
  if (s.isBridgeDay) {
    signals.push({
      key: 'bridge',
      className: DAY_SIGNAL_CLASS.bridge,
      label: labels.bridge,
    });
  }
  return signals;
}

/**
 * One day of the ride's 30-day wait-time history: the crowd calendar's cell with a queue curve
 * in it.
 *
 * Deliberately the same object as {@link ParkCalendarDay} (tile fill, signal bar, day number,
 * verdict), so a park's calendar and its rides speak one visual language. What the ride cell adds
 * is the sparkline: a ride day is a measured curve and its shape is the finding, so it takes the
 * floor of the tile. `yMax` is shared across the grid because `Sparkline` fits each instance to its
 * own maximum, and a flat day would otherwise look as dramatic as a peak.
 */
function AttractionHistoryDayComponent({ day, yMax }: AttractionHistoryDayProps) {
  const t = useTranslations('attractions');
  const tCommon = useTranslations('common');
  const tParks = useTranslations('parks');
  const tLegend = useTranslations('attractions.historyLegend');
  const locale = useLocale();

  const dateLocale = dateFnsLocale(locale);

  const dayDate = parseISO(day.dateStr);
  const dayOfWeek = format(dayDate, 'EEE', { locale: dateLocale });
  const dayOfMonth = format(dayDate, 'd', { locale: dateLocale });
  const month = format(dayDate, 'MMM', { locale: dateLocale });

  const { historyData } = day;
  const isOpen = day.attractionStatus === 'OPEN';
  const curve = historyData?.hourlyP90 ?? [];
  const hasCurve = curve.length > 1;

  const level = historyData?.utilization;
  // Same rule as the park cell: a tier only carries colour when there IS one. A day the ride stood
  // aggregates to nothing, and nothing is not a quiet day.
  const colored: ColoredCrowdLevel | null =
    isOpen && level && level !== 'unknown' ? (level as ColoredCrowdLevel) : null;

  const minMax = hasCurve
    ? {
        min: Math.min(...curve.map((h) => h.value)),
        max: Math.max(...curve.map((h) => h.value)),
      }
    : null;

  // A displayed wait time is a multiple of five — `hourlyP90` is a percentile, i.e. exactly the
  // arithmetic that breaks it. The raw values still drive the sparkline's geometry.
  const displayMin = minMax ? roundWaitTo5(minMax.min) : null;
  const displayMax = minMax ? roundWaitTo5(minMax.max) : null;

  const statusLabel = isOpen
    ? colored
      ? tParks(`crowdLevels.${colored}`)
      : tParks('crowdLevels.unknown')
    : day.attractionStatus === 'PARK_CLOSED'
      ? t('parkClosed')
      : day.attractionStatus === 'NOT_YET_OPEN'
        ? t('notYetOpen')
        : day.attractionStatus === 'CLOSED_RIDE'
          ? t('rideClosed')
          : tParks('crowdLevels.unknown');

  /**
   * The bar's segments, each with the name of what it marks: the legend names the category, only
   * the day knows which holiday it is.
   */
  const signals = daySignals(day, {
    school:
      (day.scheduleData?.holidayType === 'school'
        ? translateHolidayName(day.scheduleData?.holidayName, locale)
        : '') || tLegend('schoolVacation'),
    neighbor: tParks('influencingHolidays'),
    holiday: translateHolidayName(day.scheduleData?.holidayName, locale) || tLegend('holiday'),
    bridge: tLegend('bridgeDay'),
  });
  const signalHint = [
    day.scheduleData?.isPublicHoliday
      ? translateHolidayName(day.scheduleData.holidayName, locale) || tLegend('holiday')
      : null,
    day.scheduleData?.isSchoolHoliday || day.scheduleData?.isSchoolVacation
      ? tLegend('schoolVacation')
      : null,
    day.scheduleData?.isBridgeDay ? tLegend('bridgeDay') : null,
    (day.scheduleData?.influencingHolidays?.length ?? 0) > 0 &&
    day.attractionStatus !== 'PARK_CLOSED'
      ? tParks('influencingHolidays')
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card
      aria-label={`${dayOfWeek} ${dayOfMonth}. ${month} — ${statusLabel}${
        signalHint ? ` · ${signalHint}` : ''
      }`}
      className={cn(
        'relative flex h-full min-h-[118px] flex-col gap-0 overflow-hidden rounded-xl p-[10px] @min-[1024px]/page:min-h-[164px] @min-[1024px]/page:p-3',
        colored ? CROWD_TILE_CLASS[colored] : 'bg-muted/25 border-border/60',
        day.isToday && 'border-primary border-2'
      )}
    >
      {signals.length > 0 && (
        // 6 px of hit area for a 3 px bar: the segment is drawn at the cell's edge and the
        // wrapper reaches under it, so the name is reachable by pointer without the bar growing.
        <span className="absolute inset-x-0 top-0 flex h-1.5">
          {signals.map((s) => (
            <Tooltip key={s.key}>
              <TooltipTrigger asChild>
                <span className="flex h-full flex-1 cursor-help items-start" aria-label={s.label}>
                  <span className={cn('h-[3px] w-full', s.className)} aria-hidden="true" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{s.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </span>
      )}

      {/* Same wrap rule as the park cell: the date group refuses to shrink and the wait drops to
        its own line rather than sliding out from under it in a narrow column. */}
      <div className="flex flex-wrap items-start justify-between gap-x-1.5 gap-y-0.5">
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span
            className={cn(
              'text-[21px] leading-none font-bold tabular-nums @min-[1024px]/page:text-[26px]',
              colored ? CROWD_TEXT_CLASS[colored] : 'text-muted-foreground'
            )}
          >
            {dayOfMonth}
          </span>
          {day.isToday ? (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-[3px] text-[8.5px] font-bold tracking-wider whitespace-nowrap uppercase">
              {tCommon('today')}
            </span>
          ) : (
            <span className="text-muted-foreground text-[11px] font-medium @min-[1024px]/page:text-xs">
              {dayOfWeek}
            </span>
          )}
        </div>
        {displayMax !== null && (
          <span
            className={cn(
              'ml-auto text-[13px] leading-tight font-bold whitespace-nowrap tabular-nums @min-[1024px]/page:text-[15px]',
              colored ? CROWD_TEXT_CLASS[colored] : 'text-muted-foreground'
            )}
          >
            {displayMax} {tCommon('min')}
          </span>
        )}
      </div>

      <div
        className={cn(
          // `line-clamp-2`, not `truncate`: „Ganztägig geschlossen" is two words and would be cut
          // at seven columns, and the tile has slack under its `min-h` for a second line.
          'mt-1.5 line-clamp-2 text-[9.5px] font-bold tracking-wider uppercase @min-[1024px]/page:mt-2 @min-[1024px]/page:text-[10.5px]',
          !isOpen
            ? 'text-status-closed'
            : colored
              ? CROWD_TEXT_CLASS[colored]
              : 'text-muted-foreground'
        )}
      >
        {statusLabel}
      </div>

      {/* Keeps its box on a day with no data, so a closed Tuesday does not shorten its week. */}
      <div className="mt-auto flex flex-col gap-0.5 pt-1.5">
        <div className="h-8 w-full @min-[1024px]/page:h-11">
          {hasCurve && (
            <HourlyP90Sparkline
              hourlyP90={curve}
              yMax={yMax}
              className={cn(colored ? CROWD_TEXT_CLASS[colored] : 'text-muted-foreground/50')}
            />
          )}
        </div>
        {displayMin !== null && displayMax !== null && (
          <div className="text-muted-foreground flex items-center justify-between text-[9.5px] tabular-nums @min-[1024px]/page:text-[10.5px]">
            <span>
              {tCommon('min')} {displayMin}
            </span>
            <span>
              {tCommon('max')} {displayMax}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * One day cell of the ride's 30-day history calendar: crowd tile, signal bar, hourly P90 curve and
 * the day's low and high wait. Memoised; the grid renders one per day.
 */
export const AttractionHistoryDay = memo(AttractionHistoryDayComponent);
