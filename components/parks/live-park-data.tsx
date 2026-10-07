'use client';

import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { TabsWithHash } from '@/components/parks/tabs-with-hash';
import { RideAlertParkProvider } from '@/components/push/ride-alert-park-context';
import { ParkInParkBlock } from '@/components/parks/park-in-park-block';
import { ParkOpeningsProvider } from '@/components/parks/park-openings-context';
import { useMemo } from 'react';
import { groupAttractionsByLand, sortLandNames } from '@/lib/utils/park-utils';
import type { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import type { ClosedRideSearchItem } from '@/components/parks/closed-ride-matches';

interface LiveParkDataProps {
  initialData: ParkWithAttractions;
  /**
   * Today in the PARK's timezone, `YYYY-MM-DD`, from the server render.
   *
   * Passed rather than computed here for the reason the park page states at the
   * call site: this tree renders on both sides of hydration, and a clock read
   * inside it would answer twice.
   */
  todayIso: string;
  /** Does this park have a wait-time record page? Server-resolved, since the flag is a fact about
   *  the park's aggregate and not about the live poll — see `ParkTileSource.statsAvailable`. */
  statsAvailable?: boolean;
  /** The height the rider-height filter opens on, from the URL's `?height=`, already validated. */
  initialRiderHeight?: number | null;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  landNames: string[];
  attractionsByLand: Record<string, ParkAttraction[]>;
  /** Translated bucket name for attractions the API reports without a land. */
  otherAttractionsLabel: string;
  mazeSectionLabel: string;
  /** <ParkTodayPanel> as a slot — it is the top half of the header card whose bottom half is the
   *  entry-tile row, and that card is built inside <TabsWithHash>. */
  todayPanel?: React.ReactNode;
  /** The park's rides that closed for good, for the ride search. Server-built, day-stable, and
   *  absent for the parks without one. */
  closedRides?: readonly ClosedRideSearchItem[];
  /** What the page renders under the tabs, handed to <TabsWithHash> so the „Mit Kindern“ block in
   *  it can read the rider-height filter — see `TabsWithHashProps.belowTabs`. */
  belowTabs?: React.ReactNode;
}

/**
 * The park page's live body: polls the park over the server-rendered snapshot and re-groups its
 * rides by land for `TabsWithHash`. A failed poll keeps the last known state; the warning is
 * <LiveDataFreshness>.
 */
export function LiveParkData({
  initialData,
  todayIso,
  statsAvailable,
  initialRiderHeight,
  continent,
  country,
  city,
  parkSlug,
  landNames,
  attractionsByLand,
  otherAttractionsLabel,
  mazeSectionLabel,
  todayPanel,
  closedRides,
  belowTabs,
}: LiveParkDataProps) {
  const { data: park } = useLiveParkData({
    continent,
    country,
    city,
    parkSlug,
    initialData,
  });

  const currentPark = park || initialData;

  // The land-less bucket name comes from `otherAttractionsLabel`, NOT from the last of
  // `landNames`: the server only sorts that label last when the park HAS land-less rides, so
  // otherwise a ride that lost its `land` in the poll would be filed under the last real land.
  const currentAttractionsByLand = useMemo(
    () =>
      park && park.attractions !== initialData.attractions
        ? groupAttractionsByLand(park.attractions || [], otherAttractionsLabel, mazeSectionLabel)
        : attractionsByLand,
    [park, initialData.attractions, attractionsByLand, otherAttractionsLabel, mazeSectionLabel]
  );

  const currentLandNames = useMemo(() => {
    if (!(park && park.attractions !== initialData.attractions)) return landNames;
    return sortLandNames(
      Object.keys(currentAttractionsByLand),
      otherAttractionsLabel,
      mazeSectionLabel
    );
  }, [
    currentAttractionsByLand,
    park,
    initialData.attractions,
    landNames,
    otherAttractionsLabel,
    mazeSectionLabel,
  ]);

  // The park's ride list for every ride-alert bell in the tabs below: a bell opens the full
  // alert dialog with this ride picked and the park's other rides in the list.
  const tabsWithHash = (
    <RideAlertParkProvider park={currentPark} reopenAvailable={hasReadableWaitTimes(initialData)}>
      <ParkOpeningsProvider
        continent={continent}
        country={country}
        city={city}
        parkSlug={parkSlug}
        timezone={initialData.timezone}
        schedule={currentPark.schedule ?? initialData.schedule}
        todayIso={todayIso}
      >
        <TabsWithHash
          defaultValue="attractions"
          todayIso={todayIso}
          showsAvailable={currentPark.shows && currentPark.shows.length > 0}
          restaurantsAvailable={currentPark.restaurants && currentPark.restaurants.length > 0}
          weatherAvailable={!!currentPark.weather?.current}
          statsAvailable={statsAvailable}
          initialRiderHeight={initialRiderHeight}
          park={currentPark}
          continent={continent}
          country={country}
          city={city}
          parkSlug={parkSlug}
          landNames={currentLandNames}
          attractionsByLand={currentAttractionsByLand}
          todayPanel={todayPanel}
          closedRides={closedRides}
          belowTabs={belowTabs}
        />
      </ParkOpeningsProvider>
    </RideAlertParkProvider>
  );

  return (
    <>
      {/* <TabsWithHash> is rendered and hydrated EXACTLY ONCE: a second, `display:none` copy for
          another breakpoint would still hydrate. */}
      {/* "Near you" for a visitor standing in this park; nothing for everybody else. Its ask for
          location is the title card's `ParkLocationLine`. */}
      <ParkInParkBlock park={currentPark} />
      {tabsWithHash}
    </>
  );
}
