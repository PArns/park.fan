'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { adminKeys, useAdminQuery } from './api';
import { useSession } from '../_app/session';

/**
 * The auto-refresh loop the monitoring pages run on.
 *
 * The dashboards (system, queues, analytics, ML, maintenance) are live views of
 * a moving system, and they were written against a hand-rolled context that
 * also carried the shared admin password. The password is gone — the session is
 * an httpOnly cookie the browser attaches by itself — so what is left is only
 * the refresh behaviour, which is worth keeping exactly as it was: a 60 s tick,
 * paused while the tab is hidden, with an exponential backoff so a downed
 * backend is not hammered by every open admin tab.
 *
 * `useAdminFetch` stays as the dashboards' data hook rather than being
 * rewritten into `useAdminQuery` at every call site, because what those pages
 * need is precisely "re-read this endpoint on every tick" and React Query's
 * caching would be working against that. It is a thin wrapper now, sharing the
 * query client's fetch counter so the topbar's "refreshing" indicator covers
 * both worlds.
 */

const REFRESH_INTERVAL_MS = 60_000;
/** Cap for the backoff: at most 2^3 - 1 = 7 skipped ticks (8 min). */
const MAX_FAILURE_STREAK = 3;

interface AdminRuntime {
  refreshTick: number;
  refreshing: boolean;
  lastUpdated: Date | null;
  triggerRefresh: () => void;
  logout: () => void;
}

let tickListeners: Array<(tick: number) => void> = [];
let currentTick = 0;
let roundFailed = false;
let failureStreak = 0;
let skipTicks = 0;
let inFlight = 0;
let lastUpdatedAt: Date | null = null;
let refreshingListeners: Array<(refreshing: boolean, lastUpdated: Date | null) => void> = [];
let intervalHandle: ReturnType<typeof setInterval> | null = null;

function emitTick() {
  currentTick += 1;
  tickListeners.forEach((listener) => listener(currentTick));
}

function emitRefreshing(refreshing: boolean) {
  refreshingListeners.forEach((listener) => listener(refreshing, lastUpdatedAt));
}

function beginFetch() {
  inFlight += 1;
  emitRefreshing(true);
}

function endFetch(ok: boolean) {
  if (!ok) roundFailed = true;
  inFlight = Math.max(0, inFlight - 1);
  if (inFlight > 0) return;

  failureStreak = roundFailed ? Math.min(failureStreak + 1, MAX_FAILURE_STREAK) : 0;
  skipTicks = failureStreak === 0 ? 0 : 2 ** failureStreak - 1;
  roundFailed = false;
  lastUpdatedAt = new Date();
  emitRefreshing(false);
}

function ensureInterval() {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (skipTicks > 0) {
      skipTicks -= 1;
      return;
    }
    emitTick();
  }, REFRESH_INTERVAL_MS);
}

export function useAdmin(): AdminRuntime {
  const { signOut } = useSession();
  const client = useQueryClient();
  const queryFetching = useIsFetching({ queryKey: ['admin'] });
  const [tick, setTick] = useState(currentTick);
  const [legacyRefreshing, setLegacyRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(lastUpdatedAt);

  useEffect(() => {
    ensureInterval();
    const onTick = (value: number) => setTick(value);
    const onRefreshing = (value: boolean, updated: Date | null) => {
      setLegacyRefreshing(value);
      setLastUpdated(updated);
    };
    tickListeners.push(onTick);
    refreshingListeners.push(onRefreshing);

    const onVisibility = () => {
      if (!document.hidden) emitTick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      tickListeners = tickListeners.filter((listener) => listener !== onTick);
      refreshingListeners = refreshingListeners.filter((l) => l !== onRefreshing);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const triggerRefresh = useCallback(() => {
    failureStreak = 0;
    skipTicks = 0;
    emitTick();
    void client.invalidateQueries({ queryKey: ['admin'] });
  }, [client]);

  return useMemo(
    () => ({
      refreshTick: tick,
      refreshing: legacyRefreshing || queryFetching > 0,
      lastUpdated,
      triggerRefresh,
      logout: () => {
        void signOut();
      },
    }),
    [tick, legacyRefreshing, queryFetching, lastUpdated, triggerRefresh, signOut]
  );
}

interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Fetch an admin endpoint on mount and on every refresh tick.
 *
 * The `needsPass` parameter is gone: there is no pass any more, and every
 * request carries the session cookie without being asked. Call sites that
 * passed `true` keep working — the argument is simply ignored — so the
 * dashboards did not have to be edited to stop sending a credential they no
 * longer hold.
 */
export function useAdminFetch<T>(endpoint: string | null, _needsPass = false): FetchState<T> {
  const { refreshTick } = useAdmin();
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    loading: endpoint != null,
  });
  const cancelled = useRef(false);

  useEffect(() => {
    if (!endpoint) return;
    cancelled.current = false;
    let ok = false;

    beginFetch();
    fetch(endpoint, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = (await response.json()) as T;
        ok = true;
        if (!cancelled.current) setState({ data: json, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (cancelled.current) return;
        setState((previous) => ({
          ...previous,
          error: error instanceof Error ? error.message : 'Anfrage fehlgeschlagen',
          loading: false,
        }));
      })
      .finally(() => endFetch(ok));

    return () => {
      cancelled.current = true;
    };
  }, [endpoint, refreshTick]);

  return state;
}

/** Re-exported so the dashboards can reach the query layer without a new import path. */
export { adminKeys, useAdminQuery };
