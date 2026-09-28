'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  canRefreshSilently,
  initialLocationAction,
  promptStateIsReliable,
} from '@/lib/utils/geolocation-permission';

export interface GeolocationPosition {
  lat: number;
  lng: number;
}

export interface GeolocationContextValue {
  position: GeolocationPosition | null;
  /**
   * Radius of the last fix in metres (`coords.accuracy`, 95 % confidence), `null` before the
   * first one. Kept beside `position` rather than inside it: every consumer that compares or
   * keys on `position` would otherwise see a new object whenever only the accuracy moved.
   */
  accuracy: number | null;
  loading: boolean;
  error: boolean;
  /** True when the browser refuses location, whether answered now or stored from an earlier visit. */
  permissionDenied: boolean;
  /**
   * True while a read will not open a prompt: the user has granted location access (survives GPS
   * timeout/unavailable). Falls back to false when the browser reports the grant gone (a one-time
   * grant that expired); the last `position` is kept.
   */
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
 * Centralized geolocation provider. The only place on a public page that reads a position without
 * a tap, and it does so only where the browser has said it will not ask
 * (docs/rules/location-is-asked-for-by-a-tap.md).
 * - Granted (Permissions API): request on mount, no banner.
 * - Denied: remembered as denied, so no control offers a button that cannot work.
 * - Prompt, or no answer: don't request on mount; user can enable via a button. This holds on
 *   every page, blog and news entry pages included, whatever the visitor answered last time.
 * - Follows permission changes (a grant in another tab or in the site settings, an expired one).
 * - Auto-refreshes when position is set (5 min / 1 min in park), never into a prompt.
 */
export function GeolocationProvider({ children }: GeolocationProviderProps) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isInPark, setIsInPark] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const isInParkRef = useRef(false);
  // The live `PermissionStatus` (its `state` follows the browser) and whether its `prompt` means
  // anything here — see `promptStateIsReliable`. Both are set once by the mount check.
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const promptReliableRef = useRef(true);
  // Whether this page has seen the state read `granted`. A `prompt` after that is a grant that ran
  // out; a `prompt` without it may be a live Firefox temporary grant (see `canRefreshSilently`).
  const grantSeenRef = useRef(false);

  useEffect(() => {
    isInParkRef.current = isInPark;
  }, [isInPark]);

  const requestLocation = useCallback((background = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLoading(false);
      setError(true);
      return;
    }

    // Background (interval) refreshes must not pulse `loading`: every context consumer
    // (hero, nearby card, favorites, banner) re-renders on each flip, twice per tick.
    if (!background) {
      setLoading(true);
      setError(false);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Keep the previous object identity when the fix is unchanged, so consumers and
        // position-keyed effects/queries don't churn on every refresh tick.
        setPosition((prev) => (prev && prev.lat === lat && prev.lng === lng ? prev : { lat, lng }));
        setAccuracy(Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null);
        setLoading(false);
        setError(false);
        setPermissionDenied(false);
        setPermissionGranted(true);
        if (permissionStatusRef.current?.state === 'granted') grantSeenRef.current = true;
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

  // On mount: check the persisted permission state, request silently if usable, and follow it.
  useEffect(() => {
    let cancelled = false;
    let status: PermissionStatus | null = null;

    const onChange = () => {
      if (!status) return;
      if (status.state === 'granted') {
        grantSeenRef.current = true;
        // Granted in another tab, in the site settings, or by the prompt one of our buttons opened.
        // A background read: with `maximumAge` a fix taken a moment ago comes back from cache.
        setPermissionDenied(false);
        setPermissionGranted(true);
        requestLocation(true);
      } else if (status.state === 'denied') {
        setPermissionDenied(true);
        setPermissionGranted(false);
      } else if (promptReliableRef.current) {
        // A one-time grant ran out, or a grant or block was reset in the site settings. The last
        // fix stays; the next read needs a tap.
        setPermissionDenied(false);
        setPermissionGranted(false);
      }
    };

    queryGeolocationPermission().then((result) => {
      if (cancelled) return;
      status = result;
      permissionStatusRef.current = result;
      if (result?.state === 'granted') grantSeenRef.current = true;
      promptReliableRef.current = promptStateIsReliable(
        typeof navigator === 'undefined' ? undefined : navigator.vendor
      );
      setInitialCheckDone(true);

      const action = initialLocationAction(result?.state ?? null);
      if (action === 'request') {
        setPermissionGranted(true);
        requestLocation();
      } else if (action === 'denied') {
        setPermissionDenied(true);
      }
      // 'wait': stay not-granted (banner shows).

      result?.addEventListener('change', onChange);
    });

    return () => {
      cancelled = true;
      status?.removeEventListener('change', onChange);
    };
  }, [requestLocation]);

  // Auto-refresh with dynamic interval (only when we have position). Skipped while the
  // tab is hidden — the 60 s in-park cadence would otherwise wake the GPS on a pocketed
  // phone for a page nobody is looking at; on return a fresh fix is requested right away.
  // Each tick first asks the live permission state: Chrome's "Allow this time" runs out after
  // five minutes in the background, and the read on return used to open a prompt nobody tapped.
  useEffect(() => {
    if (position === null || permissionDenied || !permissionGranted) return;

    const refreshSilently = () => {
      if (document.hidden) return;
      // Read live: the `change` event for an expired grant may arrive after this tick.
      const state = permissionStatusRef.current?.state ?? null;
      if (state === 'granted') grantSeenRef.current = true;
      if (canRefreshSilently(state, promptReliableRef.current, grantSeenRef.current)) {
        requestLocation(true);
      }
    };
    const refreshInterval = isInPark ? 60 * 1000 : 5 * 60 * 1000;
    const interval = setInterval(refreshSilently, refreshInterval);
    document.addEventListener('visibilitychange', refreshSilently);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshSilently);
    };
  }, [position, permissionDenied, permissionGranted, isInPark, requestLocation]);

  // Memoized so a provider re-render without an actual state change doesn't hand every
  // consumer a new context reference (which would defeat React's context bailout).
  const value = useMemo<GeolocationContextValue>(
    () => ({
      position,
      accuracy,
      loading,
      error,
      permissionDenied,
      permissionGranted,
      initialCheckDone,
      refresh,
      isInPark,
      setIsInPark,
    }),
    [
      position,
      accuracy,
      loading,
      error,
      permissionDenied,
      permissionGranted,
      initialCheckDone,
      refresh,
      isInPark,
    ]
  );

  return <GeolocationContext.Provider value={value}>{children}</GeolocationContext.Provider>;
}

/**
 * Returns the live geolocation `PermissionStatus`, or `null` when the Permissions API can't
 * report it (unsupported / throws). Its `state` follows the browser and it fires `change`.
 */
async function queryGeolocationPermission(): Promise<PermissionStatus | null> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return null;
  }
  try {
    return await navigator.permissions.query({ name: 'geolocation' });
  } catch (e) {
    console.warn('[Geolocation] Permissions API error:', e);
    return null;
  }
}

export function useGeolocation() {
  const context = useContext(GeolocationContext);

  if (!context) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }

  return context;
}
