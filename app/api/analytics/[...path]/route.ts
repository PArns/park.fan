import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthHeaders } from '@/lib/api/client';
import { getTickerData } from '@/lib/api/analytics';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

// Read-only passthrough for the public /v1/analytics/* endpoints.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // The live wait-times ticker is polled by every homepage visitor (every 5 min, see
  // live-wait-ticker) and the admin dashboard, all asking for the same param-less data.
  // Serve it from the shared 5-min data cache (getTickerData → revalidate 300) so those
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

  const incoming = new URL(request.url);
  const apiUrl = new URL(`${API_BASE}/v1/analytics/${path.join('/')}`);
  incoming.searchParams.forEach((value, key) => apiUrl.searchParams.set(key, value));

  try {
    const response = await fetch(apiUrl.toString(), {
      cache: 'no-store',
      headers: getServerAuthHeaders(),
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
