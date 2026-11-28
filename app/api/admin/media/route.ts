import 'server-only';
import { NextResponse } from 'next/server';

import { denyUnlessAdmin } from '@/lib/admin/session';
import {
  MEDIA_REVISION,
  getMediaImage,
  listCollectionNodes,
  listCollections,
  listParks,
  listTags,
  mediaStats,
  searchMedia,
} from '@/lib/media';
import { checkParkAssignment } from '@/lib/media/geo';
import { loadParkGeoCatalog } from '@/lib/media/park-geo';
import { parseMediaSearchParams } from '@/lib/media/search-params';
import { versionedSrc } from '@/lib/media/focus';
import { getMediaText } from '@/lib/media/text';
import { MEDIA_LICENSES, MEDIA_ROLES } from '@/lib/media/types';
import { TAG_FACETS } from '@/lib/media/tags.mjs';
import type { MediaImage } from '@/lib/media/types';

/**
 * The admin media browser's read endpoint.
 *
 * Returns rows in their *editable* shape — the raw sidecar fields, not the
 * rendered ones — plus the vocabulary the editor needs to offer (tag facets,
 * roles, licences) so the UI never hardcodes a list that could drift from
 * `lib/media/tags.mjs`.
 *
 *   GET /api/admin/media?q=&park=&tag=&collection=&lowres=1
 *   GET /api/admin/media?id=toverland/troy      one image, with its GPS verdict
 */

/** Long-edge target for a source photo — see docs/development/assets.md. */
export const LOW_RES_LONG_EDGE = 2048;

/** Whether a raster image's long edge is under `LOW_RES_LONG_EDGE` (2048 px); an SVG never is. */
export function isLowRes(image: MediaImage): boolean {
  if (image.format === 'svg') return false; // resolution-independent
  return Math.max(image.width, image.height) < LOW_RES_LONG_EDGE;
}

function toRow(image: MediaImage) {
  const text = getMediaText(image.id);
  return {
    ...image,
    // The content-versioned address, which the park and ride media panels read: retargeting a
    // focal point rewrites a crop's bytes at an unchanged `src`.
    url: versionedSrc(image),
    alt: text.alt ?? {},
    caption: text.caption ?? {},
    lowRes: isLowRes(image),
  };
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
    const geo = await loadParkGeoCatalog();
    return NextResponse.json({
      image: toRow(image),
      geo: checkParkAssignment(image, geo),
    });
  }

  let results = searchMedia({
    ...parseMediaSearchParams(params),
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
      // Every node of the tree, parents included, each counted once — the number
      // the grid shows after the click.
      collectionCounts: listCollectionNodes(),
      lowResLongEdge: LOW_RES_LONG_EDGE,
    },
  });
}
