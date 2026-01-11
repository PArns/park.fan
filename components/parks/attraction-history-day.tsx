'use client';

import { PartyPopper, Calendar, Backpack, Ban } from 'lucide-react';
import type { AttractionHistoryDay, ScheduleItem } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { HourlyP90Sparkline } from './hourly-p90-sparkline';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';

export interface DayDataProps {
  dateStr: string;
  dayOfWeek: string;
  dayOfMonth: string;
  month: string;
  historyData?: AttractionHistoryDay;
  scheduleData?: ScheduleItem;
  attractionStatus: 'OPEN' | 'CLOSED_RIDE' | 'NOT_YET_OPEN' | 'PARK_CLOSED' | 'UNKNOWN';
  isToday: boolean;
}

interface AttractionHistoryDayProps {
  day: DayDataProps;
}

export function AttractionHistoryDay({ day }: AttractionHistoryDayProps) {
  const t = useTranslations('attractions');
  const tCommon = useTranslations('common');
  const tParks = useTranslations('parks');
  const { historyData } = day;

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
    if (day.attractionStatus === 'PARK_CLOSED') {
      return {
        Icon: Ban,
        color: 'text-red-500 dark:text-red-400',
        tooltip: tCommon('closed'),
      };
    }

    // If schedule is UNKNOWN or missing, we return null (neutral)

    // Priority: Public Holiday (1) > School Vacation (2) > Bridge Day (3)
    if (day.scheduleData?.isPublicHoliday) {
      return {
        Icon: PartyPopper,
        color: 'text-orange-500 dark:text-orange-400',
        tooltip: day.scheduleData?.holidayName || tParks('holiday'),
      };
    } else if (day.scheduleData?.isSchoolHoliday || day.scheduleData?.isSchoolVacation) {
      return {
        Icon: Backpack,
        color: 'text-yellow-500 dark:text-yellow-400',
        tooltip: tParks('schoolVacation'),
      };
    } else if (day.scheduleData?.isBridgeDay) {
      return {
        Icon: Calendar,
        color: 'text-blue-500 dark:text-blue-400',
        tooltip: tParks('bridgeDay'),
      };
    }
    return null;
  };

  // Determine border color based on schedule (holidays, bridge days, school vacations)
  // Priority: Park Closed/Ride Closed > Public Holiday (Prio 1) > School Vacation (Prio 2) > Bridge Day (Prio 3)
  const getBorderColor = () => {
    const borderWidth = day.isToday ? 'border-4' : 'border';

    // Check if park is closed (from schedule)
    if (day.attractionStatus === 'PARK_CLOSED') {
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
    if (day.isToday) {
      return `${borderWidth} border-park-primary`;
    }
    return borderWidth;
  };

  return (
    <Card
      className={`flex h-full flex-col gap-1 p-2 ${getBorderColor()} ${
        day.attractionStatus !== 'OPEN' ? 'bg-gray-100/50 dark:bg-gray-800/30' : ''
      }`}
    >
      {/* Header: Day of Week and Date */}
      <div className="mb-0.5 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">
          {day.isToday ? tCommon('today') : day.dayOfWeek}
        </span>
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
      {day.attractionStatus === 'OPEN' ? (
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
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-2 text-center">
          {day.attractionStatus === 'NOT_YET_OPEN' && (
            <div className="flex flex-col items-center gap-1">
              <Ban className="h-4 w-4 text-red-500 opacity-50" />
              <span className="text-muted-foreground text-[10px] font-medium text-red-500/80">
                {t('notYetOpen')}
              </span>
            </div>
          )}
          {day.attractionStatus === 'CLOSED_RIDE' && (
            <div className="flex flex-col items-center gap-1">
              <Ban className="h-4 w-4 text-red-500 opacity-50" />
              <span className="text-muted-foreground text-[10px] font-medium text-red-500/80">
                {t('rideClosed')}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
