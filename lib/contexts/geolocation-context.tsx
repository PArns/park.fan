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
  refresh: () => void;
  isInPark: boolean;
  setIsInPark: (inPark: boolean) => void;
}

const GeolocationContext = createContext<GeolocationContextValue | null>(null);

interface GeolocationProviderProps {
  children: ReactNode;
}

/**
 * Centralized geolocation provider
 * - Requests location once on mount
 * - Shares position across all components
 * - Auto-refreshes every 5 minutes (or 1 minute when in park)
 * - Prevents duplicate geolocation requests
 */
export function GeolocationProvider({ children }: GeolocationProviderProps) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isInPark, setIsInPark] = useState(false);

  // Use ref to track current position for interval callbacks
  const positionRef = useRef<GeolocationPosition | null>(null);
  const isInParkRef = useRef(false);

  // Update refs when state changes
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

  // Initial location request
  useEffect(() => {
    const timer = setTimeout(() => {
      requestLocation();
    }, 0);

    return () => clearTimeout(timer);
  }, [requestLocation]);

  // Auto-refresh with dynamic interval
  useEffect(() => {
    if (position === null || permissionDenied) {
      // Don't set up auto-refresh if we don't have a position or permission was denied
      return;
    }

    // Dynamic interval: 1 minute in park, 5 minutes otherwise
    const refreshInterval = isInPark ? 60 * 1000 : 5 * 60 * 1000;

    const interval = setInterval(() => {
      console.log(
        `[Geolocation] Auto-refreshing position (${isInParkRef.current ? 'in park - 1 min' : 'normal - 5 min'})`
      );
      requestLocation();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [position, permissionDenied, isInPark, requestLocation]);

  const value: GeolocationContextValue = {
    position,
    loading,
    error,
    permissionDenied,
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
