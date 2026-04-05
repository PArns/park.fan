import { getLocale, getTranslations } from 'next-intl/server';
import { format, eachDayOfInterval } from 'date-fns';
import { de, enUS, es, fr, it, nl, type Locale } from 'date-fns/locale';
import { Ban, PartyPopper, Backpack, Calendar } from 'lucide-react';
import type { AttractionHistoryDay, ScheduleItem } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { AttractionHistoryDay as HistoryDay, DayDataProps } from './attraction-history-day';

interface AttractionHistoryGridProps {
  attraction: {
    name: string;
    history?: AttractionHistoryDay[];
    schedule?: ScheduleItem[];
  };
}

interface GridDayData extends DayDataProps {
  date: Date;
}

export async function AttractionHistoryGrid({ attraction }: AttractionHistoryGridProps) {
  const locale = await getLocale();
  const t = await getTranslations('attractions');

  const dateLocaleMap: Record<string, Locale> = { de, en: enUS, fr, it, nl, es };
  const dateLocale: Locale = dateLocaleMap[locale] ?? enUS;

  // Calculate date range: today to 30 days ago
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const dateRange = { start: thirtyDaysAgo, end: today };

  // Create a map of history data by date for quick lookup
  const historyMap = new Map<string, AttractionHistoryDay>();
  if (attraction.history) {
    attraction.history.forEach((day) => {
      historyMap.set(day.date, day);
    });
  }

  // Create a map of schedule data by date for quick lookup
  const scheduleMap = new Map<string, ScheduleItem>();
  if (attraction.schedule) {
    attraction.schedule.forEach((item) => {
      scheduleMap.set(item.date, item);
    });
  }

  // Generate all days in the range and group into weeks
  const allDays = eachDayOfInterval(dateRange);

  // Create day data with history and schedule lookup
  const days: GridDayData[] = allDays.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const historyData = historyMap.get(dateStr);
    const scheduleData = scheduleMap.get(dateStr);

    const hasHistory = historyData && historyData.hourlyP90 && historyData.hourlyP90.length > 1;
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    let attractionStatus: GridDayData['attractionStatus'] = 'UNKNOWN';

    if (hasHistory) {
      attractionStatus = 'OPEN';
    } else {
      // No history data
      if (scheduleData) {
        if (scheduleData.scheduleType !== 'OPERATING') {
          attractionStatus = 'PARK_CLOSED';
        } else {
          // Park is open, but no history
          if (isToday) {
            attractionStatus = 'NOT_YET_OPEN';
          } else if (date < today) {
            attractionStatus = 'CLOSED_RIDE';
          }
        }
      }
    }

    return {
      date,
      dateStr,
      dayOfWeek: format(date, 'EEE', { locale: dateLocale }),
      dayOfMonth: format(date, 'd'),
      month: format(date, 'MMM', { locale: dateLocale }),
      historyData,
      scheduleData,
      attractionStatus,
      isToday,
    };
  });

  if (!attraction.history || attraction.history.length === 0) {
    return (
      <Card className="relative p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('historyCalendar')}</h2>
          <p className="text-muted-foreground">{t('noHistoryData')}</p>
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
              <span className="text-xs">{t('historyLegend.closed')}</span>
            </div>
            {/* Holiday */}
            <div className="flex items-center gap-1.5 rounded-md border border-orange-500 bg-white px-2 py-1 dark:bg-gray-900/50">
              <PartyPopper className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
              <span className="text-xs">{t('historyLegend.holiday')}</span>
            </div>
            {/* School Vacation */}
            <div className="flex items-center gap-1.5 rounded-md border border-yellow-500 bg-white px-2 py-1 dark:bg-gray-900/50">
              <Backpack className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-400" />
              <span className="text-xs">{t('historyLegend.schoolVacation')}</span>
            </div>
            {/* Bridge Day */}
            <div className="flex items-center gap-1.5 rounded-md border border-blue-500 bg-white px-2 py-1 dark:bg-gray-900/50">
              <Calendar className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span className="text-xs">{t('historyLegend.bridgeDay')}</span>
            </div>
          </div>
        </div>

        {/* Reversed List (Today -> Past) */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
          {days
            .slice()
            .reverse()
            .map((day) => {
              const { date: _date, ...dayProps } = day;
              return <HistoryDay key={day.dateStr} day={dayProps} />;
            })}
        </div>
      </div>
    </Card>
  );
}
