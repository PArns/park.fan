import { locales, SITE_URL } from '@/i18n/config';

/**
 * WebSub (W3C, formerly PubSubHubbub) — how a new post reaches a subscriber in
 * seconds instead of whenever their reader next polls.
 *
 * Two halves, and both are needed. The feed advertises a hub
 * (`<atom:link rel="hub">`), which is how a subscriber learns there is one and
 * registers with it. Then the publisher pings the hub when something changed;
 * the hub re-fetches the feed, diffs it, and pushes only real changes to
 * everyone subscribed. A feed that names a hub but never pings it is no faster
 * than polling — the hub has no other way to find out.
 *
 * Google's public hub, the one nearly every WebSub feed points at. It stores
 * nothing but the feed URL and the subscriber list, and a wrong ping costs a
 * fetch of a document that is public anyway.
 */
export const WEBSUB_HUB = 'https://pubsubhubbub.appspot.com/';

/** Every feed a ping covers — one per locale. */
export function feedUrlsForPing(): string[] {
  return locales.map((locale) => `${SITE_URL}/${locale}/blog/feed.xml`);
}

export interface WebSubPingResult {
  url: string;
  status: number;
  ok: boolean;
  error?: string;
}

/**
 * Tell the hub a feed changed.
 *
 * `hub.mode=publish` with `hub.url` set to the feed, form-encoded — the entire
 * publisher side of the protocol. A 2xx means the hub accepted the notification,
 * not that it has fetched yet; anything else is reported rather than thrown, so
 * one unreachable locale cannot take the other five down with it.
 */
export async function pingWebSub(feedUrls: string[]): Promise<WebSubPingResult[]> {
  return Promise.all(
    feedUrls.map(async (url) => {
      try {
        const response = await fetch(WEBSUB_HUB, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ 'hub.mode': 'publish', 'hub.url': url }).toString(),
        });
        return { url, status: response.status, ok: response.ok };
      } catch (error) {
        return { url, status: 0, ok: false, error: (error as Error).message };
      }
    })
  );
}
