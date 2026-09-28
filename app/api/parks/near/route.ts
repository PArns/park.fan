import { NextRequest, NextResponse } from 'next/server';
import { getParksNearLocationFresh } from '@/lib/api/discovery';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/**
 * Live "parks near these coordinates" — backs the park page's nearby-parks client overlay
 * (`useParkNeighbors`). The page renders the nearby cards status-free (cacheable shell); this
 * endpoint supplies the live status/crowd on the client. Takes precedence over the
 * /api/parks/[...path] catch-all (static segment wins).
 *
 * Shared-cached for 60 s, the window `/api/parks/live` has for the same kind of answer. It was
 * `no-store`, so every park page view and every five-minute poll was a function invocation and a
 * backend call, although the coordinates are the park's own (`LiveNearbyParks`) and the URL is the
 * same for every visitor of that park. A backend failure throws (`getParksNearLocationFresh`) and
 * answers the uncached 502 below, never a shared empty list. Unlike `/api/nearby`, which geolocates the visitor, nothing
 * here depends on who asks. The rule in next.config.ts carries the same value.
 */
export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const lat = Number(sp.get('lat'));
  const lng = Number(sp.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }
  const exclude = sp.get('exclude') ?? undefined;
  const limit = sp.get('limit') ? Number(sp.get('limit')) : 3;
  const maxDistanceM = sp.get('radius') ? Number(sp.get('radius')) : 100_000;

  try {
    const parks = await getParksNearLocationFresh(lat, lng, exclude, limit, maxDistanceM);
    return NextResponse.json(
      { parks },
      { headers: cdnCacheHeaders('public, s-maxage=60, stale-while-revalidate=120') }
    );
  } catch (error) {
    console.error('[Park neighbors proxy] Error:', error);
    // Explicit, so the shared window in next.config.ts cannot apply to a failure.
    return NextResponse.json(
      { error: 'Failed to fetch nearby parks' },
      { status: 502, headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  }
}
