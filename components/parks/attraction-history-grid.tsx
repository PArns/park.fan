'use client';

import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfWeek, getDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { PartyPopper, Calendar, Backpack, Ban } from 'lucide-react';
import type { AttractionHistoryDay, ScheduleItem } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { HourlyP90Sparkline } from './hourly-p90-sparkline';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface AttractionHistoryGridProps {
  attraction: {
    name: string;
    history?: AttractionHistoryDay[];
    schedule?: ScheduleItem[];
  };
}

interface DayData {
  date: Date;
  dateStr: string;
  dayOfWeek: string;
  dayOfMonth: string;
  month: string;
  historyData?: AttractionHistoryDay;
  scheduleData?: ScheduleItem;
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

  // Create a map of schedule data by date for quick lookup
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleItem>();
    if (attraction.schedule) {
      attraction.schedule.forEach((item) => {
        map.set(item.date, item);
      });
    }
    return map;
  }, [attraction.schedule]);

  // Generate all days in the range and group into weeks
  const weeks = useMemo(() => {
    const { start, end } = dateRange;
    const allDays = eachDayOfInterval({ start, end });

    // Create day data with history and schedule lookup
    const today = dateRange.end;
    const days: DayData[] = allDays.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const historyData = historyMap.get(dateStr);
      const scheduleData = scheduleMap.get(dateStr);
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
        scheduleData,
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
  }, [dateRange, historyMap, scheduleMap, dateLocale]);

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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold">{t('historyCalendar')}</h2>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {/* Closed */}
            <div className="flex items-center gap-1.5 rounded-md border border-red-500 bg-red-50/50 px-2 py-1 dark:bg-red-950/20">
              <Ban className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
              <span className="text-xs">{t('historyLegend.closed') || 'Geschlossen'}</span>
            </div>
            {/* Holiday */}
            <div className="flex items-center gap-1.5 rounded-md border border-orange-500 bg-white px-2 py-1 dark:bg-gray-900/50">
              <PartyPopper className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
              <span className="text-xs">{t('historyLegend.holiday') || 'Feiertag'}</span>
            </div>
            {/* School Vacation */}
            <div className="flex items-center gap-1.5 rounded-md border border-yellow-500 bg-white px-2 py-1 dark:bg-gray-900/50">
              <Backpack className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-400" />
              <span className="text-xs">{t('historyLegend.schoolVacation') || 'Schulferien'}</span>
            </div>
            {/* Bridge Day */}
            <div className="flex items-center gap-1.5 rounded-md border border-blue-500 bg-white px-2 py-1 dark:bg-gray-900/50">
              <Calendar className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span className="text-xs">{t('historyLegend.bridgeDay') || 'Brückentag'}</span>
            </div>
          </div>
        </div>

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
  const tParks = useTranslations('parks');

  // Calculate min and max from hourlyP90 data
  const minMax =
    historyData?.hourlyP90 && historyData.hourlyP90.length > 1
      ? {
          min: Math.min(...historyData.hourlyP90.map((h) => h.value)),
          max: Math.max(...historyData.hourlyP90.map((h) => h.value)),
        }
      : null;

  // Get schedule icon and tooltip text
  // Match the exact same priority logic as getBorderColor to ensure icon matches border
  // Priority: Closed > Public Holiday (Prio 1) > School Vacation (Prio 2) > Bridge Day (Prio 3)
  const getScheduleIcon = () => {
    // Check if park is closed first (highest priority)
    // closed = scheduleType != open (includes CLOSED and UNKNOWN)
    // Only if scheduleData EXISTS. If it's missing, it falls through (Neutral).
    const isParkClosed = day.scheduleData && day.scheduleData.scheduleType !== 'OPERATING';
    if (isParkClosed) {
      return {
        Icon: Ban,
        color: 'text-red-500 dark:text-red-400',
        tooltip: tCommon('closed') || 'Geschlossen',
      };
    }

    // If schedule is UNKNOWN or missing, we return null (neutral)

    // Priority: Public Holiday (1) > School Vacation (2) > Bridge Day (3)
    if (day.scheduleData?.isPublicHoliday) {
      return {
        Icon: PartyPopper,
        color: 'text-orange-500 dark:text-orange-400',
        tooltip: day.scheduleData?.holidayName || tParks('holiday') || 'Feiertag',
      };
    } else if (day.scheduleData?.isSchoolHoliday || day.scheduleData?.isSchoolVacation) {
      return {
        Icon: Backpack,
        color: 'text-yellow-500 dark:text-yellow-400',
        tooltip: tParks('schoolVacation') || 'Schulferien',
      };
    } else if (day.scheduleData?.isBridgeDay) {
      return {
        Icon: Calendar,
        color: 'text-blue-500 dark:text-blue-400',
        tooltip: tParks('bridgeDay') || 'Brückentag',
      };
    }
    return null;
  };

  // Determine border color based on schedule (holidays, bridge days, school vacations)
  // Priority: Park Closed > Public Holiday (Prio 1) > School Vacation (Prio 2) > Bridge Day (Prio 3)
  const getBorderColor = () => {
    const borderWidth = day.isToday ? 'border-4' : 'border';

    // Check if park is closed (from schedule)
    // closed = scheduleType != open (includes CLOSED and UNKNOWN)
    const isParkClosed = day.scheduleData && day.scheduleData.scheduleType !== 'OPERATING';
    if (isParkClosed) {
      return `${borderWidth} border-red-500 dark:border-red-600`;
    }

    // Priority: Public Holiday (1) > School Vacation (2) > Bridge Day (3)
    if (day.scheduleData?.isPublicHoliday) {
      return `${borderWidth} border-orange-500 dark:border-orange-400`;
    } else if (day.scheduleData?.isSchoolHoliday || day.scheduleData?.isSchoolVacation) {
      return `${borderWidth} border-yellow-500 dark:border-yellow-400`;
    } else if (day.scheduleData?.isBridgeDay) {
      return `${borderWidth} border-blue-500 dark:border-blue-400`;
    }

    // Default border if no schedule marking or if UNKNOWN
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
        <div className="flex items-center gap-2">
          <span className={`text-sm ${day.isToday ? 'font-bold' : 'font-semibold'}`}>
            {day.dayOfMonth}. {day.month}
          </span>
          {(() => {
            const scheduleIcon = getScheduleIcon();
            if (scheduleIcon) {
              const { Icon, color, tooltip } = scheduleIcon;
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Icon className={`h-3 w-3 ${color} cursor-help`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Content */}
      {isClosed ? null : (
        <div className="flex flex-1 flex-col">
          {/* Utilization Badge */}
          {historyData && (
            <div
              className={`mb-4 flex w-full justify-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                historyData.utilization === 'very_low'
                  ? 'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/50 dark:text-green-100'
                  : historyData.utilization === 'low'
                    ? 'border-lime-200 bg-lime-100 text-lime-800 dark:border-lime-800 dark:bg-lime-900/50 dark:text-lime-100'
                    : historyData.utilization === 'moderate'
                      ? 'border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100'
                      : historyData.utilization === 'high'
                        ? 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-900/50 dark:text-orange-100'
                        : historyData.utilization === 'very_high'
                          ? 'border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/50 dark:text-red-100'
                          : 'border-red-300 bg-red-200 text-red-900 dark:border-red-700 dark:bg-red-800/50 dark:text-red-50'
              }`}
            >
              {t(`crowdLevels.${historyData.utilization}`)}
            </div>
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
