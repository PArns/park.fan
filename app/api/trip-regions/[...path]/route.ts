import { NextRequest, NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';
import { foreignForecastRequest, isSameOriginRequest } from '@/lib/api/forecast-relay';
import { tripRegionApiUrl, tripRegionCacheTag } from '@/lib/trip-regions/api';
import { tripRegionRelayTarget } from '@/lib/trip-regions/relay';
import { isSlugPath } from '@/lib/utils/servable-route';

/**
 * The hubs' relay to `/v1/trip-regions/<region>{,/calendar,/best-days,/plan,/plan/ideas}`: the planner
 * asks `/plan` on every change and the calendar asks other windows than the page rendered, and the
 * routes need the site's data key, which never reaches a browser. Every route answers only this
 * site's pages (docs/rules/a-forecast-leaves-only-with-a-key.md).
 *
 * The calendar and best days go through the Data Cache under the region's tag, so the window the
 * page rendered and the one its matrix then asks for are one upstream call. A plan and its ideas do
 * not: their query is the visitor's trip, and the API keeps each one an hour by its normalized query.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!path || !isSlugPath(path)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400, headers: NO_STORE });
  }

  const target = tripRegionRelayTarget(path, request.nextUrl.searchParams);
  if (!target) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: NO_STORE });
  }
  // Every trip-region route needs a key on the API, the region and its school breaks included.
  if (!isSameOriginRequest(request)) return foreignForecastRequest();

  const cached =
    target.route !== 'plan' && target.route !== 'plan/ideas' && target.route !== 'when';
  try {
    const response = await fetch(tripRegionApiUrl(target.apiPath), {
      ...(cached
        ? {
            next: {
              revalidate: target.forecast ? CACHE_TTL.tripRegionData : CACHE_TTL.tripRegion,
              tags: [tripRegionCacheTag(target.region)],
            },
          }
        : { cache: 'no-store' as const }),
      headers: { 'Content-Type': 'application/json', ...getServerApiHeaders() },
    });
    const body = await response.text();
    // The API's 400 says which parameter was wrong, and the planner shows it; its status passes on
    // unflattened, never as a cached 200.
    return new NextResponse(body || null, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...(response.ok ? cdnCacheHeaders(target.cacheControl) : NO_STORE),
      },
    });
  } catch (error) {
    console.error('[Trip region relay] Error:', error);
    return NextResponse.json(
      { error: 'The trip-region API could not be reached' },
      { status: 502, headers: NO_STORE }
    );
  }
}
