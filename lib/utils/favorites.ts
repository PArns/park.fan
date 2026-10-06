import { readCookie, writeCookie } from '@/lib/utils/browser-cookie';
import { getFavorites } from '@/lib/api/favorites';

export type FavoriteType = 'park' | 'attraction' | 'show' | 'restaurant';

export interface FavoritesData {
  parks: string[];
  attractions: string[];
  shows: string[];
  restaurants: string[];
}

export const FAVORITES_COOKIE_NAME = 'favorites';
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

// Cache the parsed cookie by its raw value: one `favorites-changed` event makes EVERY mounted
// FavoriteStar re-check its state, which used to re-parse the whole cookie once per star
// (O(stars) JSON.parse per toggle — a real INP cost on park pages with 100+ cards). The cached
// object is treated as immutable — mutators below clone before changing it.
let parseCache: { raw: string; data: FavoritesData } | null = null;

export interface FavoriteCounts {
  parks: number;
  attractions: number;
  shows: number;
  restaurants: number;
  total: number;
}

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
 * module writes. Pure, so the server can read the same cookie: `/favorites` takes its counts from
 * the request to render its first HTML at the size of the list (PAR-668).
 */
export function parseFavoritesCookie(raw: string | undefined): FavoritesData | null {
  if (!raw) return null;
  try {
    // `document.cookie` hands back the URL-encoded form `writeCookie` stored; Next's cookie
    // store has already decoded it.
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

/**
 * Get favorites from cookies
 */
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

/**
 * Save favorites to cookies
 */
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

/** `useSyncExternalStore` subscriber for the cookie: every add and remove above announces itself. */
export function subscribeToFavorites(onChange: () => void): () => void {
  window.addEventListener('favorites-changed', onChange);
  return () => window.removeEventListener('favorites-changed', onChange);
}

/**
 * Add a favorite.
 * Updates cookies and dispatches immediately; API sync runs in background.
 */
function addFavorite(type: FavoriteType, id: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const current = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;

  if (!current[key].includes(id)) {
    // Clone before changing — `current` may be the shared parse cache.
    const favorites: FavoritesData = { ...current, [key]: [...current[key], id] };
    saveFavoritesToCookies(favorites);
    dispatchFavoritesChanged();
    scheduleSyncToApi();
  }
}

/**
 * Remove a favorite.
 * Updates cookies and dispatches immediately; API sync runs in background.
 */
function removeFavorite(type: FavoriteType, id: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const current = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;

  if (current[key].includes(id)) {
    // Clone before changing — `current` may be the shared parse cache.
    const favorites: FavoritesData = { ...current, [key]: current[key].filter((f) => f !== id) };
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
