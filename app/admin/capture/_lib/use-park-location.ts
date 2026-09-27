'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { parkGeoFromUrl } from '@/lib/planner/park-url';

/**
 * Where the phone is, and which park that is.
 *
 * Two separate questions with two separate failure modes, so they are two hooks.
 * The position is watched rather than read once — the point of the screen is that
 * the ride in front of you rises to the top, and that only works if the distance
 * updates as you walk. The park is resolved once it is found, because
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
 *
 * While the tab is in front, every fix the browser reports is published, about
 * one a second. PAR-341 dropped fixes that moved less than 10 m and let the first
 * callback come from a cache up to 60 s old; in the park that made the
 * nearest-ride card trail the walk by several seconds, and it is the card the
 * whole screen exists for. Re-sorting a backlog of a few dozen rides once a
 * second costs nothing a phone notices.
 *
 * What stays from PAR-341 is the one lever that does not slow the screen down:
 * the watch is released while the tab is in the background. The workflow is to
 * leave for the camera and come back, and a fix nobody is on screen to read is
 * the GPS radio running for nothing. Coming back re-subscribes, and a cached fix
 * of up to 15 s answers the first callback straight away.
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
 * Metres around a park's stored point that still count as standing in it.
 *
 * The endpoint answers `in_park` on `distance <= radius` against one stored point
 * per park — there is no boundary and no tolerance, so at 1001 m the answer flips.
 * Its default of 1000 m is smaller than several parks: measured across the 182
 * parks with attraction coordinates, 22 have a ride further than 1000 m from their
 * own point (Shanghai Disneyland 2097 m, Ocean Park 1993 m, Cedar Point 1446 m),
 * and the widest genuine one is 2266 m. Standing at those rides returned "no park"
 * while the ride list beside it worked, because that one is computed on the client
 * with no radius gate at all.
 *
 * 3000 m covers the widest park and leaves the car park and the entrance plaza
 * inside. It does not make the answer less certain: which park comes back is
 * decided by whichever point is nearest, and inside a resort that is already a
 * coin toss (PortAventura, Ferrari Land and Caribe share one point; Disneyland and
 * DCA are 86 m apart). That is what the picker is for, and a hand-picked park wins
 * over this one anyway.
 */
const IN_PARK_RADIUS_M = 3000;

/**
 * How long to wait before asking again while no park has been found.
 *
 * The first fix is often the coarse one — a cell tower, or the last position the
 * browser had cached — and a "no park" answer to it used to be final until
 * somebody pressed a button. Now the next fix asks again, but not every second:
 * the answer is a round trip, and a fix a second in a dead spot would queue them.
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
 * The park an `in_park` answer names, and its path when the answer carries one.
 *
 * The park object in that answer has **no** `url`: checked against the running
 * endpoint on 2026-09-27 for Phantasialand, it carries id, name, slug, distance,
 * status, analytics, timezone and schedules, and nothing with the continent,
 * country or city in it. Requiring `park.url` is what made this screen answer
 * "Kein Park in Reichweite" in every park since it shipped. Every ride in the
 * same answer does carry one (`/v1/parks/<continent>/<country>/<city>/<park>/
 * attractions/<slug>`), which is the geography the planner already reads
 * (`parkGeoFromUrl`). `park.url` is still tried first, for the day it appears.
 *
 * `path` is null when neither is there — a park whose rides have no coordinates
 * comes back with an empty ride list — and the caller asks once more for it.
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
 * Which park a fix falls inside.
 *
 * `type: 'in_park'` is the only answer that names a park here — the
 * `nearby_parks` list is never guessed from, because picking its first entry
 * would file a morning's photographs under whichever park was closest to the
 * motorway. It reports "no park" instead and the screen offers the picker.
 *
 * The second request only runs when the `in_park` answer had no URL to read the
 * geography from. `radius=0` turns the same point into a `nearby_parks` answer,
 * whose entries do carry their URL, and the park is found in it by the slug the
 * first answer already named — it is a lookup, not a second guess.
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
 * Which park the phone is in, via the public nearby endpoint.
 *
 * Asked on the first fix and, while nothing has been found, again on a later fix
 * every `RETRY_WITHOUT_PARK_MS`. Once a park is found it stays: walking around
 * must not re-ask on every fix.
 *
 * The request is not tied to the fix that started it. A fix arrives about once a
 * second, and aborting the request on each one would cancel every answer before
 * it came back — it is aborted only by `redetect` and on unmount.
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
