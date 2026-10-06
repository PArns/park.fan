import { readCookie, writeCookie } from '@/lib/utils/browser-cookie';
import { getFavorites } from '@/lib/api/favorites';

/** The four kinds of thing a visitor can star. */
export type FavoriteType = 'park' | 'attraction' | 'show' | 'restaurant';

/** The favorites cookie's contents: starred ids per kind. */
export interface FavoritesData {
  parks: string[];
  attractions: string[];
  shows: string[];
  restaurants: string[];
}

/** Name of the cookie that holds the visitor's favorites. */
export const FAVORITES_COOKIE_NAME = 'favorites';
const FAVORITES_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
const SYNC_DEBOUNCE_MS = 400; // batches rapid toggles into one API call

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleSyncToApi(): void {
  if (typeof window === 'undefined') return;

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncTimeout = null;
    const favorites = getFavoritesFromCookies();
    getFavorites(
      favorites.parks,
      favorites.attractions,
      favorites.shows,
      favorites.restaurants
    ).catch((error) => {
      console.debug('[Favorites] API sync failed (non-critical):', error);
    });
  }, SYNC_DEBOUNCE_MS);
}

/** Parses JSON, dropping `__proto__`, `constructor` and `prototype` keys (prototype pollution). */
function secureJsonParse(str: string): unknown {
  return JSON.parse(str, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });
}

/** The input if it is an array, with anything that is not a string dropped. */
function validateStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.filter((item): item is string => typeof item === 'string');
}

// The parsed cookie, cached by its raw value: one `favorites-changed` event makes every mounted
// star re-check, and re-parsing per star costs INP on park pages with many cards. Treated as
// immutable; the mutators clone before changing it.
let parseCache: { raw: string; data: FavoritesData } | null = null;

/** How many favorites of each kind, and in total. */
export interface FavoriteCounts {
  parks: number;
  attractions: number;
  shows: number;
  restaurants: number;
  total: number;
}

/** Counts a favorites set per kind and in total. */
export function countFavorites(f: FavoritesData): FavoriteCounts {
  return {
    parks: f.parks.length,
    attractions: f.attractions.length,
    shows: f.shows.length,
    restaurants: f.restaurants.length,
    total: f.parks.length + f.attractions.length + f.shows.length + f.restaurants.length,
  };
}

/**
 * The cookie's value as `FavoritesData`, or `null` when it is missing or not the JSON object this
 * module writes. Pure, so the server can read the same cookie and render `/favorites` at the size
 * of the list.
 */
export function parseFavoritesCookie(raw: string | undefined): FavoritesData | null {
  if (!raw) return null;
  try {
    // `document.cookie` returns the URL-encoded form `writeCookie` stored; Next's cookie store has
    // already decoded it.
    const text = raw.startsWith('%') ? decodeURIComponent(raw) : raw;
    const parsed = secureJsonParse(text);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const safeParsed = parsed as Record<string, unknown>;
    return {
      parks: validateStringArray(safeParsed.parks),
      attractions: validateStringArray(safeParsed.attractions),
      shows: validateStringArray(safeParsed.shows),
      restaurants: validateStringArray(safeParsed.restaurants),
    };
  } catch {
    return null;
  }
}

/** The visitor's favorites from the cookie, empty on the server or when there is none. */
export function getFavoritesFromCookies(): FavoritesData {
  const defaultData: FavoritesData = { parks: [], attractions: [], shows: [], restaurants: [] };

  if (typeof window === 'undefined') {
    return defaultData;
  }

  try {
    const cookieValue = readCookie(FAVORITES_COOKIE_NAME);
    if (!cookieValue) {
      parseCache = null;
      return defaultData;
    }

    if (typeof cookieValue === 'string' && parseCache && parseCache.raw === cookieValue) {
      return parseCache.data;
    }

    const data = parseFavoritesCookie(cookieValue);
    if (!data) return defaultData;
    parseCache = { raw: cookieValue, data };
    return data;
  } catch (error) {
    console.error('[Favorites] Error reading favorites from cookies:', error);
    return defaultData;
  }
}

/** Writes the favorites cookie. */
function saveFavoritesToCookies(favorites: FavoritesData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    writeCookie(FAVORITES_COOKIE_NAME, JSON.stringify(favorites), {
      maxAge: FAVORITES_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
    });
  } catch (error) {
    console.error('[Favorites] Error saving favorites to cookies:', error);
  }
}

/** Announces a change so every subscriber re-reads the cookie. */
function dispatchFavoritesChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.dispatchEvent(new CustomEvent('favorites-changed'));
  } catch (error) {
    console.error('[Favorites] Error dispatching favorites-changed event:', error);
  }
}

/** `useSyncExternalStore` subscriber for the cookie: every add and remove above announces itself. */
export function subscribeToFavorites(onChange: () => void): () => void {
  window.addEventListener('favorites-changed', onChange);
  return () => window.removeEventListener('favorites-changed', onChange);
}

/** Add a favorite: the cookie and listeners update at once, the API sync runs in the background. */
function addFavorite(type: FavoriteType, id: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const current = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;

  if (!current[key].includes(id)) {
    // Clone: `current` may be the shared parse cache.
    const favorites: FavoritesData = { ...current, [key]: [...current[key], id] };
    saveFavoritesToCookies(favorites);
    dispatchFavoritesChanged();
    scheduleSyncToApi();
  }
}

/** Remove a favorite: cookie and listeners update at once, the API sync runs in the background. */
function removeFavorite(type: FavoriteType, id: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const current = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;

  if (current[key].includes(id)) {
    // Clone: `current` may be the shared parse cache.
    const favorites: FavoritesData = { ...current, [key]: current[key].filter((f) => f !== id) };
    saveFavoritesToCookies(favorites);
    dispatchFavoritesChanged();
    scheduleSyncToApi();
  }
}

/** Toggle a favorite and return the new state at once (optimistic). */
export function toggleFavorite(type: FavoriteType, id: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const isCurrentlyFavorite = isFavorite(type, id);
  if (isCurrentlyFavorite) {
    removeFavorite(type, id);
    return false;
  } else {
    addFavorite(type, id);
    return true;
  }
}

/** Whether an item is a favorite. */
export function isFavorite(type: FavoriteType, id: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const favorites = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;
  return favorites[key].includes(id);
}

/** All favorite ids of one kind. */
export function getFavoriteIds(type: FavoriteType): string[] {
  const favorites = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;
  return favorites[key];
}
