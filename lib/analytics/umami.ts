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
 * - nearby_parks_loaded: type, source, parkName (parkName only when type is in_park)
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
 * - planner_opened: source
 * - plan_day_started: parkName
 * - plan_optimized: parkName
 * - planner_closed_empty: (no properties) — 1 row per closing without a first block
 * - attraction_filter_used: filter — 2 rows per pill switched on
 * - covered_ride_opened: (no properties) — 1 row per click in the rain banner's covered list
 * - ride_alert_set: source
 * - ride_alert_removed: (no properties)
 * - show_follow_add: source
 * - show_follow_remove: (no properties)
 * - blog_toast_opened: (no properties) — the "new since your last visit" toast was followed
 * - compass_viewed / compass_heading_on: (no properties) — once per page, see trackCompassViewed
 * - compass_ride_pinned / compass_pill_clicked: (no properties)
 * - compass_ride_opened: from
 * - web-vital-inp: value, target, phase, path (only for non-`good` samples, see WebVitalsReporter)
 */

/**
 * The planner's own vocabulary, imported rather than declared here.
 *
 * `PlannerOpenedSource` names the ways INTO the panel, which is a fact about the
 * planner and not about analytics — so it lives beside `PlannerOpenIntent` in
 * `lib/planner/ui-store.ts`. It sat here first, which meant `ui-store.ts` (a
 * module every park page pulls in through `ParkPlannerLink`) depended on this
 * one, and adding a way into the planner meant editing an analytics file.
 */
import type { PlannerOpenedSource } from '@/lib/planner/ui-store';

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
  BLOG_TOAST_OPENED: 'blog_toast_opened',

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

  // Trip planner (fired when the panel goes from closed to open, whichever way in)
  PLANNER_OPENED: 'planner_opened',
  // …once per park+date, when that day gains its first block
  PLAN_DAY_STARTED: 'plan_day_started',
  // …and when the visitor lets the day sort itself. A click, not a load.
  PLAN_OPTIMIZED: 'plan_optimized',
  // …and when the panel closes again without any day having gained its first block in that opening
  PLANNER_CLOSED_EMPTY: 'planner_closed_empty',

  // Park page: which filter pill gets switched on, and whether the rain banner's covered list is followed
  ATTRACTION_FILTER_USED: 'attraction_filter_used',
  COVERED_RIDE_OPENED: 'covered_ride_opened',

  // Push alerts — whether the feature is used at all, and through which entry point
  RIDE_ALERT_SET: 'ride_alert_set',
  RIDE_ALERT_REMOVED: 'ride_alert_removed',
  SHOW_FOLLOW_ADD: 'show_follow_add',
  SHOW_FOLLOW_REMOVE: 'show_follow_remove',

  // The in-park compass under the homepage hero — whether it is used, see trackCompassViewed
  COMPASS_VIEWED: 'compass_viewed',
  COMPASS_HEADING_ON: 'compass_heading_on',
  COMPASS_RIDE_PINNED: 'compass_ride_pinned',
  COMPASS_RIDE_OPENED: 'compass_ride_opened',
  COMPASS_PILL_CLICKED: 'compass_pill_clicked',
} as const;

// Event property types

type FavoriteType = 'park' | 'attraction' | 'show' | 'restaurant';

export interface NearbyParksLoadedProps {
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

/**
 * The team testing on its own phones: `?sim=` moves the reader, `?state=` patches the park. Neither is
 * a visitor, so the events that only exist to be read as behaviour skip them, as the compass does.
 * Read from the URL alone: `isSimulationEnabled()` cannot be asked in the browser, where `VERCEL_ENV` is
 * not exposed and `NODE_ENV` is `production` in every built bundle, so it would only ever say yes
 * under `next dev`.
 */
function isSimulatedVisit(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('sim') || params.has('state');
}

// Convenience functions for common events

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
 * The trip planner's panel came on screen.
 *
 * The top of the funnel, and the one measurement the planner did not have: with
 * only `plan_day_started` and `plan_optimized` a quiet month is unreadable —
 * nobody opens the thing, and everybody who opens it walks away again, look
 * identical from the outside.
 *
 * ONE property, and it is the only one here that leads to a decision. Several
 * ways in were added over a few weeks (the button in the park header, the
 * calendar's day dialog, the planner page's own list) and whether any of them
 * earns its place is exactly what `source` answers; the value is a closed union,
 * so a report cannot end up with two spellings of one entry point. What is
 * deliberately NOT sent: `parkName` (opened from the edge tab there is often no
 * park at all, and where there is one `plan_day_started` already names it),
 * `date`, how many rides are already planned, and the locale and path Umami
 * carries on every payload anyway. Cardinality is free — Umami bills one row per
 * property per event, not per distinct value — so five sources cost the same as
 * two.
 *
 * Fired on the CLOSED → OPEN edge and nowhere else. A request while the panel is
 * already up — a second day pressed in the calendar, the wizard finishing inside
 * the panel — is not an opening and bills nothing; closing and opening again is
 * two.
 *
 * Cost: 2 billed rows per opening (the event plus its property). At a few
 * hundred openings a month that is under 1 % of the 100k plan; it would have to
 * run to ~50,000 openings a month before it were worth pricing again.
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
 * The panel closed and nothing was planned in that opening.
 *
 * The other half of the funnel: 579 openings, 197 first blocks. This says how many of the rest walked
 * away in the same opening, as against planning later, which `planner_opened` against
 * `plan_day_started` cannot tell apart. No property: `planner_opened` already carries the way in, and
 * a report joins the two on the session.
 *
 * At most once per opening: the flag is cleared here, so a second call without a new opening is
 * silent. A day started while the panel is closed (a ride dragged onto the plan from the park page)
 * belongs to no opening and changes nothing.
 *
 * Cost: 1 billed row per closing without a plan, under 500 a month.
 */
export function trackPlannerClosed(): void {
  if (!openingActive) return;
  openingActive = false;
  if (openingStartedADay || isSimulatedVisit()) return;
  trackEvent(UMAMI_EVENTS.PLANNER_CLOSED_EMPTY);
}

/**
 * Somebody started planning a day, and which park it is for.
 *
 * ONE property, which is the whole budget question here: the event already
 * carries the URL, so the locale and the page it was fired from are free, and
 * the date is deliberately absent — a `date` would be a second billed row per
 * planned day and the report it enables ("how far ahead do people plan") is not
 * the question that was asked.
 *
 * `parkName` rather than the slug, matching `tab_changed` and
 * `nearby_parks_loaded`: a report that groups parks has to group them on one
 * key, and shipping both would be the same fact twice.
 *
 * Fired at the moment a park+date goes from EMPTY to holding its first block —
 * see `usePlanner`. Not on finishing the wizard, which is a park and a date and
 * nothing in them yet, and not per added ride, which would bill every lap of a
 * day somebody is filling in.
 */
export function trackPlanDayStarted(parkName: string): void {
  if (openingActive) openingStartedADay = true;
  trackEvent(UMAMI_EVENTS.PLAN_DAY_STARTED, { parkName });
}

/**
 * Somebody let the planner sort their day.
 *
 * ONE property, the same `parkName` key its sibling above uses, so a report can
 * group the two on one column. What is deliberately not sent: how many minutes
 * it saved, how many rides moved, and which of the two buttons was pressed —
 * each would be another billed event on the plan's 100k, and none of them
 * answers a question anybody has asked yet. "Is this feature used, and where"
 * is the question, and one property answers it.
 *
 * Fired on the CLICK and only where the plan actually changed, so a press on an
 * already-optimal day costs nothing.
 */
export function trackPlanOptimized(parkName: string): void {
  trackEvent(UMAMI_EVENTS.PLAN_OPTIMIZED, { parkName });
}

/**
 * A filter pill on the park page was switched ON, and which.
 *
 * ONE property, `filter`, a closed union so a report cannot hold two spellings of one pill. The
 * question is which pills are used at all: five were added over a few weeks, and the newest
 * („Überdacht") has to show whether it earns its place. Switching off is not sent, it answers nothing
 * the switching on did not; the wet pill's three states count once, on the press that leaves „off".
 * The rider-height slider counts on its first value, not on every step of a drag.
 *
 * Cost: 2 billed rows per use, under 1,000 uses a month.
 */
export function trackAttractionFilterUsed(filter: AttractionFilterName): void {
  if (isSimulatedVisit()) return;
  trackEvent(UMAMI_EVENTS.ATTRACTION_FILTER_USED, { filter });
}

/**
 * A ride was opened from „Überdacht in der Nähe", the covered list in the rain banner.
 *
 * No property: the list is the only place it fires, and which ride is not the question, whether
 * anybody takes the rain plan is. Cost: 1 billed row per click, under 500 a month.
 */
export function trackCoveredRideOpened(): void {
  if (isSimulatedVisit()) return;
  trackEvent(UMAMI_EVENTS.COVERED_RIDE_OPENED);
}

/**
 * The in-park compass came on screen, once per page view.
 *
 * The compass's five events answer one question, whether anybody standing in a park uses it, and
 * they are a funnel: it was seen (this), the phone's compass ran (`compass_heading_on`), a ride was
 * pinned (`compass_ride_pinned`), a ride was opened from it (`compass_ride_opened`), and the hero's
 * „Zum Kompass" was how they got there (`compass_pill_clicked`). Four carry no property at all and
 * one carries one.
 *
 * Deliberately not sent: `parkName` (the reach is the question, not which park; the in-park
 * `nearby_parks_loaded` already names it), the platform (Umami records the OS, and on iOS
 * `compass_heading_on` against `compass_viewed` is the rate at which „Kompass einschalten" gets
 * tapped), every turn of the phone, every change of the ride ahead, and letting go of a pin. Nothing
 * fires in the `?sim=` demo, which is the team testing on its own phones.
 *
 * Cost: `compass_viewed` and `compass_heading_on` are one row each, once per page view of an in-park
 * visitor who scrolls to the compass, a small share of the homepage's traffic; the clicks are one or
 * two rows each and rarer still.
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
 * A ride page was opened from the compass. ONE property, `from`, because the bar under the dial and
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
 * A ride's wait-time alert was saved — the conversion this feature lives or
 * dies on, not the dialog opening. Opening `RideAlertDialog`
 * costs nothing to bill, so it stays untracked; a visitor who opens the
 * dialog and backs out answers no question a report needs, the way looking
 * at a favorite star and not pressing it does not get its own event either.
 *
 * ONE property: `source` tells the two entry points the plan asked for
 * ("kombiniert": a bell per ride card, plus a central button in the park
 * overview) apart — both open the same dialog, which reports `card` when a
 * bell opened it, which is exactly the design decision a report on this
 * event can revisit — worth the second billed row for the same reason
 * `trackPlannerOpened`'s `source` is.
 */
export function trackRideAlertSet(source: 'card' | 'central'): void {
  trackEvent(UMAMI_EVENTS.RIDE_ALERT_SET, { source });
}

/**
 * An alert was removed — from the ride's own dialog, the central list, or
 * the cross-park `/alerts` overview. No `source`: unlike setting one, all
 * three removal surfaces show the same list of existing alerts, so which
 * one somebody happened to have open answers nothing about the feature.
 */
export function trackRideAlertRemoved(): void {
  trackEvent(UMAMI_EVENTS.RIDE_ALERT_REMOVED);
}

/**
 * A show-start reminder was turned on. Same shape as `trackFavoriteAdd`
 * (no dialog in front of this one — the bell IS the action), and the same
 * `source` reasoning as `trackRideAlertSet`: a bell on the show's own card,
 * or a bell on its row in the park overview's "next shows" list.
 */
export function trackShowFollowAdd(source: 'card' | 'panel'): void {
  trackEvent(UMAMI_EVENTS.SHOW_FOLLOW_ADD, { source });
}

/** Turned back off. No `source`, matching `trackRideAlertRemoved`'s reasoning. */
export function trackShowFollowRemove(): void {
  trackEvent(UMAMI_EVENTS.SHOW_FOLLOW_REMOVE);
}
