'use client';

import { useQuery } from '@tanstack/react-query';
import { isParkyDayTip, type ParkyDayTip } from '@/lib/assistant/parky-tip';
import { PARKY_TIP_NONE_SECONDS } from '@/lib/api/cdn-cache-headers';
import { CALENDAR_STALE_TIME_MS } from '@/lib/hooks/use-calendar-data';
import type { PlannerGeo } from '@/lib/planner/types';
import { parkRelayUrl } from '@/lib/parks/paths';

/**
 * As long as the month the dialog shows the tip on stays fresh in the tab: flipping back to a day
 * opened before asks nothing, and a tip never outlives the level beside it by more than that.
 */
const TIP_STALE_MS = CALENDAR_STALE_TIME_MS;
/** „Nothing to say" goes stale with the relay's 204, so a dialog opened again later asks again. */
const NO_TIP_STALE_MS = PARKY_TIP_NONE_SECONDS * 1000;

/**
 * Parky's tip for one calendar day, through the park relay (`…/parky-tip`), or null when he has
 * nothing to say (a closed day, no forecast, Parky off). Only while `enabled`: the dialog is open
 * and Parky shows for this visitor, so nobody outside the rollout costs a model call. `today` is
 * the park's: the sentence counts from it, so a new day is a new query and a new URL.
 */
export function useParkyDayTip({
  geo,
  parkSlug,
  date,
  today,
  locale,
  enabled,
}: {
  geo: PlannerGeo;
  parkSlug: string;
  date: string | null;
  today: string;
  locale: string;
  enabled: boolean;
}) {
  return useQuery<ParkyDayTip | null>({
    queryKey: ['parky-tip', geo.continent, geo.country, geo.city, parkSlug, date, today, locale],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        parkRelayUrl({ ...geo, parkSlug }, `/parky-tip?date=${date}&today=${today}&locale=${locale}`),
        { signal }
      );
      if (response.status !== 200) return null;
      const body: unknown = await response.json();
      return isParkyDayTip(body) ? body : null;
    },
    enabled: enabled && !!date,
    staleTime: (query) => (query.state.data === null ? NO_TIP_STALE_MS : TIP_STALE_MS),
    gcTime: TIP_STALE_MS,
    retry: false,
  });
}
