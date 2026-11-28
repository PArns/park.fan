'use client';

import { GeoLocationCard } from '@/components/common/geo-location-card';
import { useGeoLiveStats, findOpenParkCount } from '@/lib/hooks/use-geo-live-stats';
import type { Coordinate } from '@/lib/utils/distance-utils';

/** Static (cacheable) region-card fields — everything except the live open-park count. */
export interface StaticRegionCard {
  slug: string;
  name: string;
  href: string;
  totalParkCount: number;
  subtitle: string;
  /** Positions of this region's parks — the card derives "X km to the nearest park" from them.
   *  Tuples (not the park tree) so the RSC payload stays small. */
  parkCoordinates?: readonly Coordinate[];
}

/**
 * The continent grid of `/parks`, or with `continent` that continent's country grid. The card
 * structure (name, link, total parks, subtitle) is prerendered/edge-cached; the live open-park
 * count is layered on the client via the shared {@link useGeoLiveStats} batch call, so the shell
 * need not revalidate to keep the count fresh.
 */
export function LiveRegionCards({
  continent,
  regions,
  headingAs,
  className,
}: {
  /** The continent whose countries the cards are; without it the cards are continents. */
  continent?: string;
  regions: StaticRegionCard[];
  headingAs?: 'h2' | 'h3';
  className?: string;
}) {
  const { data } = useGeoLiveStats();
  return (
    <div className={className}>
      {regions.map((r) => (
        <GeoLocationCard
          key={r.slug}
          name={r.name}
          slug={r.slug}
          href={r.href}
          openParkCount={
            continent ? findOpenParkCount(data, continent, r.slug) : findOpenParkCount(data, r.slug)
          }
          totalParkCount={r.totalParkCount}
          subtitle={r.subtitle}
          parkCoordinates={r.parkCoordinates}
          variant={continent ? 'country' : 'continent'}
          headingAs={headingAs}
        />
      ))}
    </div>
  );
}
