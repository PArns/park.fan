import 'server-only';
import { NextResponse } from 'next/server';

import { requireAdminPass } from '@/lib/admin/verify-pass';
import { suggestPark, suggestRides, type GeoAttraction } from '@/lib/media/suggest';
import type { GeoPark } from '@/lib/media/geo';
import type { MediaGps } from '@/lib/media/types';
import { LOW_RES_LONG_EDGE } from '../route';

/**
 * Inspect freshly dropped files and propose where each belongs.
 *
 * This is the step that makes a 100-image drop reviewable instead of a data-entry
 * session: the browser posts the files, this reads the EXIF the camera left on
 * them and answers, per file, "this is Toverland, 240 m from the entrance, and
 * here are the eight nearest rides".
 *
 * Nothing is stored. The client keeps the bytes and posts them again — with the
 * corrections a human made — to `../commit`, which opens the pull request. Two
 * round trips over one is deliberate: the expensive, irreversible step (writing to
 * the repository) happens only after somebody has looked at the suggestions.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FILES = 200;

// Imported lazily and memoized per warm instance: both are heavy native/parsing
// modules that a request which never reaches this route should not pay for.
type Sharp = (typeof import('sharp'))['default'];
// exif-reader's module IS the function, so there is no `default` to index into.
type ExifReader = typeof import('exif-reader');

let sharpMod: Sharp | null = null;
let exifMod: ExifReader | null = null;

async function loadTools(): Promise<{ sharp: Sharp; exifReader: ExifReader }> {
  sharpMod ??= (await import('sharp')).default;
  exifMod ??= (await import('exif-reader')).default;
  return { sharp: sharpMod, exifReader: exifMod };
}

function toDecimalDegrees(dms: unknown, ref: unknown): number | null {
  if (!Array.isArray(dms) || dms.length < 2) return null;
  const [degrees = 0, minutes = 0, seconds = 0] = dms.map(Number);
  if (![degrees, minutes, seconds].every(Number.isFinite)) return null;
  const value = degrees + minutes / 60 + seconds / 3600;
  return ref === 'S' || ref === 'W' ? -value : value;
}

/** Park + attraction coordinates, cached in the Data Cache for an hour. */
async function loadCatalog(): Promise<{ parks: GeoPark[] }> {
  try {
    const response = await fetch('https://api.park.fan/v1/parks?limit=1000', {
      headers: { 'User-Agent': 'park.fan-admin/1.0' },
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return { parks: [] };
    const data = (await response.json()).data ?? [];
    return {
      parks: data
        .filter((p: { latitude?: string; longitude?: string }) => p.latitude && p.longitude)
        .map(
          (p: {
            slug: string;
            name: string;
            latitude: string;
            longitude: string;
            url?: string;
          }) => ({
            slug: p.slug,
            name: p.name,
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
            url: p.url,
          })
        ),
    };
  } catch {
    return { parks: [] };
  }
}

const attractionCache = new Map<string, GeoAttraction[]>();

async function loadAttractions(parkUrl: string): Promise<GeoAttraction[]> {
  const cached = attractionCache.get(parkUrl);
  if (cached) return cached;
  try {
    const response = await fetch(`https://api.park.fan${parkUrl}`, {
      headers: { 'User-Agent': 'park.fan-admin/1.0' },
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const body = await response.json();
    const list: GeoAttraction[] = (body.attractions ?? [])
      .filter((a: { latitude?: string; longitude?: string }) => a.latitude && a.longitude)
      .map(
        (a: {
          slug: string;
          name: string;
          latitude: string;
          longitude: string;
          land?: string;
        }) => ({
          slug: a.slug,
          name: a.name,
          latitude: Number(a.latitude),
          longitude: Number(a.longitude),
          land: a.land ?? null,
        })
      );
    attractionCache.set(parkUrl, list);
    return list;
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;

  const form = await req.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 });
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `At most ${MAX_FILES} files per batch` }, { status: 400 });
  }

  const { sharp, exifReader } = await loadTools();
  const { parks } = await loadCatalog();

  const results = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());

      let width = 0;
      let height = 0;
      let gps: MediaGps | null = null;
      let shotAt: string | null = null;

      try {
        const meta = await sharp(buffer).metadata();
        const swap = Boolean(meta.orientation && meta.orientation >= 5);
        width = (swap ? meta.height : meta.width) ?? 0;
        height = (swap ? meta.width : meta.height) ?? 0;

        if (meta.exif) {
          const tags = exifReader(meta.exif);
          const info = tags.GPSInfo as Record<string, unknown> | undefined;
          if (info) {
            const lat = toDecimalDegrees(info.GPSLatitude, info.GPSLatitudeRef);
            const lon = toDecimalDegrees(info.GPSLongitude, info.GPSLongitudeRef);
            if (lat !== null && lon !== null && (lat !== 0 || lon !== 0)) {
              gps = { lat: Number(lat.toFixed(6)), lon: Number(lon.toFixed(6)), source: 'exif' };
            }
          }
          const taken = tags.Photo?.DateTimeOriginal ?? tags.Image?.DateTime;
          if (taken instanceof Date && !Number.isNaN(taken.getTime())) {
            shotAt = taken.toISOString().slice(0, 10);
          }
        }
      } catch {
        // An unreadable file still comes back, so the UI can show it as needing
        // manual assignment rather than silently dropping it from the batch.
      }

      const park = gps ? suggestPark(gps, parks) : null;
      let rides: ReturnType<typeof suggestRides> = [];
      if (gps && park) {
        const parkRecord = parks.find((p) => p.slug === park.slug) as
          (GeoPark & { url?: string }) | undefined;
        if (parkRecord?.url) rides = suggestRides(gps, await loadAttractions(parkRecord.url));
      }

      return {
        name: file.name,
        size: file.size,
        type: file.type,
        width,
        height,
        // Flagged here as well as in the browser, so a low-res source is caught at
        // the moment of upload rather than discovered on a park page later.
        lowRes: width > 0 && Math.max(width, height) < LOW_RES_LONG_EDGE,
        gps,
        shotAt,
        suggestion: {
          park,
          // A ranked shortlist, never a single auto-assigned ride: the nearest
          // attraction is the right one only ~55 % of the time (see lib/media/suggest.ts).
          rides,
          // The themed area of the closest ride, offered alongside it.
          area: rides[0]?.area ?? null,
        },
      };
    })
  );

  return NextResponse.json({
    files: results,
    catalogAvailable: parks.length > 0,
    lowResLongEdge: LOW_RES_LONG_EDGE,
  });
}
