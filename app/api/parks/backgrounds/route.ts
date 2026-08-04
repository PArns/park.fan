import { NextResponse } from 'next/server';

import { MEDIA_IMAGES, MEDIA_REVISION } from '@/lib/media';
import { versionedSrc } from '@/lib/media/focus';

/**
 * Every park/ride photo the site ships, as a flat list of paths.
 *
 * Used to walk `public/images/parks` recursively on first request and cache the
 * result in module state; the media manifest already is that list, so the walk
 * and its cache are gone. Paths are content-versioned, so a client can cache each
 * one indefinitely.
 */
export async function GET() {
  return NextResponse.json({
    revision: MEDIA_REVISION,
    backgrounds: MEDIA_IMAGES.map((image) => versionedSrc(image)),
  });
}
