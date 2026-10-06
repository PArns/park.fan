import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { mergeLiveParkSnapshot, type LiveParkSnapshot } from '@/lib/api/parks';
import { readParkSimulationParam } from '@/lib/parks/park-simulation';
import type { ParkWithAttractions } from '@/lib/api/types';
import { LIVE_POLL_QUERY_OPTIONS } from '@/lib/hooks/live-poll-options';

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
 * How long a tab may keep the day-scoped block (shows, restaurants) before asking for it again: a
 * park opening also drops the backend cache, but a show pulled during the day is announced by
 * nothing.
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

/**
 * Polls a park's live projection ({@link LiveParkSnapshot}) every five minutes and merges it onto
 * the server-rendered park in `select`, per observer, so consumers read a complete
 * `ParkWithAttractions`. Shows and restaurants are set for the day, so their full block (`?full=1`)
 * is asked for on the first poll, every {@link DAILY_BLOCK_INTERVAL_MS} and when the park's status
 * flips. See docs/rules/api-budget-per-page.md.
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
    // The seed comes from the cached page and may be stale: anchored to epoch, it refetches on
    // mount instead of counting as fresh for the whole staleTime.
    initialDataUpdatedAt: 0,
    // Client-only: during the static prerender the component renders from `initialData`, and
    // React Query would read the clock.
    enabled: enabled && typeof window !== 'undefined',
    ...LIVE_POLL_QUERY_OPTIONS,
  });
}
