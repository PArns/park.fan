import { useQuery } from '@tanstack/react-query';
import type { AttractionResponse } from '@/lib/api/types';

interface UseAttractionDetailParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  attractionSlug: string;
  /**
   * Defer the fetch until the consumer actually needs it. The blog's ride spotlight cards gate on
   * "scrolled into view" and its hover previews on "hover opened", so a post that names a dozen
   * rides doesn't fire a dozen detail requests on load.
   */
  enabled?: boolean;
  /**
   * Refresh on a 5-minute cycle and on window focus. Opt-in: the ride page renders its live panel
   * from this response, while the blog's ride cards read live status from the lean `wait-times`
   * batch and use this only for a sparkline.
   */
  poll?: boolean;
}

/**
 * Client-side fetch for an attraction's heavy detail (daily `history`, `hourlyForecast`,
 * `schedule`, `bestVisitTimes`, `predictionAccuracy`) from the CDN-cached
 * `/api/parks/.../attractions/<slug>` route, so the page's static shell does not bake the time
 * series into every ISR write. The daily chart, history grid and accuracy card share this query.
 * A 404 means no detail and resolves to `null`.
 */
export function useAttractionDetail({
  continent,
  country,
  city,
  parkSlug,
  attractionSlug,
  enabled = true,
  poll = false,
}: UseAttractionDetailParams) {
  return useQuery<AttractionResponse | null>({
    queryKey: ['attraction-detail', continent, country, city, parkSlug, attractionSlug],
    queryFn: async () => {
      const response = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/attractions/${attractionSlug}`,
        { cache: 'no-store' }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch attraction detail: ${response.statusText}`);
      }

      return (await response.json()) as AttractionResponse;
    },
    enabled: enabled && !!attractionSlug && typeof window !== 'undefined',
    // Polling consumers use 5 min, the backend's own cache window for an attraction. Others read
    // this for the sparkline and the forecast, not for a live badge.
    staleTime: poll ? 5 * 60_000 : 10 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: poll,
    refetchInterval: poll ? 5 * 60_000 : false,
    retry: 1,
  });
}
