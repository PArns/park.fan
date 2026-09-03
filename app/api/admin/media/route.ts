import 'server-only';
import { NextResponse } from 'next/server';

import { getServerApiHeaders } from '@/lib/api/client';
import { denyUnlessAdmin } from '@/lib/admin/session';
import {
  MEDIA_REVISION,
  getMediaImage,
  listCollections,
  listParks,
  listTags,
  mediaStats,
  searchMedia,
} from '@/lib/media';
import { checkParkAssignment, type GeoPark } from '@/lib/media/geo';
import { versionedSrc } from '@/lib/media/focus';
import { getMediaText } from '@/lib/media/text';
import { MEDIA_LICENSES, MEDIA_ROLES } from '@/lib/media/types';
import { TAG_FACETS } from '@/lib/media/tags.mjs';
import type { MediaImage, MediaLicense, MediaRole } from '@/lib/media/types';

/**
 * The admin media browser's read endpoint.
 *
 * Returns rows in their *editable* shape — the raw sidecar fields, not the
 * rendered ones — plus the vocabulary the editor needs to offer (tag facets,
 * roles, licences) so the UI never hardcodes a list that could drift from
 * `lib/media/tags.mjs`.
 *
 *   GET /api/admin/media?q=&park=&tag=&lowres=1
 *   GET /api/admin/media?id=toverland/troy      one image, with its GPS verdict
 */

/** Long-edge target for a source photo — see docs/development/assets.md. */
export const LOW_RES_LONG_EDGE = 2048;

export function isLowRes(image: MediaImage): boolean {
  if (image.format === 'svg') return false; // resolution-independent
  return Math.max(image.width, image.height) < LOW_RES_LONG_EDGE;
}

function toRow(image: MediaImage) {
  const text = getMediaText(image.id);
  return {
    ...image,
    // The content-versioned address, which a spread of `MediaImage` does not
    // carry: the row has `src`, and `?v=<hash>` is added by `versionedSrc`
    // because retargeting a focal point rewrites a crop's bytes at an
    // unchanged URL. The park and ride media panels read `url` — without it
    // every thumbnail in them rendered as a broken image.
    url: versionedSrc(image),
    alt: text.alt ?? {},
    caption: text.caption ?? {},
    lowRes: isLowRes(image),
  };
}

/** Park coordinates, for the GPS cross-check. Fetched fresh; failures are non-fatal. */
async function loadParkGeo(): Promise<GeoPark[]> {
  try {
    const response = await fetch('https://api.park.fan/v1/parks?limit=1000', {
      headers: getServerApiHeaders(),
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const parks = (await response.json()).data ?? [];
    return parks
      .filter((p: { latitude?: string; longitude?: string }) => p.latitude && p.longitude)
      .map((p: { slug: string; name: string; latitude: string; longitude: string }) => ({
        slug: p.slug,
        name: p.name,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const unauthorized = await denyUnlessAdmin(req);
  if (unauthorized) return unauthorized;

  const params = new URL(req.url).searchParams;

  // Single image: the detail panel, which also wants the GPS verdict.
  const id = params.get('id');
  if (id) {
    const image = getMediaImage(id);
    if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const geo = await loadParkGeo();
    return NextResponse.json({
      image: toRow(image),
      geo: checkParkAssignment(image, geo),
    });
  }

  const park = params.has('park') ? params.get('park') || null : undefined;
  const ride = params.has('ride') ? params.get('ride') || null : undefined;

  let results = searchMedia({
    q: params.get('q') ?? undefined,
    park,
    ride,
    collection: params.get('collection') ?? undefined,
    tags: params.getAll('tag'),
    role: (params.get('role') as MediaRole) || undefined,
    license: (params.get('license') as MediaLicense) || undefined,
    unlicensedOnly: params.get('unlicensed') === '1',
    unassignedOnly: params.get('unassigned') === '1',
    reviewOnly: params.get('review') === '1',
  });

  // Filters that exist only for the admin: they describe work still to do rather
  // than what an image is.
  if (params.get('lowres') === '1') results = results.filter(isLowRes);
  if (params.get('nofocus') === '1') results = results.filter((i) => !i.focus);
  if (params.get('noalt') === '1') {
    results = results.filter((i) => Object.keys(getMediaText(i.id).alt ?? {}).length === 0);
  }

  return NextResponse.json({
    revision: MEDIA_REVISION,
    total: results.length,
    images: results.map(toRow),
    stats: { ...mediaStats(), lowRes: searchMedia().filter(isLowRes).length },
    vocabulary: {
      facets: TAG_FACETS,
      tags: listTags(),
      roles: MEDIA_ROLES,
      licenses: MEDIA_LICENSES,
      parks: listParks(),
      collections: listCollections(),
      lowResLongEdge: LOW_RES_LONG_EDGE,
    },
  });
}
