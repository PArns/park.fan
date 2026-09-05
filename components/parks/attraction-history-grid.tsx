'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format, eachDayOfInterval } from 'date-fns';
import { de, enUS, es, fr, it, nl, type Locale } from 'date-fns/locale';
import type { AttractionHistoryDay, ScheduleItem } from '@/lib/api/types';
import { AttractionHistoryDay as HistoryDay, type DayDataProps } from './attraction-history-day';
import { HISTORY_WINDOW_DAYS } from '@/lib/parks/attraction-history-geometry';

interface AttractionHistoryGridProps {
  history?: AttractionHistoryDay[];
  schedule?: ScheduleItem[];
  /**
   * Today in the PARK's timezone (`yyyy-MM-dd`), resolved on the server.
   *
   * The same string the panel's reservation is computed from, and that is the point: the grid
   * used to build its window from `new Date(browserNow)` at the VISITOR's local midnight, so the
   * two disagreed by a day whenever the reader was on the other side of the park's date line —
   * an afternoon in Los Angeles looking at a European park is enough. A day's difference flips
   * the window's start weekday, which flips five week rows to six, which is a 172 px shift the
   * moment the grid replaces the placeholder. Two weekdays in seven, so roughly 29 % of days.
   *
   * It also fixes what the cells SAY: „HEUTE" now lands on the day the park is on, the same day
   * the typical/busy pair and the rope-drop card on this page already use.
   */
  todayIso: string;
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
export function AttractionHistoryGrid({ history, schedule, todayIso }: AttractionHistoryGridProps) {
  const locale = useLocale();
  const t = useTranslations('attractions');
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

    // Built in UTC off the park's own date string. A local `new Date(y, m, d)` in a zone whose
    // DST jump lands at midnight resolves to the previous day, which would silently drop a row —
    // the same trap `attraction-history-geometry` documents on the other half of this pair.
    const [ty, tm, td] = todayIso.split('-').map(Number);
    const today = new Date(Date.UTC(ty, tm - 1, td));
    const start = new Date(today.getTime() - HISTORY_WINDOW_DAYS * 86_400_000);

    const historyMap = new Map((history ?? []).map((d) => [d.date, d]));
    const scheduleMap = new Map((schedule ?? []).map((s) => [s.date, s]));

    const computed: DayDataProps[] = eachDayOfInterval({ start, end: today }).map((date) => {
      // `formatInTimeZone`-free and `UTC`-consistent: `eachDayOfInterval` walks UTC midnights
      // here, so the local `format` would name the previous day west of Greenwich.
      const dateStr = date.toISOString().slice(0, 10);
      const historyData = historyMap.get(dateStr);
      const scheduleData = scheduleMap.get(dateStr);
      const hasHistory = !!historyData?.hourlyP90 && historyData.hourlyP90.length > 1;
      const isToday = dateStr === todayIso;

      let attractionStatus: DayDataProps['attractionStatus'] = 'UNKNOWN';
      if (hasHistory) {
        attractionStatus = 'OPEN';
      } else if (scheduleData) {
        if (scheduleData.scheduleType !== 'OPERATING') {
          attractionStatus = 'PARK_CLOSED';
        } else if (isToday) {
          attractionStatus = 'NOT_YET_OPEN';
        } else if (date.getTime() < today.getTime()) {
          attractionStatus = 'CLOSED_RIDE';
        }
      }

      return { dateStr, historyData, scheduleData, attractionStatus, isToday };
    });

    // Weekday-aligned rows: pad the first week to Monday and the last one out to seven, so every
    // column is one weekday down the whole grid.
    // getUTCDay: 0 = Sunday. Monday-first means Monday → 0 and Sunday → 6 — the same expression
    // `historyWeekRows` uses, so the reservation and the grid cannot count different rows.
    const lead = (start.getUTCDay() + 6) % 7;
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
  }, [todayIso, history, schedule, dateLocale]);

  // Thirty days in which the ride never once ran. The grid would be a wall of grey tiles saying
  // the same thing thirty-one times, so it says it once.
  //
  // No `!browserNow` branch above this any more: the window is built from `todayIso`, so the grid
  // is complete on its first render and never gives the reserved box back for a frame. It used to
  // — `useBrowserNow` sets from an effect — and the chapter went 1072 → 212 → 1064 px at 1440 and
  // 2251 → 235 → 2258 px at 390, two shifts of 0.19 with the reader parked on it.
  if (days.length > 0 && !days.some((d) => d.attractionStatus === 'OPEN')) {
    return (
      <p className="text-muted-foreground flex h-full min-h-40 items-center justify-center text-center text-sm">
        {t('noHistoryData')}
      </p>
    );
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
