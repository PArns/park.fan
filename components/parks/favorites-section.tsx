'use client';

import { useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParkCardNearby } from '@/components/parks/park-card-nearby';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';
import { AttractionCard } from '@/components/parks/attraction-card';
import { AttractionCardSkeleton } from '@/components/parks/attraction-card-skeleton';
import { ShowCard } from '@/components/parks/show-card';
import { FavoriteStar } from '@/components/common/favorite-star';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useFavorites } from '@/lib/hooks/use-favorites';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistance } from '@/lib/utils/distance-utils';
import { stripNewPrefix } from '@/lib/utils';
import {
  buildShowUrl,
  buildRestaurantUrl,
  convertApiUrlToFrontendUrl,
} from '@/lib/utils/url-utils';
import { Link } from '@/i18n/navigation';
import { ChevronRight, Navigation, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function FavoritesSection() {
  const t = useTranslations('favorites');
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const { position } = useGeolocation();
  const { data: favoritesData, isLoading: loading } = useFavorites();

  const queryClient = useQueryClient();

  // Sort by distance (nearest first) or alphabetically if no distance available
  const sortByDistanceOrName = useCallback(
    <T extends { distance?: number; name: string }>(items: T[]): T[] => {
      return [...items].sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });
    },
    []
  );

  // Memoize sorted list to avoid recalculating when parent re-renders
  const sortedFavorites = useMemo(
    () =>
      favoritesData
        ? {
            parks: sortByDistanceOrName(favoritesData.parks),
            attractions: sortByDistanceOrName(favoritesData.attractions),
            shows: sortByDistanceOrName(favoritesData.shows),
            restaurants: sortByDistanceOrName(favoritesData.restaurants),
          }
        : null,
    [favoritesData, sortByDistanceOrName]
  );

  // Invalidate on favorites-changed (React Query refetches active queries automatically)
  useEffect(() => {
    const handleFavoritesChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    };

    window.addEventListener('favorites-changed', handleFavoritesChanged);
    return () => {
      window.removeEventListener('favorites-changed', handleFavoritesChanged);
    };
  }, [queryClient]);

  // Same structure on server and initial client to avoid hydration mismatch (React Query state differs)
  if (!mounted || loading) {
    return (
      <section className="border-b px-4 py-8">
        <div className="container mx-auto">
          <Card className="gap-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="text-park-primary h-5 w-5" />
                  {t('title')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="bg-muted mb-4 h-6 w-24 rounded" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <ParkCardNearbySkeleton />
                  <ParkCardNearbySkeleton />
                  <ParkCardNearbySkeleton />
                </div>
              </div>
              <div>
                <div className="bg-muted mb-4 h-6 w-24 rounded" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AttractionCardSkeleton />
                  <AttractionCardSkeleton />
                  <AttractionCardSkeleton />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const hasAnyFavorites =
    sortedFavorites &&
    (sortedFavorites.parks.length > 0 ||
      sortedFavorites.attractions.length > 0 ||
      sortedFavorites.shows.length > 0 ||
      sortedFavorites.restaurants.length > 0);

  const totalFavorites =
    (sortedFavorites?.parks.length ?? 0) +
    (sortedFavorites?.attractions.length || 0) +
    (sortedFavorites?.shows.length || 0) +
    (sortedFavorites?.restaurants.length || 0);

  if (!hasAnyFavorites) {
    return (
      <section className="border-b px-4 py-8">
        <div className="container mx-auto" />
      </section>
    );
  }

  return (
    <section className="border-b px-4 py-8">
      <div className="container mx-auto">
        <Card className="gap-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="text-park-primary h-5 w-5" />
                {t('title')} ({totalFavorites})
              </CardTitle>
              {!position && <p className="text-muted-foreground text-xs">{t('locationHint')}</p>}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Parks */}
            {sortedFavorites.parks.length > 0 && (
              <>
                <div>
                  <h3 className="mb-4 text-lg font-semibold">{t('parks')}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedFavorites.parks.map((park) => (
                      <ParkCardNearby
                        key={park.id}
                        id={park.id}
                        name={stripNewPrefix(park.name)}
                        slug={park.slug}
                        city={park.city}
                        country={park.country}
                        distance={park.distance || 0}
                        status={park.status}
                        timezone={park.timezone}
                        totalAttractions={park.totalAttractions}
                        operatingAttractions={park.operatingAttractions}
                        analytics={park.analytics}
                        todaySchedule={park.todaySchedule}
                        nextSchedule={park.nextSchedule}
                        backgroundImage={park.backgroundImage}
                        url={park.url}
                      />
                    ))}
                  </div>
                </div>
                {(sortedFavorites.attractions.length > 0 ||
                  sortedFavorites.shows.length > 0 ||
                  sortedFavorites.restaurants.length > 0) && <Separator />}
              </>
            )}

            {/* Attractions */}
            {sortedFavorites.attractions.length > 0 && (
              <>
                <div>
                  <h3 className="mb-4 text-lg font-semibold">{t('attractions')}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedFavorites.attractions.map((attraction) => (
                      <AttractionCard
                        key={attraction.id}
                        attraction={attraction}
                        backgroundImage={attraction.backgroundImage}
                        distance={attraction.distance}
                        showParkName={true}
                      />
                    ))}
                  </div>
                </div>
                {(sortedFavorites.shows.length > 0 || sortedFavorites.restaurants.length > 0) && (
                  <Separator />
                )}
              </>
            )}

            {/* Shows */}
            {sortedFavorites.shows.length > 0 && (
              <>
                <div>
                  <h3 className="mb-4 text-lg font-semibold">{t('shows')}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedFavorites.shows.map((show) => {
                      // Build show URL: always use park URL with #shows hash
                      let showHref = '#';

                      // First, try to get park URL from show.url
                      let parkUrl: string | null = null;
                      if (show.url) {
                        if (show.url.startsWith('/v1/parks/') || show.url.startsWith('/parks/')) {
                          // It's already a park URL, use it
                          parkUrl = convertApiUrlToFrontendUrl(show.url);
                        } else if (show.url.startsWith('/v1/shows/')) {
                          // Show URL - we need park data
                          parkUrl = null; // Will use park data below
                        } else {
                          // Try to convert it
                          const converted = convertApiUrlToFrontendUrl(show.url);
                          if (converted !== '#' && converted.startsWith('/parks/')) {
                            parkUrl = converted;
                          }
                        }
                      }

                      // If we don't have a park URL yet, construct from park data
                      if (!parkUrl && show.park) {
                        if (show.park.continent && show.park.country && show.park.city) {
                          parkUrl = `/parks/${show.park.continent}/${show.park.country}/${show.park.city}/${show.park.slug}`;
                        }
                      }

                      // Build show URL with hash
                      if (parkUrl) {
                        showHref = buildShowUrl(parkUrl);
                      }

                      return (
                        <ShowCard
                          key={show.id}
                          id={show.id}
                          name={stripNewPrefix(show.name)}
                          slug={show.slug}
                          status={show.status}
                          showtimes={show.showtimes}
                          timezone={show.park?.timezone || 'UTC'}
                          href={showHref}
                          parkName={show.park?.name ? stripNewPrefix(show.park.name) : undefined}
                          distance={show.distance}
                        />
                      );
                    })}
                  </div>
                </div>
                {sortedFavorites.restaurants.length > 0 && <Separator />}
              </>
            )}

            {/* Restaurants */}
            {sortedFavorites.restaurants.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">{t('restaurants')}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedFavorites.restaurants.map((restaurant) => {
                    // Build restaurant URL: always use park URL with #restaurants hash
                    let restaurantHref = '#';

                    // First, try to get park URL from restaurant.url
                    let parkUrl: string | null = null;
                    if (restaurant.url) {
                      if (
                        restaurant.url.startsWith('/v1/parks/') ||
                        restaurant.url.startsWith('/parks/')
                      ) {
                        // It's already a park URL, use it
                        parkUrl = convertApiUrlToFrontendUrl(restaurant.url);
                      } else if (restaurant.url.startsWith('/v1/restaurants/')) {
                        // Restaurant URL - we need park data
                        parkUrl = null; // Will use park data below
                      } else {
                        // Try to convert it
                        const converted = convertApiUrlToFrontendUrl(restaurant.url);
                        if (converted !== '#' && converted.startsWith('/parks/')) {
                          parkUrl = converted;
                        }
                      }
                    }

                    // If we don't have a park URL yet, construct from park data
                    if (!parkUrl && restaurant.park) {
                      if (
                        restaurant.park.continent &&
                        restaurant.park.country &&
                        restaurant.park.city
                      ) {
                        parkUrl = `/parks/${restaurant.park.continent}/${restaurant.park.country}/${restaurant.park.city}/${restaurant.park.slug}`;
                      }
                    }

                    // Build restaurant URL with hash
                    if (parkUrl) {
                      restaurantHref = buildRestaurantUrl(parkUrl);
                    }

                    return (
                      <Link
                        key={restaurant.id}
                        href={restaurantHref}
                        prefetch={restaurant.status === 'OPERATING'} // Only prefetch operating restaurants
                        className="group block h-full"
                      >
                        <Card className="hover:border-primary/50 relative h-full overflow-hidden transition-all hover:shadow-md">
                          {/* Favorite Star */}
                          <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
                            <FavoriteStar type="restaurant" id={restaurant.id} />
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="group-hover:text-primary line-clamp-2 text-base font-semibold transition-colors">
                                  {stripNewPrefix(restaurant.name)}
                                </h3>
                                {restaurant.park && (
                                  <p className="text-muted-foreground mt-1 truncate text-xs">
                                    {stripNewPrefix(restaurant.park.name)}
                                  </p>
                                )}
                                {restaurant.cuisineType && (
                                  <Badge variant="secondary" className="mt-2 text-xs">
                                    {restaurant.cuisineType}
                                  </Badge>
                                )}
                                {restaurant.distance && (
                                  <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
                                    <Navigation className="h-4 w-4" />
                                    <span className="font-medium">
                                      {formatDistance(restaurant.distance)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <ChevronRight className="text-muted-foreground group-hover:text-primary mt-0.5 h-4 w-4 flex-shrink-0 transition-colors" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
