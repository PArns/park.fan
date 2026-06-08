import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import {
  parseRefKey,
  resolveAttraction,
  resolvePark,
} from '@/lib/blog/park-resolver';

/**
 * Resolve a ref: token into the same handful of fields the published renderer
 * uses for the inline annotation — name, location, live status. The editor's
 * WYSIWYG preview layer calls this once per unique ref so authors see what the
 * link will look like after publish.
 *
 * Accepts both the short form (`phantasialand`, `phantasialand/black-mamba`)
 * and the full geo-path form the picker now writes
 * (`/parks/europe/germany/bruehl/phantasialand[/<rideSlug>]`).
 */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref');
  if (!ref) {
    return NextResponse.json({ error: 'missing ref' }, { status: 400 });
  }
  const { kind, key } = parseRefKey(ref);

  if (kind === 'park') {
    const park = await resolvePark(key);
    if (!park) return NextResponse.json({ kind: 'park', found: false });
    return NextResponse.json({
      kind: 'park',
      found: true,
      name: park.name,
      city: park.city,
      country: park.country,
      status: park.status ?? null,
      crowdLevel: park.crowdLevel ?? null,
    });
  }

  const [parkSlug, attractionSlug] = key.split('/');
  if (!parkSlug || !attractionSlug) {
    return NextResponse.json({ kind: 'ride', found: false });
  }
  const [attraction, park] = await Promise.all([
    resolveAttraction(parkSlug, attractionSlug),
    resolvePark(parkSlug),
  ]);
  if (!attraction || !park) {
    return NextResponse.json({ kind: 'ride', found: false });
  }
  return NextResponse.json({
    kind: 'ride',
    found: true,
    name: attraction.attractionName,
    parkName: park.name,
    country: park.country,
    status: attraction.status ?? null,
    waitTime: attraction.currentWaitTime ?? null,
    crowdLevel: attraction.crowdLevel ?? null,
  });
}
