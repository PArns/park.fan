import { NextRequest, NextResponse } from 'next/server';

import {
  MEDIA_REVISION,
  listCollections,
  listParks,
  listTags,
  mediaStats,
  searchMedia,
} from '@/lib/media';
import { serializeMediaImage, type MediaApiImage } from '@/lib/media/api';
import { parseMediaSearchParams } from '@/lib/media/search-params';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/**
 * Public read API for the media database — the catalog the native app syncs.
 *
 *   GET /api/media                          everything, paginated
 *   GET /api/media?q=halloween&park=toverland
 *   GET /api/media?ride=troy&park=toverland
 *   GET /api/media?tag=night&tag=coaster    (repeatable, ANDed)
 *   GET /api/media?role=ride-card&locale=en
 *   GET /api/media?facets=1                 + tag/park/collection counts
 *
 * The database only changes with a deployment and `MEDIA_REVISION` hashes all of it, so this is
 * cached hard: a strong ETag over revision and query (a 304 with no body), a long `s-maxage` with a
 * longer stale window, and `revision` in every payload so the app can ask cheaply whether anything
 * changed. Image URLs carry `?v=<content hash>` and are immutable.
 */

// Dynamic: every filter is a query parameter, and `force-static` would prerender once with an
// empty query and serve that for every request. The CDN still caches per full URL.
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 60;

/** A day at the edge, a week of stale-while-revalidate. */
const CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800';

interface MediaApiResponse {
  revision: string;
  total: number;
  limit: number;
  offset: number;
  images: MediaApiImage[];
  facets?: {
    tags: { tag: string; count: number }[];
    parks: { park: string; count: number }[];
    collections: string[];
  };
  stats?: ReturnType<typeof mediaStats>;
}

function toInt(value: string | null, fallback: number): number {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;

  const locale = params.get('locale') ?? 'de';
  const limit = Math.min(Math.max(toInt(params.get('limit'), DEFAULT_LIMIT), 1), MAX_LIMIT);
  const offset = Math.max(toInt(params.get('offset'), 0), 0);

  const results = searchMedia(parseMediaSearchParams(params));

  const body: MediaApiResponse = {
    revision: MEDIA_REVISION,
    total: results.length,
    limit,
    offset,
    images: results
      .slice(offset, offset + limit)
      .map((image) => serializeMediaImage(image, locale)),
  };

  if (params.get('facets') === '1') {
    body.facets = { tags: listTags(), parks: listParks(), collections: listCollections() };
    body.stats = mediaStats();
  }

  // The ETag covers the revision AND the query, so two different queries against
  // the same deployment can't be conflated by a shared cache.
  const etag = `"${MEDIA_REVISION}-${hashQuery(params)}"`;
  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, ...cdnCacheHeaders(CACHE_CONTROL) },
    });
  }

  return NextResponse.json(body, {
    headers: { ETag: etag, ...cdnCacheHeaders(CACHE_CONTROL) },
  });
}

/**
 * Short, stable digest of the query that affects the response.
 *
 * Sorted so `?park=x&q=y` and `?q=y&park=x` share a cache entry, and built from a
 * fixed key list so an unrelated tracking parameter can't fragment the cache.
 */
function hashQuery(params: URLSearchParams): string {
  const KEYS = [
    'q',
    'park',
    'ride',
    'collection',
    'tag',
    'role',
    'license',
    'unlicensed',
    'unassigned',
    'locale',
    'limit',
    'offset',
    'facets',
  ];
  const parts: string[] = [];
  for (const key of KEYS) {
    for (const value of params.getAll(key).sort()) parts.push(`${key}=${value}`);
  }
  const joined = parts.join('&');

  // FNV-1a: no crypto import for what is only a cache-key discriminator.
  let hash = 0x811c9dc5;
  for (let i = 0; i < joined.length; i += 1) {
    hash ^= joined.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
