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
   * Keep the response fresh on a 5-minute cycle (and on window focus), the way the park poll this
   * replaced did.
   *
   * Opt-in rather than always-on: the ride page now renders its LIVE panel from this response, so
   * it has to refresh; the blog's ride cards read live status from the lean whole-park
   * `wait-times` batch and only use this for a sparkline, so polling it there would add a request
   * per on-screen card for values nothing re-reads.
   */
  poll?: boolean;
}

/**
 * Client-side fetch for an attraction's heavy detail: the daily `history` + `hourlyForecast`
 * time-series (plus `schedule`, `bestVisitTimes`, `predictionAccuracy`).
 *
 * Moved off the server render so the attraction page's static shell no longer bakes this
 * time-series into every per-attraction × per-locale ISR write — by far the dominant ISR-write
 * source (the attraction route was the top writer in Vercel's cache dashboard). The
 * `/api/parks/.../attractions/<slug>` route serves it as a CDN-cached function response
 * (s-maxage=3600); this hook just polls that. The daily chart, history grid and the
 * prediction-accuracy card all consume it, sharing one request via this query key.
 *
 * - Browser-only (`enabled` gated on `window`): never runs during the static prerender, where
 *   React Query reading the clock is forbidden under Cache Components.
 * - 404 = attraction has no detail → treated as `null`, no retries.
 * - 10-min staleTime mirrors the route's CDN window (today's hourlyForecast refines through the
 *   day; the backend caches attractions ~5 min), so a revisit refetches rather than showing 1h-old
 *   forecast.
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
    // Polling consumers mirror the old park poll's cadence: 5 min, which is also what the backend
    // caches an attraction for, so a shorter window would only add origin load without adding
    // freshness. Non-polling consumers keep the longer window — they read this for the sparkline
    // and the forecast, not for a live badge.
    staleTime: poll ? 5 * 60_000 : 10 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: poll,
    refetchInterval: poll ? 5 * 60_000 : false,
    retry: 1,
  });
}
