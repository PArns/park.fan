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
    />
  );
}

/**
 * Featured-parks card grid with hub-page-style live overlay: the shell bakes only day-stable
 * structure (name, link, city, photo), so the pages embedding it (homepage, blog, glossary,
 * howto) can keep long ISR windows; status/crowd/wait/schedule land client-side and stay on a
 * 5-min poll.
 *
 * The featured set deliberately spans several countries (the German strip reaches Efteling and
 * Disneyland Paris), which used to mean one request per country: three requests and 16.7 KB to
 * fill in nine fields on six cards. `useLiveParksByRegion` takes the whole region list at once,
 * so the strip is one request now. The hook sits here rather than in the card so the list is
 * passed down instead of re-derived six times.
 */
export function FeaturedParkCardsLive({ parks }: { parks: FeaturedCardStatic[] }) {
  const regions = useMemo(() => parks.map((p) => `${p.continentSlug}/${p.countrySlug}`), [parks]);
  const { liveByParkId } = useLiveParksByRegion(regions);

  return (
    <div className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {parks.map((park) => (
        <FeaturedLiveCard key={park.slug} park={park} live={liveByParkId?.[park.parkId]} />
      ))}
    </div>
  );
}
