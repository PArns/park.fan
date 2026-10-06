import 'server-only';
import { NextResponse } from 'next/server';

import { denyUnlessAdmin } from '@/lib/admin/session';
import { getRideImages, listParks, searchMedia } from '@/lib/media';

/**
 * Which rides have no picture, the question an editor asks before an afternoon of photos.
 *
 * Two shapes:
 *
 *   POST { parkSlug, rideSlugs[] }  → exactly which of those rides are blank.
 *     The caller already holds the park's ride list, so this costs no API call
 *     at all: it is a lookup against the media index and nothing else.
 *
 *   GET                            → per park in the media database, how many
 *     distinct rides have at least one image. Paired with the park list's
 *     `attractionCount` in the UI, that is the backlog ranking, and it needs no
 *     per-park round trip.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;

  let body: { parkSlug?: string; rideSlugs?: string[] };
  try {
    body = (await request.json()) as { parkSlug?: string; rideSlugs?: string[] };
  } catch {
    return NextResponse.json({ error: 'Malformed request' }, { status: 400 });
  }

  const parkSlug = body.parkSlug?.trim();
  const rideSlugs = Array.isArray(body.rideSlugs) ? body.rideSlugs : [];
  if (!parkSlug) return NextResponse.json({ error: 'parkSlug is required' }, { status: 400 });
  // A park has tens of rides, not thousands; a cap keeps a stray caller from
  // walking the whole index in one request.
  if (rideSlugs.length > 500) {
    return NextResponse.json({ error: 'Too many rides in one request' }, { status: 400 });
  }

  const withImage: string[] = [];
  const without: string[] = [];
  for (const slug of rideSlugs) {
    if (typeof slug !== 'string' || !slug) continue;
    // `getRideImages`, not a folder listing: a photo in another collection, or one naming the
    // ride in `alsoRides`, answers for it too.
    (getRideImages(parkSlug, slug).length > 0 ? withImage : without).push(slug);
  }

  return NextResponse.json(
    { parkSlug, withImage, without },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
  );
}

export async function GET(request: Request) {
  const denied = await denyUnlessAdmin(request, 'viewer');
  if (denied) return denied;

  const parks = listParks().map(({ park, count }) => {
    const rides = new Set<string>();
    for (const image of searchMedia({ park })) {
      if (image.ride) rides.add(image.ride);
      for (const also of image.alsoRides ?? []) rides.add(also);
    }
    return { parkSlug: park, images: count, ridesWithImage: rides.size };
  });

  return NextResponse.json(
    { parks: parks.sort((a, b) => a.parkSlug.localeCompare(b.parkSlug)) },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
  );
}
