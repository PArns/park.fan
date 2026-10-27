import { API_ORIGIN } from '@/lib/api/client';
import { analyticsOptedOut, isAnalyticsHost } from '@/lib/analytics/opt-out';

/**
 * What a page view can be about, the API's `PAGE_VIEW_KINDS`. A post is keyed by its
 * `translationKey`, so its six URLs are one page; a park or a ride by its UUID. The language is
 * sent beside the key, never in it. See docs/features/most-read.md.
 */
export type PageViewKind = 'article' | 'news' | 'park' | 'attraction';

/** How long a page has to be in front of the reader before it counts as read. */
export const PAGE_VIEW_DWELL_MS = 5000;

/**
 * What this tab has sent, in memory only. Nothing goes into the browser's storage: a flag kept
 * there for a statistic would need the reader's consent (§ 25 TDDDG), and the API's own cap per
 * reader and day already holds one who reloads to three.
 */
const sentThisTab = new Set<string>();

/**
 * Whether this view should be sent at all: only on production's hosts, not from automation
 * (`navigator.webdriver`), not under Do Not Track, Global Privacy Control or the analytics opt-out,
 * and not twice from one tab.
 */
export function shouldCountPageView(id: string): boolean {
  if (!isAnalyticsHost(location.hostname)) return false;
  if (navigator.webdriver || analyticsOptedOut()) return false;
  return !sentThisTab.has(id);
}

/**
 * Sends one view straight to api.park.fan, never through this app's relay: the API caps a reader by
 * address and drops bots by User-Agent, and both must be the reader's own. Fire and forget, and no
 * `keepalive`: the view goes out while the page is in front, not as it unloads.
 */
export function sendPageView(
  id: string,
  view: { kind: PageViewKind; key: string; locale: string }
) {
  sentThisTab.add(id);
  fetch(`${API_ORIGIN}/v1/page-views`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(view),
  }).catch(() => {});
}
