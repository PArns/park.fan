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
import { getDebugPositionForMode, type DebugGeoMode } from '@/lib/debug-geo';

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
  /** Current debug geo mode from Vercel Toolbar (read-only). */
  debugGeoMode: DebugGeoMode | null;
}

const GeolocationContext = createContext<GeolocationContextValue | null>(null);

interface GeolocationProviderProps {
  children: ReactNode;
  /** From Vercel Toolbar Flags Explorer; when "near" or "in", overrides real geolocation. */
  initialDebugGeoMode?: DebugGeoMode;
}

/**
 * Fetches the debug-geo-mode flag from the API (reads cookie on server). Ensures flag overrides
 * work even when the initial server render didn't receive the cookie.
 */
async function fetchDebugGeoMode(): Promise<DebugGeoMode> {
  try {
    const res = await fetch('/api/debug-geo-mode', { credentials: 'same-origin' });
    if (!res.ok) return 'real';
    const json = await res.json();
    const mode = json?.mode;
    return mode === 'near' || mode === 'in' ? mode : 'real';
  } catch {
    return 'real';
  }
}

/**
 * Centralized geolocation provider.
 * - If permission already granted (Permissions API): request location on mount, no banner.
 * - If prompt/denied: don't request on mount; user can enable via banner.
 * - When debug mode is "near" or "in" (from server or client fetch), uses preset coordinates (Phantasialand).
 * - Client fetches /api/debug-geo-mode on mount and on window focus so Flags Explorer overrides apply without full reload.
 * - Auto-refreshes when position is set (5 min / 1 min in park).
 */
export function GeolocationProvider({
  children,
  initialDebugGeoMode = 'real',
}: GeolocationProviderProps) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isInPark, setIsInPark] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  /** Client-resolved flag from /api/debug-geo-mode (cookie); overrides initialDebugGeoMode when set. */
  const [clientDebugMode, setClientDebugMode] = useState<DebugGeoMode | null>(null);

  const positionRef = useRef<GeolocationPosition | null>(null);
  const isInParkRef = useRef(false);
  const prevEffectiveModeRef = useRef<DebugGeoMode>(initialDebugGeoMode);

  const effectiveDebugMode: DebugGeoMode =
    clientDebugMode !== null ? clientDebugMode : initialDebugGeoMode;
  const debugPos = getDebugPositionForMode(effectiveDebugMode);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    isInParkRef.current = isInPark;
  }, [isInPark]);

  const requestLocation = useCallback(() => {
    if (debugPos) {
      setPosition(debugPos);
      setLoading(false);
      setError(false);
      setPermissionDenied(false);
      return;
    }

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

        if (err.code === 1) {
          setPermissionDenied(true);
        }

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
        maximumAge: 0,
      }
    );
  }, [debugPos]);

  const refresh = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  // Fetch flag from API on mount and on window focus so Flags Explorer overrides apply (cookie is sent with fetch)
  useEffect(() => {
    const apply = () => {
      fetchDebugGeoMode().then((mode) => {
        setClientDebugMode(mode);
      });
    };
    apply();
    window.addEventListener('focus', apply);
    return () => window.removeEventListener('focus', apply);
  }, []);

  // When debug position is set, use it; otherwise run normal flow (permission check + request)
  useEffect(() => {
    let cancelled = false;
    const wasDebug =
      prevEffectiveModeRef.current === 'near' || prevEffectiveModeRef.current === 'in';
    prevEffectiveModeRef.current = effectiveDebugMode;

    if (debugPos) {
      queueMicrotask(() => {
        if (cancelled) return;
        setPosition(debugPos);
        setInitialCheckDone(true);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    if (wasDebug && effectiveDebugMode === 'real') {
      queueMicrotask(() => {
        if (!cancelled) setPosition(null);
      });
    }
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
  }, [requestLocation, debugPos, effectiveDebugMode]);

  // Auto-refresh with dynamic interval (only when we have position)
  useEffect(() => {
    if (position === null || permissionDenied) {
      return;
    }

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
    debugGeoMode: effectiveDebugMode !== 'real' ? effectiveDebugMode : null,
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
  } catch {
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
