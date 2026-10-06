'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { parkGeoFromUrl } from '@/lib/planner/park-url';

/**
 * Where the phone is, and which park that is: two questions with two failure modes, so two hooks.
 * The position is watched so the ride in front of you rises as you walk; the park is resolved once.
 */

export interface DevicePosition {
  lat: number;
  lon: number;
  /** Metres of uncertainty the browser reports — a fix inside a building is poor. */
  accuracy: number;
}

export type PositionStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable';

/**
 * The device's position, kept current. Watched with high accuracy because the list is ordered by
 * distances of tens of metres, and every fix is published so the nearest-ride card keeps up with
 * the walk. The watch is released while the tab is in the background, where nobody reads it.
 */
export function useDevicePosition(enabled = true) {
  const [position, setPosition] = useState<DevicePosition | null>(null);
  const [status, setStatus] = useState<PositionStatus>(enabled ? 'locating' : 'idle');
  /** Bumped by `retry`, which is the only thing that re-subscribes. */
  const [attempt, setAttempt] = useState(0);
  /** Whether the tab is in front. Only then is there a watch at all. */
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const read = () => setActive(document.visibilityState === 'visible');
    read();
    document.addEventListener('visibilitychange', read);
    return () => document.removeEventListener('visibilitychange', read);
  }, []);

  useEffect(() => {
    if (!enabled || !active) return;

    const geolocation = typeof navigator === 'undefined' ? undefined : navigator.geolocation;
    if (!geolocation) {
      // Deferred like any other callback: setting state straight from an effect body is the
      // cascading render the lint rule stops.
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
        // A denial lasts until the browser's settings change, so it gets its own state and
        // sentence instead of sending somebody looking for a signal problem.
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 }
    );

    return () => geolocation.clearWatch(watch);
  }, [enabled, active, attempt]);

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
 * Metres around a park's stored point that still count as standing in it. The endpoint compares
 * against one point per park, and its 1000 m default is smaller than several parks (the widest has
 * a ride 2266 m out). Which park comes back is still decided by the nearest point.
 */
const IN_PARK_RADIUS_M = 3000;

/**
 * How long to wait before asking again while no park has been found. The first fix is often
 * coarse, so a later fix asks again, but not every second: each answer is a round trip.
 */
const RETRY_WITHOUT_PARK_MS = 15_000;

/** Nearby answers name parks by their API URL; the backlog wants the four segments. */
function parkPath(url: string | null | undefined, slug: string): string | null {
  const geo = parkGeoFromUrl(url);
  return geo ? `${geo.continent}/${geo.country}/${geo.city}/${slug}` : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/**
 * The park an `in_park` answer names, and its path when the answer carries one. The park object
 * has no `url`, so the geography comes from the first ride that has one (`park.url` is still tried
 * first). `path` is null when neither is there, and the caller asks once more.
 */
export function readInParkAnswer(
  data: unknown
): { slug: string; name: string; path: string | null } | null {
  const answer = record(data);
  if (answer?.type !== 'in_park') return null;
  const body = record(answer.data);
  const park = record(body?.park);
  const slug = typeof park?.slug === 'string' && park.slug ? park.slug : null;
  if (!park || !slug) return null;

  const name = typeof park.name === 'string' && park.name ? park.name : slug;
  let path = parkPath(typeof park.url === 'string' ? park.url : null, slug);
  const rides = Array.isArray(body?.rides) ? body.rides : [];
  // `for` rather than `[0]`: a ride with no URL must not end the search.
  for (const ride of rides) {
    if (path) break;
    const url = record(ride)?.url;
    path = parkPath(typeof url === 'string' ? url : null, slug);
  }
  return { slug, name, path };
}

/** The path of `slug` in a `nearby_parks` answer, whose parks each carry a `url`. */
export function pathFromNearbyParks(data: unknown, slug: string): string | null {
  const answer = record(data);
  if (answer?.type !== 'nearby_parks') return null;
  const parks = record(answer.data)?.parks;
  if (!Array.isArray(parks)) return null;
  const park = parks.map(record).find((entry) => entry?.slug === slug);
  return park && typeof park.url === 'string' ? parkPath(park.url, slug) : null;
}

async function askNearby(query: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(`/api/nearby?${query}`, { signal });
  if (!response.ok) throw new Error(`nearby ${response.status}`);
  return response.json();
}

/**
 * Which park a fix falls inside. Only `in_park` names a park: guessing from `nearby_parks` would
 * file a morning's photos under whichever park is closest to the motorway. The second request
 * (`radius=0`) only looks up the URL of the park the first answer named.
 */
async function resolveNearbyPark(
  position: DevicePosition,
  signal: AbortSignal
): Promise<NearbyPark | null> {
  const at = `lat=${position.lat}&lng=${position.lon}`;
  const inPark = readInParkAnswer(await askNearby(`${at}&radius=${IN_PARK_RADIUS_M}`, signal));
  if (!inPark) return null;
  const path =
    inPark.path ??
    pathFromNearbyParks(await askNearby(`${at}&radius=0&limit=10`, signal), inPark.slug);
  return path ? { path, name: inPark.name } : null;
}

/**
 * Which park the phone is in, via the public nearby endpoint. Asked again every
 * `RETRY_WITHOUT_PARK_MS` until a park is found, which then stays. The request is aborted only by
 * `redetect` and on unmount: a fix arrives about once a second and would cancel every answer.
 */
export function useNearbyPark(position: DevicePosition | null) {
  const [park, setPark] = useState<NearbyPark | null>(null);
  const [resolving, setResolving] = useState(false);
  const [failed, setFailed] = useState(false);
  /** Bumped by `redetect`, so it asks again even when no new fix arrives. */
  const [attempt, setAttempt] = useState(0);
  const inFlight = useRef<AbortController | null>(null);
  const lastAskedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!position || park || inFlight.current) return;
    const now = Date.now();
    if (lastAskedAt.current !== null && now - lastAskedAt.current < RETRY_WITHOUT_PARK_MS) return;

    const controller = new AbortController();
    inFlight.current = controller;
    lastAskedAt.current = now;
    setResolving(true);
    setFailed(false);

    resolveNearbyPark(position, controller.signal)
      .then((found) => {
        if (!controller.signal.aborted) setPark(found);
      })
      .catch(() => {
        // Aborted or offline. `failed` is what makes the screen offer the picker
        // rather than sit on a spinner in a dead spot.
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (inFlight.current !== controller) return;
        inFlight.current = null;
        setResolving(false);
      });
  }, [position, park, attempt]);

  // On unmount the request goes, and so does the memory of having asked: React's
  // development double mount runs this and then the effect above again, and that
  // second run must be free to ask rather than wait out the retry interval.
  useEffect(
    () => () => {
      inFlight.current?.abort();
      inFlight.current = null;
      lastAskedAt.current = null;
    },
    []
  );

  /** Ask again — after moving, or after picking the wrong park by hand. */
  const redetect = useCallback(() => {
    inFlight.current?.abort();
    inFlight.current = null;
    lastAskedAt.current = null;
    setPark(null);
    setFailed(false);
    setResolving(false);
    setAttempt((n) => n + 1);
  }, []);

  return { park, resolving, failed, redetect };
}
