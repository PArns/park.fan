import { NextResponse } from 'next/server';
import { getParkPaths, getAttractionPaths, localizedUrls } from '@/lib/content-urls';
import { SITE_URL } from '@/i18n/config';

/**
 * Cache-prewarm crawler.
 *
 * Park & attraction pages are on-demand ISR (statically rendered + edge-cached on
 * first request). After a deploy the cache is empty, so the *first* visitor of each
 * park would otherwise pay the cold render. This route fetches those URLs once to
 * populate the edge/ISR cache so real visitors get a HIT.
 *
 * Trigger it right after a deploy:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://park.fan/api/cron/prewarm
 * and via the daily Vercel cron (vercel.json) to recover from cache eviction.
 *
 * Parks are warmed most-popular-first (see getParkPaths) so a time-bounded run
 * always covers the highest-traffic pages. Attractions are light (no calendar/stats
 * server fetch) and very numerous, so they're opt-in via ?include=attractions.
 */

export const maxDuration = 300; // warming cold parks resolves calendar/stats server-side

const BASE_URL = process.env.PREWARM_BASE_URL || SITE_URL;
const CONCURRENCY = 12;
const PER_REQUEST_TIMEOUT_MS = 20_000;

async function warmAll(urls: string[]): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        const res = await fetch(url, {
          headers: { 'x-prewarm': '1' },
          signal: AbortSignal.timeout(PER_REQUEST_TIMEOUT_MS),
        });
        // The server renders + caches on request; we don't need the body — cancel it
        // to free the connection without downloading the full HTML.
        await res.body?.cancel().catch(() => {});
        if (res.ok) ok++;
        else failed++;
      } catch {
        failed++;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return { ok, failed };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const includeAttractions = new URL(request.url).searchParams.get('include') === 'attractions';

  let urls: string[];
  try {
    urls = localizedUrls(await getParkPaths(), BASE_URL);
    if (includeAttractions) {
      urls.push(...localizedUrls(await getAttractionPaths(), BASE_URL));
    }
  } catch (error) {
    console.error('[Prewarm] Failed to build URL list:', error);
    return NextResponse.json({ error: 'Failed to build URL list' }, { status: 500 });
  }

  const startedAt = Date.now();
  const { ok, failed } = await warmAll(urls);

  return NextResponse.json({
    total: urls.length,
    ok,
    failed,
    includeAttractions,
    durationMs: Date.now() - startedAt,
  });
}
