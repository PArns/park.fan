import { NextRequest, NextResponse } from 'next/server';

import { MEDIA_REVISION, getMediaImage, getRideImages } from '@/lib/media';
import { serializeMediaImage } from '@/lib/media/api';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/**
 * One image by its database id, with everything a client needs to render and
 * attribute it.
 *
 *   GET /api/media/toverland/troy
 *   GET /api/media/halloween-2026/kulissen/05-arachnophobia-turm?locale=en
 *
 * Ids contain slashes (`<collection>/<name>`), which is why this is a catch-all
 * segment rather than a single one.
 *
 * Cached exactly like the collection route: strong ETag from the content
 * revision, long `s-maxage`, because the answer changes only on deployment.
 */

// Dynamic for the same reason as the collection route: `?locale=` selects the
// language of the resolved text, and a statically prerendered response would
// answer every locale with whichever one the build happened to render.
export const dynamic = 'force-dynamic';

const CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string[] }> }) {
  const { id: segments } = await context.params;
  const id = segments.join('/');
  const image = getMediaImage(id);

  if (!image) {
    return NextResponse.json(
      { error: `No image with id "${id}"` },
      // Not cached: an id that is missing today may exist after the next deploy.
      { status: 404, headers: cdnCacheHeaders('public, s-maxage=60') }
    );
  }

  const locale = new URL(request.url).searchParams.get('locale') ?? 'de';

  // Per-image ETag: one image changing must not invalidate the others.
  const etag = `"${image.version}-${locale}"`;
  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, ...cdnCacheHeaders(CACHE_CONTROL) },
    });
  }

  return NextResponse.json(
    {
      revision: MEDIA_REVISION,
      image: serializeMediaImage(image, locale),
      // Sibling photos of the same ride, so a client showing one can offer the
      // rest without a second round trip. Ids only — the client already knows how
      // to fetch a full record, and inlining them would multiply the payload.
      alsoOfThisRide: getRideImages(image.park, image.ride)
        .filter((other) => other.id !== image.id)
        .map((other) => other.id),
    },
    { headers: { ETag: etag, ...cdnCacheHeaders(CACHE_CONTROL) } }
  );
}
