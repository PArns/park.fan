import { getTranslations } from 'next-intl/server';
import type {
  AttractionHistoryDay,
  ForecastItem,
  ScheduleItem,
  BestVisitSlot,
} from '@/lib/api/types';
import { DailyWaitTimeChartClient } from './daily-wait-time-chart-client';

interface DailyWaitTimeChartServerProps {
  history?: AttractionHistoryDay[];
  hourlyForecast?: ForecastItem[];
  timezone: string;
  schedule?: ScheduleItem[];
  bestVisitTimes?: BestVisitSlot[] | null;
}

/**
 * Server shell for the daily wait-time chart: it only loads the (locale-stable) translations and
 * hands the RAW history/forecast/schedule down to the client. The "today" pick and slot-building
 * happen client-side (DailyWaitTimeChartClient) — previously this component read getServerToday()
 * to select today's data, which pinned the attraction static shell to a 1h revalidate (the #1
 * ISR-write driver). With no clock read here the shell is time-independent (1-day TTL); the data
 * still originates server-side so it stays available for SEO/first paint.
 */
export async function DailyWaitTimeChartServer({
  history,
  hourlyForecast,
  timezone,
  schedule,
  bestVisitTimes,
}: DailyWaitTimeChartServerProps) {
  const t = await getTranslations('attractions.todayChart');

  return (
    <DailyWaitTimeChartClient
      history={history}
      hourlyForecast={hourlyForecast}
      timezone={timezone}
      schedule={schedule}
      bestVisitTimes={bestVisitTimes}
      translations={{
        title: t('title'),
        now: t('now'),
        bestSlots: t('bestSlots', { hours: '{hours}' }),
        bestSlotsGood: t('bestSlotsGood', { hours: '{hours}' }),
        timeSuffix: t('timeSuffix'),
        min: t('min'),
        ratingOptimal: t('ratingOptimal'),
        ratingGood: t('ratingGood'),
      }}
    />
  );
}
