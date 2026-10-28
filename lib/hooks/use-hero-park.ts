'use client';

import { useMemo } from 'react';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { resolveHeroPark, type HeroParkVariant } from '@/lib/home/hero-park';

/**
 * The hero's park, after mount only: `useHomeNearbyParks` reads the last known position from
 * localStorage and can answer in the first client render, which would not match the server's
 * general hero. The hero's text column reads it from `md` up, the phone's search list below.
 */
export function useHeroPark(): HeroParkVariant | null {
  const mounted = useMounted();
  const { data } = useHomeNearbyParks();
  const nearby = mounted ? data : undefined;
  return useMemo(() => resolveHeroPark(nearby), [nearby]);
}
