/**
 * Umami Analytics Integration
 *
 * Type-safe wrapper for Umami event tracking.
 * Provides centralized event definitions and tracking functions.
 *
 * ## The property budget (READ THIS BEFORE ADDING A PROPERTY)
 *
 * Umami Cloud bills per stored row, not per event: one hit is one event, and **every event
 * property is billed as another event** (https://docs.umami.is/docs/cloud/faq). A five-property
 * event therefore costs six times a pageview. On the Hobby plan (100k/month) the properties, not
 * the pageviews, are what blows the budget — they were ~70 % of usage before this file was cut
 * down.
 *
 * Two rules keep it that way:
 *
 * 1. **Never send what Umami already knows.** Every event payload carries the page URL, the
 *    referrer, the screen size and `navigator.language`. So no `locale` (it is in the path,
 *    `/de/glossar/…`), no `path`, no `browser_language`.
 * 2. **Never send what another property implies.** `in_park` was `type === 'in_park'`,
 *    `geo_allowed` was `source === 'gps'`, `hasQuery` was `queryLength > 0`, and a `parkId`
 *    next to a `parkName` is the same fact twice. Pick one and derive the rest in the report.
 *
 * Session properties (`umami.identify`) are billed the same way and cost one row **per session**,
 * which made them a quarter of all usage on their own. That is why there is no identify call here
 * any more — see `docs/development/analytics.md`.
 *
 * Events & properties in use:
 * - favorite_add / favorite_remove: type, name
 * - nearby_permission_granted / nearby_permission_denied: (no properties)
 * - nearby_parks_loaded: count, type, source, parkName (parkName only when type is in_park)
 * - search_opened: source
 * - hero_search_clicked: (no properties)
 * - search_result_clicked: resultType, position, queryLength, term_id
 * - search_view_all: (no properties)
 * - search_no_results: queryLength
 * - language_switched: from, to
 * - theme_toggled: theme
 * - tab_changed (park page): tab, parkName
 * - glossary_term_viewed: term_id (English ID)
 * - glossary_category_filtered: category (slug or 'none')
 * - glossary_searched: queryLength
 * - preferred_source_clicked / feedback_opened: (no properties)
 * - web-vital-inp: value, target, phase, path (only for non-`good` samples, see WebVitalsReporter)
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

  // Search (location tracking, not content)
  SEARCH_OPENED: 'search_opened',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  SEARCH_VIEW_ALL: 'search_view_all',
  HERO_SEARCH_CLICKED: 'hero_search_clicked',

  // User Preferences
  LANGUAGE_SWITCHED: 'language_switched',
  THEME_TOGGLED: 'theme_toggled',

  // Tabs
  TAB_CHANGED: 'tab_changed',

  // Hero & Entry points
  LOCATION_BANNER_CLICKED: 'location_banner_clicked',

  // Engagement & health
  SEARCH_NO_RESULTS: 'search_no_results',

  // Glossary
  GLOSSARY_TERM_VIEWED: 'glossary_term_viewed',
  GLOSSARY_CATEGORY_FILTERED: 'glossary_category_filtered',
  GLOSSARY_SEARCHED: 'glossary_searched',

  // SEO / Outbound (footer "mark park.fan as a preferred source on Google" click)
  PREFERRED_SOURCE_CLICKED: 'preferred_source_clicked',

  // Feedback (Userback widget — fired when the visitor opens the feedback form)
  FEEDBACK_OPENED: 'feedback_opened',
} as const;

// Event property types

type FavoriteType = 'park' | 'attraction' | 'show' | 'restaurant';

export interface NearbyParksLoadedProps {
  count: number;
  type: 'nearby_parks' | 'in_park';
  /**
   * Whether results came from GPS (user granted location) or IP fallback. Segments "geo allowed"
   * in Umami on its own — the former `geo_allowed` boolean was `source === 'gps'` restated.
   */
  source?: 'gps' | 'ip';
  /**
   * When in_park, the park for reports. Deliberately the *name* and not the id: one identifies
   * the park as well as the other, and Umami's report reads the raw value.
   */
  parkName?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface SearchResultClickedProps {
  resultType: 'park' | 'attraction' | 'show' | 'restaurant' | 'location' | 'glossary';
  position?: number;
  queryLength?: number;
  /** For glossary results: the English term ID (e.g. "wait-time"). */
  term_id?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ThemeToggledProps {
  theme: 'light' | 'dark' | 'system';
  [key: string]: string | number | boolean;
}

export interface SearchNoResultsProps {
  queryLength: number;
  [key: string]: string | number | boolean;
}

export interface GlossaryTermViewedProps {
  /** Original English term ID, language-independent (e.g. "wait-time", "fastpass"). */
  term_id: string;
  [key: string]: string | number | boolean;
}

export interface GlossaryCategoryFilteredProps {
  /** Category slug (e.g. "wait-times") or "none" when filter is cleared. */
  category: string;
  [key: string]: string | number | boolean;
}

export interface GlossarySearchedProps {
  queryLength: number;
  [key: string]: string | number | boolean;
}

export interface TabChangedProps {
  /** attractions | map | shows | restaurants | weather. No `calendar`: it is a page of its own
   *  now and is counted as a pageview, which costs no event property at all. */
  tab: 'attractions' | 'map' | 'shows' | 'restaurants' | 'weather';
  parkName?: string;
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
 * @param eventData - Optional event properties. Every property is billed as an extra event —
 *   see the property budget at the top of this file before adding one.
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

export function trackFavoriteAdd(type: FavoriteType, name?: string): void {
  trackEvent(UMAMI_EVENTS.FAVORITE_ADD, { type, ...(name && { name }) });
}

export function trackFavoriteRemove(type: FavoriteType, name?: string): void {
  trackEvent(UMAMI_EVENTS.FAVORITE_REMOVE, { type, ...(name && { name }) });
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

export function trackSearchOpened(source: 'header' | 'hero' | 'keyboard'): void {
  trackEvent(UMAMI_EVENTS.SEARCH_OPENED, { source });
}

export function trackHeroSearchClicked(): void {
  trackEvent(UMAMI_EVENTS.HERO_SEARCH_CLICKED);
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

export function trackTabChanged(props: TabChangedProps): void {
  trackEvent(UMAMI_EVENTS.TAB_CHANGED, props);
}

export function trackLocationBannerClicked(): void {
  trackEvent(UMAMI_EVENTS.LOCATION_BANNER_CLICKED);
}

export function trackSearchNoResults(props: SearchNoResultsProps): void {
  trackEvent(UMAMI_EVENTS.SEARCH_NO_RESULTS, props);
}

export function trackGlossaryTermViewed(props: GlossaryTermViewedProps): void {
  trackEvent(UMAMI_EVENTS.GLOSSARY_TERM_VIEWED, props);
}

export function trackGlossaryCategoryFiltered(props: GlossaryCategoryFilteredProps): void {
  trackEvent(UMAMI_EVENTS.GLOSSARY_CATEGORY_FILTERED, props);
}

export function trackGlossarySearched(props: GlossarySearchedProps): void {
  trackEvent(UMAMI_EVENTS.GLOSSARY_SEARCHED, props);
}

/** Footer "mark park.fan as a preferred source on Google" click (no properties). */
export function trackPreferredSourceClicked(): void {
  trackEvent(UMAMI_EVENTS.PREFERRED_SOURCE_CLICKED);
}
