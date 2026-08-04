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
import type { MediaLicense, MediaRole } from '@/lib/media/types';

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
 * ## Caching
 *
 * The database only changes when a deployment ships, and `MEDIA_REVISION` is a
 * content hash over the whole thing — so this is one of the rare API routes that
 * can be cached hard and still never be wrong:
 *
 *  - a **strong ETag** derived from the revision and the query, so a client that
 *    already has the answer gets a 304 with no body,
 *  - a long `s-maxage` with a longer `stale-while-revalidate`, because a stale
 *    answer here is a previous deployment's catalog, not stale live data,
 *  - `revision` in every payload, so the app can ask "has anything changed?"
 *    with one cheap conditional request instead of re-downloading the catalog.
 *
 * Image URLs themselves carry `?v=<content hash>` and can be treated as immutable.
 */

// MUST stay dynamic: every filter arrives as a query parameter, and `force-static`
// prerenders the route once with an EMPTY query and then serves that one response
// for every request — so `?q=…` silently returned the entire catalog. The caching
// win is not lost by this: the CDN still caches per full URL via the headers below,
// which is the correct granularity for a route whose answer depends on the query.
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

  // `park=` and `ride=` accept an explicit empty value to mean "has none" — that
  // is how a client asks for the park-level tier (images of a park but of no
  // particular ride), which is a real category here, not an absence of data.
  const park = params.has('park') ? params.get('park') || null : undefined;
  const ride = params.has('ride') ? params.get('ride') || null : undefined;

  const results = searchMedia({
    q: params.get('q') ?? undefined,
    park,
    ride,
    collection: params.get('collection') ?? undefined,
    tags: params.getAll('tag'),
    role: (params.get('role') as MediaRole) || undefined,
    license: (params.get('license') as MediaLicense) || undefined,
    unlicensedOnly: params.get('unlicensed') === '1',
    unassignedOnly: params.get('unassigned') === '1',
  });

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
      headers: { ETag: etag, 'Cache-Control': CACHE_CONTROL },
    });
  }

  return NextResponse.json(body, {
    headers: { ETag: etag, 'Cache-Control': CACHE_CONTROL },
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
