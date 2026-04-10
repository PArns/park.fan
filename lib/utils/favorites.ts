import { getCookie, setCookie } from 'cookies-next';
import { getFavorites } from '@/lib/api/favorites';

export type FavoriteType = 'park' | 'attraction' | 'show' | 'restaurant';

export interface FavoritesData {
  parks: string[];
  attractions: string[];
  shows: string[];
  restaurants: string[];
}

const FAVORITES_COOKIE_NAME = 'favorites';
const FAVORITES_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds
const SYNC_DEBOUNCE_MS = 400; // Batch rapid toggles into a single API call

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

/**
 * Securely parse JSON to prevent prototype pollution
 */
function secureJsonParse(str: string): unknown {
  return JSON.parse(str, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });
}

/**
 * Validates that the input is an array containing only strings
 */
function validateStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.filter((item): item is string => typeof item === 'string');
}

/**
 * Get favorites from cookies
 */
export function getFavoritesFromCookies(): FavoritesData {
  const defaultData: FavoritesData = { parks: [], attractions: [], shows: [], restaurants: [] };

  if (typeof window === 'undefined') {
    return defaultData;
  }

  try {
    const cookieValue = getCookie(FAVORITES_COOKIE_NAME);
    if (!cookieValue) {
      return defaultData;
    }

    const parsed = typeof cookieValue === 'string' ? secureJsonParse(cookieValue) : cookieValue;

    // Ensure parsed is a non-null object to avoid crashes on parsed.parks etc.
    if (typeof parsed !== 'object' || parsed === null) {
      return defaultData;
    }

    const safeParsed = parsed as Record<string, unknown>;

    return {
      parks: validateStringArray(safeParsed.parks),
      attractions: validateStringArray(safeParsed.attractions),
      shows: validateStringArray(safeParsed.shows),
      restaurants: validateStringArray(safeParsed.restaurants),
    };
  } catch (error) {
    console.error('[Favorites] Error reading favorites from cookies:', error);
    return defaultData;
  }
}

/**
 * Save favorites to cookies
 */
function saveFavoritesToCookies(favorites: FavoritesData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    setCookie(FAVORITES_COOKIE_NAME, JSON.stringify(favorites), {
      maxAge: FAVORITES_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
    });
  } catch (error) {
    console.error('[Favorites] Error saving favorites to cookies:', error);
  }
}

/**
 * Dispatch custom event for reactive updates
 */
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

/**
 * Add a favorite.
 * Updates cookies and dispatches immediately; API sync runs in background.
 */
export function addFavorite(type: FavoriteType, id: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const favorites = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;

  if (!favorites[key].includes(id)) {
    favorites[key].push(id);
    saveFavoritesToCookies(favorites);
    dispatchFavoritesChanged();
    scheduleSyncToApi();
  }
}

/**
 * Remove a favorite.
 * Updates cookies and dispatches immediately; API sync runs in background.
 */
export function removeFavorite(type: FavoriteType, id: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const favorites = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;

  const index = favorites[key].indexOf(id);
  if (index > -1) {
    favorites[key].splice(index, 1);
    saveFavoritesToCookies(favorites);
    dispatchFavoritesChanged();
    scheduleSyncToApi();
  }
}

/**
 * Toggle a favorite. Returns the new state immediately (optimistic).
 */
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

/**
 * Check if an item is favorited
 */
export function isFavorite(type: FavoriteType, id: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const favorites = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;
  return favorites[key].includes(id);
}

/**
 * Get all favorite IDs for a specific type
 */
export function getFavoriteIds(type: FavoriteType): string[] {
  const favorites = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;
  return favorites[key];
}
