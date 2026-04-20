import { getTranslations } from 'next-intl/server';
import type { AttractionHistoryDay, ForecastItem, ScheduleItem } from '@/lib/api/types';
import { DailyWaitTimeChart, type DailyWaitTimeChartData } from './daily-wait-time-chart';

interface DailyWaitTimeChartServerProps {
  history?: AttractionHistoryDay[];
  hourlyForecast?: ForecastItem[];
  timezone: string;
  schedule?: ScheduleItem[];
}

/** Returns the time string (HH:mm) in the given IANA timezone from an ISO string, rounded to 15m. */
function getTimeSlotInTimezone(isoStr: string, timezone: string): string {
  const date = new Date(isoStr);
  const parts = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    hourCycle: 'h23',
    timeZone: timezone,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
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

  // History P90 map: "HH:mm" → value
  const todayHistory = history?.find((h) => h.date === todayStr);
  const historyMap = new Map<string, number>();
  todayHistory?.hourlyP90?.forEach((p) => {
    historyMap.set(p.hour, p.value);
  });

  // Forecast map: "HH:mm" (park tz) → waitTime, first entry wins per slot
  const forecastMap = new Map<string, number>();
  hourlyForecast?.forEach((f) => {
    const slot = getTimeSlotInTimezone(f.predictedTime, timezone);
    if (!forecastMap.has(slot)) forecastMap.set(slot, f.predictedWaitTime);
  });

  // Time range: schedule-based or derived from data points
  const todaySchedule = schedule?.find((s) => s.date === todayStr);
  let startTime = '09:00';
  let endTime = '19:00';

  if (todaySchedule) {
    if (todaySchedule.openingTime) {
      const date = new Date(todaySchedule.openingTime);
      const h = new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone,
      }).format(date);
      const m = new Intl.DateTimeFormat('en', { minute: 'numeric', timeZone: timezone }).format(
        date
      );
      // Round down to nearest 15m
      const roundedM = Math.floor(parseInt(m, 10) / 15) * 15;
      startTime = `${h.padStart(2, '0')}:${roundedM.toString().padStart(2, '0')}`;
    }
    if (todaySchedule.closingTime) {
      const date = new Date(todaySchedule.closingTime);
      const h = new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone,
      }).format(date);
      const m = new Intl.DateTimeFormat('en', { minute: 'numeric', timeZone: timezone }).format(
        date
      );
      // Round up to nearest 15m
      const roundedM = Math.ceil(parseInt(m, 10) / 15) * 15;
      let finalH = parseInt(h, 10);
      let finalM = roundedM;
      if (finalM === 60) {
        finalH = (finalH + 1) % 24;
        finalM = 0;
      }
      endTime = `${finalH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
    }
  } else {
    const allSlots = [...historyMap.keys(), ...forecastMap.keys()].sort();
    if (allSlots.length > 0) {
      startTime = allSlots[0];
      endTime = allSlots[allSlots.length - 1];
    }
  }

  // Filter maps to ensure no data outside operating hours
  for (const time of historyMap.keys()) {
    if (time < startTime || time > endTime) historyMap.delete(time);
  }
  for (const time of forecastMap.keys()) {
    if (time < startTime || time > endTime) forecastMap.delete(time);
  }

  // Start at the first actual history record — forecasts may contain stale past-hour
  // entries from Redis cache, so only history determines the real data start.
  const historyKeys = [...historyMap.keys()].sort();
  if (historyKeys.length > 0 && historyKeys[0] > startTime) {
    startTime = historyKeys[0];
  }

  // Build 15-minute slots
  const slots: DailyWaitTimeChartData['slots'] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let curH = startH;
  let curM = startM;

  while (curH < endH || (curH === endH && curM <= endM)) {
    const time = `${curH.toString().padStart(2, '0')}:${curM.toString().padStart(2, '0')}`;
    slots.push({
      time,
      historyValue: historyMap.get(time) ?? null,
      forecastValue: forecastMap.get(time) ?? null,
    });

    curM += 15;
    if (curM >= 60) {
      curM = 0;
      curH++;
    }
  }

  // Linear interpolation for null history values between two known points.
  // Handles gaps where no rides were polled in a 15-min window.
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].historyValue !== null) continue;
    let prev = i - 1;
    while (prev >= 0 && slots[prev].historyValue === null) prev--;
    let next = i + 1;
    while (next < slots.length && slots[next].historyValue === null) next++;
    if (prev >= 0 && next < slots.length) {
      const a = slots[prev].historyValue!;
      const b = slots[next].historyValue!;
      slots[i].historyValue = Math.round(a + (b - a) * ((i - prev) / (next - prev)));
    } else if (prev >= 0) {
      // Trailing slots after last known value: carry-forward
      slots[i].historyValue = slots[prev].historyValue;
    }
    // Leading nulls (before first data point) remain null — park not open yet
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
