'use client';

import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfWeek, getDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import type { AttractionHistoryDay } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { HourlyP90Sparkline } from './hourly-p90-sparkline';
import { Badge } from '@/components/ui/badge';

interface AttractionHistoryGridProps {
  attraction: {
    name: string;
    history?: AttractionHistoryDay[];
  };
}

interface DayData {
  date: Date;
  dateStr: string;
  dayOfWeek: string;
  dayOfMonth: string;
  month: string;
  historyData?: AttractionHistoryDay;
  isClosed: boolean;
  isToday: boolean;
}

export function AttractionHistoryGrid({ attraction }: AttractionHistoryGridProps) {
  const locale = useLocale();
  const t = useTranslations('attractions');
  const tCommon = useTranslations('common');
  const dateLocale = locale === 'de' ? de : enUS;

  // Calculate date range: today to 30 days ago
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { start: thirtyDaysAgo, end: today };
  }, []);

  // Create a map of history data by date for quick lookup
  const historyMap = useMemo(() => {
    const map = new Map<string, AttractionHistoryDay>();
    if (attraction.history) {
      attraction.history.forEach((day) => {
        map.set(day.date, day);
      });
    }
    return map;
  }, [attraction.history]);

  // Generate all days in the range and group into weeks
  const weeks = useMemo(() => {
    const { start, end } = dateRange;
    const allDays = eachDayOfInterval({ start, end });

    // Create day data with history lookup
    const today = dateRange.end;
    const days: DayData[] = allDays.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const historyData = historyMap.get(dateStr);
      const isClosed = !historyData || !historyData.hourlyP90 || historyData.hourlyP90.length <= 1;
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

      return {
        date,
        dateStr,
        dayOfWeek: format(date, 'EEE', { locale: dateLocale }),
        dayOfMonth: format(date, 'd'),
        month: format(date, 'MMM', { locale: dateLocale }),
        historyData,
        isClosed,
        isToday,
      };
    });

    // Group days into weeks (7 columns, Monday to Sunday)
    const weeks: (DayData | null)[][] = [];
    let currentWeek: (DayData | null)[] = [];

    // Find the start of the week (Monday) for the first day
    const firstDay = days[0];
    const weekStart = startOfWeek(firstDay.date, { weekStartsOn: 1, locale: dateLocale }); // 1 = Monday
    const daysBeforeFirst = Math.floor(
      (firstDay.date.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Add empty cells for days before the first day in our range
    for (let i = 0; i < daysBeforeFirst; i++) {
      currentWeek.push(null);
    }

    days.forEach((day) => {
      const dayOfWeek = getDay(day.date);
      // Convert to Monday-based (0 = Monday, 6 = Sunday)
      const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      if (mondayBasedDay === 0 && currentWeek.length > 0) {
        // Monday - start new week (but only if we already have days)
        weeks.push(currentWeek);
        currentWeek = [day];
      } else {
        currentWeek.push(day);
      }
    });

    // Add the last week if it has days
    if (currentWeek.length > 0) {
      // Fill remaining days of the week with null
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [dateRange, historyMap, dateLocale]);

  // Weekday headers (Monday to Sunday)
  const weekdayHeaders = useMemo(() => {
    const headers: string[] = [];
    // Start with Monday (2024-01-01 is a Monday)
    const monday = new Date(2024, 0, 1);
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      headers.push(format(date, 'EEE', { locale: dateLocale }));
    }
    return headers;
  }, [dateLocale]);

  if (!attraction.history || attraction.history.length === 0) {
    return (
      <Card className="relative p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('historyCalendar')}</h2>
          <p className="text-muted-foreground">
            {t('noHistoryData') || 'No historical data available for this attraction.'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative p-4 md:p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('historyCalendar')}</h2>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Weekday Headers */}
            <div className="mb-2 hidden grid-cols-7 gap-2 md:grid">
              {weekdayHeaders.map((header, idx) => (
                <div key={idx} className="text-muted-foreground text-center text-sm font-medium">
                  {header}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-2 items-stretch gap-2 md:grid-cols-7">
                  {week.map((day, dayIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${weekIdx}-${dayIdx}`}
                          className="hidden h-full md:block"
                        ></div>
                      );
                    }

                    return <DayCard key={day.dateStr} day={day} t={t} tCommon={tCommon} />;
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface DayCardProps {
  day: DayData;
  t: ReturnType<typeof useTranslations<'attractions'>>;
  tCommon: ReturnType<typeof useTranslations<'common'>>;
}

function DayCard({ day, t, tCommon }: DayCardProps) {
  const { historyData, isClosed } = day;

  // Calculate min and max from hourlyP90 data
  const minMax =
    historyData?.hourlyP90 && historyData.hourlyP90.length > 1
      ? {
          min: Math.min(...historyData.hourlyP90.map((h) => h.value)),
          max: Math.max(...historyData.hourlyP90.map((h) => h.value)),
        }
      : null;

  // Determine border color based on utilization
  const getBorderColor = () => {
    const borderWidth = day.isToday ? 'border-4' : 'border';

    if (isClosed) {
      return `${borderWidth} border-gray-300 dark:border-gray-700`;
    }

    if (historyData) {
      switch (historyData.utilization) {
        case 'very_low':
          return `${borderWidth} border-emerald-500 dark:border-emerald-400`;
        case 'low':
          return `${borderWidth} border-emerald-400 dark:border-emerald-300`;
        case 'moderate':
          return `${borderWidth} border-blue-500 dark:border-blue-400`;
        case 'high':
          return `${borderWidth} border-orange-500 dark:border-orange-400`;
        case 'very_high':
          return `${borderWidth} border-rose-500 dark:border-rose-400`;
        case 'extreme':
          return `${borderWidth} border-red-700 dark:border-red-600`;
        default:
          return borderWidth;
      }
    }
    return borderWidth;
  };

  return (
    <Card
      className={`flex h-full flex-col gap-1 p-2 ${getBorderColor()} ${
        isClosed ? 'bg-gray-100/50 dark:bg-gray-800/30' : ''
      }`}
    >
      {/* Header: Day of Week and Date */}
      <div className="mb-0.5 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">{day.dayOfWeek}</span>
        <span className={`text-sm ${day.isToday ? 'font-bold' : 'font-semibold'}`}>
          {day.dayOfMonth}. {day.month}
        </span>
      </div>

      {/* Content */}
      {isClosed ? null : (
        <div className="flex flex-1 flex-col">
          {/* Utilization Badge */}
          {historyData && (
            <Badge
              variant="outline"
              className={`mb-4 w-full justify-center text-xs ${
                historyData.utilization === 'very_low'
                  ? 'border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                  : historyData.utilization === 'low'
                    ? 'border-emerald-400 text-emerald-500 dark:border-emerald-300 dark:text-emerald-300'
                    : historyData.utilization === 'moderate'
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : historyData.utilization === 'high'
                        ? 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400'
                        : historyData.utilization === 'very_high'
                          ? 'border-rose-500 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                          : 'border-red-700 text-red-700 dark:border-red-600 dark:text-red-600'
              }`}
            >
              {t(`crowdLevels.${historyData.utilization}`)}
            </Badge>
          )}

          {/* Sparkline */}
          {historyData?.hourlyP90 && historyData.hourlyP90.length > 1 && (
            <div className="h-10 w-full">
              <HourlyP90Sparkline hourlyP90={historyData.hourlyP90} className="text-foreground" />
            </div>
          )}

          {/* Min/Max */}
          {minMax && (
            <div className="text-muted-foreground flex items-center justify-between text-[10px]">
              <span>
                {tCommon('min')}: {minMax.min} min
              </span>
              <span>
                {tCommon('max')}: {minMax.max} min
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
