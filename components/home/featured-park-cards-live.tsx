'use client';

import { useMemo } from 'react';
import { ParkCard } from '@/components/parks/park-card';
import { useLiveParksByRegion, type LiveParkFields } from '@/lib/hooks/use-live-parks-by-region';

/** Static, day-stable card fields resolved on the server (translation + fs background lookup). */
export interface FeaturedCardStatic {
  parkId: string;
  name: string;
  slug: string;
  city: string;
  /** Already-translated country display name. */
  country: string;
  href: string;
  backgroundImage: string | null;
  backgroundPosition?: string;
  continentSlug: string;
  countrySlug: string;
}

function FeaturedLiveCard({ park, live }: { park: FeaturedCardStatic; live?: LiveParkFields }) {
  return (
    <ParkCard
      parkId={park.parkId}
      name={park.name}
      slug={park.slug}
      city={park.city}
      country={park.country}
      href={park.href as '/'}
      backgroundImage={park.backgroundImage}
      objectPosition={park.backgroundPosition}
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
      reserveStatusRow
    />
  );
}

/**
 * Featured-parks card grid with a live overlay: the shell bakes only day-stable structure (name,
 * link, city, photo), so the pages embedding it keep long ISR windows, and status, crowd, wait and
 * schedule land on the client on a 5-minute poll. `useLiveParksByRegion` takes all regions in one
 * request, since the featured set spans several countries.
 */
export function FeaturedParkCardsLive({ parks }: { parks: FeaturedCardStatic[] }) {
  const regions = useMemo(() => parks.map((p) => `${p.continentSlug}/${p.countrySlug}`), [parks]);
  const { liveByParkId } = useLiveParksByRegion(regions);

  return (
    <div className="grid [grid-auto-rows:auto_1fr_auto] gap-4 max-sm:auto-rows-auto sm:grid-cols-2 lg:grid-cols-3">
      {parks.map((park) => (
        <FeaturedLiveCard key={park.slug} park={park} live={liveByParkId?.[park.parkId]} />
      ))}
    </div>
  );
}
