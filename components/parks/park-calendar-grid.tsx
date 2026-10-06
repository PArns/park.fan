'use client';

import { useCallback, useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { useRouter, getPathname } from '@/i18n/navigation';
import { suppressScrollToTopFor } from '@/lib/navigation/history-navigation';
import {
  addDays,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  getDay,
} from 'date-fns';
import { Info } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCalendarData } from '@/lib/hooks/use-calendar-data';
import { extremeCandidates, rankOf } from '@/lib/parks/calendar-month-summary';
import type { CalendarDay } from '@/lib/api/types';
import { CROWD_LEVEL_ORDER } from '@/lib/utils/crowd-level-styles';
import { parkDayOf } from '@/lib/utils/park-day';
import { dateFnsLocale } from '@/lib/utils/date-fns-locale';
import { parkCalendarPath, type ParkCalendarMonth } from '@/lib/parks/calendar-segments';
import type { IntegratedCalendarResponse, ParkWithAttractions } from '@/lib/api/types';
import { ParkCalendarGridPlaceholder } from '@/components/parks/park-calendar-grid-placeholder';
import { dayComparisonStore } from '@/lib/parks/day-comparison-store';
import { ParkCalendarComparison } from './park-calendar-comparison';
import { ParkCalendarDay } from './park-calendar-day';
import { ParkCalendarDayDetail } from './park-calendar-day-detail';

interface ParkCalendarGridProps {
  park: ParkWithAttractions;
  /**
   * Optional SSR seed. Without it the grid renders from its own per-month `useCalendarData` fetch.
   */
  initialCalendarData?: IntegratedCalendarResponse;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /**
   * The month to show, from the URL; `null` on the calendar hub, which shows today's. A path
   * segment rather than state or a hash, so every month is a crawlable page and the stepper is two
   * real links.
   */
  month: ParkCalendarMonth | null;
  /** Neighbouring months, already range-checked by the page — `null` means the stepper stops. */
  prevMonth: ParkCalendarMonth | null;
  nextMonth: ParkCalendarMonth | null;
}

/**
 * The park's crowd calendar for one month: a week grid on desktop, a two-column list on phones, a
 * detail panel for the tapped day and a two-day comparison. Client only (`ssr: false`); the month
 * comes from the URL.
 */
export function ParkCalendarGrid({
  park,
  initialCalendarData,
  continent,
  country,
  city,
  parkSlug,
  month,
  prevMonth,
  nextMonth,
}: ParkCalendarGridProps) {
  const locale = useLocale();
  const parkTimezone = park.timezone ?? 'UTC';
  const router = useRouter();
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');

  const dateLocale = dateFnsLocale(locale);

  // Derived from the URL, not held in state. `month` is null only on the hub, where "this month"
  // is the answer and the browser clock is the right source for it.
  const currentMonth = useMemo(
    () => (month ? new Date(month.year, month.month - 1, 1) : new Date()),
    [month]
  );
  // Selected day for the click-to-open detail panel, which unlike a hover tooltip works on touch.
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /**
   * The comparison's two picks, held outside this component (see `day-comparison-store.ts`). A
   * month change is a route navigation that unmounts this grid, and comparing days from two months
   * is the case the feature exists for.
   */
  const selection = useSyncExternalStore(
    dayComparisonStore.subscribe,
    // Wrapped, because `useSyncExternalStore` calls the getter on every render and compares by
    // identity; the store returns one frozen `IDLE` for a miss.
    useCallback(() => dayComparisonStore.getSnapshot(parkSlug), [parkSlug]),
    dayComparisonStore.getServerSnapshot
  );
  const comparing = selection.active;
  const pickedDates = useMemo(() => selection.days.map((d) => d.date), [selection.days]);

  /**
   * Whether the comparison is on screen. The dialog opens on the second pick, so "two days are
   * selected" cannot also keep it open: closing it would bring it straight back. The dismissed pair
   * is remembered instead, in the store because this component unmounts on a month change.
   */
  const pairKey = pickedDates.join('|');
  const comparisonOpen = selection.days.length === 2 && selection.dismissed !== pairKey;

  // Two structurally different layouts (a two-column list on phones, a seven-column week grid on
  // desktop), picked from the live viewport so each day card mounts once. This grid is
  // `ssr: false`, so there is no hydration mismatch.
  //
  // This switch stays on the window, not `@container/page`: the `lg:` classes and this query are
  // one decision, and converting only the classes leaves an open trip planner showing neither
  // layout. The day card's `lg:` classes and <ParkCalendarGridPlaceholder> follow it.
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const {
    data: fetchedCalendarData,
    isLoading,
    isPlaceholderData,
    error,
  } = useCalendarData({
    continent,
    country,
    city,
    parkSlug,
    from,
    to,
    enabled: true,
  });

  /**
   * Today in the park's timezone, never the browser's: a Florida park is still on yesterday for six
   * hours after midnight in Berlin, and this decides the HEUTE badge, the „Empfohlen" candidates
   * and the month's median. Memoised because `new Date()` in a render body is a new value on every
   * pass.
   */
  const todayStr = useMemo(() => parkDayOf(new Date(), parkTimezone), [parkTimezone]);

  const calendarData = fetchedCalendarData || initialCalendarData;

  const monthHref = (m: ParkCalendarMonth | null) =>
    m ? parkCalendarPath(locale, continent, country, city, parkSlug, m) : null;

  // Flip a day forward or back from inside the detail dialog. Crossing a month boundary navigates
  // to that month's page, and the dialog keeps the previous day dimmed until the new month lands.
  //
  // `{ scroll: false }` + `suppressScrollToTopFor`, the same pair `MonthStep` uses in
  // `ParkCalendarPanel`: without it, swiping through the days into a new month put a phone reader
  // back at the park's title card.
  const handleDayNavigate = (direction: -1 | 1) => {
    if (!selectedDate) return;
    const target = format(addDays(parseISO(selectedDate), direction), 'yyyy-MM-dd');
    setSelectedDate(target);
    if (target.slice(0, 7) !== format(currentMonth, 'yyyy-MM')) {
      const href = monthHref(direction === 1 ? nextMonth : prevMonth);
      if (href) {
        suppressScrollToTopFor(getPathname({ href, locale }));
        router.push(href, { scroll: false });
      }
    }
  };

  const { weeks, weekdayHeaders, listDays } = useMemo(() => {
    // Start and end inside the memo, so Date identity does not invalidate it.
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });

    const computedWeeks: ((typeof allDays)[0] | null)[][] = [];
    let currentWeek: ((typeof allDays)[0] | null)[] = [];

    const firstDay = allDays[0];
    const weekStart = startOfWeek(firstDay, { weekStartsOn: 1, locale: dateLocale });
    const daysBeforeFirst = Math.floor(
      (firstDay.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (let i = 0; i < daysBeforeFirst; i++) {
      currentWeek.push(null);
    }

    allDays.forEach((day) => {
      const dayOfWeek = getDay(day);
      const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      if (mondayBasedDay === 0 && currentWeek.length > 0) {
        computedWeeks.push(currentWeek);
        currentWeek = [day];
      } else {
        currentWeek.push(day);
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      computedWeeks.push(currentWeek);
    }

    const computedHeaders: string[] = [];
    const monday = new Date(2024, 0, 1);
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      computedHeaders.push(format(date, 'EEE', { locale: dateLocale }));
    }

    return {
      weeks: computedWeeks,
      weekdayHeaders: computedHeaders,
      listDays: allDays,
    };
  }, [currentMonth, dateLocale]);

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    if (calendarData?.days) {
      calendarData.days.forEach((day) => {
        map.set(day.date, day);
      });
    }
    return map;
  }, [calendarData]);

  /**
   * One handler for a press on a day tile: it picks in comparison mode and opens the detail dialog
   * otherwise. The tile is memoised and takes one `onSelect(date)`, so the decision is made here
   * instead of in a closure per cell.
   *
   * The whole `CalendarDay` goes into the store, because after a month step `calendarMap` no longer
   * holds it.
   */
  const handleDayPress = useCallback(
    (date: string) => {
      if (!comparing) {
        setSelectedDate(date);
        return;
      }
      const day = calendarMap.get(date);
      if (day) dayComparisonStore.toggle(parkSlug, day);
    },
    [comparing, calendarMap, parkSlug]
  );

  /**
   * How far below the month's median a day must rank before it gets a star, in `rankOf` units (1.0
   * is one crowd bucket). Half a bucket: below that the badge marks noise, and a month of `low`
   * days that differ by five minutes of queue would have half of itself recommended.
   */
  const BEST_DAY_MARGIN = 0.5;

  /**
   * The days that get the „Empfohlen" star: the ones that stand out, not the ones that tie. The
   * same ranking as `summarizeCalendarMonth`, from the same `rankOf` (crowd bucket, headliner wait
   * as the tie-break, since the API sends no `crowdScore`), so the grid and the summary above it
   * never disagree.
   *
   * A day has to beat the median by `BEST_DAY_MARGIN`, not merely beat it: on a flat month the
   * lowest bucket is the whole month, and a recommendation that applies to most of it recommends
   * nothing. "Below the median" already caps the count at half the month.
   */
  const bestDayDates = useMemo(() => {
    // The same candidate set the summary sentence uses, `extremeCandidates`, so both medians are
    // taken over the same days. A quiet Whit Monday is still the month's quietest day.
    const all = Array.from(calendarMap.values()) as CalendarDay[];
    const lastDate = all.reduce((acc, d) => (d.date > acc ? d.date : acc), all[0]?.date ?? '');
    const monthIsPast = !!lastDate && lastDate < todayStr;
    const ranked = extremeCandidates(all, todayStr, monthIsPast).map((d) => ({
      date: d.date,
      rank: rankOf(
        d,
        CROWD_LEVEL_ORDER.indexOf(d.crowdLevel as (typeof CROWD_LEVEL_ORDER)[number])
      ),
    }));
    if (ranked.length < 4) return new Set<string>();

    const sorted = ranked.map((d) => d.rank).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

    return new Set<string>(
      ranked.filter((d) => d.rank <= median - BEST_DAY_MARGIN).map((d) => d.date)
    );
  }, [calendarMap, todayStr]);

  return (
    /*
     * The card lives in `ParkCalendarPanel`: the month stepper has to sit inside it and be
     * server-rendered so a crawler can reach the other months, and this grid is `ssr: false`.
     */
    <>
      <div className="space-y-4">
        {/* What comparison mode is doing, right above the tiles. The switch itself is in the card's
            heading band because it is server-rendered there. Rendered only while the mode is on, so
            at first paint the grid draws exactly the box `--cal-grid-h*` promised. */}
        {comparing && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-muted-foreground text-xs">
              {selection.days.length === 0
                ? t('dayComparison.hintNone')
                : selection.days.length === 1
                  ? t('dayComparison.hintOne')
                  : t('dayComparison.hintTwo')}
            </p>
            {selection.days.length > 0 && (
              <div className="ml-auto flex shrink-0 items-center gap-3">
                {selection.days.length === 2 && !comparisonOpen && (
                  <button
                    type="button"
                    onClick={() => dayComparisonStore.dismiss(parkSlug, null)}
                    className="text-primary text-xs font-medium hover:underline max-sm:min-h-11"
                  >
                    {t('dayComparison.reopen')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dayComparisonStore.clearDays(parkSlug)}
                  className="text-muted-foreground hover:text-foreground text-xs max-sm:min-h-11"
                >
                  {t('dayComparison.reset')}
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 p-3 dark:bg-red-950/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {tCommon('failedToLoadCalendar')}
            </p>
          </div>
        )}

        {!isLoading && calendarData?.meta?.hasOperatingSchedule === false && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
            <div className="flex items-start gap-2 text-blue-700 dark:text-blue-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm">
                {t('calendarView.details.schedule.noOfficialScheduleDisclaimer')}
              </p>
            </div>
          </div>
        )}

        {/* The same box the `next/dynamic` loading showed a moment ago, so the two waits do not
            shift the page. */}
        {isLoading && <ParkCalendarGridPlaceholder />}

        {/* Dimmed while the previous month stands in during a month-navigation fetch
            (keepPreviousData), instead of flashing back to the skeleton. */}
        {!isLoading && (
          <div
            className={`overflow-x-auto transition-opacity ${isPlaceholderData ? 'opacity-50' : ''}`}
          >
            <div className="inline-block min-w-full">
              <div className="mb-2 hidden grid-cols-7 gap-2 lg:grid">
                {weekdayHeaders.map((header, idx) => (
                  <div key={idx} className="text-muted-foreground text-center text-sm font-medium">
                    {header}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 lg:hidden">
                {!isDesktop &&
                  listDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayData = calendarMap.get(dateStr);

                    if (!dayData) return null;

                    const isToday = dateStr === todayStr;

                    return (
                      <ParkCalendarDay
                        key={dateStr}
                        day={dayData}
                        parkTimezone={parkTimezone}
                        isToday={isToday}
                        isBest={bestDayDates.has(dateStr)}
                        onSelect={handleDayPress}
                        selectable={comparing}
                        selectionIndex={selectionIndexOf(pickedDates, dateStr)}
                      />
                    );
                  })}
              </div>

              <div className="hidden space-y-2 pt-3 lg:block">
                {isDesktop &&
                  weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="grid grid-cols-7 items-stretch gap-2">
                      {week.map((day, dayIdx) => {
                        if (!day) {
                          return <div key={`empty-${weekIdx}-${dayIdx}`} className="h-full"></div>;
                        }

                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayData = calendarMap.get(dateStr);

                        if (!dayData) {
                          return <div key={dateStr} className="h-full"></div>;
                        }

                        const isToday = dateStr === todayStr;

                        return (
                          <ParkCalendarDay
                            key={dateStr}
                            day={dayData}
                            parkTimezone={parkTimezone}
                            isToday={isToday}
                            isBest={bestDayDates.has(dateStr)}
                            onSelect={handleDayPress}
                            selectable={comparing}
                            selectionIndex={selectionIndexOf(pickedDates, dateStr)}
                          />
                        );
                      })}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prev/next flips days without leaving the dialog, across a month boundary too. */}
      <ParkCalendarDayDetail
        day={selectedDate ? (calendarMap.get(selectedDate) ?? null) : null}
        parkTimezone={parkTimezone}
        open={selectedDate !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedDate(null);
        }}
        onNavigate={handleDayNavigate}
        planner={{ parkSlug, parkName: park.name, geo: { continent, country, city } }}
      />

      {/* Opens on the second pick and closes to the grid with both days still lit, so the reader
          can swap one and see the new answer. */}
      <ParkCalendarComparison
        a={selection.days[0] ?? null}
        b={selection.days[1] ?? null}
        parkTimezone={parkTimezone}
        todayIso={todayStr}
        open={comparisonOpen}
        onOpenChange={(next) => {
          if (!next) dayComparisonStore.dismiss(parkSlug, pairKey);
        }}
        planner={{ parkSlug, parkName: park.name, geo: { continent, country, city } }}
      />
    </>
  );
}

/**
 * `1` or `2` where a date is one of the two picked, `null` otherwise. A function rather than a
 * `Set` because the order is what the tile draws: the first pick is the comparison's left column.
 */
function selectionIndexOf(picked: readonly string[], date: string): 1 | 2 | null {
  const index = picked.indexOf(date);
  return index === 0 ? 1 : index === 1 ? 2 : null;
}
