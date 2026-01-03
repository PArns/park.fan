'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { Input } from '@/components/ui/input';
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

// Dynamic import to avoid SSR issues with Leaflet
const ParkMap = dynamic(() => import('@/components/parks/park-map').then((mod) => mod.ParkMap), {
  ssr: false,
});

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Avoid hydration mismatch by only rendering after mount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const tabsRef = useRef<HTMLDivElement>(null);

  // Sync with URL hash on mount and on hash change
  useEffect(() => {
    if (!isMounted) return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validTabs = ['attractions', 'shows', 'restaurants', 'calendar', 'map'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);

        // Scroll with a manual offset calculation for better reliability
        setTimeout(() => {
          const tabsContainer = tabsRef.current;

          if (tabsContainer) {
            // Prefer scrolling to the tabs container to show the navigation
            const headerOffset = 100; // Account for sticky header
            const elementPosition = tabsContainer.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }
        }, 500);
      }
    };

    // Check hash on mount/update
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isMounted]);

  // Clear search on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        // Optional: blur input if desired, but keeping focus is usually better for UX
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // Auto-focus on typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only trigger if attractions tab is active
      if (activeTab !== 'attractions') return;

      // Ignore if user is already typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ignore modifiers
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Only trigger on single character keys (letters, numbers, etc.)
      if (e.key.length === 1) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab]);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL hash without triggering navigation
    window.history.replaceState(null, '', `${pathname}#${value}`);
  };

  // Flatten attractions for Fuse.js
  const allAttractions = Object.values(attractionsByLand).flat();

  // Initialize Fuse instance
  const fuse = new Fuse(allAttractions, {
    keys: [
      { name: 'name', weight: 0.8 },
      { name: 'slug', weight: 0.8 },
      { name: 'land', weight: 0.5 },
      { name: 'queues.queueType', weight: 0.3 },
    ],
    threshold: 0.3,
    distance: 100,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  // Filter attractions based on search query
  const filteredAttractionsByLand =
    searchQuery.trim() === ''
      ? attractionsByLand
      : fuse
          .search(searchQuery)
          .map((result) => result.item)
          .reduce(
            (acc, attraction) => {
              const land = attraction.land || 'Other';
              if (!acc[land]) {
                acc[land] = [];
              }
              acc[land].push(attraction);
              return acc;
            },
            {} as Record<string, ParkAttraction[]>
          );

  const hasSearchResults = Object.keys(filteredAttractionsByLand).length > 0;

  if (!isMounted) {
    return null; // Or a skeleton/placeholder
  }

  return (
    <div ref={tabsRef} className="scroll-mt-20">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6 h-auto w-full flex-wrap justify-start">
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
          <TabsTrigger value="map">{t('map')}</TabsTrigger>
        </TabsList>

        <TabsContent value="attractions" id="attractions">
          {/* Attractions grouped by Land */}
          <div className="relative space-y-8">
            <div className="relative z-10 mb-4 md:absolute md:top-0 md:right-0 md:mb-0">
              <div className="relative w-full sm:w-auto">
                <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                <Input
                  ref={inputRef}
                  placeholder={t('searchAttractions')}
                  className={`w-full pl-9 transition-all duration-300 sm:w-[250px] focus:sm:w-[300px] ${
                    isFocused && searchQuery ? 'pr-16' : 'pr-4'
                  }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                {isFocused && searchQuery && (
                  <div className="animate-in fade-in zoom-in pointer-events-none absolute top-1/2 right-3 -translate-y-[0.85rem] duration-200">
                    <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                      ESC
                    </kbd>
                  </div>
                )}
              </div>
            </div>

            {hasSearchResults ? (
              landNames.map((landName) => {
                const attractions = filteredAttractionsByLand[landName];
                if (!attractions) return null;

                return (
                  <LandSection
                    key={landName}
                    landName={landName}
                    attractions={attractions}
                    parkPath={`/parks/${continent}/${country}/${city}/${parkSlug}`}
                    parkStatus={park.status}
                  />
                );
              })
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">{t('noAttractionsFound')}</p>
                <button
                  className="text-primary mt-2 text-sm underline hover:no-underline"
                  onClick={() => setSearchQuery('')}
                >
                  {t('clearSearch')}
                </button>
              </div>
            )}
          </div>
        </TabsContent>

        {showsAvailable && (
          <TabsContent value="shows" id="shows">
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
                                className={`text-xs ${isPast ? 'line-through opacity-50' : ''} ${
                                  isNext ? 'bg-green-600 hover:bg-green-700' : ''
                                }`}
                              >
                                <LocalTime time={showtime.startTime} timeZone={park.timezone} />
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      {todayShowtimes.length === 0 &&
                        show.showtimes &&
                        show.showtimes.length > 0 && (
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
          <TabsContent value="restaurants" id="restaurants">
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

        <TabsContent value="calendar" id="calendar">
          <ParkCalendar park={park} calendarData={calendarData} />
        </TabsContent>

        <TabsContent value="map" id="map">
          <ParkMap park={park} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
