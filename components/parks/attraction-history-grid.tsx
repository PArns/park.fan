'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { eachDayOfInterval } from 'date-fns';
import type { AttractionHistoryDay, ScheduleItem } from '@/lib/api/types';
import { AttractionHistoryDay as HistoryDay, type DayDataProps } from './attraction-history-day';
import { HISTORY_WINDOW_DAYS } from '@/lib/parks/attraction-history-geometry';

interface AttractionHistoryGridProps {
  history?: AttractionHistoryDay[];
  schedule?: ScheduleItem[];
  /**
   * Today in the PARK's timezone (`yyyy-MM-dd`), resolved on the server.
   *
   * The same string the panel's reservation is computed from: a window built from the visitor's
   * clock can be a day off, which can turn five rows into six and shift the page when the grid
   * replaces the placeholder. It also puts „today" on the park's day.
   */
  todayIso: string;
}

/**
 * The ride's 30-day wait-time history: today first, then backwards.
 *
 * Not laid out like the park's month grid: that one is a forecast read forwards by weekday, this
 * one is a record read from today outwards, so no weekday alignment and the newest reading comes
 * first. It shares the park calendar's cell and legend. One `yMax` across every cell, because
 * `Sparkline` fits each instance to its own maximum and a flat day would look like a peak.
 */
export function AttractionHistoryGrid({ history, schedule, todayIso }: AttractionHistoryGridProps) {
  const t = useTranslations('attractions');
  const { days, yMax } = useMemo(() => {
    // Built in UTC off the park's own date string. A local `new Date(y, m, d)` in a zone whose
    // DST jump lands at midnight resolves to the previous day, which would silently drop a day.
    const [ty, tm, td] = todayIso.split('-').map(Number);
    const today = new Date(Date.UTC(ty, tm - 1, td));
    const start = new Date(today.getTime() - HISTORY_WINDOW_DAYS * 86_400_000);

    const historyMap = new Map((history ?? []).map((d) => [d.date, d]));
    const scheduleMap = new Map((schedule ?? []).map((s) => [s.date, s]));

    const computed: DayDataProps[] = eachDayOfInterval({ start, end: today }).map((date) => {
      // `eachDayOfInterval` walks UTC midnights here, so a local `format` would name the previous
      // day west of Greenwich.
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

    const peak = computed.reduce((max, d) => {
      for (const p of d.historyData?.hourlyP90 ?? []) if (p.value > max) max = p.value;
      return max;
    }, 0);

    // Today first. `computed` is built forwards because that is how a date range walks; the grid
    // reads the other way.
    return { days: computed.reverse(), yMax: peak > 0 ? peak : undefined };
  }, [todayIso, history, schedule]);

  // Thirty days in which the ride never once ran. The grid would be a wall of grey tiles saying
  // the same thing thirty-one times, so it says it once.
  if (days.length > 0 && !days.some((d) => d.attractionStatus === 'OPEN')) {
    return (
      <p className="text-muted-foreground flex h-full min-h-40 items-center justify-center text-center text-sm">
        {t('noHistoryData')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 @min-[1024px]/page:grid-cols-7">
      {days.map((day) => (
        <HistoryDay key={day.dateStr} day={day} yMax={yMax} />
      ))}
    </div>
  );
}
