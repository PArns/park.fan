import { useQuery } from '@tanstack/react-query';
import type { PlanDay } from '@/lib/api/types';

interface UsePlanDayParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Park-local date (YYYY-MM-DD). Omit for today. */
  date?: string;
  /** Keep the hook call unconditional while the planner has no park or day yet. */
  enabled?: boolean;
}

/**
 * One day's per-ride hourly plan.
 *
 * Deliberately NOT behind `useLoadLast`, unlike the stats hooks. That gate exists
 * so historical aggregates cannot race the live status and weather queries on a
 * park page; this request is the whole content of a panel the visitor opened on
 * purpose, and making them wait for the rest of the page to settle would be the
 * gate applied backwards.
 *
 * The stale window is FIFTEEN minutes, matching the proxy's `s-maxage`, so the
 * two do not disagree about how old an answer may be. It does not poll: a plan
 * for a day in November does not move, and the one for today is refetched when
 * the panel is reopened or the tab regains focus.
 *
 * A 404 is the settled answer "no plan for that park and day" and resolves to
 * `null` rather than retrying — the panel renders its empty state. A 502 is a
 * real failure and does retry, which is why the proxy route is careful to
 * distinguish the two rather than flattening both into a 404.
 */
export function usePlanDay({
  continent,
  country,
  city,
  parkSlug,
  date,
  enabled = true,
}: UsePlanDayParams) {
  return useQuery<PlanDay | null>({
    queryKey: ['plan-day', continent, country, city, parkSlug, date ?? 'today'],
    queryFn: async () => {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      const res = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/plan/day${query}`,
        { cache: 'no-store' }
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`plan day ${parkSlug}: ${res.statusText}`);
      return (await res.json()) as PlanDay;
    },
    enabled: enabled && typeof window !== 'undefined' && Boolean(parkSlug),
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
