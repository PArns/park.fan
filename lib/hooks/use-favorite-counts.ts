'use client';

import { useSyncExternalStore } from 'react';
import { getFavoritesFromCookies } from '@/lib/utils/favorites';

/**
 * How many things the visitor has starred, straight off the cookie.
 *
 * This is the cheap half of the favorites story and the only half the header needs before
 * somebody opens the menu: the cookie holds ids, so it can answer "how many" without a request,
 * and the panel resolves those ids into names only once it is opened.
 *
 * `useSyncExternalStore` rather than an effect + listener, for the same reason `FavoriteStar`
 * cannot use one: the count has to read as zero in the server render and in the hydrating render,
 * or the two disagree. The snapshot is therefore a STRING — `getFavoritesFromCookies` hands back
 * an object, and returning that (or a fresh one built from it) is a new identity on every read,
 * which React answers with an infinite re-render. The parse behind it is cached by the raw cookie
 * value, so reading this per render costs a `document.cookie` lookup and a string compare.
 */
function subscribe(onChange: () => void) {
  window.addEventListener('favorites-changed', onChange);
  return () => window.removeEventListener('favorites-changed', onChange);
}

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

export function useFavoriteCounts(): FavoriteCounts {
  const [parks, attractions, shows, restaurants] = useSyncExternalStore(
    subscribe,
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
