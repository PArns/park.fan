'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { getParkHeroImages } from '@/lib/hero-images-park';
import type { NearbyAttractionsData } from '@/types/nearby';

/** How long each park image stays before crossfading to the next (only when >1 image). */
const PARK_ROTATE_MS = 8000;

interface HeroRotation {
  /** The in-park park's curated hero images (empty when not in a park). */
  parkImages: string[];
  /** Index into `parkImages` that is currently shown. */
  activeIndex: number;
  /** The currently shown park image, or null when not rotating park images. */
  activeSrc: string | null;
}

const HeroRotationContext = createContext<HeroRotation>({
  parkImages: [],
  activeIndex: 0,
  activeSrc: null,
});

/**
 * Owns the in-park hero rotation in one place so the background images and the image attribution
 * stay perfectly in sync (a single interval, a single index). When the user isn't in a park,
 * `parkImages` is empty and consumers fall back to their default behavior.
 */
export function HeroRotationProvider({ children }: { children: ReactNode }) {
  const { data: nearbyData } = useHomeNearbyParks();
  const parkSlug =
    nearbyData?.type === 'in_park'
      ? (nearbyData.data as NearbyAttractionsData).park?.slug
      : undefined;
  const parkImages = useMemo(() => getParkHeroImages(parkSlug), [parkSlug]);

  // Monotonic counter; active = step % length, so it stays in range across park changes without
  // resetting state inside the effect. The tick is skipped while the tab is hidden — the
  // crossfade is invisible there, and the provider sits high enough in the tree that every
  // step re-renders the whole hero subtree for nothing.
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (parkImages.length <= 1) return;
    const id = setInterval(() => {
      if (!document.hidden) setStep((s) => s + 1);
    }, PARK_ROTATE_MS);
    return () => clearInterval(id);
  }, [parkImages]);

  const value = useMemo<HeroRotation>(() => {
    if (parkImages.length === 0) return { parkImages, activeIndex: 0, activeSrc: null };
    const activeIndex = step % parkImages.length;
    return { parkImages, activeIndex, activeSrc: parkImages[activeIndex] };
  }, [parkImages, step]);

  return <HeroRotationContext.Provider value={value}>{children}</HeroRotationContext.Provider>;
}

export function useHeroRotation(): HeroRotation {
  return useContext(HeroRotationContext);
}
