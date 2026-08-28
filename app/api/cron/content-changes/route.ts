import { NextResponse } from 'next/server';
import { crawlContentFingerprints } from '@/lib/seo/content-changes/crawl';
import { diffSnapshot, mergeScheduleCoverage } from '@/lib/seo/content-changes/fingerprint';
import {
  readContentChangeSnapshot,
  writeContentChangeSnapshot,
} from '@/lib/seo/content-changes/store';

/**
 * The daily pass that turns "the catalog looks like this" into "these pages
 * changed today".
 *
 * It runs at 05:30 UTC, half an hour before the IndexNow submitter, because that
 * submitter now reads what this run wrote: without the ordering it would ping
 * yesterday's set of changed URLs.
 *
 * The response is the diagnostic — `added`/`changed`/`removed` counts plus the
 * first few paths of each. On a normal day they are single digits; if `changed`
 * comes back in the thousands, something volatile has leaked into the
 * fingerprint and the `<lastmod>` on every sitemap URL is about to become
 * worthless. See `lib/seo/content-changes/fingerprint.ts`.
 */

export const maxDuration = 300;

/** Enough to see WHICH pages moved without turning the response into a sitemap. */
const SAMPLE = 20;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();

  let crawl;
  try {
    crawl = await crawlContentFingerprints();
  } catch (error) {
    console.error('[ContentChanges] Crawl failed:', error);
    return NextResponse.json({ error: 'Crawl failed' }, { status: 500 });
  }

  // A run that reached almost nothing is an outage, not a catalog that emptied
  // overnight. Writing it would stamp today on every page when the API recovers.
  if (crawl.parksCovered === 0) {
    console.error('[ContentChanges] No park answered — snapshot left untouched');
    return NextResponse.json(
      { error: 'No park answered', failed: crawl.failedParkPaths.length },
      { status: 502 }
    );
  }

  const previous = await readContentChangeSnapshot();
  const failed = new Set(crawl.failedParkPaths);
  const result = diffSnapshot(previous, crawl.fingerprints, {
    today: new Date().toISOString().slice(0, 10),
    // A key under a park that did not answer keeps the date it already has. The
    // park path itself and its attraction paths both start with it, and no other
    // key can: the segment count differs at every level above.
    retainUncovered: (path) => {
      for (const parkPath of failed) {
        if (path === parkPath || path.startsWith(`${parkPath}/`)) return true;
      }
      return false;
    },
  });

  // Schedule coverage rides beside the diff, not through it: `diffSnapshot` decides which dates
  // move and this is a value to carry. A park that did not answer keeps the coverage it already
  // had — the same rule `retainUncovered` applies to its dates, and for the same reason: one
  // timeout must not shorten that park's calendar to nothing tomorrow morning.
  result.snapshot.scheduleCoverage = mergeScheduleCoverage(previous, crawl.scheduleCoverage);

  try {
    await writeContentChangeSnapshot(result.snapshot);
  } catch (error) {
    console.error('[ContentChanges] Failed to persist snapshot:', error);
    return NextResponse.json({ error: 'Failed to persist snapshot' }, { status: 500 });
  }

  return NextResponse.json({
    entries: Object.keys(result.snapshot.entries).length,
    parksCovered: crawl.parksCovered,
    attractionsCovered: crawl.attractionsCovered,
    parksFailed: crawl.failedParkPaths.length,
    carried: result.carried,
    added: { count: result.added.length, sample: result.added.slice(0, SAMPLE) },
    changed: { count: result.changed.length, sample: result.changed.slice(0, SAMPLE) },
    removed: { count: result.removed.length, sample: result.removed.slice(0, SAMPLE) },
    durationMs: Date.now() - startedAt,
  });
}
