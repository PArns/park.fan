'use client';

import { useEffect, useState } from 'react';
import { pickHeroImage, type HeroImageMeta } from '@/lib/media/hero';

/**
 * How long one photograph stays.
 *
 * Long enough not to flicker between visits, short enough that the admin does
 * not become one park's admin. It is also what carries the picture from the
 * login screen into the dashboard: both ask for the same window, so within the
 * same half hour both get the same park, and signing in does not throw away
 * the thing you were just looking at.
 */
export const HERO_WINDOW_MS = 30 * 60 * 1000;

export interface HeroPhoto {
  src: string;
  meta: HeroImageMeta | null;
}

/**
 * The rotating photograph, picked in the browser.
 *
 * After mount, deliberately. The choice depends on the clock, so doing it
 * during render would make the server and the browser disagree about which
 * photo — and the deferred `setTimeout(…, 0)` is the shape this codebase
 * already uses for a clock-dependent value (`useBrowserNow`), which keeps it
 * clear of `react-hooks/set-state-in-effect`.
 *
 * `@/lib/media/hero` is the only client-safe slice of the media database:
 * 21 KB against the 107 KB catalog that `@/lib/media` would ship.
 */
export function useHeroPhoto(windowMs: number = HERO_WINDOW_MS): HeroPhoto | null {
  const [photo, setPhoto] = useState<HeroPhoto | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setPhoto(pickHeroImage(windowMs)), 0);
    return () => clearTimeout(id);
  }, [windowMs]);

  return photo;
}
