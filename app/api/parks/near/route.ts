import { NextRequest, NextResponse } from 'next/server';
import { getParksNearLocationFresh } from '@/lib/api/discovery';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/**
 * Live "parks near these coordinates" for the park page's nearby cards (`useParkNeighbors`), which
 * render without status. The coordinates are the park's own, so the answer is the same for every
 * visitor and shares the 60 s window of `/api/parks/live` (next.config.ts carries the same value).
 * A backend failure answers an uncached 502, never a shared empty list.
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
