'use client';

import { useMemo } from 'react';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { useCalendarData } from '@/lib/hooks/use-calendar-data';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import type { CrowdLevel } from '@/lib/api/types';

interface UseTodayCrowdLevelParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Park IANA timezone — "today" is the park's today, not the visitor's. */
  timezone: string;
}

export interface TodayCrowdLevelResult {
  /** Today's own DAILY rating, or null while loading / too thin / not ratable / closed. */
  level: CrowdLevel | null;
  /** True once the query has settled, so a consumer can tell "loading" from "no value". */
  settled: boolean;
}

/**
 * Below this many observations the day-P90 the rating is built from is still just
 * a handful of readings per headliner — the feed has barely started rather than
 * the park being quiet. Not a statistical guarantee, a noise floor: the honest
 * "the morning is structurally quieter than the day will be" problem is handled
 * by labelling the value "so far today", not by waiting it out.
 */
const MIN_SAMPLES = 20;

/**
 * Today's crowd level as a DAILY statistic — the one number directly comparable to
 * the day's forecast.
 *
 * The park's live crowd (`analytics.statistics.crowdLevel`) is a point-in-time
 * ratio-vs-P50 reading and the forecast is a day aggregate ÷ typical-day-peak, so
 * putting those two badges side by side compares different things — that is why a
 * park can read "normal" next to "very high" without either being wrong. The API's
 * `todayCrowdLevel` is today's day aggregate against the same baseline the forecast
 * uses, which makes the pair legible.
 *
 * Costs no request: it reads the SAME one-day `/calendar` query <ParkHeaderStats>
 * already runs for the day-detail dialog (identical key ⇒ React Query serves both
 * observers from one fetch), and stays behind `useLoadLast` so it never competes
 * with the live/weather queries (park-page loading-priority rule).
 */
export function useTodayCrowdLevel({
  continent,
  country,
  city,
  parkSlug,
  timezone,
}: UseTodayCrowdLevelParams): TodayCrowdLevelResult {
  const browserNow = useBrowserNow(null);
  const releasedLast = useLoadLast();

  const todayStr = useMemo(
    () => (browserNow ? browserNow.toLocaleDateString('en-CA', { timeZone: timezone }) : null),
    [browserNow, timezone]
  );

  const { data, isSuccess } = useCalendarData({
    continent,
    country,
    city,
    parkSlug,
    from: todayStr ?? '',
    to: todayStr ?? '',
    enabled: !!todayStr && releasedLast,
  });

  const level = useMemo(() => {
    if (!data || !todayStr) return null;
    const today = data.days.find((d) => d.date === todayStr);
    if (!today?.todayCrowdLevel) return null;
    if ((today.todayCrowdLevelSamples ?? 0) < MIN_SAMPLES) return null;
    return today.todayCrowdLevel;
  }, [data, todayStr]);

  return { level, settled: isSuccess };
}
