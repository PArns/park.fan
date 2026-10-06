import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand cache revalidation. Vercel bills every regeneration as a write, even a byte-identical
 * one, so entries run on long TTLs and the source POSTs here when something really changed.
 *
 *   curl -X POST https://park.fan/api/revalidate \
 *     -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"tags":["geo","popular-parks"],"paths":["/en"]}'
 *
 * Add `"expire": 0` to make the next request wait for fresh data instead of being served the old
 * copy one last time — see the profile below.
 *
 * Tags in use (see lib/api/*): geo · parks · attractions · analytics · popular-parks · ml ·
 * weather · best-days:<park-slug> · park:<continent>/<country>/<city>/<park-slug> (one park's
 * structure fetch — see `parkCacheTag`). `paths` takes concrete URLs (e.g. /de, /en/parks) for
 * the page shells themselves.
 *
 * Callers: the backend's change-detection webhook (v4.api.park.fan) and manual ops. The
 * endpoint is disabled (503) until REVALIDATE_SECRET is configured in the environment.
 */

/** Upper bound per request — a webhook should invalidate a handful of things, not the site. */
const MAX_ENTRIES = 50;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    .slice(0, MAX_ENTRIES);
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Revalidation is disabled (REVALIDATE_SECRET is not configured)' },
      { status: 503 }
    );
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const tags = asStringArray((body as { tags?: unknown } | null)?.tags);
  const paths = asStringArray((body as { paths?: unknown } | null)?.paths);
  const immediate = (body as { expire?: unknown } | null)?.expire === 0;
  if (tags.length === 0 && paths.length === 0) {
    return NextResponse.json(
      { error: 'Provide at least one entry in "tags" or "paths"' },
      { status: 400 }
    );
  }

  // 'max' marks entries stale and re-renders them in the background on the next request, right
  // for content a few minutes behind. `"expire": 0` is for a park opening, where the stale copy
  // shows yesterday's shows as closed to the first visitor; that one request waits instead.
  const profile = immediate ? { expire: 0 } : 'max';
  for (const tag of tags) revalidateTag(tag, profile);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({
    revalidated: { tags, paths, immediate },
    at: new Date().toISOString(),
  });
}
