import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { getFavoriteIds } from '@/lib/utils/favorites';
import type { FavoritesResponse } from '@/lib/api/favorites';

/**
 * Hook to fetch favorites using React Query
 * - Reads favorite IDs from cookies inside queryFn so refetch after toggle uses current state
 * - Automatically uses geolocation from context
 * - Caches results for 1 minute (wait times should be relatively fresh)
 */
export function useFavorites() {
  const { position, loading: geoLoading } = useGeolocation();

  return useQuery<FavoritesResponse>({
    queryKey: ['favorites', position?.lat, position?.lng],
    queryFn: async () => {
      // Read current cookie state at fetch time so invalidate+refetch shows updated list
      const favoriteIds = {
        parks: getFavoriteIds('park'),
        attractions: getFavoriteIds('attraction'),
        shows: getFavoriteIds('show'),
        restaurants: getFavoriteIds('restaurant'),
      };

      const hasFavorites =
        favoriteIds.parks.length > 0 ||
        favoriteIds.attractions.length > 0 ||
        favoriteIds.shows.length > 0 ||
        favoriteIds.restaurants.length > 0;

      if (!hasFavorites) {
        return {
          parks: [],
          attractions: [],
          shows: [],
          restaurants: [],
        };
      }

      const url = new URL('/api/favorites', window.location.origin);

      if (favoriteIds.parks.length > 0) {
        url.searchParams.set('parkIds', favoriteIds.parks.join(','));
      }
      if (favoriteIds.attractions.length > 0) {
        url.searchParams.set('attractionIds', favoriteIds.attractions.join(','));
      }
      if (favoriteIds.shows.length > 0) {
        url.searchParams.set('showIds', favoriteIds.shows.join(','));
      }
      if (favoriteIds.restaurants.length > 0) {
        url.searchParams.set('restaurantIds', favoriteIds.restaurants.join(','));
      }
      if (position) {
        url.searchParams.set('lat', position.lat.toString());
        url.searchParams.set('lng', position.lng.toString());
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !geoLoading,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
