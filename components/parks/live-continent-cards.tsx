'use client';

import { GeoLocationCard } from '@/components/common/geo-location-card';
import { useGeoLiveStats, findOpenParkCount } from '@/lib/hooks/use-geo-live-stats';

/** Static (cacheable) continent-card fields — everything except the live open-park count. */
export interface StaticContinentCard {
  slug: string;
  name: string;
  href: string;
  totalParkCount: number;
  subtitle: string;
}

/**
 * Parks-hub continent grid. The card structure (name, link, total parks, country count) is
 * prerendered/edge-cached; the live open-park count is layered on the client via the shared
 * {@link useGeoLiveStats} batch call — so the /parks shell no longer revalidates every 10 min just
 * to keep the count fresh. Mirrors {@link LiveCountryCards} one level up the geo hierarchy.
 *
 * `seedOpenParkCount` is the day-stale structural count (from getContinents) shown until the live
 * batch lands, so the cards aren't blank on first paint.
 */
export function LiveContinentCards({
  continents,
  seedOpenParkCount,
  className,
}: {
  continents: StaticContinentCard[];
  seedOpenParkCount: Record<string, number>;
  className?: string;
}) {
  const { data } = useGeoLiveStats();
  return (
    <div className={className}>
      {continents.map((c) => (
        <GeoLocationCard
          key={c.slug}
          name={c.name}
          slug={c.slug}
          href={c.href}
          openParkCount={findOpenParkCount(data, c.slug) ?? seedOpenParkCount[c.slug]}
          totalParkCount={c.totalParkCount}
          subtitle={c.subtitle}
          variant="continent"
        />
      ))}
    </div>
  );
}
