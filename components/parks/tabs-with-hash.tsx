'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandSection } from '@/components/parks/land-section';
import { ParkCalendar } from '@/components/parks/park-calendar';
import { LocalTime } from '@/components/ui/local-time';
import type {
  ParkWithAttractions,
  IntegratedCalendarResponse,
  ParkAttraction,
} from '@/lib/api/types';

interface TabsWithHashProps {
  defaultValue: string;
  showsAvailable: boolean | undefined;
  restaurantsAvailable: boolean | undefined;
  park: ParkWithAttractions;
  calendarData: IntegratedCalendarResponse;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  landNames: string[];
  attractionsByLand: Record<string, ParkAttraction[]>;
}

export function TabsWithHash({
  defaultValue,
  showsAvailable,
  restaurantsAvailable,
  park,
  calendarData,
  continent,
  country,
  city,
  parkSlug,
  landNames,
  attractionsByLand,
}: TabsWithHashProps) {
  const pathname = usePathname();
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');

  // Initialize with defaultValue to match server rendering (avoids hydration mismatch)
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Sync with URL hash on mount and on hash change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validTabs = ['attractions', 'shows', 'restaurants', 'calendar'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };

    // Check hash on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL hash without triggering navigation
    window.history.replaceState(null, '', `${pathname}#${value}`);
  };



  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="attractions">
          {t('attractions')} ({park.attractions?.length || 0})
        </TabsTrigger>
        {showsAvailable && (
          <TabsTrigger value="shows">
            {t('shows')} ({park.shows?.length || 0})
          </TabsTrigger>
        )}
        {restaurantsAvailable && (
          <TabsTrigger value="restaurants">
            {t('restaurants')} ({park.restaurants?.length || 0})
          </TabsTrigger>
        )}
        <TabsTrigger value="calendar">{t('calendar')}</TabsTrigger>
      </TabsList>

      <TabsContent value="attractions">
        {/* Attractions grouped by Land */}
        <div className="space-y-8">
          {landNames.map((landName) => (
            <LandSection
              key={landName}
              landName={landName}
              attractions={attractionsByLand[landName]}
              parkPath={`/parks/${continent}/${country}/${city}/${parkSlug}`}
              parkStatus={park.status}
            />
          ))}
        </div>
      </TabsContent>

      {showsAvailable && (
        <TabsContent value="shows">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {park.shows?.map((show) => {
              // Filter showtimes for today or future dates
              const today = new Date();
              const todayShowtimes =
                show.showtimes?.filter((showtime) => {
                  const showtimeDate = new Date(showtime.startTime);
                  return (
                    showtimeDate >= today || showtimeDate.toDateString() === today.toDateString()
                  );
                }) || [];

              // Find next showtime
              const nextShowtime = todayShowtimes.find((showtime) => {
                const showtimeDate = new Date(showtime.startTime);
                return showtimeDate > today;
              });

              return (
                <Card key={show.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{show.name}</h3>

                    {/* All showtimes */}
                    {todayShowtimes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {todayShowtimes.map((showtime, i) => {
                          const showtimeDate = new Date(showtime.startTime);
                          const isPast = showtimeDate < today;
                          const isNext =
                            nextShowtime && showtime.startTime === nextShowtime.startTime;

                          return (
                            <Badge
                              key={i}
                              variant={isNext ? 'default' : 'outline'}
                              className={`text-xs ${isPast ? 'line-through opacity-50' : ''} ${isNext ? 'bg-green-600 hover:bg-green-700' : ''
                                }`}
                            >
                              <LocalTime time={showtime.startTime} timeZone={park.timezone} />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    {todayShowtimes.length === 0 && show.showtimes && show.showtimes.length > 0 && (
                      <p className="text-muted-foreground mt-2 text-sm">
                        {tCommon('noShowtimesToday')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      )}

      {restaurantsAvailable && (
        <TabsContent value="restaurants">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {park.restaurants?.map((restaurant) => (
              <Card key={restaurant.id}>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{restaurant.name}</h3>
                  {restaurant.cuisineType && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {restaurant.cuisineType}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      )}

      <TabsContent value="calendar">
        <ParkCalendar park={park} calendarData={calendarData} />
      </TabsContent>
    </Tabs>
  );
}
