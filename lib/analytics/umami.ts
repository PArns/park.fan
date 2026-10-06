/**
 * Type-safe wrapper for Umami event tracking: the event names and one function per event.
 *
 * Every event property is billed as another event, so never send what Umami already has (URL,
 * referrer, screen, language) or what another property implies. See
 * docs/rules/umami-event-budget.md; each event's properties and cost are in
 * docs/development/analytics.md.
 */

import type { PlannerOpenedSource } from '@/lib/planner/ui-store';

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
  }
}

/** Every Umami event name this site sends. */
export const UMAMI_EVENTS = {
  FAVORITE_ADD: 'favorite_add',
  FAVORITE_REMOVE: 'favorite_remove',

  NEARBY_PERMISSION_GRANTED: 'nearby_permission_granted',
  NEARBY_PERMISSION_DENIED: 'nearby_permission_denied',
  NEARBY_PARKS_LOADED: 'nearby_parks_loaded',

  SEARCH_OPENED: 'search_opened',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  SEARCH_VIEW_ALL: 'search_view_all',
  HERO_SEARCH_CLICKED: 'hero_search_clicked',

  LANGUAGE_SWITCHED: 'language_switched',
  THEME_TOGGLED: 'theme_toggled',

  TAB_CHANGED: 'tab_changed',

  LOCATION_BANNER_CLICKED: 'location_banner_clicked',
  BLOG_TOAST_OPENED: 'blog_toast_opened',

  SEARCH_NO_RESULTS: 'search_no_results',

  GLOSSARY_TERM_VIEWED: 'glossary_term_viewed',
  GLOSSARY_CATEGORY_FILTERED: 'glossary_category_filtered',
  GLOSSARY_SEARCHED: 'glossary_searched',

  PREFERRED_SOURCE_CLICKED: 'preferred_source_clicked',

  FEEDBACK_OPENED: 'feedback_opened',

  PLANNER_OPENED: 'planner_opened',
  PLAN_DAY_STARTED: 'plan_day_started',
  PLAN_OPTIMIZED: 'plan_optimized',
  PLANNER_CLOSED_EMPTY: 'planner_closed_empty',

  ATTRACTION_FILTER_USED: 'attraction_filter_used',
  COVERED_RIDE_OPENED: 'covered_ride_opened',

  RIDE_ALERT_SET: 'ride_alert_set',
  RIDE_ALERT_REMOVED: 'ride_alert_removed',
  SHOW_FOLLOW_ADD: 'show_follow_add',
  SHOW_FOLLOW_REMOVE: 'show_follow_remove',

  COMPASS_VIEWED: 'compass_viewed',
  COMPASS_HEADING_ON: 'compass_heading_on',
  COMPASS_RIDE_PINNED: 'compass_ride_pinned',
  COMPASS_RIDE_OPENED: 'compass_ride_opened',
  COMPASS_PILL_CLICKED: 'compass_pill_clicked',
} as const;

type FavoriteType = 'park' | 'attraction' | 'show' | 'restaurant';

export interface NearbyParksLoadedProps {
  type: 'nearby_parks' | 'in_park';
  /** Whether results came from GPS or the IP fallback, which also says whether geo was allowed. */
  source?: 'gps' | 'ip';
  /**
   * When in_park, the park for reports. Deliberately the *name* and not the id: one identifies
   * the park as well as the other, and Umami's report reads the raw value.
   */
  parkName?: string;
  [key: string]: string | number | boolean | undefined;
}

/** The pills of the park page's filter panel, plus the rider-height slider. Closed on purpose. */
export type AttractionFilterName =
  'open' | 'off_season' | 'wet' | 'fast_pass' | 'single_rider' | 'covered' | 'height';

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
  /** No `calendar`: it is a page of its own, counted as a pageview at no property cost. */
  tab: 'attractions' | 'map' | 'shows' | 'restaurants' | 'weather';
  parkName?: string;
  [key: string]: string | number | boolean | undefined;
}

/** Drops undefined and non-primitive values from event data. */
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
 * Sends one event to Umami, or nothing when the script is not loaded. Every property is billed as
 * an extra event; see the budget at the top of this file before adding one.
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number | boolean | undefined>
): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!window.umami?.track) {
    // Ad blockers and privacy tools remove the script.
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

/**
 * The team testing on its own phones (`?sim=` moves the reader, `?state=` patches the park) is not
 * a visitor, so behaviour events skip it. Read from the URL, because `isSimulationEnabled()` in
 * the browser only ever says yes under `next dev`.
 */
function isSimulatedVisit(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('sim') || params.has('state');
}

/**
 * Sends `favorite_add` with the type and name when a favorite star is switched on (`FavoriteStar`).
 */
export function trackFavoriteAdd(type: FavoriteType, name?: string): void {
  trackEvent(UMAMI_EVENTS.FAVORITE_ADD, { type, ...(name && { name }) });
}

/**
 * Sends `favorite_remove` with the type and name when a favorite star is switched off
 * (`FavoriteStar`).
 */
export function trackFavoriteRemove(type: FavoriteType, name?: string): void {
  trackEvent(UMAMI_EVENTS.FAVORITE_REMOVE, { type, ...(name && { name }) });
}

/**
 * Sends `nearby_permission_granted` once when the browser starts returning a position
 * (`useNearbyAnalytics`).
 */
export function trackNearbyPermissionGranted(): void {
  trackEvent(UMAMI_EVENTS.NEARBY_PERMISSION_GRANTED);
}

/**
 * Sends `nearby_permission_denied` when the visitor refuses location now, not for a refusal stored
 * from an earlier visit (`useNearbyAnalytics`).
 */
export function trackNearbyPermissionDenied(): void {
  trackEvent(UMAMI_EVENTS.NEARBY_PERMISSION_DENIED);
}

/**
 * Sends `nearby_parks_loaded` once per new nearby result, with its type, its source (GPS or IP)
 * and, in a park, the park name.
 */
export function trackNearbyParksLoaded(props: NearbyParksLoadedProps): void {
  trackEvent(UMAMI_EVENTS.NEARBY_PARKS_LOADED, props);
}

/**
 * Sends `search_opened` with its source (header, hero or keyboard) when the search dialog opens
 * (`SearchBar`).
 */
export function trackSearchOpened(source: 'header' | 'hero' | 'keyboard'): void {
  trackEvent(UMAMI_EVENTS.SEARCH_OPENED, { source });
}

/**
 * Sends `hero_search_clicked` when the homepage hero's search field is clicked or first focused.
 */
export function trackHeroSearchClicked(): void {
  trackEvent(UMAMI_EVENTS.HERO_SEARCH_CLICKED);
}

/**
 * Sends `search_result_clicked` with the result type, position and query length (never the query)
 * when a search result is opened.
 */
export function trackSearchResultClicked(props: SearchResultClickedProps): void {
  trackEvent(UMAMI_EVENTS.SEARCH_RESULT_CLICKED, props);
}

/**
 * Sends `search_view_all` when the search panel's view-all button is pressed, before it goes to
 * `/search`.
 */
export function trackSearchViewAll(): void {
  trackEvent(UMAMI_EVENTS.SEARCH_VIEW_ALL);
}

/**
 * Sends `language_switched` with the old and new locale when the visitor picks a language in
 * `LocaleSwitcher`.
 */
export function trackLanguageSwitched(from: string, to: string): void {
  trackEvent(UMAMI_EVENTS.LANGUAGE_SWITCHED, { from, to });
}

/** Sends `theme_toggled` with the new theme once the theme toggle's transition has applied it. */
export function trackThemeToggled(theme: ThemeToggledProps['theme']): void {
  trackEvent(UMAMI_EVENTS.THEME_TOGGLED, { theme });
}

/**
 * Sends `tab_changed` with the tab and park name when a park page tab is switched
 * (`useTabHashRouting`).
 */
export function trackTabChanged(props: TabChangedProps): void {
  trackEvent(UMAMI_EVENTS.TAB_CHANGED, props);
}

/**
 * Sends `location_banner_clicked` when the location banner's button is pressed to ask for the
 * visitor's position.
 */
export function trackLocationBannerClicked(): void {
  trackEvent(UMAMI_EVENTS.LOCATION_BANNER_CLICKED);
}

/** Sends `blog_toast_opened` when the new-posts toast is followed to its post (`NewPostsToast`). */
export function trackBlogToastOpened(): void {
  trackEvent(UMAMI_EVENTS.BLOG_TOAST_OPENED);
}

/**
 * Sends `search_no_results` with the query length (never the query) when a search of three or more
 * characters returns nothing.
 */
export function trackSearchNoResults(props: SearchNoResultsProps): void {
  trackEvent(UMAMI_EVENTS.SEARCH_NO_RESULTS, props);
}

/**
 * Sends `planner_opened` with its `source` on the closed-to-open edge of the planner panel, the
 * top of the planner funnel. `source` is the one property, because which way in earns its place
 * is the decision it answers.
 */
export function trackPlannerOpened(source: PlannerOpenedSource): void {
  openingActive = true;
  openingStartedADay = false;
  trackEvent(UMAMI_EVENTS.PLANNER_OPENED, { source });
}

/**
 * Whether the panel is up, and whether a day gained its first block since it came up. Module state
 * because the two ends live in different files (`PlannerLauncher` opens and closes, `usePlanner`
 * counts the first block) and a closing has to know what happened in between.
 */
let openingActive = false;
let openingStartedADay = false;

/**
 * Sends `planner_closed_empty` when the panel closes and no day gained its first block in that
 * opening, at most once per opening. No property: `planner_opened` already carries the way in.
 */
export function trackPlannerClosed(): void {
  if (!openingActive) return;
  openingActive = false;
  if (openingStartedADay || isSimulatedVisit()) return;
  trackEvent(UMAMI_EVENTS.PLANNER_CLOSED_EMPTY);
}

/**
 * Sends `plan_day_started` with the park name when a park and date gain their first block (see
 * `usePlanner`), not on finishing the wizard and not per added ride. No date: it would be a second
 * billed row per planned day.
 */
export function trackPlanDayStarted(parkName: string): void {
  if (openingActive) openingStartedADay = true;
  trackEvent(UMAMI_EVENTS.PLAN_DAY_STARTED, { parkName });
}

/**
 * Sends `plan_optimized` with the park name when the visitor lets the planner sort the day, only
 * where the plan actually changed.
 */
export function trackPlanOptimized(parkName: string): void {
  trackEvent(UMAMI_EVENTS.PLAN_OPTIMIZED, { parkName });
}

/**
 * Sends `attraction_filter_used` with the pill when a park page filter is switched on, never off;
 * the rider-height slider counts on its first value, not on every step of a drag.
 */
export function trackAttractionFilterUsed(filter: AttractionFilterName): void {
  if (isSimulatedVisit()) return;
  trackEvent(UMAMI_EVENTS.ATTRACTION_FILTER_USED, { filter });
}

/**
 * Sends `covered_ride_opened` when a ride is opened from the rain banner's covered list. No
 * property: the question is whether anybody takes the rain plan, not which ride.
 */
export function trackCoveredRideOpened(): void {
  if (isSimulatedVisit()) return;
  trackEvent(UMAMI_EVENTS.COVERED_RIDE_OPENED);
}

/**
 * Sends `compass_viewed` once per page view when the in-park compass comes on screen, the top of
 * the compass's five-event funnel. No compass event fires in the `?sim=` demo, which is the team
 * testing on its own phones.
 */
export function trackCompassViewed(): void {
  trackEvent(UMAMI_EVENTS.COMPASS_VIEWED);
}

/** The phone's compass started delivering, once per page view (on iOS: after the tap). */
export function trackCompassHeadingOn(): void {
  trackEvent(UMAMI_EVENTS.COMPASS_HEADING_ON);
}

/** A tap on a marker pinned a ride. Letting go of it is not tracked. */
export function trackCompassRidePinned(): void {
  trackEvent(UMAMI_EVENTS.COMPASS_RIDE_PINNED);
}

/**
 * A ride page was opened from the compass. One property, `from`, because the bar under the dial and
 * the list below it are two designs of the same link and which one people follow is a decision.
 */
export function trackCompassRideOpened(from: 'bar' | 'list'): void {
  trackEvent(UMAMI_EVENTS.COMPASS_RIDE_OPENED, { from });
}

/** The hero's „Zum Kompass" pill was tapped. */
export function trackCompassPillClicked(): void {
  trackEvent(UMAMI_EVENTS.COMPASS_PILL_CLICKED);
}

/**
 * Sends `glossary_term_viewed` with the English term id once per glossary term page view
 * (`GlossaryTermTracker`).
 */
export function trackGlossaryTermViewed(props: GlossaryTermViewedProps): void {
  trackEvent(UMAMI_EVENTS.GLOSSARY_TERM_VIEWED, props);
}

/**
 * Sends `glossary_category_filtered` with the category slug, or `none` when the filter is cleared,
 * on the glossary overview.
 */
export function trackGlossaryCategoryFiltered(props: GlossaryCategoryFilteredProps): void {
  trackEvent(UMAMI_EVENTS.GLOSSARY_CATEGORY_FILTERED, props);
}

/**
 * Sends `glossary_searched` with the query length (never the query) 600 ms after the glossary
 * search holds three or more characters.
 */
export function trackGlossarySearched(props: GlossarySearchedProps): void {
  trackEvent(UMAMI_EVENTS.GLOSSARY_SEARCHED, props);
}

/** Footer "mark park.fan as a preferred source on Google" click (no properties). */
export function trackPreferredSourceClicked(): void {
  trackEvent(UMAMI_EVENTS.PREFERRED_SOURCE_CLICKED);
}

/**
 * Sends `ride_alert_set` when a ride's wait-time alert is saved, the conversion the feature is
 * judged on (opening the dialog is not tracked). `source` tells the card bell from the central
 * button, the design decision a report can revisit.
 */
export function trackRideAlertSet(source: 'card' | 'central'): void {
  trackEvent(UMAMI_EVENTS.RIDE_ALERT_SET, { source });
}

/**
 * Sends `ride_alert_removed` when an alert is removed. No `source`: every removal surface shows
 * the same list, so which one was open answers nothing.
 */
export function trackRideAlertRemoved(): void {
  trackEvent(UMAMI_EVENTS.RIDE_ALERT_REMOVED);
}

/**
 * Sends `show_follow_add` when a show-start reminder is turned on, with `source` telling the
 * show's card from its row in the park overview's next-shows list.
 */
export function trackShowFollowAdd(source: 'card' | 'panel'): void {
  trackEvent(UMAMI_EVENTS.SHOW_FOLLOW_ADD, { source });
}

/** Sends `show_follow_remove` when a show reminder is turned off; no `source`, as for alerts. */
export function trackShowFollowRemove(): void {
  trackEvent(UMAMI_EVENTS.SHOW_FOLLOW_REMOVE);
}
