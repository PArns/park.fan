'use client';

import { ParkCard } from '@/components/parks/park-card';
import { useRegionParks } from '@/lib/hooks/use-region-parks';

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

  return (
    <div className={className}>
      {parks.map((park) => {
        const live = liveByParkId?.get(park.id);
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
