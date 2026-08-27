import { NextResponse } from 'next/server';
import { feedUrlsForPing, pingWebSub, WEBSUB_HUB } from '@/lib/websub';

export const maxDuration = 30;

/**
 * Tell the WebSub hub the blog feeds may have changed.
 *
 * The hub is what turns a subscriber's polling interval into a push, and it can
 * only do that if somebody tells it to look. Declaring
 * `<atom:link rel="hub">` in the feed and never pinging leaves every subscriber
 * exactly where polling left them.
 *
 * Daily, and unconditional. The obvious refinement — ping only when a post is
 * new — needs state this route does not have, and would buy nothing: the hub
 * fetches the feed, diffs it against what it last saw and pushes **only** if
 * something actually changed, so a ping for an unchanged feed costs one
 * conditional GET of a public document. Six requests a day is not worth a
 * snapshot to avoid.
 *
 * What this cannot do is deliver a post within minutes of publication, because
 * it fires on a schedule rather than on a deploy. Run it by hand
 * (`pnpm ping:websub`) after publishing if that matters for a particular post.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const feeds = feedUrlsForPing();
  const results = await pingWebSub(feeds);
  const accepted = results.filter((result) => result.ok).length;

  // A hub that refuses is worth seeing in the logs: it is invisible from the
  // site, and the only symptom is subscribers quietly going back to polling.
  for (const result of results) {
    if (!result.ok) {
      console.error(`[WebSub] ${result.url} → ${result.status} ${result.error ?? ''}`.trim());
    }
  }

  return NextResponse.json({ hub: WEBSUB_HUB, feeds: feeds.length, accepted, results });
}
