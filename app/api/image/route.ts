import { access } from 'node:fs/promises';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Park / attraction image delivery for external clients (e.g. the native app).
 *
 * Resolves a park/attraction slug to its on-disk source under
 * `public/images/parks/<park>/<base>.<ext>` and redirects to Next.js' built-in
 * image optimizer, which serves AVIF/WebP at the requested width & quality with
 * an immutable 1-year cache. No image processing (or `sharp`) is done here — we
 * lean on the optimizer the rest of the app already uses.
 *
 *   GET /api/image?park=europa-park            → park hero (background.jpg)
 *   GET /api/image?park=europa-park&attraction=blue-fire-megacoaster
 *   GET /api/image?park=europa-park&w=400&q=75
 */

// Keep in sync with next.config.ts `images.{deviceSizes ∪ imageSizes, qualities}`.
// The optimizer rejects any width/quality not in these allow-lists.
const ALLOWED_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 828, 1080, 1200, 1920, 2560, 3840];
const ALLOWED_QUALITIES = [50, 60, 75, 85, 90];

const SLUG_RE = /^[a-z0-9-]+$/; // blocks path traversal (no '/', '.', '..')
const SOURCE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const PUBLIC_DIR = path.join(process.cwd(), 'public');

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

/** Find the real source path (extension may vary), or null if none exists. */
async function resolveSource(park: string, base: string): Promise<string | null> {
  for (const ext of SOURCE_EXTS) {
    const rel = `/images/parks/${park}/${base}.${ext}`;
    try {
      await access(path.join(PUBLIC_DIR, rel));
      return rel;
    } catch {
      // try next extension
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const park = (params.get('park') ?? '').toLowerCase();
  const attraction = (params.get('attraction') ?? '').toLowerCase() || undefined;

  if (!SLUG_RE.test(park) || (attraction !== undefined && !SLUG_RE.test(attraction))) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const base = attraction ?? 'background';
  const source = await resolveSource(park, base);
  if (!source) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  const width = snapWidth(Math.min(Math.max(toInt(params.get('w'), 828), 16), 3840));
  const quality = snapQuality(Math.min(Math.max(toInt(params.get('q'), 75), 1), 100));

  // The optimizer response carries the immutable long-lived cache headers.
  const target = `/_next/image?url=${encodeURIComponent(source)}&w=${width}&q=${quality}`;
  return NextResponse.redirect(new URL(target, request.url), 307);
}
