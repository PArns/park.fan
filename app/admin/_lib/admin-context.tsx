'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export const SESSION_KEY = 'parkfan_admin_pass';
const REFRESH_INTERVAL_MS = 60_000;
/** Cap for the exponential backoff: at most 2^3 - 1 = 7 skipped ticks (8 min). */
const MAX_FAILURE_STREAK = 3;

/** Header used to send the admin pass to /api/admin/* (kept out of URLs/server logs). */
export const ADMIN_PASS_HEADER = 'x-admin-pass';

interface AdminContextValue {
  pass: string;
  refreshTick: number;
  refreshing: boolean;
  lastUpdated: Date | null;
  triggerRefresh: () => void;
  logout: () => void;
  beginFetch: () => void;
  endFetch: (ok: boolean) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}

export function AdminProvider({
  pass,
  onLogout,
  children,
}: {
  pass: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const inFlight = useRef(0);
  const roundFailed = useRef(false);
  const failureStreak = useRef(0);
  const skipTicks = useRef(0);

  const triggerRefresh = useCallback(() => {
    failureStreak.current = 0;
    skipTicks.current = 0;
    setRefreshTick((t) => t + 1);
  }, []);

  const beginFetch = useCallback(() => {
    inFlight.current += 1;
    setRefreshing(true);
  }, []);

  const endFetch = useCallback((ok: boolean) => {
    if (!ok) roundFailed.current = true;
    inFlight.current = Math.max(0, inFlight.current - 1);
    if (inFlight.current === 0) {
      // Exponential backoff: after a failed round, skip 1/3/7 auto-refresh ticks
      // so a downed backend isn't hammered by every open admin tab.
      failureStreak.current = roundFailed.current
        ? Math.min(failureStreak.current + 1, MAX_FAILURE_STREAK)
        : 0;
      skipTicks.current = failureStreak.current === 0 ? 0 : 2 ** failureStreak.current - 1;
      roundFailed.current = false;
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      if (skipTicks.current > 0) {
        skipTicks.current -= 1;
        return;
      }
      setRefreshTick((t) => t + 1);
    }, REFRESH_INTERVAL_MS);

    // Refresh immediately when the tab becomes visible again (ticks are paused while hidden).
    const onVisibilityChange = () => {
      if (!document.hidden) setRefreshTick((t) => t + 1);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <AdminContext.Provider
      value={{
        pass,
        refreshTick,
        refreshing,
        lastUpdated,
        triggerRefresh,
        logout: onLogout,
        beginFetch,
        endFetch,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Fetches an admin endpoint on mount and on every refresh tick (auto-refresh
 * + manual). Pass-protected endpoints send the pass via header (not the URL,
 * to keep it out of logs/history).
 * Refetches whenever `endpoint` changes (e.g. pagination/search state).
 */
export function useAdminFetch<T>(endpoint: string | null, needsPass = false): FetchState<T> {
  const { pass, refreshTick, beginFetch, endFetch } = useAdmin();
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    loading: endpoint != null,
  });

  useEffect(() => {
    if (!endpoint) return;
    let cancelled = false;
    let ok = false;

    beginFetch();
    fetch(endpoint, {
      cache: 'no-store',
      headers: needsPass ? { [ADMIN_PASS_HEADER]: pass } : undefined,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as T;
        ok = true;
        if (!cancelled) setState({ data: json, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Request failed',
            loading: false,
          }));
        }
      })
      .finally(() => {
        endFetch(ok);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, needsPass, pass, refreshTick, beginFetch, endFetch]);

  return state;
}
