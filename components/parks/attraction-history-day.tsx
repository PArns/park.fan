'use client';

import { memo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';
import { de, enUS, es, fr, it, nl } from 'date-fns/locale';
import type {
  AttractionHistoryDay as AttractionHistoryDayData,
  ScheduleItem,
} from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { HourlyP90Sparkline } from './hourly-p90-sparkline';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { CROWD_TEXT_CLASS, CROWD_TILE_CLASS } from '@/lib/utils/crowd-level-styles';
import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
 * one reads a `CalendarDay`. Same colours in the same order, because the two grids sit two
 * chapters apart on pages about the same park and are explained by the same legend — this cell
 * used to say all of it with ONE coloured border plus ONE icon chosen by priority, so a Friday in
 * the summer holidays that is also a public holiday next door showed a third of what it knew.
 *
 * The neighbour signal is suppressed on a day the park was shut, exactly as over there: nobody
 * travelled in. A day where only the RIDE stood keeps it — the day-trippers still came.
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
      className: 'bg-yellow-500 dark:bg-yellow-400',
      label: labels.school,
    });
  }
  if ((s.influencingHolidays?.length ?? 0) > 0 && day.attractionStatus !== 'PARK_CLOSED') {
    signals.push({
      key: 'neighbor',
      className: 'bg-amber-600 dark:bg-amber-500',
      label: labels.neighbor,
    });
  }
  if (s.isPublicHoliday) {
    signals.push({
      key: 'holiday',
      className: 'bg-red-500 dark:bg-red-400',
      label: labels.holiday,
    });
  }
  if (s.isBridgeDay) {
    signals.push({
      key: 'bridge',
      className: 'bg-blue-500 dark:bg-blue-400',
      label: labels.bridge,
    });
  }
  return signals;
}

/**
 * One day of the ride's 30-day wait-time history — the crowd calendar's cell with a queue curve
 * in it.
 *
 * It is deliberately the same object as {@link ParkCalendarDay}: same tile fill from the same
 * `CROWD_TILE_CLASS`, same signal bar, same oversized day number in the tier's colour, same
 * one-word verdict under it. The two used to be different components that looked different — a
 * white card with a coloured BORDER and an icon row against a tinted tile with a top bar — and a
 * reader walking a park's calendar and then one of its rides met two visual languages for one
 * statement. The guide page settles which of them is canonical: it teaches `ParkCalendarDay` as
 * "the real calendar cell".
 *
 * What the ride cell has that the park cell does not is the SPARKLINE, and it is the reason this
 * component still exists. A park day is a forecast — one level, one number, opening hours. A ride
 * day is a measured curve, and its shape (flat all day, or a spike at eleven) is the finding: two
 * days can both read "hoch" and want visiting at different hours. So the curve takes the floor of
 * the tile, where the park cell puts its hours and weather, and the min–max pair sits under it.
 *
 * `yMax` is shared across the grid on purpose — see the trap named in the guide's own notes:
 * `Sparkline` fits each instance to its own maximum, so a flat 20-minute day and a 120-minute
 * peak are drawn identically dramatic unless the whole month is put on one scale.
 */
function AttractionHistoryDayComponent({ day, yMax }: AttractionHistoryDayProps) {
  const t = useTranslations('attractions');
  const tCommon = useTranslations('common');
  const tParks = useTranslations('parks');
  const tLegend = useTranslations('attractions.historyLegend');
  const locale = useLocale();

  const dateLocale =
    { de, en: enUS, es, fr, it, nl }[locale as 'de' | 'en' | 'es' | 'fr' | 'it' | 'nl'] || enUS;

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
   * The bar's segments, each with the name of what it marks.
   *
   * The old cell put the holiday's own name in a tooltip on its corner icon — „Sommerferien",
   * not „Schulferien" — and the rewrite dropped it: the name survived only in the cell's
   * `aria-label`, so a sighted reader could no longer find out WHICH holiday a coloured segment
   * meant. The legend names the category; only the day knows the day.
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
        'relative flex h-full min-h-[118px] flex-col gap-0 overflow-hidden rounded-xl p-[10px] lg:min-h-[164px] lg:p-3',
        colored ? CROWD_TILE_CLASS[colored] : 'bg-muted/25 border-border/60',
        day.isToday && 'border-primary border-2'
      )}
    >
      {/* The signal bar, on the cell's own top edge and inside its rounding. */}
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

      {/* Header: the date on the left, the day's longest queue on the right. Same wrap rule as
        the park cell — the date group refuses to shrink and the wait drops to its own line rather
        than sliding out from under it in a 128 px column. */}
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
          {day.isToday ? (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-[3px] text-[8.5px] font-bold tracking-wider whitespace-nowrap uppercase">
              {tCommon('today')}
            </span>
          ) : (
            <span className="text-muted-foreground text-[11px] font-medium lg:text-xs">
              {dayOfWeek}
            </span>
          )}
        </div>
        {displayMax !== null && (
          <span
            className={cn(
              'ml-auto text-[13px] leading-tight font-bold whitespace-nowrap tabular-nums lg:text-[15px]',
              colored ? CROWD_TEXT_CLASS[colored] : 'text-muted-foreground'
            )}
          >
            {displayMax} {tCommon('min')}
          </span>
        )}
      </div>

      {/* What kind of day it was, in one word — or why there is no curve. */}
      <div
        className={cn(
          // `line-clamp-2`, not `truncate`: a crowd tier is one word but „Ganztägig geschlossen"
          // is two, and at seven columns it came out „GANZTÄGIG GESCHLOS…". The tile has ~33 px of
          // slack under its `min-h`, so a second line costs the grid nothing.
          'mt-1.5 line-clamp-2 text-[9.5px] font-bold tracking-wider uppercase lg:mt-2 lg:text-[10.5px]',
          !isOpen
            ? 'text-status-closed'
            : colored
              ? CROWD_TEXT_CLASS[colored]
              : 'text-muted-foreground'
        )}
      >
        {statusLabel}
      </div>

      {/* The queue curve — the whole reason this cell is not `ParkCalendarDay`. It takes the floor
        the park cell gives its hours and weather, and it keeps its box on a day with no data so a
        closed Tuesday does not shorten the week it sits in. */}
      <div className="mt-auto flex flex-col gap-0.5 pt-1.5">
        <div className="h-8 w-full lg:h-11">
          {hasCurve && (
            <HourlyP90Sparkline
              hourlyP90={curve}
              yMax={yMax}
              className={cn(colored ? CROWD_TEXT_CLASS[colored] : 'text-muted-foreground/50')}
            />
          )}
        </div>
        {displayMin !== null && displayMax !== null && (
          <div className="text-muted-foreground flex items-center justify-between text-[9.5px] tabular-nums lg:text-[10.5px]">
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

export const AttractionHistoryDay = memo(AttractionHistoryDayComponent);
