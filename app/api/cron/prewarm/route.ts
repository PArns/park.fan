import { NextResponse } from 'next/server';
import { getParkPaths, getAttractionPaths } from '@/lib/content-urls';
import { defaultLocale, SITE_URL } from '@/i18n/config';

/**
 * Data-Cache prewarm crawler.
 *
 * Warms one locale per park, not six.
 *
 * What it warms is the Vercel Data Cache entry behind `getParkByGeoPath`, which is keyed by the
 * BACKEND url and therefore shared by all six locales of a park (see lib/api/parks.ts). Warming
 * `/en/...` and `/de/...` and four more fills the same single entry six times over, and each of
 * those five extra requests is a full `force-dynamic` SSR render billed as Active CPU.
 *
 * It used to do exactly that: 213 parks x 6 locales = 1,278 renders every six hours, ~5,100 a day,
 * roughly 10 % of all production function invocations. The docblock that justified it described a
 * world that ended with PR #147 — it said park & attraction pages were "on-demand ISR (statically
 * rendered + edge-cached on first request)" and that this run populated that cache so the first
 * visitor got a HIT. Since #147 those pages are `force-dynamic`: there is no per-URL shell to
 * populate, nothing to get a HIT on, and the five extra locales warmed nothing whatsoever.
 *
 * A visitor in any locale gets the same thing out of this run as before: their render reads the
 * park snapshot it just put in the Data Cache. Only the five repeat renders are gone.
 *
 * Trigger it right after a deploy:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://park.fan/api/cron/prewarm
 * and via the Vercel cron (vercel.json) to recover from cache eviction.
 *
 * ONCE a day, at 04:00 UTC, and the cadence is the entry's own window rather than a round number.
 * `PARK_REVALIDATE` is 86400 (lib/api/parks.ts), so a run every six hours re-rendered 213 park
 * pages to refresh an entry with eighteen hours left on it — 636 of its 848 daily renders were
 * the same entry filled again. 04:00 puts it an hour ahead of the 05:30 content-change crawl, so
 * that crawl reads warm entries. Eviction is still covered: it is what the run exists for, and a
 * deploy triggers it by hand.
 *
 * Parks are warmed most-popular-first (see getParkPaths) so a time-bounded run always covers the
 * highest-traffic pages. Attractions are very numerous, so they stay opt-in via
 * ?include=attractions — and they read the same per-park entry, so they are warmed one locale deep
 * for the same reason.
 */

export const maxDuration = 300; // warming cold parks resolves calendar/stats server-side

const BASE_URL = process.env.PREWARM_BASE_URL || SITE_URL;
const CONCURRENCY = 12;
const PER_REQUEST_TIMEOUT_MS = 20_000;

/**
 * One URL per path, in the default locale.
 *
 * Deliberately NOT `localizedUrls` (which indexnow still needs, because a search engine really
 * does want all six): the entry this run fills is locale-independent, so a second locale is a
 * second render for a cache write that already happened.
 */
const warmUrls = (paths: string[]): string[] =>
  paths.map((path) => `${BASE_URL}/${defaultLocale}${path}`);

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
    urls = warmUrls(await getParkPaths());
    if (includeAttractions) {
      urls.push(...warmUrls(await getAttractionPaths()));
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
