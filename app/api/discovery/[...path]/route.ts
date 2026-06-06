import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthHeaders } from '@/lib/api/client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

/**
 * Live (no-store) passthrough for a region's parks — `/api/discovery/<continent>/<country>`
 * maps to the backend `/v1/discovery/continents/<continent>/<country>` (the same data
 * `getCitiesWithParks` reads, but uncached).
 *
 * The hub pages (continent/country/city) render their ParkCards STATUS-FREE so the per-locale
 * ISR shell carries no volatile data (and can be cached for a day). The live open/closed status,
 * crowd level and wait times are layered on the client via `useRegionParks`, which polls this
 * endpoint — exactly the SSR-static + client-live split already used for the park page, favorites
 * and nearby. Always no-store here so the client overlay reflects the backend's latest snapshot.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  if (path.length !== 2) {
    return NextResponse.json(
      { error: 'Expected /api/discovery/<continent>/<country>' },
      { status: 400 }
    );
  }

  const [continent, country] = path;
  const apiUrl = `${API_BASE}/v1/discovery/continents/${continent}/${country}`;

  try {
    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: getServerAuthHeaders(),
    });
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error) {
    console.error('[Discovery proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch discovery data' }, { status: 502 });
  }
}
