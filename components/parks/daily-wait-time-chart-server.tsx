import { getTranslations } from 'next-intl/server';
import type { AttractionHistoryDay, ForecastItem, ScheduleItem } from '@/lib/api/types';
import { DailyWaitTimeChart, type DailyWaitTimeChartData } from './daily-wait-time-chart';

interface DailyWaitTimeChartServerProps {
  history?: AttractionHistoryDay[];
  hourlyForecast?: ForecastItem[];
  timezone: string;
  schedule?: ScheduleItem[];
}

/** Returns the hour (0-23) in the given IANA timezone from an ISO string. */
function getHourInTimezone(isoStr: string, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    hour12: false,
    hourCycle: 'h23',
    timeZone: timezone,
  }).formatToParts(new Date(isoStr));
  const hourPart = parts.find((p) => p.type === 'hour');
  return hourPart ? parseInt(hourPart.value, 10) : 0;
}

/** Returns today's date as YYYY-MM-DD in the given IANA timezone. */
function getTodayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
}

export async function DailyWaitTimeChartServer({
  history,
  hourlyForecast,
  timezone,
  schedule,
}: DailyWaitTimeChartServerProps) {
  const t = await getTranslations('attractions.todayChart');

  const todayStr = getTodayInTimezone(timezone);

  // History P90 map: hour → value (hours in history are already in park local time)
  const todayHistory = history?.find((h) => h.date === todayStr);
  const historyMap = new Map<number, number>();
  todayHistory?.hourlyP90?.forEach((p) => {
    const h = parseInt(p.hour.split(':')[0], 10);
    historyMap.set(h, p.value);
  });

  // Forecast map: hour (park tz) → waitTime, first entry wins per hour
  const forecastMap = new Map<number, number>();
  hourlyForecast?.forEach((f) => {
    const h = getHourInTimezone(f.predictedTime, timezone);
    if (!forecastMap.has(h)) forecastMap.set(h, f.predictedWaitTime);
  });

  // Hour range: schedule-based (closing time is exclusive, e.g. 18:00 → last slot 17h)
  // or derived from data points (inclusive).
  const todaySchedule = schedule?.find((s) => s.date === todayStr);
  let openHour = 9;
  let lastHour = 19; // inclusive last slot
  if (todaySchedule) {
    if (todaySchedule.openingTime)
      openHour = getHourInTimezone(todaySchedule.openingTime, timezone);
    if (todaySchedule.closingTime)
      lastHour = getHourInTimezone(todaySchedule.closingTime, timezone) - 1;
  } else {
    const allHours = [...historyMap.keys(), ...forecastMap.keys()];
    if (allHours.length > 0) {
      openHour = Math.min(...allHours);
      lastHour = Math.max(...allHours);
    }
  }

  // Build hour slots — no current/past/forecast typing here, that's the client's job.
  const slots: DailyWaitTimeChartData['slots'] = [];
  for (let h = openHour; h <= lastHour; h++) {
    slots.push({
      hour: h,
      historyValue: historyMap.get(h) ?? null,
      forecastValue: forecastMap.get(h) ?? null,
    });
  }

  // Skip render if there's no data at all
  if (slots.every((s) => s.historyValue === null && s.forecastValue === null)) return null;

  const data: DailyWaitTimeChartData = {
    slots,
    timezone,
    translations: {
      title: t('title'),
      now: t('now'),
      bestSlots: t('bestSlots', { hours: '{hours}' }),
      min: t('min'),
    },
  };

  return <DailyWaitTimeChart {...data} />;
}
