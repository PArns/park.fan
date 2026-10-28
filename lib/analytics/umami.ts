/**
 * The one way an event reaches Umami. Umami keeps its pageviews and the two Web Vitals events
 * (`components/analytics/web-vitals-reporter.tsx`); every other custom event is counted by our own
 * statistic (`lib/analytics/site-analytics.ts`), where a property costs nothing. Every property sent
 * here is billed as another event, so never send what Umami already has (URL, referrer, screen,
 * language) or what another property implies. See docs/rules/umami-event-budget.md; the split is in
 * docs/development/analytics.md.
 */

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
  }
}

/** The global function the tracker's `data-before-send` names; the layout defines it first. */
export const UMAMI_BEFORE_SEND = 'umamiBeforeSend';

/**
 * Defines {@link UMAMI_BEFORE_SEND}: a page with a query string reaches Umami without its title.
 * The search page puts the query in its title, and `data-exclude-search` strips only the URL and
 * the next page's referrer.
 */
export const UMAMI_BEFORE_SEND_SCRIPT = `window.${UMAMI_BEFORE_SEND}=function(t,p){if(p&&location.search)delete p.title;return p};`;

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
