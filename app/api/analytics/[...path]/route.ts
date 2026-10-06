import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { getTickerData } from '@/lib/api/analytics';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/**
 * The three public analytics reads, and only those three. It stays anonymous, so the lock is the
 * path list: a catch-all joining the caller's segments would forward `x-auth-key`, a rate-limit
 * bypass at the API, wherever an encoded `..` takes it. See
 * docs/rules/an-api-route-passes-only-slugs-upstream.md.
 */
const ANALYTICS_PATHS = new Set(['ticker', 'realtime', 'geo-live']);

/**
 * The same bytes for every visitor, so a 60 s shared window collapses concurrent polls onto one
 * invocation, as on `/api/parks/live`. Only a successful answer is shared; next.config.ts carries
 * the same value.
 */
const SHARED_WINDOW = 'public, s-maxage=60, stale-while-revalidate=120';
/** Every other answer says so itself, or the rule in next.config.ts would share it. */
const NO_STORE = { 'Cache-Control': 'no-store, must-revalidate' };
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // Every homepage visitor and the admin dashboard poll the ticker without parameters, so it comes
  // from the shared data cache (`getTickerData`) and concurrent polls make one backend call.
  if (path.length === 1 && path[0] === 'ticker') {
    try {
      const data = await getTickerData();
      return NextResponse.json(data, { headers: cdnCacheHeaders(SHARED_WINDOW) });
    } catch (error) {
      console.error('[Analytics proxy] Ticker error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ticker data' },
        { status: 502, headers: NO_STORE }
      );
    }
  }

  const requested = path.join('/');
  if (!ANALYTICS_PATHS.has(requested)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: NO_STORE });
  }
  const upstream = [...ANALYTICS_PATHS].find((candidate) => candidate === requested)!;

  // No query string goes upstream: none of the three takes one, and each distinct query would
  // miss the shared window and spend a keyed backend call.
  const apiUrl = new URL(`${getApiBaseUrl()}/v1/analytics/${upstream}`);

  try {
    const response = await fetch(apiUrl.toString(), {
      cache: 'no-store',
      headers: getServerApiHeaders(),
    });
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
      headers: response.ok ? cdnCacheHeaders(SHARED_WINDOW) : NO_STORE,
    });
  } catch (error) {
    console.error('[Analytics proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 502, headers: NO_STORE }
    );
  }
}
