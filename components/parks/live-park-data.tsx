'use client';

import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { ParkStatus } from '@/components/parks/park-status';
import { TabsWithHash } from '@/components/parks/tabs-with-hash';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  calendarData: IntegratedCalendarResponse;
  landNames: string[];
  attractionsByLand: Record<string, ParkAttraction[]>;
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
}: LiveParkDataProps) {
  const t = useTranslations('common');

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

  // Re-group attractions if data has changed
  const currentAttractionsByLand =
    park && park.attractions !== initialData.attractions
      ? groupAttractionsByLand(park.attractions || [], landNames[landNames.length - 1])
      : attractionsByLand;

  const currentLandNames =
    park && park.attractions !== initialData.attractions
      ? Object.keys(currentAttractionsByLand).sort((a, b) => {
          const otherLabel = landNames[landNames.length - 1];
          if (a === otherLabel) return 1;
          if (b === otherLabel) return -1;
          return a.localeCompare(b);
        })
      : landNames;

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

      {/* Subtle loading indicator during background refetch */}
      {isFetching && !isError && (
        <div className="text-muted-foreground mb-4 flex items-center gap-2 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{t('updating')}</span>
        </div>
      )}

      {/* Park Status Component */}
      <ParkStatus park={currentPark} variant="detailed" />

      <Separator className="my-8" />

      {/* Tabs for Attractions, Shows, Restaurants */}
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
    </>
  );
}

// Helper function to group attractions by land (same as in page.tsx)
function groupAttractionsByLand(
  attractions: ParkAttraction[],
  fallbackName: string = 'Other Attractions'
): Record<string, ParkAttraction[]> {
  const grouped: Record<string, ParkAttraction[]> = {};

  attractions.forEach((attraction) => {
    const landName = attraction.land || fallbackName;
    if (!grouped[landName]) {
      grouped[landName] = [];
    }
    grouped[landName].push(attraction);
  });

  // Sort attractions within each land by name
  Object.keys(grouped).forEach((land) => {
    grouped[land].sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped;
}
