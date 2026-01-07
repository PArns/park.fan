'use client';

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

/**
 * Get favorites from cookies
 */
export function getFavoritesFromCookies(): FavoritesData {
  if (typeof window === 'undefined') {
    return { parks: [], attractions: [], shows: [], restaurants: [] };
  }

  try {
    const cookieValue = getCookie(FAVORITES_COOKIE_NAME);
    if (!cookieValue) {
      return { parks: [], attractions: [], shows: [], restaurants: [] };
    }

    const parsed = typeof cookieValue === 'string' ? JSON.parse(cookieValue) : cookieValue;
    return {
      parks: Array.isArray(parsed.parks) ? parsed.parks : [],
      attractions: Array.isArray(parsed.attractions) ? parsed.attractions : [],
      shows: Array.isArray(parsed.shows) ? parsed.shows : [],
      restaurants: Array.isArray(parsed.restaurants) ? parsed.restaurants : [],
    };
  } catch (error) {
    console.error('[Favorites] Error reading favorites from cookies:', error);
    return { parks: [], attractions: [], shows: [], restaurants: [] };
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
 * Add a favorite
 */
export async function addFavorite(type: FavoriteType, id: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const favorites = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;

  if (!favorites[key].includes(id)) {
    favorites[key].push(id);
    saveFavoritesToCookies(favorites);

    // Call API with updated favorites to get full data (API requires query params)
    try {
      await getFavorites(
        favorites.parks,
        favorites.attractions,
        favorites.shows,
        favorites.restaurants
      );
    } catch (error) {
      // Silently fail - favorites are saved in cookies, API call is optional
      console.debug('[Favorites] API call after adding favorite failed (non-critical):', error);
    }

    dispatchFavoritesChanged();
  }
}

/**
 * Remove a favorite
 */
export async function removeFavorite(type: FavoriteType, id: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const favorites = getFavoritesFromCookies();
  const key = `${type}s` as keyof FavoritesData;

  const index = favorites[key].indexOf(id);
  if (index > -1) {
    favorites[key].splice(index, 1);
    saveFavoritesToCookies(favorites);

    // Call API with updated favorites to get full data (API requires query params)
    // If no favorites left, API will return empty response
    try {
      await getFavorites(
        favorites.parks,
        favorites.attractions,
        favorites.shows,
        favorites.restaurants
      );
    } catch (error) {
      // Silently fail - favorites are saved in cookies, API call is optional
      console.debug('[Favorites] API call after removing favorite failed (non-critical):', error);
    }

    dispatchFavoritesChanged();
  }
}

/**
 * Toggle a favorite
 */
export async function toggleFavorite(type: FavoriteType, id: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  const isCurrentlyFavorite = isFavorite(type, id);
  if (isCurrentlyFavorite) {
    await removeFavorite(type, id);
    return false;
  } else {
    await addFavorite(type, id);
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
