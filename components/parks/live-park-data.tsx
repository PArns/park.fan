'use client';

import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { TabsWithHash } from '@/components/parks/tabs-with-hash';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useMounted } from '@/lib/hooks/use-mounted';
import { groupAttractionsByLand } from '@/lib/utils/park-utils';
import type { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';

interface LiveParkDataProps {
  initialData: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  landNames: string[];
  attractionsByLand: Record<string, ParkAttraction[]>;
  /** Translated bucket name for attractions the API reports without a land. */
  otherAttractionsLabel: string;
}

/**
 * Client component that wraps park data with live updates
 * - Uses initial SSR data for instant render
 * - Refreshes on window focus (when user returns to tab)
 * - Shows live indicator when data is fresh
 * - Gracefully falls back to last known state on error
 */
export function LiveParkData({
  initialData,
  continent,
  country,
  city,
  parkSlug,
  landNames,
  attractionsByLand,
  otherAttractionsLabel,
}: LiveParkDataProps) {
  const t = useTranslations('common');
  // Gate the live-refetch indicator on mount: the server render (and first client render) must agree
  // (both render the empty fixed-height slot), or the refetch-on-mount flipping `isFetching` true
  // would cause a hydration mismatch on this force-dynamic page.
  const mounted = useMounted();

  const {
    data: park,
    isError,
    error,
    isFetching,
  } = useLiveParkData({
    continent,
    country,
    city,
    parkSlug,
    initialData,
  });

  // Use current data if available, otherwise fall back to initial data
  const currentPark = park || initialData;

  // Re-group attractions if data has changed (memoized to avoid recalculating on every render).
  // The land-less bucket name comes from the explicit `otherAttractionsLabel` prop, NOT from
  // `landNames[landNames.length - 1]`: the server only sorts that label last when the park
  // actually HAS land-less attractions. On every other park the last entry is a real land, so a
  // ride that lost its `land` in the live poll was silently filed under (and counted towards)
  // whichever land sorts last alphabetically.
  const currentAttractionsByLand = useMemo(
    () =>
      park && park.attractions !== initialData.attractions
        ? groupAttractionsByLand(park.attractions || [], otherAttractionsLabel)
        : attractionsByLand,
    [park, initialData.attractions, attractionsByLand, otherAttractionsLabel]
  );

  const currentLandNames = useMemo(() => {
    if (!(park && park.attractions !== initialData.attractions)) return landNames;
    return Object.keys(currentAttractionsByLand).sort((a, b) => {
      if (a === otherAttractionsLabel) return 1;
      if (b === otherAttractionsLabel) return -1;
      return a.localeCompare(b);
    });
  }, [currentAttractionsByLand, park, initialData.attractions, landNames, otherAttractionsLabel]);

  const tabsWithHash = (
    <TabsWithHash
      defaultValue="attractions"
      showsAvailable={currentPark.shows && currentPark.shows.length > 0}
      restaurantsAvailable={currentPark.restaurants && currentPark.restaurants.length > 0}
      weatherAvailable={!!currentPark.weather?.current}
      park={currentPark}
      continent={continent}
      country={country}
      city={city}
      parkSlug={parkSlug}
      landNames={currentLandNames}
      attractionsByLand={currentAttractionsByLand}
    />
  );

  return (
    <>
      {/* Error State - Still show data but warn user */}
      {isError && (
        <Card className="mb-6 border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                {t('failedToLoadLiveData')}
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {t('showingLastKnownState')}
                {error instanceof Error && ` (${error.message})`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Subtle loading indicator during background refetch. Wrapped in a fixed-height slot that is
          always present, so the indicator appearing/disappearing on every 5-min poll (and on the
          immediate refetch-on-mount) no longer shifts the status + tabs below it (CLS). */}
      <div className="mb-4 h-4">
        {mounted && isFetching && !isError && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{t('updating')}</span>
          </div>
        )}
      </div>

      {/* Just the tiles and the tab body now.
          The <ParkStatus variant="detailed"> board that used to open this column is gone: every
          figure on its three cards — occupancy and the vs-typical delta, today's and the live
          crowd rating, Ø wait, peak, and open-of-total — is now in <ParkTodayPanel> up in the
          header, and printing them a second time here is what made the page read as two answers
          to one question. Best-days moved INTO the calendar tab, where it opens the chapter it
          belongs to; between the header and the tabs it was a ~500px block about a future visit
          standing in front of the way to everything else.
          The heavy <TabsWithHash> stays rendered + hydrated EXACTLY ONCE — it used to be mounted
          twice (a mobile copy inside ParkStatus and a `hidden sm:block` desktop copy) and
          `display:none` does not skip hydration, which was the dominant mobile-INP source on
          large parks like PortAventura. */}
      {tabsWithHash}
    </>
  );
}
