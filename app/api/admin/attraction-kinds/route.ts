import 'server-only';
import { NextResponse } from 'next/server';
import { parkGeoSegments } from '@/lib/admin/park-geo-path';
import { denyUnlessAdmin } from '@/lib/admin/session';
import type { ServedAttractionKind } from '@/lib/admin/attraction-kind';
import { getParkByGeoPath } from '@/lib/api/parks';
import { NO_STORE } from '@/lib/api/cdn-cache-headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One park's attraction kinds as the public payload serves them, keyed by attraction id, with who
 * decided each. The admin's own attraction list stores only the editor's column, so this is where
 * the park editor learns what the API's rule derived for the rest. Reads the park shell the park
 * page renders from, so it usually costs no API call; the derived kinds change once a night.
 */
export async function GET(request: Request) {
  const denied = await denyUnlessAdmin(request, 'viewer');
  if (denied) return denied;

  const segments = parkGeoSegments(new URL(request.url).searchParams.get('path'));
  if (!segments) {
    return NextResponse.json(
      { error: 'path must be continent/country/city/park' },
      { status: 400, headers: NO_STORE }
    );
  }
  const [continent, country, city, parkSlug] = segments;

  try {
    const park = await getParkByGeoPath(continent, country, city, parkSlug);
    if (!park) {
      return NextResponse.json({ error: 'Park not found' }, { status: 404, headers: NO_STORE });
    }

    const kinds: Record<string, ServedAttractionKind> = {};
    for (const attraction of park.attractions ?? []) {
      if (!attraction.attractionKind) continue;
      kinds[attraction.id] = {
        kind: attraction.attractionKind,
        source: attraction.attractionKindSource ?? null,
      };
    }
    return NextResponse.json({ kinds }, { headers: NO_STORE });
  } catch (error) {
    console.error('[Admin attraction kinds] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch the park' },
      { status: 502, headers: NO_STORE }
    );
  }
}
