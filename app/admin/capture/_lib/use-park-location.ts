'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Where the phone is, and which park that is.
 *
 * Two separate questions with two separate failure modes, so they are two hooks.
 * The position is watched rather than read once — the point of the screen is that
 * the ride in front of you rises to the top, and that only works if the distance
 * updates as you walk. The park is resolved once per fix that matters, because
 * `/api/nearby` is a round trip and the answer does not change between two paths.
 */

export interface DevicePosition {
  lat: number;
  lon: number;
  /** Metres of uncertainty the browser reports — a fix inside a building is poor. */
  accuracy: number;
}

export type PositionStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable';

/**
 * The device's position, kept current.
 *
 * `watchPosition` rather than `getCurrentPosition`: a single fix taken at the
 * entrance is wrong by half a kilometre by the time somebody reaches the back of
 * the park. `enableHighAccuracy` is on because the whole list is ordered by
 * distances of tens of metres, and the coarse fix cannot tell two neighbouring
 * rides apart.
 */
export function useDevicePosition(enabled = true) {
  const [position, setPosition] = useState<DevicePosition | null>(null);
  const [status, setStatus] = useState<PositionStatus>(enabled ? 'locating' : 'idle');
  /** Bumped by `retry`, which is the only thing that re-subscribes. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const geolocation = typeof navigator === 'undefined' ? undefined : navigator.geolocation;
    if (!geolocation) {
      // Reported like any other failure, and deferred like any other callback. A
      // browser without the API is not an event to subscribe to, and setting state
      // straight from an effect body is the cascading render the rule exists to
      // stop — so it goes out as a task instead.
      const timer = setTimeout(() => setStatus('unavailable'), 0);
      return () => clearTimeout(timer);
    }

    const watch = geolocation.watchPosition(
      (fix) => {
        setPosition({
          lat: fix.coords.latitude,
          lon: fix.coords.longitude,
          accuracy: fix.coords.accuracy,
        });
        setStatus('ready');
      },
      (error) => {
        // A denial is permanent until somebody changes it in the browser's
        // settings, so it gets its own state and its own sentence — "Ortung
        // fehlgeschlagen" would send them looking for a signal problem they do
        // not have.
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 }
    );

    return () => geolocation.clearWatch(watch);
  }, [enabled, attempt]);

  const retry = useCallback(() => {
    setStatus('locating');
    setAttempt((n) => n + 1);
  }, []);

  return { position, status, retry };
}

export interface NearbyPark {
  /** `continent/country/city/park`, ready for the backlog endpoint. */
  path: string;
  name: string;
}

/**
 * Which park a fix falls inside, via the public nearby endpoint.
 *
 * `type: 'in_park'` is the only answer this screen acts on. Standing in the car
 * park an hour before opening returns `nearby_parks`, and guessing from that list
 * would file a morning's photographs under whichever park was closest to the
 * motorway — so it reports "no park" and the screen offers the picker.
 *
 * The park's own URL is `/v1/parks/<continent>/<country>/<city>/<slug>`; the four
 * segments are what everything downstream addresses a park by.
 */
export function useNearbyPark(position: DevicePosition | null) {
  const [park, setPark] = useState<NearbyPark | null>(null);
  const [resolving, setResolving] = useState(false);
  const [failed, setFailed] = useState(false);
  /** Resolved once per session: walking around must not re-ask on every fix. */
  const asked = useRef(false);

  useEffect(() => {
    if (!position || asked.current) return;
    asked.current = true;
    setResolving(true);
    setFailed(false);

    const controller = new AbortController();
    fetch(`/api/nearby?lat=${position.lat}&lng=${position.lon}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (data?.type !== 'in_park' || !data?.data?.park?.url) {
          setPark(null);
          return;
        }
        const path = String(data.data.park.url).replace(/^\/?(?:v1\/)?parks\//, '');
        if (path.split('/').filter(Boolean).length !== 4) {
          setPark(null);
          return;
        }
        setPark({ path, name: data.data.park.name ?? path.split('/')[3] });
      })
      .catch(() => {
        // Aborted or offline. `failed` is what makes the screen offer the picker
        // rather than sit on a spinner in a dead spot.
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => setResolving(false));

    return () => controller.abort();
  }, [position]);

  /** Ask again — after moving, or after picking the wrong park by hand. */
  const redetect = useCallback(() => {
    asked.current = false;
    setPark(null);
    setFailed(false);
  }, []);

  return { park, resolving, failed, redetect };
}
