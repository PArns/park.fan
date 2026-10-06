import { NextResponse } from 'next/server';
import { feedUrlsForPing, pingWebSub, WEBSUB_HUB } from '@/lib/websub';
import { cronUnauthorized } from '@/lib/security/cron-auth';

export const maxDuration = 30;

/**
 * Tells the WebSub hub the blog feeds may have changed, so subscribers get a push instead of
 * polling. Daily and unconditional: the hub diffs the feed and pushes only on a change, so a ping
 * for an unchanged feed costs one conditional GET. For a post that should go out at once, run
 * `pnpm ping:websub` after publishing.
 */
export async function GET(request: Request) {
  const denied = cronUnauthorized(request);
  if (denied) return denied;

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
