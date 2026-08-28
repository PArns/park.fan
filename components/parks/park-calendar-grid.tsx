'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
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
import { de, enUS, es, fr, it, nl } from 'date-fns/locale';
import { Info } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCalendarData } from '@/lib/hooks/use-calendar-data';
import { extremeCandidates, rankOf } from '@/lib/parks/calendar-month-summary';
import type { CalendarDay } from '@/lib/api/types';
import { CROWD_LEVEL_ORDER } from '@/lib/utils/crowd-level-styles';
import { parkCalendarPath, type ParkCalendarMonth } from '@/lib/parks/calendar-segments';
import type { IntegratedCalendarResponse, ParkWithAttractions } from '@/lib/api/types';
import { ParkCalendarGridPlaceholder } from '@/components/parks/park-calendar-grid-placeholder';
import { ParkCalendarDay } from './park-calendar-day';
import { ParkCalendarDayDetail } from './park-calendar-day-detail';

interface ParkCalendarGridProps {
  park: ParkWithAttractions;
  /** Optional SSR seed. When omitted, the grid renders from its own per-month
   *  useCalendarData fetch (calendarData?.days is already null-guarded below). */
  initialCalendarData?: IntegratedCalendarResponse;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /**
   * The month to show, from the URL. `null` on the calendar hub, which shows today's.
   *
   * It used to be component state seeded from `new Date()` and then corrected by an effect that
   * read `#calendar-2026-04` off the location — a month that lived in a hash, was written with
   * `replaceState`, and therefore could not be crawled, could not be a search result and did not
   * answer the back button. It is a path segment now, so the stepper below is two real links and
   * each month is a page.
   */
  month: ParkCalendarMonth | null;
  /** Neighbouring months, already range-checked by the page — `null` means the stepper stops. */
  prevMonth: ParkCalendarMonth | null;
  nextMonth: ParkCalendarMonth | null;
}

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

  // Derived from the URL, not held in state. `month` is null only on the hub, where "this month"
  // is the answer and the browser clock is the right source for it.
  const currentMonth = useMemo(
    () => (month ? new Date(month.year, month.month - 1, 1) : new Date()),
    [month]
  );
  // Selected day for the click-to-open detail panel (weather / forecast /
  // predictions). Touch-friendly replacement for the old hover-only tooltips.
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // The calendar has two structurally different layouts (a reversed 2-col list on mobile, a 7-col
  // week grid on desktop). They used to BOTH live in the DOM toggled by `lg:hidden` / `hidden
  // lg:block`, so every ParkCalendarDay mounted + rendered TWICE (display:none doesn't skip render
  // or hydration). This grid is `ssr: false` (see tabs-with-hash) and only mounts once the calendar
  // tab is opened, so we can pick the layout from the live viewport — no hydration mismatch — and
  // each day card mounts exactly once.
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

  // Fetch calendar data with React Query (automatic caching)
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
    enabled: true, // Always fetch for current month
  });

  // Today-only patch: fetches just today with a short staleTime (5 min) so the crowd level
  // stays in sync with the park overview even when the full-month SSR cache (1h) is stale.
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: todayData } = useCalendarData({
    continent,
    country,
    city,
    parkSlug,
    from: todayStr,
    to: todayStr,
    staleTime: 5 * 60_000,
  });

  // Merge: start from fetched month data (or SSR fallback), then overlay today's fresh day.
  const calendarData = useMemo(() => {
    const base = fetchedCalendarData || initialCalendarData;
    const todayDay = todayData?.days?.[0];
    if (!base || !todayDay) return base;
    return {
      ...base,
      days: base.days.map((d) =>
        d.date === todayStr ? { ...d, crowdLevel: todayDay.crowdLevel } : d
      ),
    };
  }, [fetchedCalendarData, initialCalendarData, todayData, todayStr]);

  const monthHref = (m: ParkCalendarMonth | null) =>
    m ? parkCalendarPath(locale, continent, country, city, parkSlug, m) : null;

  // Flip a day forward/back from inside the detail dialog. Crossing a month boundary navigates to
  // that month's PAGE, because the month is a URL now — the dialog keeps showing the previous day
  // dimmed until the new month's data lands (see ParkCalendarDayDetail's lastDay retention).
  const handleDayNavigate = (direction: -1 | 1) => {
    if (!selectedDate) return;
    const target = format(addDays(parseISO(selectedDate), direction), 'yyyy-MM-dd');
    setSelectedDate(target);
    if (target.slice(0, 7) !== format(currentMonth, 'yyyy-MM')) {
      const href = monthHref(direction === 1 ? nextMonth : prevMonth);
      if (href) router.push(href);
    }
  };

  // Memoize expensive calendar layout calculations — only recalculate when month or locale changes
  const { weeks, weekdayHeaders, listDays } = useMemo(() => {
    // Compute start/end inside the memo so Date object identity doesn't cause spurious invalidation
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

  // Create a map of calendar data by date for quick lookup
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
   * How far below the month's median a day must rank before it is worth a star, in units of
   * `rankOf` — where 1.0 is one crowd bucket and the fractional part is the headliner wait scaled
   * over two hours.
   *
   * Half a bucket. Below that the badge marks noise: a month whose days all forecast `low` and
   * differ only by five minutes of queue would otherwise have half of itself recommended.
   */
  const BEST_DAY_MARGIN = 0.5;

  /**
   * The days that get the „Empfohlen" star — the ones that stand out, not the ones that tie.
   *
   * This used to mark every candidate sitting at the month's lowest crowd BUCKET, and on a month
   * where the bucket does not vary that is the whole month: measured on Phantasialand's November
   * 2026, thirty days all forecast `low` and **23 of them wore the badge**. A recommendation that
   * applies to three quarters of the month recommends nothing, and it contradicted the summary
   * directly above the grid, which applies a median test and therefore said the month has no
   * quiet day at all. Two answers to one question, on one page.
   *
   * So the same ranking as `summarizeCalendarMonth`, from the same `rankOf`: the crowd bucket with
   * the headliner wait as the tie-break (the API sends no `crowdScore` — 0 of 30 days — so the
   * wait is the only continuous signal that actually arrives). And a day has to beat the month's
   * median by BEST_DAY_MARGIN, not merely beat it: "strictly below the median" still badged 13 of
   * November's 29 candidates, and what separated them was 30 minutes of headliner wait against
   * 35. Five minutes is not a recommendation.
   *
   * Half a crowd bucket is. Measured across four months of Phantasialand, that is the difference
   * between a month with something to say and one without:
   *
   * ```
   *   2026-09   29 candidates   ranks 0.21-3.50   12 badges
   *   2026-10   15 candidates   ranks 0.21-3.50    7 badges
   *   2026-11   29 candidates   ranks 1.25-1.29    0 badges
   *   2026-12   22 candidates   ranks 1.25-1.29    0 badges
   * ```
   *
   * No separate cap on the count: "below the median" already bounds it at half the month, and the
   * margin does the rest of the work.
   */
  const bestDayDates = useMemo(() => {
    // The SAME candidate set the summary sentence above the grid uses — `extremeCandidates`. The
    // two had their own lists until a review caught it: the grid dropped school and public
    // holidays and kept today, the summary did the reverse, so their medians were computed over
    // different populations and they could name different days on one page. A quiet Whit Monday
    // is still the month's quietest day.
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    /* No <Card> around this any more: the box lives in `ParkCalendarPanel`, because the month
       stepper has to be INSIDE it and cannot be inside this component — this is a `ssr: false`
       import and anything in here is missing from the served HTML, which for two <a> tags means
       a crawler arriving at one month finds no way to any other. So the panel renders the card,
       puts the server-rendered stepper in it, and drops this grid in underneath. */
    <>
      <div className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 p-3 dark:bg-red-950/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {tCommon('failedToLoadCalendar')}
            </p>
          </div>
        )}

        {/* Disclaimer for parks without official schedule */}
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

        {/* The SAME box the `next/dynamic` loading showed a moment ago, and now the same box
          exactly: the legend that used to sit above this moved up into the panel's control row,
          so the two waits no longer differ by a row one of them draws and the other does not. */}
        {isLoading && <ParkCalendarGridPlaceholder />}

        {/* Calendar Grid — dimmed while the previous month is shown as placeholder during a
            month-navigation fetch (keepPreviousData), instead of flashing back to the skeleton. */}
        {!isLoading && (
          <div
            className={`overflow-x-auto transition-opacity ${isPlaceholderData ? 'opacity-50' : ''}`}
          >
            <div className="inline-block min-w-full">
              {/* Weekday Headers - Desktop Only */}
              <div className="mb-2 hidden grid-cols-7 gap-2 lg:grid">
                {weekdayHeaders.map((header, idx) => (
                  <div key={idx} className="text-muted-foreground text-center text-sm font-medium">
                    {header}
                  </div>
                ))}
              </div>

              {/* Mobile View: Reversed List (Newest First) */}
              <div className="grid grid-cols-2 gap-2 pt-3 lg:hidden">
                {!isDesktop &&
                  listDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayData = calendarMap.get(dateStr);

                    if (!dayData) return null;

                    const isToday =
                      day.getFullYear() === today.getFullYear() &&
                      day.getMonth() === today.getMonth() &&
                      day.getDate() === today.getDate();

                    return (
                      <ParkCalendarDay
                        key={dateStr}
                        day={dayData}
                        parkTimezone={parkTimezone}
                        isToday={isToday}
                        isBest={bestDayDates.has(dateStr)}
                        onSelect={setSelectedDate}
                      />
                    );
                  })}
              </div>

              {/* Desktop View: Standard Weeks */}
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

                        const isToday =
                          day.getFullYear() === today.getFullYear() &&
                          day.getMonth() === today.getMonth() &&
                          day.getDate() === today.getDate();

                        return (
                          <ParkCalendarDay
                            key={dateStr}
                            day={dayData}
                            parkTimezone={parkTimezone}
                            isToday={isToday}
                            isBest={bestDayDates.has(dateStr)}
                            onSelect={setSelectedDate}
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

      {/* Click-to-open day detail (weather + forecast + predictions) — works on
          touch and desktop, unlike the calendar's former hover-only tooltips.
          Prev/next flips days without leaving the dialog (incl. month crossing). */}
      <ParkCalendarDayDetail
        day={selectedDate ? (calendarMap.get(selectedDate) ?? null) : null}
        parkTimezone={parkTimezone}
        open={selectedDate !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedDate(null);
        }}
        onNavigate={handleDayNavigate}
      />
    </>
  );
}
