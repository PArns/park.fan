'use client';

import { GeoLocationCard } from '@/components/common/geo-location-card';
import { useGeoLiveStats, findOpenParkCount } from '@/lib/hooks/use-geo-live-stats';

/** Static (cacheable) country-card fields — everything except the live open-park count. */
export interface StaticCountryCard {
  slug: string;
  name: string;
  href: string;
  totalParkCount: number;
  subtitle: string;
}

/**
 * Continent-page country grid. The card structure (name, link, total parks, city count) is
 * prerendered/edge-cached; the live open-park count is layered on the client via the shared
 * {@link useGeoLiveStats} batch call — so the continent shell no longer revalidates every 10 min
 * just to keep the count fresh.
 */
export function LiveCountryCards({
  continent,
  countries,
  className,
}: {
  continent: string;
  countries: StaticCountryCard[];
  className?: string;
}) {
  const { data } = useGeoLiveStats();
  return (
    <div className={className}>
      {countries.map((c) => (
        <GeoLocationCard
          key={c.slug}
          name={c.name}
          slug={c.slug}
          href={c.href}
          openParkCount={findOpenParkCount(data, continent, c.slug)}
          totalParkCount={c.totalParkCount}
          subtitle={c.subtitle}
          variant="country"
        />
      ))}
    </div>
  );
}
