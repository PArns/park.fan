import 'server-only';
import { NextResponse } from 'next/server';

import { NO_STORE } from '@/lib/api/cdn-cache-headers';
import { startNewsExport } from '@/lib/admin/news-export-run';
import { denyUnlessAdmin } from '@/lib/admin/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/news-export/run: „Export neu starten“ on `/admin/system`. Starts the export
 * workflow on GitHub and answers `{ started: true, workflowUrl }`, or `{ started: false, reason }`
 * with 503 (no token here) or 502 (GitHub refused), or with `maybeStarted: true` and 504 when the
 * start was sent and GitHub did not answer in time or answered 5xx. Role editor, the floor of the
 * admin's other job starts.
 */
export async function POST(request: Request) {
  const denied = await denyUnlessAdmin(request, 'editor');
  if (denied) return denied;
  const { status, answer } = await startNewsExport();
  return NextResponse.json(answer, { status, headers: NO_STORE });
}
