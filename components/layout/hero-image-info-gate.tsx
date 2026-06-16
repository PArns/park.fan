'use client';

import type React from 'react';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';

/**
 * Hides the (server-rendered) hero image attribution when the user is detected inside a park.
 * In that case the hero rotates the park's own images, so the global image's caption would be
 * misleading. The hero itself already names the park ("You're at <Park>"), so dropping the caption
 * is fine.
 */
export function HeroImageInfoGate({ children }: { children: React.ReactNode }) {
  const { data: nearbyData } = useHomeNearbyParks();
  if (nearbyData?.type === 'in_park') return null;
  return <>{children}</>;
}
