'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format, eachDayOfInterval, startOfWeek } from 'date-fns';
import { de, enUS, es, fr, it, nl, type Locale } from 'date-fns/locale';
import type { AttractionHistoryDay, ScheduleItem } from '@/lib/api/types';
import { AttractionHistoryDay as HistoryDay, type DayDataProps } from './attraction-history-day';
import { AttractionHistoryGridPlaceholder } from './attraction-history-grid-placeholder';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { HISTORY_WINDOW_DAYS } from '@/lib/parks/attraction-history-geometry';

interface AttractionHistoryGridProps {
  history?: AttractionHistoryDay[];
  schedule?: ScheduleItem[];
}

/**
 * The ride's 30-day wait-time history, drawn as a calendar.
 *
 * Same two layouts as the park's crowd calendar and for the same reasons: weekday-aligned week
 * rows from `lg` up, a two-column list below it. That alignment is the point of putting this in a
 * grid at all — the finding a reader comes here for is „Samstag ist immer voll", and a strip of
 * thirty cells in a row cannot show it. It used to run seven-per-row from today backwards, which
 * puts a different weekday in each column every month.
 *
 * The list below `lg` runs newest first, because there it is a list and not a calendar, and the
 * day a reader wants first is today.
 *
 * One `yMax` across every cell. `Sparkline` fits each instance to its own maximum, so without it
 * a flat twenty-minute Tuesday is drawn exactly as dramatically as a hundred-minute Saturday and
 * the grid says the opposite of what the data says.
 */
export function AttractionHistoryGrid({ history, schedule }: AttractionHistoryGridProps) {
  const locale = useLocale();
  const t = useTranslations('attractions');
  // "today" is derived from the browser clock (null until mount) so the static shell never reads
  // the server clock — previously getServerNowMs() here pinned the attraction shell's revalidate.
  const browserNow = useBrowserNow(null);

  const dateLocale: Locale =
    ({ de, en: enUS, fr, it, nl, es } as Record<string, Locale>)[locale] ?? enUS;

  /**
   * Which of the two layouts to build, read off the live viewport.
   *
   * Both used to sit in the DOM behind `lg:hidden` / `hidden lg:block`, and `display: none` skips
   * neither render nor hydration — so every day mounted twice and the grid drew 62 sparklines to
   * show 31. Safe to read the viewport here because nothing in this grid renders on the server at
   * all: `days` is empty until `browserNow` lands. Same solution, same reason, as
   * `ParkCalendarGrid`.
   */
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(min-width: 1024px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const { days, weeks, weekdayHeaders, yMax } = useMemo(() => {
    const headers: string[] = [];
    const monday = new Date(2024, 0, 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      headers.push(format(d, 'EEE', { locale: dateLocale }));
    }

    if (!browserNow) {
      return {
        days: [] as DayDataProps[],
        weeks: [] as (DayDataProps | null)[][],
        weekdayHeaders: headers,
        yMax: undefined,
      };
    }

    const today = new Date(browserNow);
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - HISTORY_WINDOW_DAYS);

    const historyMap = new Map((history ?? []).map((d) => [d.date, d]));
    const scheduleMap = new Map((schedule ?? []).map((s) => [s.date, s]));

    const computed: DayDataProps[] = eachDayOfInterval({ start, end: today }).map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const historyData = historyMap.get(dateStr);
      const scheduleData = scheduleMap.get(dateStr);
      const hasHistory = !!historyData?.hourlyP90 && historyData.hourlyP90.length > 1;
      const isToday = dateStr === format(today, 'yyyy-MM-dd');

      let attractionStatus: DayDataProps['attractionStatus'] = 'UNKNOWN';
      if (hasHistory) {
        attractionStatus = 'OPEN';
      } else if (scheduleData) {
        if (scheduleData.scheduleType !== 'OPERATING') {
          attractionStatus = 'PARK_CLOSED';
        } else if (isToday) {
          attractionStatus = 'NOT_YET_OPEN';
        } else if (date < today) {
          attractionStatus = 'CLOSED_RIDE';
        }
      }

      return { dateStr, historyData, scheduleData, attractionStatus, isToday };
    });

    // Weekday-aligned rows: pad the first week to Monday and the last one out to seven, so every
    // column is one weekday down the whole grid.
    const first = new Date(start);
    const lead = Math.round(
      (first.getTime() - startOfWeek(first, { weekStartsOn: 1 }).getTime()) / 86_400_000
    );
    const cells: (DayDataProps | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...computed,
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const computedWeeks: (DayDataProps | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) computedWeeks.push(cells.slice(i, i + 7));

    const peak = computed.reduce((max, d) => {
      for (const p of d.historyData?.hourlyP90 ?? []) if (p.value > max) max = p.value;
      return max;
    }, 0);

    return {
      days: computed,
      weeks: computedWeeks,
      weekdayHeaders: headers,
      yMax: peak > 0 ? peak : undefined,
    };
  }, [browserNow, history, schedule, dateLocale]);

  // The clock arrives one commit AFTER this component mounts — `useBrowserNow` sets it from an
  // effect — and until it does `days` is empty, so the grid would paint its two containers and
  // nothing inside them: the box the placeholder was holding is given up and taken back a frame
  // later. Measured on Taron before this guard: the chapter went 1072 → 212 → 1064 px at 1440
  // (657 ms, then 700 ms) and 2251 → 235 → 2258 px at 390, which `measure:cls --late --scroll`
  // scored as two shifts of 0.19 each with the reader parked at the chapter. So keep holding the
  // same box the panel reserved — the placeholder reads it from the panel's own custom
  // properties, so there is one number here, not two that have to agree.
  if (!browserNow) return <AttractionHistoryGridPlaceholder />;

  // Thirty days in which the ride never once ran. The grid would be a wall of grey tiles saying
  // the same thing thirty-one times, so it says it once.
  if (browserNow && days.length > 0 && !days.some((d) => d.attractionStatus === 'OPEN')) {
    return <p className="text-muted-foreground text-sm">{t('noHistoryData')}</p>;
  }

  return (
    <>
      {/* List below `lg`: newest first. */}
      <div className="grid grid-cols-2 gap-2 lg:hidden">
        {!isDesktop &&
          days
            .slice()
            .reverse()
            .map((day) => <HistoryDay key={day.dateStr} day={day} yMax={yMax} />)}
      </div>

      {/* Calendar from `lg` up: one weekday per column, oldest week first, today in the last row. */}
      <div className="hidden lg:block">
        <div className="mb-2 grid grid-cols-7 gap-2">
          {weekdayHeaders.map((header) => (
            <div key={header} className="text-muted-foreground text-center text-sm font-medium">
              {header}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {isDesktop &&
            weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 items-stretch gap-2">
                {week.map((day, dayIdx) =>
                  day ? (
                    <HistoryDay key={day.dateStr} day={day} yMax={yMax} />
                  ) : (
                    <div key={`empty-${weekIdx}-${dayIdx}`} className="h-full" />
                  )
                )}
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
