import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand cache revalidation — the "only write when data actually changed" lever.
 *
 * Time-based ISR cannot skip unchanged content: Vercel bills EVERY regeneration as a
 * size-weighted write, even if the output is byte-identical. So the shells/data entries run
 * on long TTLs, and whenever the SOURCE knows something really changed (new/removed park,
 * geo restructure, popularity re-rank, blog publish, model retrain) it POSTs here and only
 * then does the next request re-render + write.
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

  // 'max' = Next 16's stale-while-revalidate purge: entries are marked stale immediately and
  // re-rendered in the background on the next request (no user-facing latency spike). That is the
  // right trade for content whose old copy is merely a few minutes behind.
  //
  // `"expire": 0` is for the caller that cannot live with one more stale answer, and there is one:
  // a park opening. Until the fetch re-runs, its shows carry yesterday's showtimes and read CLOSED
  // (the API reports them that way for as long as the park is), and under 'max' the visitor who
  // triggers the revalidation is served exactly that — the first person through the door every
  // morning, on the park's busiest page. The cost is that one request waiting out the upstream
  // fetch instead.
  const profile = immediate ? { expire: 0 } : 'max';
  for (const tag of tags) revalidateTag(tag, profile);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({
    revalidated: { tags, paths, immediate },
    at: new Date().toISOString(),
  });
}
