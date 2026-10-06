'use client';

import { useEffect, useState } from 'react';
import { pickHeroImage, type HeroImageMeta } from '@/lib/media/hero';

/**
 * How long one photo stays: long enough not to flicker between visits, and the shared window
 * carries the picture from the login screen into the dashboard.
 */
const HERO_WINDOW_MS = 30 * 60 * 1000;

export interface HeroPhoto {
  src: string;
  meta: HeroImageMeta | null;
}

/**
 * The rotating admin photo, picked after mount because the choice depends on the clock, on which
 * server and browser would disagree. It reads `@/lib/media/hero`, the client-safe slice of the
 * media database.
 */
export function useHeroPhoto(windowMs: number = HERO_WINDOW_MS): HeroPhoto | null {
  const [photo, setPhoto] = useState<HeroPhoto | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setPhoto(pickHeroImage(windowMs)), 0);
    return () => clearTimeout(id);
  }, [windowMs]);

  return photo;
}
