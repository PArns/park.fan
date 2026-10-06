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
 * One day's per-ride hourly plan. Not behind `useLoadLast`: it is the whole content of a panel the
 * visitor opened on purpose. Fifteen minutes stale, the proxy's `s-maxage`, and no polling. A 404
 * is "no plan for that park and day" and resolves to `null`; a 502 is a real failure and retries.
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
    ...planDayQuery({ continent, country, city, parkSlug, date }),
    enabled: enabled && typeof window !== 'undefined' && Boolean(parkSlug),
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

/**
 * The key and the fetch behind {@link usePlanDay}, for a caller that needs the
 * day once, on a press, rather than subscribed (`AddToPlannerButton`).
 * One definition, so `queryClient.fetchQuery` hits the same cache entry the
 * flyout fills and the same 404-is-`null` rule.
 */
export function planDayQuery({
  continent,
  country,
  city,
  parkSlug,
  date,
}: Omit<UsePlanDayParams, 'enabled'>) {
  return {
    queryKey: ['plan-day', continent, country, city, parkSlug, date ?? 'today'],
    queryFn: async (): Promise<PlanDay | null> => {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      const res = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/plan/day${query}`,
        { cache: 'no-store' }
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`plan day ${parkSlug}: ${res.statusText}`);
      return (await res.json()) as PlanDay;
    },
    staleTime: 15 * 60_000,
  };
}
