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
 * Tags in use (see lib/api/*): geo · parks · attractions · analytics · popular-parks · ml ·
 * weather · best-days:<park-slug>. `paths` takes concrete URLs (e.g. /de, /en/parks) for the
 * page shells themselves.
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
  if (tags.length === 0 && paths.length === 0) {
    return NextResponse.json(
      { error: 'Provide at least one entry in "tags" or "paths"' },
      { status: 400 }
    );
  }

  // 'max' = Next 16's stale-while-revalidate purge: entries are marked stale immediately and
  // re-rendered in the background on the next request (no user-facing latency spike).
  for (const tag of tags) revalidateTag(tag, 'max');
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ revalidated: { tags, paths }, at: new Date().toISOString() });
}
