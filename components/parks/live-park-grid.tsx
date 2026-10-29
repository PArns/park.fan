'use client';

import { ParkCard } from '@/components/parks/park-card';
import { useLiveParksByRegion } from '@/lib/hooks/use-live-parks-by-region';
import { useViewerPosition } from '@/lib/hooks/use-distance-to';
import { useMounted } from '@/lib/hooks/use-mounted';
import { calculateDistance } from '@/lib/utils/distance-utils';

/** Static (cacheable) per-park fields resolved on the server — nothing here changes during the day. */
export interface StaticPark {
  id: string;
  name: string;
  slug: string;
  /** City display name (for the card subtitle). */
  city: string;
  /** Already-translated country name. */
  countryName: string;
  /** Frontend href. */
  href: string;
  /** Resolved server-side (fs lookup can't run on the client). */
  backgroundImage: string | null;
  backgroundPosition?: string;
  /** Park position — feeds the card's "X km away" line. Null for parks that never geocoded. */
  latitude?: number | null;
  longitude?: number | null;
}

interface LiveParkGridProps {
  /** The `"<continent>/<country>"` pairs the parks lie in: one on a geo page, several on a brand page. */
  regions: string[];
  parks: StaticPark[];
  className?: string;
}

/**
 * Renders a grid of park cards whose STRUCTURE (name, link, city, photo) is prerendered and
 * edge-cached, while the live status / crowd / wait time / schedule is layered on the client via
 * {@link useLiveParksByRegion}. The hub page's ISR shell stays status-free and long-cached without
 * ever showing a stale open/closed badge. Grids on one page with the same regions share one request.
 */
export function LiveParkGrid({ regions, parks, className }: LiveParkGridProps) {
  const { liveByParkId } = useLiveParksByRegion(regions);
  // One position read for the whole grid (not one per card). Only after mount, like everywhere
  // this query is read: `useViewerPosition` resolves from the position `useNearbyParks` seeds out
  // of `localStorage`, so a returning visitor HAS it in the first client render while the
  // prerendered card carries no distance line. That extra `· 49.7 km` is a hydration mismatch
  // React answers by regenerating the whole grid (PAR-956). The cards gain the line after mount,
  // same as the live-status overlay above.
  const mounted = useMounted();
  const position = useViewerPosition();
  const viewer = mounted ? position : null;

  return (
    <div className={className}>
      {parks.map((park) => {
        const live = liveByParkId?.[park.id];
        // These come from `/v1/discovery/*`, which sends real JSON numbers; it is the
        // park-detail endpoints that send decimal strings, and those are parsed at the
        // fetch boundary (lib/api/coordinates). Coerce anyway, and drop the distance
        // rather than render "NaN km" if a payload ever arrives in the other shape.
        const lat = park.latitude == null ? NaN : Number(park.latitude);
        const lng = park.longitude == null ? NaN : Number(park.longitude);
        const distance =
          viewer && Number.isFinite(lat) && Number.isFinite(lng)
            ? calculateDistance(viewer.lat, viewer.lng, lat, lng)
            : undefined;
        return (
          <ParkCard
            key={park.id}
            parkId={park.id}
            name={park.name}
            slug={park.slug}
            city={park.city}
            country={park.countryName}
            href={park.href}
            backgroundImage={park.backgroundImage}
            objectPosition={park.backgroundPosition}
            distance={distance}
            variant="detailed"
            // Live overlay — undefined until the client batch call resolves, so the prerendered
            // shell shows the card without a status badge (the footer renders its own skeleton).
            status={live?.status}
            crowdLevel={live?.crowdLevel}
            averageWaitTime={live?.averageWaitTime}
            operatingAttractions={live?.operatingAttractions}
            totalAttractions={live?.totalAttractions}
            timezone={live?.timezone}
            hasOperatingSchedule={live?.hasOperatingSchedule}
            todaySchedule={live?.todaySchedule}
            nextSchedule={live?.nextSchedule}
          />
        );
      })}
    </div>
  );
}
