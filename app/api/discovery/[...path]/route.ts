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
 * and nearby. The upstream fetch stays no-store (always the backend's latest), but the RESPONSE
 * gets a small shared CDN window (s-maxage=60) so concurrent hub polls collapse onto one backend
 * call instead of hitting it per visitor — the client polls every 5 min anyway, so a ≤60 s CDN
 * window doesn't meaningfully stale the overlay. (Requires a matching exemption in next.config,
 * placed AFTER the blanket `/api → no-store` rule, or that rule overrides this header.)
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
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('[Discovery proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch discovery data' }, { status: 502 });
  }
}
