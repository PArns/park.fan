import { NextRequest, NextResponse } from 'next/server';
import { getParksNearLocationFresh } from '@/lib/api/discovery';

/**
 * Live (no-store) "parks near these coordinates" — backs the park page's nearby-parks client
 * overlay (`useParkNeighbors`). The page renders the nearby cards status-free (cacheable shell);
 * this endpoint supplies the live status/crowd on the client. Takes precedence over the
 * /api/parks/[...path] catch-all (static segment wins).
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
    return NextResponse.json({ parks }, { headers: { 'Cache-Control': 'no-store, must-revalidate' } });
  } catch (error) {
    console.error('[Park neighbors proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby parks' }, { status: 502 });
  }
}
