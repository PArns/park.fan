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
const REFRESH_INTERVAL_MS = 15_000;

interface AdminContextValue {
  pass: string;
  refreshTick: number;
  refreshing: boolean;
  lastUpdated: Date | null;
  triggerRefresh: () => void;
  logout: () => void;
  beginFetch: () => void;
  endFetch: () => void;
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

  const triggerRefresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  const beginFetch = useCallback(() => {
    inFlight.current += 1;
    setRefreshing(true);
  }, []);

  const endFetch = useCallback(() => {
    inFlight.current = Math.max(0, inFlight.current - 1);
    if (inFlight.current === 0) {
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => setRefreshTick((t) => t + 1), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
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
 * + manual). Pass-protected endpoints get the `pass` query param appended.
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
    const url = needsPass
      ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}pass=${encodeURIComponent(pass)}`
      : endpoint;

    beginFetch();
    fetch(url, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as T;
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
        endFetch();
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, needsPass, pass, refreshTick, beginFetch, endFetch]);

  return state;
}
