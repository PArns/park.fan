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
 * The ride's 30-day wait-time history: today first, then backwards.
 *
 * It is NOT the park's month grid and must not be laid out like one. That grid is a forecast over
 * a calendar month, so it aligns to weekday columns and reads forwards — the question there is
 * „welchen Tag buche ich". This one is a record of what already happened, and the question is
 * „was war hier zuletzt los", which is answered from today outwards. Aligning it to weekdays was
 * tried and reverted: it put the oldest week at the top, so the newest reading — the only one a
 * visitor standing in the park cares about — ended up at the bottom of a two-thousand-pixel
 * block, and the days ran forwards through a chapter titled „Verlauf".
 *
 * What it DOES take from the park calendar is the cell: the same `CROWD_TILE_CLASS` fill, the
 * same four-signal bar, the same oversized day number and one-word verdict, and the same legend
 * explaining them. The two grids answer different questions in the same visual language, which is
 * the point — the layout is where they differ, because the question differs.
 *
 * Seven per row from `md` up, two below it. One `yMax` across every cell: `Sparkline` fits each
 * instance to its own maximum, so without it a flat twenty-minute Tuesday is drawn exactly as
 * dramatically as a hundred-minute Saturday and the grid says the opposite of what the data says.
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
    // One flow, today first. No weekday alignment and no week rows: this is a history, and a
    // reader looking at a chapter called „Verlauf" starts from the most recent day. See the
    // component docblock for why the park's month grid is laid out the other way.
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-7">
      {days.map((day) => (
        <HistoryDay key={day.dateStr} day={day} yMax={yMax} />
      ))}
    </div>
  );
}
