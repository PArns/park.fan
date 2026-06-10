'use client';

import dynamic from 'next/dynamic';
import type { ParkWithAttractions } from '@/lib/api/types';

// Leaflet touches `window` on import, so the map can only mount client-side.
// Same pattern the park detail page uses for its map tab.
const ParkMap = dynamic(() => import('@/components/parks/park-map').then((mod) => mod.ParkMap), {
  ssr: false,
});

export function BlogMapClient({ park }: { park: ParkWithAttractions }) {
  return <ParkMap park={park} />;
}
