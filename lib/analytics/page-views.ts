import { canCountSite, trackSiteEvent } from '@/lib/analytics/site-analytics';

/**
 * What a read can be about: a post (keyed by its `translationKey`, so its six URLs are one page)
 * or a park or a ride (keyed by its UUID). The language is the URL's, never part of the key. See
 * docs/features/most-read.md.
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
 * Whether this read should be counted at all: the gates of the site statistic (production's hosts,
 * not automation, not Do Not Track, Global Privacy Control or the opt-out), and not twice from one
 * tab.
 */
export function shouldCountPageView(id: string): boolean {
  return canCountSite() && !sentThisTab.has(id);
}

/**
 * Counts one read as the `page_read` event of the site statistic. A post is named by its key; a
 * park or a ride is the event's entity, its UUID. The API keeps the reader to three counted reads
 * per page and day and feeds the most-read rankings from them.
 */
export function sendPageView(id: string, view: { kind: PageViewKind; key: string }) {
  sentThisTab.add(id);
  if (view.kind === 'park' || view.kind === 'attraction') {
    trackSiteEvent('page_read', { kind: view.kind }, view.key);
  } else {
    trackSiteEvent('page_read', { kind: view.kind, key: view.key });
  }
}
