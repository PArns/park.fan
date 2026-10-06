'use client';

import { useSyncExternalStore } from 'react';
import { getFavoritesFromCookies, subscribeToFavorites } from '@/lib/utils/favorites';

/** `parks/attractions/shows/restaurants`. */
function getSnapshot(): string {
  const f = getFavoritesFromCookies();
  return `${f.parks.length}/${f.attractions.length}/${f.shows.length}/${f.restaurants.length}`;
}

const getServerSnapshot = () => '0/0/0/0';

export interface FavoriteCounts {
  parks: number;
  attractions: number;
  shows: number;
  restaurants: number;
  total: number;
}

/**
 * How many things the visitor has starred, straight off the cookie, so the header can show it
 * without a request. `useSyncExternalStore` so the server and hydrating renders both read zero;
 * the snapshot is a string because a fresh object per read would re-render forever.
 */
export function useFavoriteCounts(): FavoriteCounts {
  const [parks, attractions, shows, restaurants] = useSyncExternalStore(
    subscribeToFavorites,
    getSnapshot,
    getServerSnapshot
  )
    .split('/')
    .map(Number);
  return {
    parks,
    attractions,
    shows,
    restaurants,
    total: parks + attractions + shows + restaurants,
  };
}
