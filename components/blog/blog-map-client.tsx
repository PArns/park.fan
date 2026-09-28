'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ParkWithAttractions } from '@/lib/api/types';

// Leaflet touches `window` on import, so the map can only mount client-side.
// Same pattern the park detail page uses for its map tab.
const ParkMap = dynamic(() => import('@/components/parks/park-map').then((mod) => mod.ParkMap), {
  ssr: false,
  loading: () => <MapBox />,
});

/**
 * The box `ParkMap` draws itself into (`h-[65vh] md:h-[800px]`), standing in until it does. The
 * dynamic import used to render nothing while its chunk loaded, so the post grew by a map's
 * height under whoever was reading below it.
 */
function MapBox() {
  return <div className="bg-muted/40 h-[65vh] w-full rounded-lg border md:h-[800px]" />;
}

/**
 * Mounts the map when it comes near the viewport, not on hydration.
 *
 * The fence usually sits near the end of a long post, and mounting on hydration made every reader
 * download leaflet and its CSS, build the map, request map tiles and start the map's minute clock
 * for a section most of them never scroll to. Same distance as `LazyMount`: about a screen and a
 * half ahead, so the map is there by the time it scrolls into view.
 */
export function BlogMapClient({ park }: { park: ParkWithAttractions }) {
  const [near, setNear] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (near) return;
    const box = boxRef.current;
    if (!box) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: '150% 0px' }
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, [near]);

  // A park without coordinates draws `ParkMap`'s shorter "no map data" box, not a map, so there
  // is nothing to defer and no map-sized box to reserve.
  if (near || park.latitude == null || park.longitude == null) return <ParkMap park={park} />;
  return (
    <div ref={boxRef}>
      <MapBox />
    </div>
  );
}
