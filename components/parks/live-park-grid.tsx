'use client';

import { ParkCard } from '@/components/parks/park-card';
import { useRegionParks } from '@/lib/hooks/use-region-parks';
import { useViewerPosition } from '@/lib/hooks/use-distance-to';
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
  /** Park position — feeds the card's "X km away" line. Null for parks that never geocoded. */
  latitude?: number | null;
  longitude?: number | null;
}

interface LiveParkGridProps {
  continent: string;
  country: string;
  parks: StaticPark[];
  className?: string;
}

/**
 * Renders a grid of park cards whose STRUCTURE (name, link, city, photo) is prerendered and
 * edge-cached, while the live status / crowd / wait time / schedule is layered on the client via
 * {@link useRegionParks}. This keeps the hub-page ISR shell status-free (so it can be cached for a
 * day instead of churning every hour to stay fresh) without ever showing a stale open/closed badge:
 * the badge simply renders once the client batch call lands. Multiple grids on a country page share
 * one underlying request (React Query dedupe by continent+country).
 */
export function LiveParkGrid({ continent, country, parks, className }: LiveParkGridProps) {
  const { liveByParkId } = useRegionParks(continent, country);
  // One position read for the whole grid (not one per card). Null on the server and until the
  // visitor's position resolves — the cards then simply gain their distance line, same as the
  // live-status overlay above.
  const viewer = useViewerPosition();

  return (
    <div className={className}>
      {parks.map((park) => {
        const live = liveByParkId?.[park.id];
        // Coordinates are typed as numbers but decimal columns have leaked through as strings
        // before — coerce, and drop the distance rather than render "NaN km".
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
