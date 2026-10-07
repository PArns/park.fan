import { useQuery } from '@tanstack/react-query';
import { useLoadLast, LOAD_LAST_META } from '@/lib/hooks/use-load-last';
import { planDayQuery } from '@/lib/hooks/use-plan-day';
import type { PlanDay } from '@/lib/api/types';

/**
 * Today's `/plan/day` for the park page, behind `useLoadLast`: what it feeds (a ride's later
 * opening, the park's early entry) is a line of small print, and it must not queue in front of the
 * live status and weather. Same key as `usePlanDay`, so the in-park suggestions and the planner
 * share the entry. It does not refetch on focus; the opening times it reads move once a day.
 */
export function useParkPlanDay({
  continent,
  country,
  city,
  parkSlug,
  enabled = true,
}: {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  enabled?: boolean;
}) {
  const releasedLast = useLoadLast();
  return useQuery<PlanDay | null>({
    ...planDayQuery({ continent, country, city, parkSlug }),
    meta: LOAD_LAST_META,
    enabled: enabled && releasedLast && typeof window !== 'undefined' && Boolean(parkSlug),
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
