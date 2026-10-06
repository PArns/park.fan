'use client';

import { useEffect, useState } from 'react';

export interface LivePosition {
  lat: number;
  lng: number;
  /** Radius of the fix in metres, 95 % confidence. */
  accuracy: number;
}

/**
 * A precise, following position, only while `enabled` and only where location is already granted.
 * The geolocation context's coarse once-a-minute fix is enough for ride lists but would point a
 * compass arrow at the wrong ride, so this watches with high accuracy while the caller says it is
 * on screen and in front. It never asks: without `granted` it stays `null`.
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
