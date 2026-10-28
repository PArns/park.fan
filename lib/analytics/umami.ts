/**
 * Type-safe wrapper for Umami event tracking: the event names and one function per event.
 *
 * Umami keeps its pageviews and the two Web Vitals events; every other custom event is counted by
 * our own statistic (`lib/analytics/site-analytics.ts`), where a property costs nothing. Every
 * property sent here is billed as another event, so never send what Umami already has (URL,
 * referrer, screen, language) or what another property implies. See
 * docs/rules/umami-event-budget.md; the split and each event's cost are in
 * docs/development/analytics.md.
 */

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
  }
}

/** Every Umami event name this site sends. */
export const UMAMI_EVENTS = {
  SEARCH_OPENED: 'search_opened',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  SEARCH_VIEW_ALL: 'search_view_all',
  HERO_SEARCH_CLICKED: 'hero_search_clicked',

  SEARCH_NO_RESULTS: 'search_no_results',
} as const;

export interface SearchResultClickedProps {
  resultType:
    'park' | 'attraction' | 'show' | 'restaurant' | 'location' | 'glossary' | 'guide' | 'news';
  position?: number;
  queryLength?: number;
  /** For glossary results: the English term ID (e.g. "wait-time"). */
  term_id?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface SearchNoResultsProps {
  queryLength: number;
  [key: string]: string | number | boolean;
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
 * Sends `search_opened` with its source (header, hero or keyboard) when the search dialog opens
 * (`SearchCommand`).
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
 * Sends `search_no_results` with the query length (never the query) when a search of three or more
 * characters returns nothing.
 */
export function trackSearchNoResults(props: SearchNoResultsProps): void {
  trackEvent(UMAMI_EVENTS.SEARCH_NO_RESULTS, props);
}
