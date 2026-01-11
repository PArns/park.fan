'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParkCardNearby } from '@/components/parks/park-card-nearby';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';
import { AttractionCard } from '@/components/parks/attraction-card';
import { AttractionCardSkeleton } from '@/components/parks/attraction-card-skeleton';
import { ShowCard } from '@/components/parks/show-card';
import { FavoriteStar } from '@/components/common/favorite-star';
import { getFavoriteIds } from '@/lib/utils/favorites';
import {
  getFavorites,
  type FavoritePark,
  type FavoriteAttraction,
  type FavoriteShow,
  type FavoriteRestaurant,
} from '@/lib/api/favorites';
import { formatDistance } from '@/lib/utils/distance-utils';
import {
  buildShowUrl,
  buildRestaurantUrl,
  convertApiUrlToFrontendUrl,
} from '@/lib/utils/url-utils';
import { Link } from '@/i18n/navigation';
import { ChevronRight, Navigation, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface FavoritesSectionProps {
  initialHasFavorites?: boolean;
}

export function FavoritesSection({ initialHasFavorites = true }: FavoritesSectionProps) {
  const t = useTranslations('favorites');

  const [favoritesData, setFavoritesData] = useState<{
    parks: FavoritePark[];
    attractions: FavoriteAttraction[];
    shows: FavoriteShow[];
    restaurants: FavoriteRestaurant[];
  } | null>(null);
  const [loading, setLoading] = useState(initialHasFavorites);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geolocationLoading, setGeolocationLoading] = useState(true);
  // Use ref to always have current userLocation in event handlers
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Function to update user location (reusable for initial load and periodic updates)
  const updateLocation = useCallback((onSuccess?: () => void) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          userLocationRef.current = location;
          if (onSuccess) {
            onSuccess();
          }
        },
        (err) => {
          // Silently fail - distance calculation is optional
          // Only log if there's actual error information
          if (err && (err.message || err.code)) {
            console.debug('[FavoritesSection] Geolocation error (optional):', err);
          }
          if (onSuccess) {
            onSuccess();
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0, // Always get fresh location for periodic updates
        }
      );
    } else {
      // No geolocation support
      if (onSuccess) {
        onSuccess();
      }
    }
  }, []);

  // Get user location for distance calculation (initial load)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const timeoutId = setTimeout(() => {
        setGeolocationLoading(false);
      }, 2000);

      updateLocation(() => {
        setGeolocationLoading(false);
        clearTimeout(timeoutId);
      });

      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      // No geolocation support, set loading to false immediately
      setGeolocationLoading(false);
    }
  }, [updateLocation]);

  // Load favorites from API
  const loadFavorites = useCallback(async () => {
    try {
      // Get favorite IDs from cookies
      const favoriteIds = {
        parks: getFavoriteIds('park'),
        attractions: getFavoriteIds('attraction'),
        shows: getFavoriteIds('show'),
        restaurants: getFavoriteIds('restaurant'),
      };

      // Check if we have any favorites before calling API
      const hasFavorites =
        favoriteIds.parks.length > 0 ||
        favoriteIds.attractions.length > 0 ||
        favoriteIds.shows.length > 0 ||
        favoriteIds.restaurants.length > 0;

      if (!hasFavorites) {
        setFavoritesData({ parks: [], attractions: [], shows: [], restaurants: [] });
        setLoading(false);
        return;
      }

      // Call API with favorite IDs as query parameters
      // Use ref to get current location (important for event handlers)
      const currentLocation = userLocationRef.current || userLocation;
      const data = await getFavorites(
        favoriteIds.parks,
        favoriteIds.attractions,
        favoriteIds.shows,
        favoriteIds.restaurants,
        currentLocation?.lat,
        currentLocation?.lng
      );

      // Sort by distance (nearest first) or alphabetically if no distance available
      const sortByDistanceOrName = <T extends { distance?: number; name: string }>(
        items: T[]
      ): T[] => {
        return [...items].sort((a, b) => {
          // If both have distance, sort by distance
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          // If only one has distance, prioritize it
          if (a.distance !== undefined) return -1;
          if (b.distance !== undefined) return 1;
          // If neither has distance, sort alphabetically by name
          return a.name.localeCompare(b.name);
        });
      };

      setFavoritesData({
        parks: sortByDistanceOrName(data.parks),
        attractions: sortByDistanceOrName(data.attractions),
        shows: sortByDistanceOrName(data.shows),
        restaurants: sortByDistanceOrName(data.restaurants),
      });
    } catch (error) {
      console.error('[FavoritesSection] Error loading favorites:', error);
      setFavoritesData({ parks: [], attractions: [], shows: [], restaurants: [] });
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  // Load favorites only when geolocation is complete
  useEffect(() => {
    if (!geolocationLoading) {
      loadFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geolocationLoading]);

  // Reload favorites when userLocation changes (from null to a value)
  // Only reload if we already have data (to avoid duplicate initial load)
  useEffect(() => {
    if (userLocation && !loading && favoritesData !== null) {
      loadFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // Listen for favorites-changed events
  useEffect(() => {
    const handleFavoritesChanged = () => {
      loadFavorites();
    };

    window.addEventListener('favorites-changed', handleFavoritesChanged);
    return () => {
      window.removeEventListener('favorites-changed', handleFavoritesChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-reload favorites every 5 minutes (with location update)
  useEffect(() => {
    if (!loading && favoritesData !== null) {
      const interval = setInterval(
        () => {
          // Update location first, then reload favorites with new location
          updateLocation(() => {
            loadFavorites();
          });
        },
        5 * 60 * 1000
      ); // 5 minutes

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, favoritesData, updateLocation]);

  // Show skeleton loaders while loading
  if (loading) {
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
              {/* Parks Skeleton */}
              <div>
                <div className="bg-muted mb-4 h-6 w-24 rounded" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <ParkCardNearbySkeleton />
                  <ParkCardNearbySkeleton />
                  <ParkCardNearbySkeleton />
                </div>
              </div>
              {/* Attractions Skeleton */}
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

  if (
    !favoritesData ||
    (favoritesData.parks.length === 0 &&
      favoritesData.attractions.length === 0 &&
      favoritesData.shows.length === 0 &&
      favoritesData.restaurants.length === 0)
  ) {
    return null;
  }

  const hasAnyFavorites =
    favoritesData.parks.length > 0 ||
    favoritesData.attractions.length > 0 ||
    favoritesData.shows.length > 0 ||
    favoritesData.restaurants.length > 0;

  if (!hasAnyFavorites) {
    return null;
  }

  const totalFavorites =
    (favoritesData?.parks.length || 0) +
    (favoritesData?.attractions.length || 0) +
    (favoritesData?.shows.length || 0) +
    (favoritesData?.restaurants.length || 0);

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
              {!userLocation && (
                <p className="text-muted-foreground text-xs">{t('locationHint')}</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Parks */}
            {favoritesData.parks.length > 0 && (
              <>
                <div>
                  <h3 className="mb-4 text-lg font-semibold">{t('parks')}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {favoritesData.parks.map((park) => (
                      <ParkCardNearby
                        key={park.id}
                        id={park.id}
                        name={park.name}
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
                {(favoritesData.attractions.length > 0 ||
                  favoritesData.shows.length > 0 ||
                  favoritesData.restaurants.length > 0) && <Separator />}
              </>
            )}

            {/* Attractions */}
            {favoritesData.attractions.length > 0 && (
              <>
                <div>
                  <h3 className="mb-4 text-lg font-semibold">{t('attractions')}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {favoritesData.attractions.map((attraction) => (
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
                {(favoritesData.shows.length > 0 || favoritesData.restaurants.length > 0) && (
                  <Separator />
                )}
              </>
            )}

            {/* Shows */}
            {favoritesData.shows.length > 0 && (
              <>
                <div>
                  <h3 className="mb-4 text-lg font-semibold">{t('shows')}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {favoritesData.shows.map((show) => {
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
                          name={show.name}
                          slug={show.slug}
                          status={show.status}
                          showtimes={show.showtimes}
                          timezone={show.park?.timezone || 'UTC'}
                          href={showHref}
                          parkName={show.park?.name}
                          distance={show.distance}
                        />
                      );
                    })}
                  </div>
                </div>
                {favoritesData.restaurants.length > 0 && <Separator />}
              </>
            )}

            {/* Restaurants */}
            {favoritesData.restaurants.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">{t('restaurants')}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {favoritesData.restaurants.map((restaurant) => {
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
                                  {restaurant.name}
                                </h3>
                                {restaurant.park && (
                                  <p className="text-muted-foreground mt-1 truncate text-xs">
                                    {restaurant.park.name}
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
