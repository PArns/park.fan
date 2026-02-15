'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { de, enUS, es, fr, nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Ban, PartyPopper, Backpack, Calendar } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCalendarData } from '@/lib/hooks/use-calendar-data';
import type { IntegratedCalendarResponse, ParkWithAttractions } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ParkCalendarDay } from './park-calendar-day';

interface ParkCalendarGridProps {
  park: ParkWithAttractions;
  initialCalendarData: IntegratedCalendarResponse;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

export function ParkCalendarGrid({
  initialCalendarData,
  continent,
  country,
  city,
  parkSlug,
}: ParkCalendarGridProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('parks');
  const tAttractions = useTranslations('attractions');
  const tCommon = useTranslations('common');

  // Map locale to date-fns locale
  const dateLocale =
    {
      de,
      en: enUS,
      es,
      fr,
      nl,
    }[locale as 'de' | 'en' | 'es' | 'fr' | 'nl'] || enUS;

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch calendar data with React Query (automatic caching)
  const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const {
    data: fetchedCalendarData,
    isLoading,
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

  // Use fetched data if available, otherwise fall back to initial data
  const calendarData = fetchedCalendarData || initialCalendarData;

  // Read month from URL hash on mount (e.g., #calendar-2026-01)
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#calendar-(\d{4})-(\d{2})$/);
    if (match) {
      const [, year, month] = match;
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentMonth(parsedDate);
        // React Query will automatically fetch when currentMonth changes
      }
    } else {
      // Set hash to current month
      const monthHash = `calendar-${format(currentMonth, 'yyyy-MM')}`;
      window.history.replaceState(null, '', `${pathname}#${monthHash}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle month navigation
  const handleMonthChange = (direction: 'next' | 'prev') => {
    const newMonth = direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);

    // Update hash when user navigates
    const monthHash = `calendar-${format(newMonth, 'yyyy-MM')}`;
    window.history.replaceState(null, '', `${pathname}#${monthHash}`);

    // React Query will automatically fetch when currentMonth changes (from/to change)
  };

  // Calculate date range for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Create a map of calendar data by date for quick lookup
  const calendarMap = useMemo(() => {
    const map = new Map();
    if (calendarData?.days) {
      calendarData.days.forEach((day) => {
        map.set(day.date, day);
      });
    }
    return map;
  }, [calendarData]);

  // Generate all days in the month and group into weeks
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weeks: ((typeof allDays)[0] | null)[][] = [];
  let currentWeek: ((typeof allDays)[0] | null)[] = [];

  // Find the start of the week (Monday) for the first day
  const firstDay = allDays[0];
  const weekStart = startOfWeek(firstDay, { weekStartsOn: 1, locale: dateLocale });
  const daysBeforeFirst = Math.floor(
    (firstDay.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Add empty cells for days before the first day in the month
  for (let i = 0; i < daysBeforeFirst; i++) {
    currentWeek.push(null);
  }

  allDays.forEach((day) => {
    const dayOfWeek = getDay(day);
    const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    if (mondayBasedDay === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [day];
    } else {
      currentWeek.push(day);
    }
  });

  // Add the last week if it has days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Weekday headers (Monday to Sunday)
  const weekdayHeaders: string[] = [];
  const monday = new Date(2024, 0, 1); // 2024-01-01 is a Monday
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekdayHeaders.push(format(date, 'EEE', { locale: dateLocale }));
  }

  // For mobile: reverse order (newest first)
  const reversedDays = [...allDays].reverse();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card className="relative p-4 md:p-6">
      <div className="space-y-4">
        {/* Header with title and navigation */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold">{t('crowdCalendar')}</h2>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMonthChange('prev')}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[140px] text-center font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMonthChange('next')}
              disabled={isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 p-3 dark:bg-red-950/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {tCommon('failedToLoadCalendar')}
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 rounded-md border border-red-500 bg-red-50/50 px-2 py-1 dark:bg-red-950/20">
            <Ban className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
            <span className="text-xs">{tAttractions('historyLegend.closed')}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-orange-500 bg-white px-2 py-1 dark:bg-gray-900/50">
            <PartyPopper className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
            <span className="text-xs">{tAttractions('historyLegend.holiday')}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-yellow-500 bg-white px-2 py-1 dark:bg-gray-900/50">
            <Backpack className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs">{tAttractions('historyLegend.schoolVacation')}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-blue-500 bg-white px-2 py-1 dark:bg-gray-900/50">
            <Calendar className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            <span className="text-xs">{tAttractions('historyLegend.bridgeDay')}</span>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {/* Desktop Skeleton */}
            <div className="hidden md:block">
              {/* Weekday Headers Skeleton */}
              <div className="mb-2 grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
              {/* Calendar Grid Skeleton */}
              {Array.from({ length: 5 }).map((_, weekIdx) => (
                <div key={weekIdx} className="mb-2 grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, dayIdx) => (
                    <Skeleton key={dayIdx} className="h-32 w-full" />
                  ))}
                </div>
              ))}
            </div>
            {/* Mobile Skeleton */}
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        {!isLoading && (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Weekday Headers - Desktop Only */}
              <div className="mb-2 hidden grid-cols-7 gap-2 md:grid">
                {weekdayHeaders.map((header, idx) => (
                  <div key={idx} className="text-muted-foreground text-center text-sm font-medium">
                    {header}
                  </div>
                ))}
              </div>

              {/* Mobile View: Reversed List (Newest First) */}
              <div className="grid grid-cols-2 gap-3 md:hidden">
                {reversedDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayData = calendarMap.get(dateStr);

                  if (!dayData) return null;

                  const isToday =
                    day.getFullYear() === today.getFullYear() &&
                    day.getMonth() === today.getMonth() &&
                    day.getDate() === today.getDate();

                  return <ParkCalendarDay key={dateStr} day={dayData} isToday={isToday} />;
                })}
              </div>

              {/* Desktop View: Standard Weeks */}
              <div className="hidden space-y-2 md:block">
                {weeks.map((week, weekIdx) => (
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

                      return <ParkCalendarDay key={dateStr} day={dayData} isToday={isToday} />;
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
