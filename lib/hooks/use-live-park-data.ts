import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { mergeLiveParkSnapshot, type LiveParkSnapshot } from '@/lib/api/parks';
import { readParkSimulationParam } from '@/lib/parks/park-simulation';
import type { ParkWithAttractions } from '@/lib/api/types';

interface UseLiveParkDataParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  initialData?: ParkWithAttractions;
  /** Lets a non-primary consumer (e.g. the WeatherCard) subscribe only when it has geo params. */
  enabled?: boolean;
}

/**
 * Hook to fetch live park data with React Query
 * - Page HTML served from Full Route Cache (ISR); this hook provides live updates on top
 * - Refetches immediately on mount: initialData comes from the statically cached page and
 *   can be stale, so we anchor it to epoch (initialDataUpdatedAt: 0) to mark it stale and
 *   force a fresh fetch on mount. (React Query otherwise treats initialData as fresh as of
 *   mount time and would skip the refetch for the full staleTime.)
 * - Auto-polls every 5 min regardless of park status (catches opening/closing)
 * - staleTime 5 min prevents redundant focus-triggered refetches within the poll window
 *
 * What comes back over the wire is the LIVE PROJECTION, not the whole park ({@link
 * LiveParkSnapshot} — ~40 KB instead of ~90 KB, every five minutes, for as long as the tab is
 * open). The merge back onto `initialData` happens in `select`, i.e. per observer against that
 * observer's own seed, so consumers still read a complete `ParkWithAttractions`. Subscribers
 * that pass no seed (WeatherCard, useTodaySchedule) read only park-level live fields and carry
 * props for the rest, so they see the projection unchanged.
 */
export function useLiveParkData({
  continent,
  country,
  city,
  parkSlug,
  initialData,
  enabled = true,
}: UseLiveParkDataParams) {
  // Memoized on the seed: React Query re-runs `select` whenever its identity changes, and this
  // hook re-renders on every minute tick in `useTodaySchedule`.
  const select = useCallback(
    (snapshot: LiveParkSnapshot) => mergeLiveParkSnapshot(initialData, snapshot),
    [initialData]
  );

  // Dev/preview only, `null` everywhere else (see `lib/parks/park-simulation.ts`). It is part of
  // the query key so a simulated snapshot and the real one can never share a cache entry.
  const simState =
    typeof window !== 'undefined' ? readParkSimulationParam(window.location.search) : null;

  return useQuery<LiveParkSnapshot, Error, ParkWithAttractions>({
    queryKey: ['park-live', continent, country, city, parkSlug, simState],
    queryFn: async () => {
      const url = new URL(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}`,
        window.location.origin
      );
      if (simState) url.searchParams.set('state', simState);
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Failed to fetch park: ${response.statusText}`);
      }

      return response.json();
    },
    select,
    // The seed is a full park, which is a valid snapshot too — merging it over itself is a no-op,
    // so the pre-fetch render is byte-identical to what the server sent.
    initialData,
    // initialData comes from the statically cached page HTML and may be stale; anchor it to
    // epoch so React Query treats it as stale and refetches live data on mount (see docblock).
    initialDataUpdatedAt: 0,
    // Run the query on the client only. During the static (Cache Components) prerender the
    // component renders from `initialData`; activating React Query server-side would read
    // Date.now() internally, which a static prerender forbids.
    enabled: enabled && typeof window !== 'undefined',
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });
}
