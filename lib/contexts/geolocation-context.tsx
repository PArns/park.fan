'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

export interface GeolocationPosition {
  lat: number;
  lng: number;
}

export interface GeolocationContextValue {
  position: GeolocationPosition | null;
  loading: boolean;
  error: boolean;
  permissionDenied: boolean;
  /** True once the user has granted location access (survives GPS timeout/unavailable). */
  permissionGranted: boolean;
  /** False until initial permission check (Permissions API) has completed. */
  initialCheckDone: boolean;
  refresh: () => void;
  isInPark: boolean;
  setIsInPark: (inPark: boolean) => void;
}

const GeolocationContext = createContext<GeolocationContextValue | null>(null);

interface GeolocationProviderProps {
  children: ReactNode;
}

/**
 * Centralized geolocation provider.
 * - If permission already granted (Permissions API): request location on mount, no banner.
 * - If prompt/denied: don't request on mount; user can enable via banner.
 * - Auto-refreshes when position is set (5 min / 1 min in park).
 */
export function GeolocationProvider({ children }: GeolocationProviderProps) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isInPark, setIsInPark] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const isInParkRef = useRef(false);

  useEffect(() => {
    isInParkRef.current = isInPark;
  }, [isInPark]);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
        setError(false);
        setPermissionDenied(false);
        setPermissionGranted(true);
      },
      (err) => {
        setLoading(false);

        if (err.code === 1) {
          // User explicitly denied → clear granted flag
          setPermissionDenied(true);
          setPermissionGranted(false);
          setError(true);
          console.warn('[Geolocation] Permission denied by user');
        } else {
          // code=2 (unavailable) or code=3 (timeout): the browser had permission but
          // couldn't get a fix. Mark as granted so banners don't reappear.
          setPermissionGranted(true);
          console.warn(
            '[Geolocation]',
            err.code === 3 ? 'Timeout' : 'Position unavailable',
            err.message
          );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        // Longer than the refresh interval (5 min / 1 min in park) so cached positions
        // are always reused on auto-refresh instead of triggering a fresh GPS lookup.
        maximumAge: 8 * 60 * 1000,
      }
    );
  }, []);

  const refresh = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  // On mount: check if permission already granted, request silently if so.
  useEffect(() => {
    let cancelled = false;

    isGeolocationGranted().then((granted) => {
      if (cancelled) return;
      setInitialCheckDone(true);
      if (granted) {
        setPermissionGranted(true);
        requestLocation();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [requestLocation]);

  // Auto-refresh with dynamic interval (only when we have position)
  useEffect(() => {
    if (position === null || permissionDenied) return;

    const refreshInterval = isInPark ? 60 * 1000 : 5 * 60 * 1000;
    const interval = setInterval(() => {
      requestLocation();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [position, permissionDenied, isInPark, requestLocation]);

  const value: GeolocationContextValue = {
    position,
    loading,
    error,
    permissionDenied,
    permissionGranted,
    initialCheckDone,
    refresh,
    isInPark,
    setIsInPark,
  };

  return <GeolocationContext.Provider value={value}>{children}</GeolocationContext.Provider>;
}

async function isGeolocationGranted(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return false;
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state === 'granted';
  } catch (e) {
    console.warn('[Geolocation] Permissions API error:', e);
    return false;
  }
}

export function useGeolocation() {
  const context = useContext(GeolocationContext);

  if (!context) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }

  return context;
}
