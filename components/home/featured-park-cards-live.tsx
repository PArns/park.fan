'use client';

import { ParkCard } from '@/components/parks/park-card';
import { useRegionParks } from '@/lib/hooks/use-region-parks';

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
  continentSlug: string;
  countrySlug: string;
}

function FeaturedLiveCard({ park }: { park: FeaturedCardStatic }) {
  // One /api/discovery/<continent>/<country> batch per distinct region — React Query dedupes
  // the call across cards (and with any hub-page grid already in the cache), so the featured
  // set costs a handful of small no-store requests, not one per card.
  const { liveByParkId } = useRegionParks(park.continentSlug, park.countrySlug);
  const live = liveByParkId?.[park.parkId];

  return (
    <ParkCard
      parkId={park.parkId}
      name={park.name}
      slug={park.slug}
      city={park.city}
      country={park.country}
      href={park.href as '/'}
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
}

/**
 * Featured-parks card grid with hub-page-style live overlay: the shell bakes only day-stable
 * structure (name, link, city, photo), so the pages embedding it (homepage, blog, glossary,
 * howto) can keep long ISR windows; status/crowd/wait/schedule land client-side and stay on a
 * 5-min poll. Mirrors {@link LiveParkGrid} — kept separate because the featured set spans
 * multiple regions instead of one (continent, country) pair.
 */
export function FeaturedParkCardsLive({ parks }: { parks: FeaturedCardStatic[] }) {
  return (
    <div className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {parks.map((park) => (
        <FeaturedLiveCard key={park.slug} park={park} />
      ))}
    </div>
  );
}
