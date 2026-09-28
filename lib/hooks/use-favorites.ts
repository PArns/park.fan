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
 * Every starred id, each kind sorted, as one string — the query key's view of the cookie.
 *
 * The key used to be the position alone while the query function read the ids, so a star set
 * anywhere but on the homepage band left the cached list standing: only the band invalidated on
 * `favorites-changed`, and the header menu, which is mounted on every page, reopened with the
 * list as it was before for up to five minutes. With the ids in the key a change is a new entry,
 * wherever the star was pressed and whichever surface asks next.
 *
 * `null` in the server and hydrating renders (no cookie there), which keeps the query off until
 * the real ids are known instead of fetching once for "none" and again for the real set.
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
   * Gate on top of the geolocation gate. The homepage band leaves this at `true` — it is the
   * page's reason for existing. The header's favorites menu passes `false` until somebody opens
   * it: mounted in the layout, an ungated copy would put a `/api/favorites` request on EVERY
   * page for every visitor who has ever starred anything, which is exactly the "one more request
   * per page" the API budget is written against. Both share the query key, so opening the menu
   * on the homepage costs nothing at all.
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
 * Hook to fetch favorites using React Query
 * - Keyed on the starred ids, so a toggle anywhere is a new entry (see `getIdsSnapshot`)
 * - Automatically uses geolocation from context
 * - Caches results for 5 minutes (matches the backend favorites TTL + the 5-min wait-times sync)
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
    staleTime: 5 * 60 * 1000, // 5 minutes — matches refetch interval
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: poll, // refresh when user returns to tab (live status can change)
    refetchInterval: poll ? 5 * 60 * 1000 : false, // poll every 5 min — attraction status changes during the day
    // When geo resolves, or a star is set or removed, the queryKey changes (new cache entry). Keep
    // showing the previous list while the new one loads instead of flashing a skeleton.
    placeholderData: (previousData: FavoritesResponse | undefined) => previousData,
  });
}
