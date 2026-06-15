'use client';

import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { ParkStatus } from '@/components/parks/park-status';
import { TabsWithHash } from '@/components/parks/tabs-with-hash';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useMounted } from '@/lib/hooks/use-mounted';
import { groupAttractionsByLand } from '@/lib/utils/park-utils';
import type {
  ParkWithAttractions,
  IntegratedCalendarResponse,
  ParkAttraction,
} from '@/lib/api/types';

interface LiveParkDataProps {
  initialData: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Optional SSR seed for the calendar tab. Omitted now that the tab client-fetches per
   *  visible month — keeps the cold calendar build off the park page's critical path. */
  calendarData?: IntegratedCalendarResponse;
  landNames: string[];
  attractionsByLand: Record<string, ParkAttraction[]>;
  bestDaysSlot?: React.ReactNode;
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
  calendarData,
  landNames,
  attractionsByLand,
  bestDaysSlot,
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

  // Re-group attractions if data has changed (memoized to avoid recalculating on every render)
  const currentAttractionsByLand = useMemo(
    () =>
      park && park.attractions !== initialData.attractions
        ? groupAttractionsByLand(park.attractions || [], landNames[landNames.length - 1])
        : attractionsByLand,
    [park, initialData.attractions, attractionsByLand, landNames]
  );

  const currentLandNames = useMemo(() => {
    if (!(park && park.attractions !== initialData.attractions)) return landNames;
    const otherLabel = landNames[landNames.length - 1];
    return Object.keys(currentAttractionsByLand).sort((a, b) => {
      if (a === otherLabel) return 1;
      if (b === otherLabel) return -1;
      return a.localeCompare(b);
    });
  }, [currentAttractionsByLand, park, initialData.attractions, landNames]);

  const tabsWithHash = (
    <TabsWithHash
      defaultValue="attractions"
      showsAvailable={currentPark.shows && currentPark.shows.length > 0}
      restaurantsAvailable={currentPark.restaurants && currentPark.restaurants.length > 0}
      park={currentPark}
      calendarData={calendarData}
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

      {/* Status, ride-list tabs and best-days are laid out in ONE flex column and reordered per
          breakpoint via `order`, so the heavy <TabsWithHash> (the full attraction grid for big
          parks) is rendered + hydrated EXACTLY ONCE. It used to be mounted twice — a mobile copy
          inside ParkStatus and a `hidden sm:block` desktop copy — and `display:none` does not skip
          hydration, so every park page paid double the hydration/re-render cost (the dominant
          mobile-INP source on large parks like PortAventura). `gap-8` gives uniform spacing.
            mobile : status → tabs → best-days
            desktop: status → best-days → separator → tabs */}
      <div className="flex flex-col gap-8">
        <ParkStatus park={currentPark} variant="detailed" className="order-1" />
        <div className="order-2 sm:order-4">{tabsWithHash}</div>
        {bestDaysSlot && <div className="order-3 sm:order-2">{bestDaysSlot}</div>}
        <Separator className="order-3 hidden sm:block" />
      </div>
    </>
  );
}
