import 'server-only';
import { NextResponse } from 'next/server';
import { denyUnlessAdmin } from '@/lib/admin/session';
import { summarizeSubmissions } from '@/lib/contribute/submissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/contributions/summary — the pending submissions, newest first.
 *
 * What the admin shell asks after a login to decide whether to say "new photos
 * came in". The moderation list would answer too, but it also lists every
 * image blob for the orphan check, which is two `list` calls the toast has no
 * use for. "Seen" is the reader's own state and lives in their browser; the
 * server only says what is waiting.
 */
export async function GET(request: Request) {
  const unauthorized = await denyUnlessAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json(await summarizeSubmissions(), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    console.error('[admin/contributions/summary] failed:', err);
    return NextResponse.json({ error: 'summary-failed' }, { status: 500 });
  }
}
