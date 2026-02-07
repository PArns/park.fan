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
  /** False until initial permission check (Permissions API) has completed; avoids banner flash when permission already granted */
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
 * Check if geolocation permission is already granted via Permissions API.
 * If granted, we request location on mount without showing the banner.
 */
async function isGeolocationGranted(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return false;
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state === 'granted';
  } catch {
    return false;
  }
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
  const [isInPark, setIsInPark] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const positionRef = useRef<GeolocationPosition | null>(null);
  const isInParkRef = useRef(false);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

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
        const newPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(newPosition);
        setLoading(false);
        setError(false);
        setPermissionDenied(false);
      },
      (err) => {
        setLoading(false);
        setError(true);

        // Check if it's a permission denied error (code 1)
        if (err.code === 1) {
          setPermissionDenied(true);
        }

        // Only log non-permission errors
        if (err.code !== 1) {
          console.warn('[Geolocation] Error:', {
            code: err.code,
            message: err.message,
          });
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0, // Always get fresh location
      }
    );
  }, []);

  const refresh = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  // On mount: if permission already granted (Permissions API), request location immediately
  useEffect(() => {
    let cancelled = false;

    isGeolocationGranted().then((granted) => {
      if (cancelled) return;
      setInitialCheckDone(true);
      if (granted) {
        requestLocation();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [requestLocation]);

  // Auto-refresh with dynamic interval (only when we have position)
  useEffect(() => {
    if (position === null || permissionDenied) {
      // Don't set up auto-refresh if we don't have a position or permission was denied
      return;
    }

    // Dynamic interval: 1 minute in park, 5 minutes otherwise
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
    initialCheckDone,
    refresh,
    isInPark,
    setIsInPark,
  };

  return <GeolocationContext.Provider value={value}>{children}</GeolocationContext.Provider>;
}

/**
 * Hook to access geolocation context
 */
export function useGeolocation() {
  const context = useContext(GeolocationContext);

  if (!context) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }

  return context;
}
