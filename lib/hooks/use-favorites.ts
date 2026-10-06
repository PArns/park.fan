import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import {
  getFavoriteIds,
  getFavoritesFromCookies,
  subscribeToFavorites,
} from '@/lib/utils/favorites';
import type { FavoritesResponse } from '@/lib/api/favorites';

/**
 * Every starred id, each kind sorted, as one string: the query key's view of the cookie, so a star
 * set anywhere is a new cache entry for every surface. `null` in the server and hydrating renders,
 * which keeps the query off until the real ids are known.
 */
function getIdsSnapshot(): string {
  const f = getFavoritesFromCookies();
  return [f.parks, f.attractions, f.shows, f.restaurants]
    .map((ids) => [...ids].sort().join(','))
    .join('|');
}

const getServerIdsSnapshot = () => null;

interface UseFavoritesOptions {
  /**
   * Gate on top of the geolocation gate. The header's favorites menu passes `false` until it is
   * opened, or every page would fetch `/api/favorites` for everyone who ever starred anything. It
   * shares the query key with the homepage band.
   */
  enabled?: boolean;
  /**
   * Polling. Only the surface that is actually on screen for minutes at a time needs it; the
   * menu closes again after a few seconds, and a second observer polling the same key would
   * double the request rate for a panel nobody is looking at.
   */
  poll?: boolean;
}

/**
 * The visitor's favorites with their live data, keyed on the starred ids and the position, and
 * fresh for five minutes like the backend's favorites cache.
 */
export function useFavorites({ enabled = true, poll = true }: UseFavoritesOptions = {}) {
  const { position, loading: geoLoading } = useGeolocation();
  const ids = useSyncExternalStore<string | null>(
    subscribeToFavorites,
    getIdsSnapshot,
    getServerIdsSnapshot
  );

  return useQuery<FavoritesResponse>({
    queryKey: ['favorites', ids, position?.lat, position?.lng],
    queryFn: async () => {
      // The cookie as it is at fetch time, in the order the ids were starred — `ids` above is the
      // same set, sorted for the key.
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
    enabled: !geoLoading && enabled && ids !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: poll,
    refetchInterval: poll ? 5 * 60 * 1000 : false,
    // When geo resolves, or a star is set or removed, the queryKey changes (new cache entry). Keep
    // showing the previous list while the new one loads instead of flashing a skeleton.
    placeholderData: (previousData: FavoritesResponse | undefined) => previousData,
  });
}
