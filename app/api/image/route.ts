import { NextRequest, NextResponse } from 'next/server';

import { getParkBackground, getRideImage } from '@/lib/media';
import { versionedSrc } from '@/lib/media/focus';

/**
 * Park / attraction image delivery for external clients (e.g. the native app).
 *
 * Resolves a park/attraction slug through the media database and redirects to
 * Next.js' built-in image optimizer, which serves AVIF/WebP at the requested
 * width & quality with an immutable 1-year cache. No image processing (or
 * `sharp`) is done here — we lean on the optimizer the rest of the app uses.
 *
 *   GET /api/image?park=europa-park            → park background
 *   GET /api/image?park=europa-park&attraction=blue-fire-megacoaster
 *   GET /api/image?park=europa-park&w=400&q=75
 *
 * The lookup used to probe `public/images/parks/<park>/<slug>.<ext>` on disk,
 * which tied a ride's photo to its filename; the database resolves by role
 * instead, so a ride whose photo is filed under any name still answers, and a
 * ride with only a Halloween shot gets that rather than a 404.
 *
 * Prefer `/api/media` for anything richer — it returns the metadata, the focal
 * point and the pre-cut aspect variants. This route stays for clients that just
 * want bytes at a size.
 */

// Keep in sync with next.config.ts `images.{deviceSizes ∪ imageSizes, qualities}`.
// The optimizer rejects any width/quality not in these allow-lists.
const ALLOWED_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 828, 1080, 1200, 1920, 2560, 3840];
const ALLOWED_QUALITIES = [50, 60, 75, 85, 90];

const SLUG_RE = /^[a-z0-9-]+$/; // blocks path traversal (no '/', '.', '..')

function toInt(value: string | null, fallback: number): number {
  const n = value ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/** Smallest allowed width >= requested (so we never upscale-by-request). */
function snapWidth(width: number): number {
  return ALLOWED_WIDTHS.find((w) => w >= width) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

function snapQuality(quality: number): number {
  return ALLOWED_QUALITIES.reduce((best, q) =>
    Math.abs(q - quality) < Math.abs(best - quality) ? q : best
  );
}

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const park = (params.get('park') ?? '').toLowerCase();
  const attraction = (params.get('attraction') ?? '').toLowerCase() || undefined;

  if (!SLUG_RE.test(park) || (attraction !== undefined && !SLUG_RE.test(attraction))) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const image = attraction ? getRideImage(park, attraction) : getParkBackground(park);
  if (!image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  const width = snapWidth(Math.min(Math.max(toInt(params.get('w'), 828), 16), 3840));
  const quality = snapQuality(Math.min(Math.max(toInt(params.get('q'), 75), 1), 100));

  // The versioned source keeps the optimizer's cache key tied to the actual
  // pixels, so a replaced photo or a retargeted crop is picked up immediately
  // instead of being pinned by the 1-year rendition cache.
  const target = `/_next/image?url=${encodeURIComponent(versionedSrc(image))}&w=${width}&q=${quality}`;
  // The optimizer response carries the immutable long-lived cache headers.
  return NextResponse.redirect(new URL(target, request.url), 307);
}
