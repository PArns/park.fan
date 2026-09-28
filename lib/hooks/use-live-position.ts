'use client';

import { useEffect, useState } from 'react';

export interface LivePosition {
  lat: number;
  lng: number;
  /** Radius of the fix in metres, 95 % confidence. */
  accuracy: number;
}

/**
 * A precise, following position — only while `enabled`, and only where location is already
 * granted.
 *
 * The site otherwise avoids a second `watchPosition` (PAR-341): the geolocation context re-reads a
 * coarse fix once a minute in a park, and lists of rides do not need more. A compass does. An arrow
 * computed from a one-minute-old, 50 m fix points at the wrong ride as soon as the reader has
 * walked past two others. So this watches with high accuracy, but the caller passes its own
 * visibility as `enabled`: the watch runs while the compass is on screen and the tab is in front,
 * and is cleared the moment either stops being true — which is when the park map does the same.
 *
 * It never asks. `granted` is the context's answer; without it this stays `null` and the caller
 * falls back to the position the nearby answer was made for.
 */
export function useLivePosition(enabled: boolean, granted: boolean): LivePosition | null {
  const [position, setPosition] = useState<LivePosition | null>(null);

  useEffect(() => {
    if (!enabled || !granted || typeof navigator === 'undefined' || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) =>
        setPosition((prev) =>
          prev &&
          prev.lat === coords.latitude &&
          prev.lng === coords.longitude &&
          prev.accuracy === coords.accuracy
            ? prev
            : { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }
        ),
      () => {
        // Revoked or no fix: keep the last one, the caller falls back without it.
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, granted]);

  return position;
}
