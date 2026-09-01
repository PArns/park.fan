import { useQuery, useQueryClient } from '@tanstack/react-query';
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
 *
 * Shows and restaurant statuses are the case the projection could not cover, because they are
 * neither live nor stable: they are set for the DAY. The server render's copy comes out of a
 * fetch cached for PARK_REVALIDATE, so a tab opened at noon can be looking at a snapshot written
 * before the park unlocked its gates — showtimes dated yesterday, every show CLOSED. So this hook
 * asks for them (`?full=1`) on its first poll and every {@link DAILY_BLOCK_INTERVAL_MS} after,
 * plus once more when the park's own status flips, which is what changes the API's answer for
 * them. Upstream it is free: the proxy re-fetches the whole park on every poll either way.
 */
/**
 * How long a tab may keep a day-scoped block before asking for it again.
 *
 * Half an hour, because the two things it can be wrong about resolve on different clocks: the
 * park opening (which the backend also pushes at, by dropping the park's cache tag — so a page
 * LOADED after opening is already right, and this covers the tab that was open across it) and a
 * show pulled during the day, which nothing announces. Measured against a running server the block
 * costs 5.1 KB, so this cadence spends ~10 KB an hour on it rather than ~61.
 */
const DAILY_BLOCK_INTERVAL_MS = 30 * 60_000;

/**
 * Per-park bookkeeping for that cadence.
 *
 * Module scope, because the state belongs to the QUERY, not to an observer: the park page, the
 * weather card and `useTodaySchedule` share one `park-live` entry and therefore one `queryFn`
 * run, so a ref would give each of them its own idea of when the last full poll was and whoever
 * happened to trigger the fetch would decide with it.
 */
const dailyBlockPolls = new Map<string, { lastFullAt: number; status?: string }>();

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

  const queryClient = useQueryClient();
  const queryKey = ['park-live', continent, country, city, parkSlug, simState];
  const pollKey = `${continent}/${country}/${city}/${parkSlug}/${simState ?? ''}`;

  return useQuery<LiveParkSnapshot, Error, ParkWithAttractions>({
    queryKey,
    queryFn: async () => {
      const url = new URL(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}`,
        window.location.origin
      );
      if (simState) url.searchParams.set('state', simState);

      // First poll of this tab, or the half hour is up — see DAILY_BLOCK_INTERVAL_MS.
      const previousPoll = dailyBlockPolls.get(pollKey);
      const wantsDailyBlock =
        !previousPoll || Date.now() - previousPoll.lastFullAt >= DAILY_BLOCK_INTERVAL_MS;
      if (wantsDailyBlock) url.searchParams.set('full', '1');

      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Failed to fetch park: ${response.statusText}`);
      }

      const snapshot = (await response.json()) as LiveParkSnapshot;

      // A poll without the day-scoped block means "unchanged", so the freshest one this tab has
      // seen has to survive into the cached snapshot — `select` merges what is IN the snapshot
      // over the server-rendered seed, and dropping the block here would hand the next render
      // back the seed's morning copy.
      const cached = queryClient.getQueryData<LiveParkSnapshot>(queryKey);
      if (!snapshot.shows && cached?.shows) snapshot.shows = cached.shows;
      if (!snapshot.restaurants && cached?.restaurants) snapshot.restaurants = cached.restaurants;

      // The park opening or closing is exactly what rewrites the block upstream (the API reports
      // every show as CLOSED for as long as the park is), so a flip seen on a lean poll asks for
      // the next one in full rather than waiting out the half hour.
      const statusFlipped = previousPoll ? previousPoll.status !== snapshot.status : false;
      dailyBlockPolls.set(pollKey, {
        lastFullAt: wantsDailyBlock ? Date.now() : statusFlipped ? 0 : previousPoll.lastFullAt,
        status: snapshot.status,
      });

      return snapshot;
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
