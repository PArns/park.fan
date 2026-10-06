import { NextResponse } from 'next/server';
import { crawlContentFingerprints } from '@/lib/seo/content-changes/crawl';
import { diffSnapshot, mergeScheduleCoverage } from '@/lib/seo/content-changes/fingerprint';
import {
  readContentChangeSnapshot,
  writeContentChangeSnapshot,
} from '@/lib/seo/content-changes/store';
import { cronUnauthorized } from '@/lib/security/cron-auth';

/**
 * The daily pass that turns "the catalog looks like this" into "these pages changed today", run
 * half an hour before the IndexNow submitter, which reads what it writes. The response is the
 * diagnostic: a `changed` count in the thousands means something volatile leaked into the
 * fingerprint. See docs/rules/a-lastmod-is-observed-never-stamped.md.
 */

export const maxDuration = 300;

/** Enough to see WHICH pages moved without turning the response into a sitemap. */
const SAMPLE = 20;

export async function GET(request: Request) {
  const denied = cronUnauthorized(request);
  if (denied) return denied;

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

  // Schedule coverage rides beside the diff, not through it. A park that did not answer keeps the
  // coverage it had, as `retainUncovered` does for dates, so one timeout cannot empty its calendar.
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
