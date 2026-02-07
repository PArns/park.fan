/**
 * Umami Analytics Integration
 *
 * Type-safe wrapper for Umami event tracking.
 * Provides centralized event definitions and tracking functions.
 */

// Extend Window interface for Umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
  }
}

// Event names as const for type safety
export const UMAMI_EVENTS = {
  // Favorites
  FAVORITE_ADD: 'favorite_add',
  FAVORITE_REMOVE: 'favorite_remove',

  // Nearby Parks
  NEARBY_PERMISSION_GRANTED: 'nearby_permission_granted',
  NEARBY_PERMISSION_DENIED: 'nearby_permission_denied',
  NEARBY_PARKS_LOADED: 'nearby_parks_loaded',
  NEARBY_IN_PARK_DETECTED: 'nearby_in_park_detected',

  // Search (location tracking, not content)
  SEARCH_OPENED: 'search_opened',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  SEARCH_VIEW_ALL: 'search_view_all',
  HERO_SEARCH_CLICKED: 'hero_search_clicked',

  // Navigation & Content
  PARK_CARD_CLICKED: 'park_card_clicked',
  ATTRACTION_CARD_CLICKED: 'attraction_card_clicked',
  CONTINENT_CLICKED: 'continent_clicked',

  // User Preferences
  LANGUAGE_SWITCHED: 'language_switched',
  THEME_TOGGLED: 'theme_toggled',

  // Map & Calendar
  MAP_OPENED: 'map_opened',
  CALENDAR_DATE_SELECTED: 'calendar_date_selected',

  // Tabs
  TAB_CHANGED: 'tab_changed',
} as const;

// Event property types
export interface FavoriteEventProps {
  type: 'park' | 'attraction' | 'show' | 'restaurant';
  id: string;
  [key: string]: string | number | boolean;
}

export interface NearbyParksLoadedProps {
  count: number;
  type: 'nearby_parks' | 'in_park';
  /** True when user is detected inside a park; false when only nearby parks. Use in Umami to segment "in park" vs "not in park". */
  in_park: boolean;
  /** Whether results came from GPS (user granted location) or IP fallback */
  source?: 'gps' | 'ip';
  /** When in_park, the park id for segmentation */
  parkId?: string;
  /** When in_park, the park name for reports */
  parkName?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface NearbyInParkProps {
  parkId: string;
  parkName: string;
  [key: string]: string | number | boolean;
}

export interface SearchOpenedProps {
  source: 'header' | 'hero' | 'keyboard';
  [key: string]: string | number | boolean;
}

export interface HeroSearchClickedProps {
  /** Placeholder text shown when user clicked (typewriter or default). */
  placeholderShown: string;
  [key: string]: string | number | boolean;
}

export interface SearchResultClickedProps {
  resultType: 'park' | 'attraction' | 'show' | 'restaurant' | 'location';
  position?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface LanguageSwitchedProps {
  from: string;
  to: string;
  [key: string]: string | number | boolean;
}

export interface ThemeToggledProps {
  theme: 'light' | 'dark' | 'system';
  [key: string]: string | number | boolean;
}

export interface ContentClickedProps {
  name: string;
  id?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface TabChangedProps {
  tab: string;
  parkId?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Helper function to remove undefined values from event data
 */
function cleanEventData<T extends Record<string, unknown>>(
  data: T
): Record<string, string | number | boolean> {
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(data)) {
    if (
      value !== undefined &&
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    ) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Track an event in Umami Analytics
 *
 * @param eventName - Name of the event to track
 * @param eventData - Optional event properties
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number | boolean | undefined>
): void {
  // Only track in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Check if Umami is loaded
  if (!window.umami?.track) {
    // Silently fail if Umami is not loaded (e.g., ad blocker, privacy tools)
    console.debug('[Umami] Analytics not available, event not tracked:', eventName);
    return;
  }

  try {
    const cleanedData = eventData ? cleanEventData(eventData) : undefined;
    window.umami.track(eventName, cleanedData);
  } catch (error) {
    console.error('[Umami] Error tracking event:', error);
  }
}

// Convenience functions for common events

export function trackFavoriteAdd(type: FavoriteEventProps['type'], id: string): void {
  trackEvent(UMAMI_EVENTS.FAVORITE_ADD, { type, id });
}

export function trackFavoriteRemove(type: FavoriteEventProps['type'], id: string): void {
  trackEvent(UMAMI_EVENTS.FAVORITE_REMOVE, { type, id });
}

export function trackNearbyPermissionGranted(): void {
  trackEvent(UMAMI_EVENTS.NEARBY_PERMISSION_GRANTED);
}

export function trackNearbyPermissionDenied(): void {
  trackEvent(UMAMI_EVENTS.NEARBY_PERMISSION_DENIED);
}

export function trackNearbyParksLoaded(props: NearbyParksLoadedProps): void {
  trackEvent(UMAMI_EVENTS.NEARBY_PARKS_LOADED, props);
}

export function trackNearbyInParkDetected(props: NearbyInParkProps): void {
  trackEvent(UMAMI_EVENTS.NEARBY_IN_PARK_DETECTED, props);
}

export function trackSearchOpened(source: SearchOpenedProps['source']): void {
  trackEvent(UMAMI_EVENTS.SEARCH_OPENED, { source });
}

export function trackHeroSearchClicked(props: HeroSearchClickedProps): void {
  trackEvent(UMAMI_EVENTS.HERO_SEARCH_CLICKED, props);
}

export function trackSearchResultClicked(props: SearchResultClickedProps): void {
  trackEvent(UMAMI_EVENTS.SEARCH_RESULT_CLICKED, props);
}

export function trackSearchViewAll(): void {
  trackEvent(UMAMI_EVENTS.SEARCH_VIEW_ALL);
}

export function trackLanguageSwitched(from: string, to: string): void {
  trackEvent(UMAMI_EVENTS.LANGUAGE_SWITCHED, { from, to });
}

export function trackThemeToggled(theme: ThemeToggledProps['theme']): void {
  trackEvent(UMAMI_EVENTS.THEME_TOGGLED, { theme });
}

export function trackParkCardClicked(props: ContentClickedProps): void {
  trackEvent(UMAMI_EVENTS.PARK_CARD_CLICKED, props);
}

export function trackAttractionCardClicked(props: ContentClickedProps): void {
  trackEvent(UMAMI_EVENTS.ATTRACTION_CARD_CLICKED, props);
}

export function trackContinentClicked(name: string): void {
  trackEvent(UMAMI_EVENTS.CONTINENT_CLICKED, { name });
}

export function trackMapOpened(parkId?: string): void {
  trackEvent(UMAMI_EVENTS.MAP_OPENED, parkId ? { parkId } : undefined);
}

export function trackCalendarDateSelected(date: string, parkId?: string): void {
  trackEvent(UMAMI_EVENTS.CALENDAR_DATE_SELECTED, { date, ...(parkId && { parkId }) });
}

export function trackTabChanged(props: TabChangedProps): void {
  trackEvent(UMAMI_EVENTS.TAB_CHANGED, props);
}
