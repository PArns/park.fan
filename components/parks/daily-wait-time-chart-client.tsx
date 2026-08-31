'use client';

import { useMemo } from 'react';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useRideDayCurve } from '@/lib/hooks/use-ride-day-curve';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import type {
  AttractionHistoryDay,
  ForecastItem,
  ScheduleItem,
  BestVisitSlot,
} from '@/lib/api/types';
import { DailyWaitTimeChart, type DailyWaitTimeChartData } from './daily-wait-time-chart';

interface DailyWaitTimeChartClientProps {
  history?: AttractionHistoryDay[];
  hourlyForecast?: ForecastItem[];
  timezone: string;
  schedule?: ScheduleItem[];
  bestVisitTimes?: BestVisitSlot[] | null;
  translations: DailyWaitTimeChartData['translations'];
  /**
   * Where to read this ride's historical corridor from. All four are needed
   * because `/stats/day` is a park-scoped route; the ride is pinned by slug so
   * the corridor belongs to the bars it sits behind and not to whatever the
   * endpoint would have picked on its own.
   *
   * Omit and the chart renders exactly as before — the corridor is additive.
   */
  corridor?: {
    continent: string;
    country: string;
    city: string;
    parkSlug: string;
    attractionSlug: string;
  };
}

/** Returns the time string (HH:mm) in the given IANA timezone from an ISO string, rounded to 15m. */
function getTimeSlotInTimezone(isoStr: string, timezone: string): string {
  const date = new Date(isoStr);
  const parts = getDateTimeFormat('en', {
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

/** Today's date as YYYY-MM-DD in the given IANA timezone. */
function getTodayInTimezone(timezone: string): string {
  return getDateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
}

/**
 * Builds the daily chart's 15-minute slots for the given "today" (park-tz date string).
 *
 * Moved verbatim off the former DailyWaitTimeChartServer so the "today" selection no longer reads
 * the server clock (getServerToday) in the attraction static shell — that read was the #1 ISR-write
 * driver, pinning the shell to a 1h revalidate. The data itself (history/forecast/schedule) is
 * still passed down from the server shell (good for SEO/first paint); only the day pick is client.
 */
function buildChartData(
  todayStr: string,
  {
    history,
    hourlyForecast,
    timezone,
    schedule,
    bestVisitTimes,
    translations,
    corridor,
  }: DailyWaitTimeChartClientProps,
  /** Hour → [P25, P90] for this ride, or null while the query is in flight. */
  corridorByHour: Map<number, [number, number]> | null
): DailyWaitTimeChartData | null {
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
      const h = getDateTimeFormat('en', {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone,
      }).format(date);
      const m = getDateTimeFormat('en', { minute: 'numeric', timeZone: timezone }).format(date);
      // Round down to nearest 15m
      const roundedM = Math.floor(parseInt(m, 10) / 15) * 15;
      startTime = `${h.padStart(2, '0')}:${roundedM.toString().padStart(2, '0')}`;
    }
    if (todaySchedule.closingTime) {
      const date = new Date(todaySchedule.closingTime);
      const h = getDateTimeFormat('en', {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone,
      }).format(date);
      const m = getDateTimeFormat('en', { minute: 'numeric', timeZone: timezone }).format(date);
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

  // Track last real data point to trim trailing empty slots later
  const lastHistoryTime = historyKeys.length > 0 ? historyKeys[historyKeys.length - 1] : null;
  const forecastKeys = [...forecastMap.keys()].sort();
  const lastForecastTime = forecastKeys.length > 0 ? forecastKeys[forecastKeys.length - 1] : null;
  const lastActualTime =
    [lastHistoryTime, lastForecastTime]
      .filter((t): t is string => t !== null)
      .sort()
      .pop() ?? null;

  // Build 15-minute slots
  const slots: DailyWaitTimeChartData['slots'] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let curH = startH;
  let curM = startM;

  while (curH < endH || (curH === endH && curM <= endM)) {
    const time = `${curH.toString().padStart(2, '0')}:${curM.toString().padStart(2, '0')}`;
    // The corridor is hourly, so all four slots of an hour share its band —
    // honest, because the rollup behind it is hourly too.
    const band = corridorByHour?.get(curH) ?? null;
    slots.push({
      time,
      historyValue: historyMap.get(time) ?? null,
      forecastValue: forecastMap.get(time) ?? null,
      typicalLow: band?.[0] ?? null,
      typicalHigh: band?.[1] ?? null,
    });

    curM += 15;
    if (curM >= 60) {
      curM = 0;
      curH++;
    }
  }

  // Trim trailing slots past last actual data point (schedule may extend beyond predictions)
  if (lastActualTime) {
    while (slots.length > 0 && slots[slots.length - 1].time > lastActualTime) {
      slots.pop();
    }
  }

  // Fill null history slots using carry-forward from last known value.
  // This avoids fake sloping lines between two real data points.
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].historyValue !== null) continue;
    const prev = i - 1;
    if (prev >= 0 && slots[prev].historyValue !== null) {
      slots[i].historyValue = slots[prev].historyValue;
    }
    // Leading nulls (before first data point) remain null — park not open yet
  }

  // Skip render if there's no data at all
  if (slots.every((s) => s.historyValue === null && s.forecastValue === null)) return null;

  // Convert bestVisitTimes ISO timestamps → "HH:mm" in park timezone
  const bestSlots = bestVisitTimes
    ?.map((s) => ({
      time: getTimeSlotInTimezone(s.time, timezone),
      rating: s.rating,
    }))
    .filter((s) => s.time >= startTime && s.time <= endTime);

  return {
    slots,
    timezone,
    bestSlots: bestSlots?.length ? bestSlots : undefined,
    expectTypical: Boolean(corridor),
    translations,
  };
}

export function DailyWaitTimeChartClient(props: DailyWaitTimeChartClientProps) {
  const mounted = useMounted();
  const { corridor } = props;

  // The corridor arrives late on purpose. It is a historical aggregate behind the
  // same `useLoadLast` gate as every other one, so the bars paint from the server
  // shell's data first and the band fades in behind them — never the other way
  // round, and never at the cost of the live numbers' request budget.
  const { data: dayCurve } = useRideDayCurve({
    continent: corridor?.continent ?? '',
    country: corridor?.country ?? '',
    city: corridor?.city ?? '',
    parkSlug: corridor?.parkSlug ?? '',
    attraction: corridor?.attractionSlug,
    enabled: Boolean(corridor),
  });

  const corridorByHour = useMemo(() => {
    if (!dayCurve) return null;
    const map = new Map<number, [number, number]>();
    dayCurve.hours.forEach((hour, i) => {
      const low = dayCurve.p25[i];
      const high = dayCurve.p90[i];
      // A band needs both edges and a positive height; an hour with one of them
      // missing gets no band rather than a zero-height line at the wrong height.
      if (low == null || high == null || high <= low) return;
      map.set(hour, [low, high]);
    });
    return map.size > 0 ? map : null;
  }, [dayCurve]);

  // Derive "today" (park tz) on the client; before mount render nothing so SSR and the first client
  // render match (no hydration mismatch) and the static shell never reads the clock.
  const data = useMemo(() => {
    if (!mounted) return null;
    const todayStr = getTodayInTimezone(props.timezone);
    return buildChartData(todayStr, props, corridorByHour);
    // props is stable per render from the server shell; rebuild only on mount/tz change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, props.timezone, corridorByHour]);

  if (!data) return null;
  return <DailyWaitTimeChart {...data} />;
}
