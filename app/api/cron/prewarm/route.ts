import { NextResponse } from 'next/server';
import { getParkPaths, getAttractionPaths } from '@/lib/content-urls';
import { defaultLocale, SITE_URL } from '@/i18n/config';
import { cronUnauthorized } from '@/lib/security/cron-auth';

/**
 * Data Cache prewarm crawler. It warms one locale per park: the entry behind `getParkByGeoPath` is
 * keyed by the backend URL and shared by all six locales, so a second locale is a second render
 * for nothing. Once a day, because `PARK_REVALIDATE` is a day, ahead of the content-change crawl,
 * and by hand after a deploy:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://park.fan/api/cron/prewarm
 * Parks go most-popular-first so a time-bounded run covers the busiest pages; attractions are
 * opt-in via `?include=attractions`.
 */

export const maxDuration = 300; // warming cold parks resolves calendar/stats server-side

const BASE_URL = process.env.PREWARM_BASE_URL || SITE_URL;
const CONCURRENCY = 12;
const PER_REQUEST_TIMEOUT_MS = 20_000;

/**
 * One URL per path, in the default locale. Not `localizedUrls`: the entry this run fills does not
 * depend on the locale.
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
  const denied = cronUnauthorized(request);
  if (denied) return denied;

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
