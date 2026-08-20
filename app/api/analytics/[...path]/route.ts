import { NextRequest, NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';
import { getTickerData } from '@/lib/api/analytics';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

/**
 * The three public analytics reads, and only those three.
 *
 * This one stays anonymous — every homepage visitor polls the ticker and the
 * live stats — so the lock is the path list rather than a session. It is the
 * same hole the admin proxy had: a catch-all that joins the caller's segments
 * into a URL forwards `x-auth-key` (a rate-limit bypass at the API) to
 * wherever a percent-encoded separator takes it, and `new URL()` normalises
 * `..` after Next has already finished matching the route.
 */
const ANALYTICS_PATHS = new Set(['ticker', 'realtime', 'geo-live']);
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // The live wait-times ticker is polled by every homepage visitor (every 5 min, see
  // live-wait-ticker) and the admin dashboard, all asking for the same param-less data.
  // Serve it from the shared 10-min data cache (getTickerData → revalidate 600) so those
  // concurrent polls collapse onto a single backend call instead of each hitting the API.
  // realtime/geo-live stay no-store below (live stats).
  if (path.length === 1 && path[0] === 'ticker') {
    try {
      const data = await getTickerData();
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      });
    } catch (error) {
      console.error('[Analytics proxy] Ticker error:', error);
      return NextResponse.json({ error: 'Failed to fetch ticker data' }, { status: 502 });
    }
  }

  const requested = path.join('/');
  if (!ANALYTICS_PATHS.has(requested)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const upstream = [...ANALYTICS_PATHS].find((candidate) => candidate === requested)!;

  const incoming = new URL(request.url);
  const apiUrl = new URL(`${API_BASE}/v1/analytics/${upstream}`);
  incoming.searchParams.forEach((value, key) => apiUrl.searchParams.set(key, value));

  try {
    const response = await fetch(apiUrl.toString(), {
      cache: 'no-store',
      headers: getServerApiHeaders(),
    });
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error) {
    console.error('[Analytics proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 502 });
  }
}
