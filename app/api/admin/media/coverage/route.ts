import 'server-only';
import { NextResponse } from 'next/server';

import { denyUnlessAdmin } from '@/lib/admin/session';
import { getRideImages, listParks, searchMedia } from '@/lib/media';

/**
 * Which rides have no picture.
 *
 * The per-entity answer has always been visible — open a ride's Bilder tab and
 * it says "no images". The aggregate never was, in the admin or anywhere else,
 * so "which of this park's forty rides is still blank" meant opening forty
 * tabs. `pnpm audit:media` reports the inverse from a terminal; this is the
 * question an editor actually asks before spending an afternoon on photos.
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
    // `getRideImages` is the right lookup rather than a folder listing: a
    // Halloween photo of Troy lives in `toverland-halloween` and still answers
    // for the ride, and `alsoRides` means one file can cover two.
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
